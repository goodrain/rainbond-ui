const SENSITIVE_KEY_RE = /(token|password|secret|authorization|cookie|key|dsn)/i;
const SENSITIVE_VALUE_RE = /\b((?:token|password|secret|authorization|cookie|dsn|api[_-]?key|access[_-]?key|secret[_-]?key)\s*[:=]\s*)(?:bearer\s+)?[^&\s"'<>]+/gi;
const BEARER_VALUE_RE = /\b(bearer\s+)[a-z0-9._~+/=-]+/gi;
const DEFAULT_TRACE_SAMPLE_RATE = 0;
const SLOW_REQUEST_SAMPLE_RATE = 0.01;
const SLOW_REQUEST_THRESHOLD_MS = 1000;
const SLOW_REQUEST_MAX_EVENTS = 10;
const SLOW_REQUEST_WINDOW_MS = 60000;
const SLOW_REQUEST_METHODS = {
  DELETE: true,
  GET: true,
  HEAD: true,
  OPTIONS: true,
  PATCH: true,
  POST: true,
  PUT: true
};
const SLOW_REQUEST_RESOURCE_SEGMENTS = {
  apps: true,
  clusters: true,
  components: true,
  enterprises: true,
  enterprise: true,
  groups: true,
  namespaces: true,
  nodes: true,
  plugins: true,
  regions: true,
  roles: true,
  services: true,
  teams: true,
  users: true
};
const SLOW_REQUEST_STATIC_SEGMENTS = {
  apps: true,
  clusters: true,
  components: true,
  config: true,
  configs: true,
  deploy: true,
  detail: true,
  details: true,
  enterprises: true,
  enterprise: true,
  events: true,
  features: true,
  groups: true,
  health: true,
  logs: true,
  metrics: true,
  namespaces: true,
  nodes: true,
  openapi: true,
  overview: true,
  permissions: true,
  plugins: true,
  posthog: true,
  regions: true,
  restart: true,
  roles: true,
  sentry: true,
  services: true,
  settings: true,
  start: true,
  status: true,
  stop: true,
  teams: true,
  users: true,
  v1: true,
  v2: true,
  v3: true
};
const DYNAMIC_SEGMENT_MARKERS = {
  teams: true,
  team: true,
  tenants: true,
  apps: true,
  app: true,
  services: true,
  service: true,
  components: true,
  groups: true,
  regions: true,
  region: true,
  clusters: true,
  nodes: true,
  namespaces: true,
  plugins: true,
  users: true,
  roles: true,
  certificates: true,
  ports: true,
  envs: true,
  volumes: true,
  domains: true,
  domain: true,
  dependency: true,
  dependencies: true,
  mnt: true,
  enterprise: true,
  enterprises: true,
  registries: true,
  registry: true,
  auth: true,
  'access-token': true,
  events: true,
  logs: true,
  backups: true,
  versions: true
};

function hasOwn(map, key) {
  return Object.prototype.hasOwnProperty.call(map, key);
}

function readRuntimeConfig() {
  if (typeof window === 'undefined') {
    return {};
  }
  if (window.RAINBOND_SENTRY || window.__RAINBOND_SENTRY__) {
    return window.RAINBOND_SENTRY || window.__RAINBOND_SENTRY__;
  }
  if (typeof document === 'undefined') {
    return {};
  }
  const script = document.getElementById('rainbond-sentry-config');
  if (!script || !script.textContent) {
    return {};
  }
  try {
    return JSON.parse(script.textContent);
  } catch (error) {
    return {};
  }
}

function readProcessEnv() {
  if (typeof process === 'undefined' || !process.env) {
    return {};
  }
  return process.env;
}

function isEnabled(value) {
  if (value === true) {
    return true;
  }
  if (typeof value !== 'string') {
    return false;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

function parseSampleRate(value) {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_TRACE_SAMPLE_RATE;
  }
  const rate = Number(value);
  if (Number.isNaN(rate) || rate < 0) {
    return DEFAULT_TRACE_SAMPLE_RATE;
  }
  if (rate > 1) {
    return 1;
  }
  return rate;
}

function firstValue() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = arguments[index];
    if (value) {
      return value;
    }
  }
  return '';
}

