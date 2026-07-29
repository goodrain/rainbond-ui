import { getDvaApp } from 'umi';
import {
  buildIssueFingerprint,
  buildReadableErrorMessage,
  buildSentryTunnelUrl,
  buildSlowRequestTransaction,
  classifyHttpError,
  completeSlowRequestTiming,
  consumeSlowRequestBudget,
  extractResponseMetadata,
  getPathPattern,
  getSentryConfig,
  parseStackFrames,
  sanitizeObject,
  sanitizeStack,
  shouldPreferFetchTransport,
  shouldReportRequestError,
  shouldSuppressBrowserError,
  shouldSuppressRequestError,
  startSlowRequestTiming
} from './sentryConfig';
import { sendEnvelope } from './sentryTransport';

let initialized = false;
let sentryClient = null;
let fallbackIdCounter = 0;
const slowRequestAttemptTimestamps = [];

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
  const directEnvelopeUrl = parsed.toString();

  return {
    dsn: publicDsn.toString(),
    envelopeUrl: buildSentryTunnelUrl(config.tunnel, parsed.pathname, parsed.search) || directEnvelopeUrl,
    directEnvelopeUrl,
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

function sendEvent(event, options = {}) {
  if (!sentryClient) {
    return;
  }
  const sanitizedEvent = sanitizeObject(event);
  sendEnvelope(sentryClient, sanitizedEvent, {
    itemType: options.itemType || 'event',
    direct: options.direct === true,
    preferFetch: options.preferFetch === undefined
      ? shouldPreferFetchTransport(sanitizedEvent)
      : options.preferFetch
  });
}

function monotonicNow() {
  try {
    if (
      typeof window !== 'undefined' &&
      window.performance &&
      typeof window.performance.now === 'function'
    ) {
      return window.performance.now();
    }
  } catch (error) {
    return NaN;
  }
  try {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
  } catch (error) {
    return NaN;
  }
  return NaN;
}

function slowRequestId(length) {
  const byteLength = length / 2;
  try {
    const cryptoObject = typeof window !== 'undefined' && (window.crypto || window.msCrypto);
    if (cryptoObject && typeof cryptoObject.getRandomValues === 'function') {
      const bytes = new Uint8Array(byteLength);
      cryptoObject.getRandomValues(bytes);
      const value = Array.prototype.map.call(
        bytes,
        item => (`0${item.toString(16)}`).slice(-2)
      ).join('');
      if (!/^0+$/.test(value)) {
        return value;
      }
    }
  } catch (error) {
    // Use the non-cryptographic fallback below.
  }

  fallbackIdCounter = (fallbackIdCounter + 1) >>> 0;
  let value = '';
  for (let index = 0; index < byteLength; index += 1) {
    const randomByte = Math.floor(Math.random() * 256);
    const byte = (randomByte + fallbackIdCounter + index * 37) & 255;
    value += (`0${byte.toString(16)}`).slice(-2);
  }
  return /^0+$/.test(value) ? `${value.slice(0, -1)}1` : value;
}

function getCurrentRoute() {
  if (typeof window === 'undefined' || !window.location) {
    return '';
  }
  return getPathPattern(window.location.href);
}

function getCurrentLocation() {
  if (typeof window === 'undefined' || !window.location) {
    return '';
  }
  return window.location.href || '';
}

function matchLocationValue(pattern, value = getCurrentLocation()) {
  const match = String(value || '').match(pattern);
  return match && match[1] ? decodeURIComponent(match[1]) : '';
}

function compactObject(value) {
  return Object.keys(value || {}).reduce((result, key) => {
    if (value[key] !== undefined && value[key] !== null && value[key] !== '') {
      result[key] = value[key];
    }
    return result;
  }, {});
}

function buildRouteContext(context = {}) {
  const rawLocation = context.url || getCurrentLocation();
  const route = context.route || getPathPattern(rawLocation);
  return compactObject({
    route,
    raw_path: getPathPattern(rawLocation),
    enterprise_id: context.enterpriseId || matchLocationValue(/enterprise\/([^/?#]+)/, rawLocation),
    team_name: context.teamName || matchLocationValue(/team\/([^/?#]+)/, rawLocation),
    region_name: context.regionName || matchLocationValue(/region\/([^/?#]+)/, rawLocation),
    app_id: context.appId || matchLocationValue(/apps\/([^/?#]+)/, rawLocation),
    component_id: context.componentId || matchLocationValue(/components\/([^/?#]+)/, rawLocation)
  });
}

function normalizeTagValue(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return String(sanitizeObject(value)).slice(0, 200);
}

function buildTags(context = {}) {
  const contextTags = context.tags || {};
  const routeContext = buildRouteContext(context);
  const route = routeContext.route || context.route || contextTags.route || getCurrentRoute();
  const tags = {
    component: 'rainbond-ui',
    error_source: context.errorSource || context.source || contextTags.error_source || contextTags.source || 'javascript',
    route,
    enterprise_id: routeContext.enterprise_id,
    team_name: routeContext.team_name,
    region_name: routeContext.region_name,
    app_id: routeContext.app_id,
    component_id: routeContext.component_id,
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

function buildUser(user = {}) {
  const id = user.user_id || user.id || user.userName || user.user_name;
  const username = user.user_name || user.username || user.nick_name;
  return compactObject({
    id: id ? String(id) : undefined,
    username: username ? String(username) : undefined,
    enterprise_id: user.enterprise_id ? String(user.enterprise_id) : undefined,
    is_enterprise_admin: user.is_enterprise_admin === undefined ? undefined : !!user.is_enterprise_admin
  });
}

function getStoreUser() {
  try {
    const app = getDvaApp();
    const state = app && app._store && app._store.getState && app._store.getState();
    return (state && state.user && state.user.currentUser) || {};
  } catch (error) {
    return {};
  }
}

function buildContexts(context = {}, routeContext = {}) {
  const contexts = {
    rainbond: routeContext
  };

  if (context.request) {
    contexts.request = sanitizeObject(context.request);
  }
  if (context.api) {
    contexts.api = sanitizeObject(context.api);
  }
  if (context.react) {
    contexts.react = sanitizeObject(context.react);
  }
  if (context.contexts) {
    Object.keys(context.contexts).forEach(key => {
      contexts[key] = sanitizeObject(context.contexts[key]);
    });
  }

  return Object.keys(contexts).reduce((result, key) => {
    if (contexts[key] && Object.keys(contexts[key]).length) {
      result[key] = contexts[key];
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
  const routeContext = buildRouteContext(context);
  const tags = buildTags(context);
  const route = routeContext.route || context.route || tags.route || getCurrentRoute();
  const enrichedContext = {
    ...context,
    route,
    tags
  };
  const frames = parseStackFrames(error && error.stack);
  const stackFrames = frames.length ? frames : buildFallbackFrame(context);
  const culpritFrame = stackFrames.length ? stackFrames[stackFrames.length - 1] : {};
  const readableMessage = buildReadableErrorMessage(error, enrichedContext);
  const originalMessage = (error && error.message) || String(error);
  const exceptionType = context.exceptionType || (error && error.name) || 'Error';
  const sentryUser = buildUser(context.user || getStoreUser());
  const extra = {
    error_message: originalMessage,
    error_name: exceptionType,
    page: routeContext,
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
    culprit: culpritFrame.function
      ? `${culpritFrame.function} (${culpritFrame.filename || route || 'unknown'})`
      : route,
    user: Object.keys(sentryUser).length ? sentryUser : undefined,
    contexts: buildContexts(context, routeContext),
    request: context.request
      ? {
        method: context.request.method,
        url: context.request.url || route,
        query_string: context.request.query_string
      }
      : {
        url: route
      },
    fingerprint: buildIssueFingerprint(error, enrichedContext, stackFrames),
    message: readableMessage,
    logentry: {
      message: readableMessage
    },
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

export function startSlowRequestTracking(options) {
  if (!initialized) {
    return;
  }
  try {
    return startSlowRequestTiming(options, Math.random, monotonicNow, Date.now);
  } catch (error) {
    return;
  }
}

export function finishSlowRequestTracking(context, outcome) {
  if (!initialized || !context) {
    return;
  }
  try {
    const monotonicEndedAt = monotonicNow();
    const completed = completeSlowRequestTiming(context, outcome, () => monotonicEndedAt);
    if (!completed || !consumeSlowRequestBudget(slowRequestAttemptTimestamps, monotonicEndedAt)) {
      return;
    }
    const transaction = buildSlowRequestTransaction({
      eventId: slowRequestId(32),
      route: completed.route,
      method: completed.method,
      startedAt: completed.startedAt,
      endedAt: completed.endedAt,
      status: completed.status,
      environment: sentryClient.environment,
      release: sentryClient.release,
      traceId: slowRequestId(32),
      spanId: slowRequestId(16)
    });
    if (transaction) {
      sendEvent(transaction, {
        itemType: 'transaction',
        direct: true
      });
    }
  } catch (error) {
    return;
  }
}

export function captureException(error, context = {}) {
  if (!initialized || !error) {
    return;
  }
  if (shouldSuppressBrowserError(error, context)) {
    return;
  }
  sendEvent(buildEvent(error, context));
}

export function captureRequestError(error, options = {}) {
  if (!initialized || !shouldReportRequestError(error)) {
    return;
  }
  if (shouldSuppressRequestError(error, options)) {
    return;
  }
  const response = error && error.response;
  const config = (error && error.config) || options || {};
  const status = response && response.status;
  const method = String(config.method || 'GET').toUpperCase();
  const route = getPathPattern(config.url);
  const responseData = (response && response.data) || {};

  // Extract backend metadata for cross-referencing with console/region logs
  const responseMeta = extractResponseMetadata(response);
  const errorClass = classifyHttpError(error);
  const businessCode = responseData && responseData.code;

  const requestContext = {
    method,
    url: getPathPattern(config.url),
    query_string: config.params ? JSON.stringify(sanitizeObject(config.params)) : undefined
  };
  const apiContext = {
    route,
    method,
    status: status || 'network',
    status_text: response && response.statusText,
    business_code: businessCode,
    response_message: responseMeta.response_message,
    request_id: responseMeta.request_id,
    backend_error_class: errorClass
  };
  captureException(error, {
    errorSource: 'api',
    exceptionType: status ? `API ${status}` : 'API Network Error',
    title: `API ${status || 'Network'} ${method} ${route || 'unknown endpoint'}`,
    route,
    status: status || 'network',
    method,
    backendErrorClass: errorClass,
    businessCode: businessCode || '',
    tags: {
      component: 'rainbond-ui',
      error_source: 'api',
      request_status: status || 'network',
      request_method: method,
      route,
      backend_error_class: errorClass,
      business_code: businessCode ? String(businessCode) : '',
      request_id: responseMeta.request_id
    },
    request: requestContext,
    api: apiContext,
    extra: {
      route,
      method,
      status,
      status_text: response && response.statusText,
      business_code: businessCode,
      response_message: responseMeta.response_message,
      request_id: responseMeta.request_id,
      backend_error_class: errorClass
    }
  });
}
