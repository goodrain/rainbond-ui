import {
  buildSentryTunnelUrl,
  getPathPattern,
  getSentryConfig,
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

function buildEvent(error, context = {}) {
  const tags = {
    component: 'rainbond-ui',
    ...(context.tags || {})
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
    exception: {
      values: [
        {
          type: (error && error.name) || 'Error',
          value: sanitizeObject((error && error.message) || String(error)),
          stacktrace: error && error.stack ? { frames: [{ filename: 'stack', context_line: sanitizeStack(error.stack) }] } : undefined
        }
      ]
    },
    extra: context.extra ? sanitizeObject(context.extra) : undefined
  };
}

function installGlobalHandlers() {
  window.addEventListener('error', event => {
    captureException(event.error || new Error(event.message), {
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
  captureException(error, {
    tags: {
      component: 'rainbond-ui',
      request_status: response && response.status
    },
    extra: {
      route: getPathPattern(config.url),
      method: config.method
    }
  });
}