function buildSentryTunnelUrl(tunnel, envelopePath, queryString) {
  if (!tunnel) {
    return '';
  }
  const requestPath = String(envelopePath || '').replace(/^\/+/, '');
  const requestQuery = queryString || '';
  const tunnelBase = String(tunnel).replace(/\/+$/, '');

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(tunnelBase)) {
    try {
      const parsed = new URL(tunnelBase);
      const basePath = parsed.pathname.replace(/\/+$/, '');
      parsed.pathname = `${basePath}/${requestPath}`.replace(/\/{2,}/g, '/');
      parsed.search = requestQuery;
      parsed.hash = '';
      return parsed.toString();
    } catch (error) {
      return '';
    }
  }

  return `${tunnelBase}/${requestPath}${requestQuery}`;
}

function hasAbsoluteDotSegment(url) {
  const authorityStart = url.indexOf('://') + 3;
  const remainder = url.slice(authorityStart);
  const pathBoundary = remainder.search(/[/?#]/);
  if (pathBoundary === -1 || remainder.charAt(pathBoundary) !== '/') {
    return false;
  }
  const rawPath = remainder.slice(pathBoundary).split(/[?#]/, 1)[0];
  return rawPath.split('/').some(rawSegment => {
    try {
      const segment = decodeURIComponent(rawSegment);
      return segment === '.' || segment === '..';
    } catch (error) {
      return false;
    }
  });
}

function parseSlowRequestPath(url) {
  if (!url || typeof url !== 'string' || url !== url.trim() || url.indexOf('\\') !== -1) {
    return null;
  }

  let pathname;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
    if (hasAbsoluteDotSegment(url)) {
      return null;
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }
      pathname = parsed.pathname;
    } catch (error) {
      return null;
    }
  } else {
    if (url.charAt(0) !== '/' || url.indexOf('//') === 0) {
      return null;
    }
    pathname = url.split(/[?#]/, 1)[0];
  }

  if (
    !pathname ||
    pathname.indexOf('\\') !== -1 ||
    pathname.indexOf('//') !== -1 ||
    /%(?:25)*(?:2f|5c)/i.test(pathname) ||
    /%(?![0-9a-f]{2})/i.test(pathname)
  ) {
    return null;
  }

  const rawSegments = pathname.split('/');
  const segments = [];
  for (let index = 1; index < rawSegments.length; index += 1) {
    if (!rawSegments[index]) {
      if (index !== rawSegments.length - 1) {
        return null;
      }
      continue;
    }
    try {
      const segment = decodeURIComponent(rawSegments[index]);
      if (!segment || segment === '.' || segment === '..' || /[\/#\\]/.test(segment)) {
        return null;
      }
      segments.push(segment);
    } catch (error) {
      return null;
    }
  }

  if (!segments.length) {
    return null;
  }
  const root = segments[0].toLowerCase();
  if (root !== 'console' && root !== 'openapi') {
    return null;
  }
  segments[0] = root;
  return segments;
}

function buildSlowRequestRouteTemplate(url) {
  const segments = parseSlowRequestPath(url);
  if (!segments) {
    return null;
  }

  const template = [segments[0]];
  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index];
    const normalized = segment.toLowerCase();
    const previous = segments[index - 1].toLowerCase();

    if (hasOwn(SLOW_REQUEST_RESOURCE_SEGMENTS, previous) || isDynamicSegment(segment)) {
      template.push(':id');
    } else if (hasOwn(SLOW_REQUEST_STATIC_SEGMENTS, normalized)) {
      template.push(normalized);
    } else {
      template.push(':unknown');
    }
  }
  return `/${template.join('/')}`;
}

function isSafeSlowRequestRouteTemplate(route) {
  if (!route || typeof route !== 'string' || /[?#]/.test(route)) {
    return false;
  }
  const segments = route.split('/');
  if (segments[0] !== '' || (segments[1] !== 'console' && segments[1] !== 'openapi')) {
    return false;
  }
  return segments.slice(2).every(segment => (
    segment === ':id' ||
    segment === ':unknown' ||
    hasOwn(SLOW_REQUEST_STATIC_SEGMENTS, segment)
  ));
}

function isSlowRequestEligible(options) {
  if (!options || options.skipSlowRequestTelemetry === true) {
    return false;
  }
  const route = buildSlowRequestRouteTemplate(options.url);
  if (!route) {
    return false;
  }
  return !isExcludedSlowRequestRoute(route);
}

function isExcludedSlowRequestRoute(route) {
  return (
    route === '/console/sentry' ||
    route.indexOf('/console/sentry/') === 0 ||
    route === '/console/posthog' ||
    route.indexOf('/console/posthog/') === 0
  );
}

function shouldSampleSlowRequest(randomValue) {
  return (
    typeof randomValue === 'number' &&
    randomValue >= 0 &&
    randomValue < SLOW_REQUEST_SAMPLE_RATE
  );
}

function normalizeSlowRequestMethod(method) {
  const normalized = String(method || 'GET').toUpperCase();
  return hasOwn(SLOW_REQUEST_METHODS, normalized) ? normalized : null;
}

function startSlowRequestTiming(
  options,
  random = Math.random,
  monotonicNow,
  epochNow = Date.now,
  routeTemplate = buildSlowRequestRouteTemplate
) {
  if (
    !options ||
    options.skipSlowRequestTelemetry === true ||
    !options.url ||
    typeof options.url !== 'string' ||
    typeof random !== 'function' ||
    typeof monotonicNow !== 'function' ||
    typeof epochNow !== 'function' ||
    typeof routeTemplate !== 'function'
  ) {
    return null;
  }
  const method = normalizeSlowRequestMethod(options.method);
  if (!method || !shouldSampleSlowRequest(random())) {
    return null;
  }
  const route = routeTemplate(options.url);
  if (!isSafeSlowRequestRouteTemplate(route) || isExcludedSlowRequestRoute(route)) {
    return null;
  }
  const monotonicStartedAt = monotonicNow();
  const startedAt = epochNow();
  if (!Number.isFinite(monotonicStartedAt) || !Number.isFinite(startedAt)) {
    return null;
  }
  return {
    route,
    method,
    monotonicStartedAt,
    startedAt,
    completed: false
  };
}

function normalizeSlowRequestStatus(status) {
  if (status === 'network_error') {
    return status;
  }
  const numericStatus = Number(status);
  if (!Number.isInteger(numericStatus) || numericStatus < 100 || numericStatus > 599) {
    return 'network_error';
  }
  return numericStatus;
}

function mapHttpStatusToTraceStatus(status) {
  if (status === 'network_error') return 'unavailable';
  const numericStatus = Number(status);
  if (!Number.isInteger(numericStatus) || numericStatus < 100 || numericStatus > 599) return 'unknown_error';
  if (numericStatus < 400) return 'ok';
  if (numericStatus === 400) return 'invalid_argument';
  if (numericStatus === 401) return 'unauthenticated';
  if (numericStatus === 403) return 'permission_denied';
  if (numericStatus === 404) return 'not_found';
  if (numericStatus === 409) return 'already_exists';
  if (numericStatus === 429) return 'resource_exhausted';
  if (numericStatus === 499) return 'cancelled';
  if (numericStatus === 501) return 'unimplemented';
  if (numericStatus === 503) return 'unavailable';
  if (numericStatus === 504) return 'deadline_exceeded';
  if (numericStatus < 500) return 'failed_precondition';
  return 'internal_error';
}

function completeSlowRequestTiming(context, outcome, monotonicNow) {
  if (!context || context.completed || typeof monotonicNow !== 'function') {
    return null;
  }
  context.completed = true;
  if (outcome && outcome.cancelled === true) {
    return null;
  }

  const monotonicEndedAt = monotonicNow();
  const duration = monotonicEndedAt - context.monotonicStartedAt;
  if (
    !Number.isFinite(context.monotonicStartedAt) ||
    !Number.isFinite(context.startedAt) ||
    !Number.isFinite(monotonicEndedAt) ||
    duration <= SLOW_REQUEST_THRESHOLD_MS
  ) {
    return null;
  }

  const status = normalizeSlowRequestStatus(outcome && outcome.status);
  return {
    route: context.route,
    method: context.method,
    startedAt: context.startedAt,
    endedAt: context.startedAt + duration,
    status
  };
}

function consumeSlowRequestBudget(attemptTimestamps, now) {
  if (!Array.isArray(attemptTimestamps) || typeof now !== 'number' || !Number.isFinite(now)) {
    return false;
  }
  const cutoff = now - SLOW_REQUEST_WINDOW_MS;
  const activeAttempts = attemptTimestamps.filter(timestamp => (
    typeof timestamp === 'number' &&
    Number.isFinite(timestamp) &&
    timestamp > cutoff
  ));
  attemptTimestamps.splice(0, attemptTimestamps.length);
  Array.prototype.push.apply(attemptTimestamps, activeAttempts);
  if (attemptTimestamps.length >= SLOW_REQUEST_MAX_EVENTS) {
    return false;
  }
  attemptTimestamps.push(now);
  return true;
}

function isValidSentryEnvironment(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 64 &&
    value !== 'None' &&
    !/[\s/\\]/.test(value)
  );
}

function isValidSentryRelease(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 200 &&
    value === value.trim() &&
    value !== 'None' &&
    value !== '.' &&
    value !== '..' &&
    !/[\u0000-\u001f\u007f/\\]/.test(value)
  );
}

function buildSlowRequestTransaction(input) {
  const safeInput = input || {};
  const eventId = typeof safeInput.eventId === 'string' ? safeInput.eventId.toLowerCase() : '';
  const traceId = typeof safeInput.traceId === 'string' ? safeInput.traceId.toLowerCase() : '';
  const spanId = typeof safeInput.spanId === 'string' ? safeInput.spanId.toLowerCase() : '';
  const method = normalizeSlowRequestMethod(safeInput.method);
  const status = normalizeSlowRequestStatus(safeInput.status);

  if (
    !/^[0-9a-f]{32}$/.test(eventId) ||
    !/^[0-9a-f]{32}$/.test(traceId) ||
    !/^[0-9a-f]{16}$/.test(spanId) ||
    !method ||
    !isSafeSlowRequestRouteTemplate(safeInput.route) ||
    !Number.isFinite(safeInput.startedAt) ||
    !Number.isFinite(safeInput.endedAt) ||
    safeInput.endedAt <= safeInput.startedAt ||
    !isValidSentryEnvironment(safeInput.environment)
  ) {
    return null;
  }

  const event = {
    event_id: eventId,
    type: 'transaction',
    transaction: `${method} ${safeInput.route}`,
    transaction_info: {
      source: 'custom'
    },
    start_timestamp: safeInput.startedAt / 1000,
    timestamp: safeInput.endedAt / 1000,
    platform: 'javascript',
    environment: safeInput.environment,
    tags: {
      component: 'rainbond-ui',
      source: 'browser_slow_request',
      method,
      status: String(status),
      sample_rate: String(SLOW_REQUEST_SAMPLE_RATE)
    },
    contexts: {
      trace: {
        trace_id: traceId,
        span_id: spanId,
        op: 'http.client',
        status: mapHttpStatusToTraceStatus(status)
      }
    }
  };
  if (isValidSentryRelease(safeInput.release)) {
    event.release = safeInput.release;
  }
  return event;
}

function isTelemetryDisabled(runtime, env) {
  return (
    isEnabled(runtime.disabled) ||
    isEnabled(runtime.errorReportingDisabled) ||
    isEnabled(env.RAINBOND_TELEMETRY_DISABLED) ||
    isEnabled(env.RAINBOND_ERROR_REPORTING_DISABLED)
  );
}

function resolveEnabled(runtime, env) {
  if (isTelemetryDisabled(runtime, env)) {
    return false;
  }
  if (runtime.enabled !== undefined) {
    return isEnabled(runtime.enabled);
  }
  if (env.RAINBOND_ERROR_REPORTING_ENABLED !== undefined) {
    return isEnabled(env.RAINBOND_ERROR_REPORTING_ENABLED);
  }
  if (env.SENTRY_ENABLED !== undefined || env.UMI_APP_SENTRY_ENABLED !== undefined) {
    return isEnabled(env.SENTRY_ENABLED) || isEnabled(env.UMI_APP_SENTRY_ENABLED);
  }
  return true;
}

function getSentryConfig() {
  const env = readProcessEnv();
  const runtime = readRuntimeConfig();
  const dsn = firstValue(
    runtime.frontendDsn,
    runtime.dsn,
    env.RAINBOND_ERROR_REPORTING_FRONTEND_DSN,
    env.RAINBOND_ERROR_REPORTING_DSN,
    env.SENTRY_FRONTEND_DSN,
    env.SENTRY_DSN,
    env.UMI_APP_SENTRY_DSN
  );
  const enabled = resolveEnabled(runtime, env);

  return {
    enabled: enabled && !!dsn,
    dsn,
    environment: runtime.environment || env.RAINBOND_ERROR_REPORTING_ENVIRONMENT || env.SENTRY_ENVIRONMENT || env.UMI_APP_SENTRY_ENVIRONMENT || 'production',
    release: runtime.release || env.RAINBOND_ERROR_REPORTING_RELEASE || env.SENTRY_RELEASE || env.UMI_APP_SENTRY_RELEASE || '',
    tunnel: firstValue(
      runtime.tunnel,
      runtime.tunnelUrl,
      env.RAINBOND_ERROR_REPORTING_FRONTEND_TUNNEL,
      env.SENTRY_FRONTEND_TUNNEL,
      env.SENTRY_TUNNEL,
      env.UMI_APP_SENTRY_TUNNEL
    ),
    tracesSampleRate: parseSampleRate(
      runtime.tracesSampleRate || env.SENTRY_TRACES_SAMPLE_RATE || env.UMI_APP_SENTRY_TRACES_SAMPLE_RATE
    )
  };
}

function sanitizeString(value) {
  return value
    .replace(SENSITIVE_VALUE_RE, '$1[Filtered]')
    .replace(BEARER_VALUE_RE, '$1[Filtered]');
}

function sanitizeObject(value, depth = 0) {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (depth > 4) {
    return '[MaxDepth]';
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map(item => sanitizeObject(item, depth + 1));
  }
  return Object.keys(value).reduce((result, key) => {
    if (SENSITIVE_KEY_RE.test(key)) {
      result[key] = '[Filtered]';
      return result;
    }
    result[key] = sanitizeObject(value[key], depth + 1);
    return result;
  }, {});
}

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }
  const queryIndex = url.search(/[?#]/);
  if (queryIndex === -1) {
    return url;
  }
  return url.slice(0, queryIndex) + '?[Filtered]';
}

function normalizePath(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }
  try {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
      const parsed = new URL(url);
      if (parsed.hash && parsed.hash.indexOf('#/') === 0) {
        return sanitizeUrl(parsed.hash.slice(1));
      }
      return parsed.pathname + (parsed.search || parsed.hash ? '?[Filtered]' : '');
    }
  } catch (error) {
    return sanitizeUrl(url);
  }
  return sanitizeUrl(url);
}

