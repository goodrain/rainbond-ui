import {
  buildIssueFingerprint,
  buildReadableErrorMessage,
  buildSentryTunnelUrl,
  getPathPattern,
  getSentryConfig,
  parseStackFrames,
  sanitizeObject,
  sanitizeStack,
  shouldReportRequestError
} from './sentryConfig';

let initialized = false;
let sentryClient = null;

function buildClient(config) {
  let parsed;
  try {
    parsed = new URL(config.dsn);
  } catch (error) {
    return null;
  }
  const publicKey = parsed.username;
  const publicDsn = new URL(config.dsn);
  publicDsn.password = '';
  publicDsn.search = '';
  publicDsn.hash = '';
  const parts = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/');
  const projectId = parts.pop();
  const basePath = parts.join('/');

  if (!publicKey || !projectId) {
    return null;
  }

  parsed.username = '';
  parsed.password = '';
  parsed.search = '';
  parsed.hash = '';
  parsed.pathname = `${basePath ? `/${basePath}` : ''}/api/${projectId}/envelope/`;
  parsed.searchParams.set('sentry_version', '7');
  parsed.searchParams.set('sentry_client', 'rainbond-ui/1.0');
  parsed.searchParams.set('sentry_key', publicKey);

  return {
    dsn: publicDsn.toString(),
    envelopeUrl: buildSentryTunnelUrl(config.tunnel, parsed.pathname, parsed.search) || parsed.toString(),
    environment: config.environment,
    release: config.release
  };
}

function eventId() {
  const cryptoObject = window.crypto || window.msCrypto;
  if (cryptoObject && cryptoObject.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObject.getRandomValues(bytes);
    return Array.prototype.map.call(bytes, item => (`0${item.toString(16)}`).slice(-2)).join('');
  }
  return String(Date.now());
}

function sendEvent(event) {
  if (!sentryClient) {
    return;
  }
  const sanitizedEvent = sanitizeObject(event);
  const payload = [
    JSON.stringify({
      event_id: sanitizedEvent.event_id,
      sent_at: new Date().toISOString(),
      dsn: sentryClient.dsn
    }),
    JSON.stringify({
      type: 'event',
      content_type: 'application/json'
    }),
    JSON.stringify(sanitizedEvent)
  ].join('\n');
  if (navigator && navigator.sendBeacon && navigator.sendBeacon(sentryClient.envelopeUrl, payload)) {
    return;
  }
  if (typeof fetch !== 'function') {
    return;
  }
  fetch(sentryClient.envelopeUrl, {
    method: 'POST',
    body: payload,
    keepalive: true
  }).catch(() => {});
}

function getCurrentRoute() {
  if (typeof window === 'undefined' || !window.location) {
    return '';
  }
  return getPathPattern(window.location.href);
}

function normalizeTagValue(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return String(sanitizeObject(value)).slice(0, 200);
}

function buildTags(context = {}) {
  const contextTags = context.tags || {};
  const route = context.route || contextTags.route || getCurrentRoute();
  const tags = {
    component: 'rainbond-ui',
    error_source: context.errorSource || context.source || contextTags.error_source || contextTags.source || 'javascript',
    route,
    ...contextTags
  };

  return Object.keys(tags).reduce((result, key) => {
    const value = normalizeTagValue(tags[key]);
    if (value !== undefined) {
      result[key] = value;
    }
    return result;
  }, {});
}

function buildFallbackFrame(context = {}) {
  const extra = context.extra || {};
  if (!extra.filename) {
    return [];
  }
  return [
    {
      filename: getPathPattern(extra.filename),
      function: '<anonymous>',
      lineno: extra.lineno,
      colno: extra.colno,
      in_app: true
    }
  ];
}

function buildEvent(error, context = {}) {
  const tags = buildTags(context);
  const route = context.route || tags.route || getCurrentRoute();
  const enrichedContext = {
    ...context,
    route,
    tags
  };
  const frames = parseStackFrames(error && error.stack);
  const stackFrames = frames.length ? frames : buildFallbackFrame(context);
  const readableMessage = buildReadableErrorMessage(error, enrichedContext);
  const originalMessage = (error && error.message) || String(error);
  const exceptionType = context.exceptionType || (error && error.name) || 'Error';
  const extra = {
    error_message: originalMessage,
    error_name: exceptionType,
    ...(context.extra || {})
  };

  return {
    event_id: eventId(),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    logger: 'rainbond-ui',
    environment: sentryClient.environment,
    release: sentryClient.release || undefined,
    tags,
    transaction: route,
    fingerprint: buildIssueFingerprint(error, enrichedContext, stackFrames),
    message: readableMessage,
    exception: {
      values: [
        {
          type: sanitizeObject(exceptionType),
          value: readableMessage,
          stacktrace: stackFrames.length
            ? { frames: stackFrames }
            : error && error.stack
              ? { frames: [{ filename: 'stack', context_line: sanitizeStack(error.stack) }] }
              : undefined
        }
      ]
    },
    extra: sanitizeObject(extra)
  };
}

function installGlobalHandlers() {
  window.addEventListener('error', event => {
    captureException(event.error || new Error(event.message), {
      errorSource: 'window_error',
      extra: {
        filename: getPathPattern(event.filename),
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });
  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    captureException(reason, {
      errorSource: 'unhandledrejection',
      tags: {
        source: 'unhandledrejection'
      }
    });
  });
}

export function initSentry() {
  const config = getSentryConfig();
  if (!config.enabled || initialized) {
    return false;
  }
  sentryClient = buildClient(config);
  if (!sentryClient) {
    return false;
  }
  initialized = true;
  installGlobalHandlers();
  return true;
}

export function captureException(error, context = {}) {
  if (!initialized || !error) {
    return;
  }
  sendEvent(buildEvent(error, context));
}

export function captureRequestError(error, options = {}) {
  if (!initialized || !shouldReportRequestError(error)) {
    return;
  }
  const response = error && error.response;
  const config = (error && error.config) || options || {};
  const status = response && response.status;
  const method = String(config.method || 'GET').toUpperCase();
  const route = getPathPattern(config.url);
  const responseData = (response && response.data) || {};
  captureException(error, {
    errorSource: 'api',
    exceptionType: status ? `API ${status}` : 'API Network Error',
    title: `API ${status || 'Network'} ${method} ${route || 'unknown endpoint'}`,
    route,
    status: status || 'network',
    method,
    fingerprint: ['rainbond-ui-api', String(status || 'network'), method, route || 'unknown endpoint'],
    tags: {
      component: 'rainbond-ui',
      error_source: 'api',
      request_status: status || 'network',
      request_method: method,
      route
    },
    extra: {
      route,
      method,
      status,
      status_text: response && response.statusText,
      business_code: responseData && responseData.code,
      response_message: responseData && (responseData.msg || responseData.msg_show)
    }
  });
}
