const SENSITIVE_KEY_RE = /(token|password|secret|authorization|cookie|key|dsn)/i;
const SENSITIVE_VALUE_RE = /\b((?:token|password|secret|authorization|cookie|dsn|api[_-]?key|access[_-]?key|secret[_-]?key)\s*[:=]\s*)(?:bearer\s+)?[^&\s"'<>]+/gi;
const BEARER_VALUE_RE = /\b(bearer\s+)[a-z0-9._~+/=-]+/gi;
const DEFAULT_TRACE_SAMPLE_RATE = 0;
const DYNAMIC_SEGMENT_MARKERS = {
  teams: true,
  tenants: true,
  apps: true,
  services: true,
  components: true,
  groups: true,
  regions: true,
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
    if (previous && DYNAMIC_SEGMENT_MARKERS[String(previous).toLowerCase()]) {
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

module.exports = {
  getPathPattern,
  getSentryConfig,
  sanitizeObject,
  sanitizeStack,
  sanitizeUrl,
  shouldReportRequestError
};