function shouldReportRequestError(error) {
  if (!error) {
    return false;
  }
  if (!error.response) {
    return true;
  }
  return error.response.status >= 500;
}

/**
 * Classifies an HTTP error into a broad error class for Sentry grouping.
 * Instead of grouping by endpoint (which over-splits during outages),
 * group by the type of backend failure so a single outage creates one issue.
 *
 * Error classes:
 *   - "network"     — no response at all (timeout, DNS, CORS, connection refused)
 *   - "gateway"     — 502 Bad Gateway (upstream service down)
 *   - "overloaded"  — 503 Service Unavailable (backend overloaded or deploying)
 *   - "timeout"     — 504 Gateway Timeout
 *   - "backend"     — 500 Internal Server Error (generic backend crash)
 *   - "other"       — any other 5xx
 */
function classifyHttpError(error) {
  if (!error || !error.response) {
    return 'network';
  }
  const status = error.response.status;
  if (status === 502) return 'gateway';
  if (status === 503) return 'overloaded';
  if (status === 504) return 'timeout';
  if (status === 500) return 'backend';
  return 'other';
}

/**
 * Determines whether a request error is expected/transient and should be
 * suppressed from Sentry. The UI already handles these gracefully via
 * handleSpecialErrorCode or user-facing notifications, so reporting them
 * creates noise without actionable signal.
 *
 * Suppressed conditions:
 *   - Network errors (no response) where the caller has its own error handler
 *   - 502/503/504 when the UI shows a user-facing notification
 */
function shouldSuppressRequestError(error, options) {
  if (!error) return false;

  const status = error.response && error.response.status;

  // Suppress network errors when a custom error handler is provided
  // (the caller is handling it gracefully)
  if (!status && options && options.handleError) {
    return true;
  }

  // Suppress 502/503/504 gateway errors — these are transient backend
  // outages that the UI already shows via notification.warning in checkStatus
  if (status === 502 || status === 503 || status === 504) {
    return true;
  }

  return false;
}

function shouldSuppressBrowserError(error, context = {}) {
  if (!error) {
    return false;
  }

  const source = getErrorSource(context);
  if (source !== 'window_error' && source !== 'unhandledrejection') {
    return false;
  }

  const message = getErrorMessage(error);
  const errorName = error.name || context.exceptionType || '';

  if (/ResizeObserver loop (limit exceeded|completed with undelivered notifications)/i.test(message)) {
    return true;
  }

  return (
    errorName === 'NotFoundError' &&
    /Failed to execute 'insertBefore' on 'Node'/i.test(message) &&
    /node before which the new node/i.test(message)
  );
}

/**
 * Extracts backend metadata from a response for Sentry tags/context.
 * Pulls x-request-id, backend error code, and business code from
 * the response so UI Sentry events can be cross-referenced with
 * backend/console logs.
 */
function extractResponseMetadata(response) {
  if (!response) return {};
  const headers = response.headers || {};
  const data = response.data || {};
  return {
    request_id: headers['x-request-id'] || headers['X-Request-Id'] || '',
    backend_error_code: data.code || '',
    response_message: data.msg_show || data.msg || ''
  };
}

function shouldPreferFetchTransport(event) {
  return getErrorSource(event || {}) === 'api';
}

function isDynamicSegment(segment) {
  return (
    /^[0-9]+$/.test(segment) ||
    /^[0-9a-f]{8,}(-[0-9a-f]{4,})*$/i.test(segment)
  );
}

function getPathPattern(url) {
  const sanitized = normalizePath(url);
  if (!sanitized || typeof sanitized !== 'string') {
    return sanitized;
  }
  const suffix = sanitized.endsWith('?[Filtered]') ? '?[Filtered]' : '';
  const pathOnly = suffix ? sanitized.slice(0, -suffix.length) : sanitized;
  const segments = pathOnly.split('/');
  const pattern = segments.map((segment, index) => {
    const previous = segments[index - 1];
    if (!segment) {
      return segment;
    }
    if (previous && hasOwn(DYNAMIC_SEGMENT_MARKERS, String(previous).toLowerCase())) {
      return ':id';
    }
    return isDynamicSegment(segment) ? ':id' : segment;
  });
  return pattern.join('/') + suffix;
}

function sanitizeStack(stack) {
  if (!stack || typeof stack !== 'string') {
    return stack;
  }
  return stack
    .split('\n')
    .slice(0, 80)
    .map(line => sanitizeString(line).replace(/https?:\/\/[^\s)]+/gi, match => getPathPattern(match)))
    .join('\n');
}

function parseFrameLocation(rawLocation) {
  const location = rawLocation || '';
  const match = location.match(/^(.*):(\d+):(\d+)$/);
  if (!match) {
    return {
      filename: sanitizeString(location),
      lineno: undefined,
      colno: undefined
    };
  }
  return {
    filename: getPathPattern(match[1]),
    lineno: Number(match[2]),
    colno: Number(match[3])
  };
}

function isAppFrame(filename) {
  if (!filename) {
    return false;
  }
  return !/(node_modules|webpack:|webpack-internal:|\/umi\.[^/]+\.js|\/vendors?\.)/i.test(filename);
}

function parseStackFrame(line) {
  const text = String(line || '').trim();
  if (!text) {
    return null;
  }

  let match = text.match(/^at\s+(.*?)\s+\((.*:\d+:\d+)\)$/);
  if (match) {
    const location = parseFrameLocation(match[2]);
    return {
      filename: location.filename,
      function: sanitizeString(match[1] || '<anonymous>'),
      lineno: location.lineno,
      colno: location.colno,
      in_app: isAppFrame(location.filename)
    };
  }

  match = text.match(/^at\s+(.*:\d+:\d+)$/);
  if (match) {
    const location = parseFrameLocation(match[1]);
    return {
      filename: location.filename,
      function: '<anonymous>',
      lineno: location.lineno,
      colno: location.colno,
      in_app: isAppFrame(location.filename)
    };
  }

  match = text.match(/^(.*?)@(.*:\d+:\d+)$/);
  if (match) {
    const location = parseFrameLocation(match[2]);
    return {
      filename: location.filename,
      function: sanitizeString(match[1] || '<anonymous>'),
      lineno: location.lineno,
      colno: location.colno,
      in_app: isAppFrame(location.filename)
    };
  }

  return null;
}

function parseStackFrames(stack) {
  if (!stack || typeof stack !== 'string') {
    return [];
  }
  const frames = stack
    .split('\n')
    .slice(0, 80)
    .map(parseStackFrame)
    .filter(Boolean);

  return frames.reverse();
}

function getErrorMessage(error) {
  if (!error) {
    return 'Unknown error';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error.message) {
    return error.message;
  }
  return String(error);
}

function normalizeMethod(method) {
  return String(method || 'UNKNOWN').toUpperCase();
}

function getErrorSource(context) {
  return (
    context.errorSource ||
    context.source ||
    (context.tags && (context.tags.error_source || context.tags.source)) ||
    'javascript'
  );
}

function buildReadableErrorMessage(error, context) {
  const safeContext = context || {};
  if (safeContext.title) {
    return sanitizeString(String(safeContext.title));
  }

  const source = getErrorSource(safeContext);
  const originalMessage = sanitizeString(getErrorMessage(error));

  if (source === 'api') {
    const status = safeContext.status || (safeContext.tags && safeContext.tags.request_status) || 'Network';
    const method = normalizeMethod(safeContext.method || (safeContext.tags && safeContext.tags.request_method));
    const route = safeContext.route || (safeContext.tags && safeContext.tags.route) || 'unknown endpoint';
    const errorClass = safeContext.backendErrorClass || (safeContext.tags && safeContext.tags.backend_error_class);
    const classSuffix = errorClass && errorClass !== 'network' ? ` [${errorClass}]` : '';
    return `API ${status} ${method} ${route}${classSuffix}`;
  }

  if (source === 'react_error_boundary') {
    return `React render error: ${originalMessage}`;
  }

  if (source === 'unhandledrejection') {
    return `Unhandled promise rejection: ${originalMessage}`;
  }

  return `JavaScript error: ${originalMessage}`;
}

function getCulpritFrame(frames) {
  if (!frames || !frames.length) {
    return {};
  }
  for (let index = frames.length - 1; index >= 0; index -= 1) {
    if (frames[index].in_app) {
      return frames[index];
    }
  }
  return frames[frames.length - 1];
}

function buildIssueFingerprint(error, context, frames) {
  const safeContext = context || {};
  if (safeContext.fingerprint) {
    return safeContext.fingerprint;
  }

  const source = getErrorSource(safeContext);
  if (source === 'api') {
    // Group by error class + business_code instead of route.
    // This prevents a single backend outage from creating one Sentry issue
    // per API endpoint. All 500s from the same backend class group together,
    // and all "network down" errors group together.
    const rawStatus = safeContext.status || (safeContext.tags && safeContext.tags.request_status);
    const errorClass = safeContext.backendErrorClass ||
      (rawStatus === 'network' || rawStatus === 'Network' ? 'network' : classifyHttpError({ response: { status: rawStatus } }));
    const businessCode = safeContext.businessCode || (safeContext.tags && safeContext.tags.business_code) || '';

    return [
      'rainbond-ui-api',
      String(errorClass),
      businessCode ? String(businessCode) : 'no-code'
    ];
  }

  const culprit = getCulpritFrame(frames);
  return [
    'rainbond-ui-js',
    source,
    (error && error.name) || 'Error',
    safeContext.route || (safeContext.tags && safeContext.tags.route) || '',
    culprit.filename || '',
    culprit.function || ''
  ];
}

module.exports = {
  SLOW_REQUEST_MAX_EVENTS,
  SLOW_REQUEST_SAMPLE_RATE,
  SLOW_REQUEST_THRESHOLD_MS,
  SLOW_REQUEST_WINDOW_MS,
  buildIssueFingerprint,
  buildReadableErrorMessage,
  buildSentryTunnelUrl,
  buildSlowRequestRouteTemplate,
  buildSlowRequestTransaction,
  classifyHttpError,
  completeSlowRequestTiming,
  consumeSlowRequestBudget,
  extractResponseMetadata,
  getPathPattern,
  getSentryConfig,
  isSlowRequestEligible,
  mapHttpStatusToTraceStatus,
  parseStackFrames,
  sanitizeObject,
  sanitizeStack,
  sanitizeUrl,
  shouldSampleSlowRequest,
  shouldSuppressBrowserError,
  shouldPreferFetchTransport,
  shouldReportRequestError,
  shouldSuppressRequestError,
  startSlowRequestTiming
};
