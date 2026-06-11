const SENSITIVE_KEY_RE = /(token|password|secret|authorization|cookie|key|dsn|email|phone)/i;
const SENSITIVE_VALUE_RE = /\b((?:token|password|secret|authorization|cookie|dsn|api[_-]?key|access[_-]?key|secret[_-]?key|email|phone)\s*[:=]\s*)(?:bearer\s+)?[^&\s"'<>]+/gi;
const BEARER_VALUE_RE = /\b(bearer\s+)[a-z0-9._~+/=-]+/gi;
const DEFAULT_API_HOST = 'https://posthog.goodrain.com';
const DEFAULT_CONFIG_DATE = '2026-05-30';
const DEFAULT_PERSON_PROFILES = 'identified_only';
const DENYLISTED_PROPERTIES = [
  '$raw_user_agent',
  '$title',
  '$viewport_height',
  '$viewport_width',
  'password',
  'token',
  'authorization',
  'cookie'
];

function readRuntimeConfig() {
  if (typeof window === 'undefined') {
    return {};
  }
  if (window.RAINBOND_POSTHOG || window.__RAINBOND_POSTHOG__) {
    return window.RAINBOND_POSTHOG || window.__RAINBOND_POSTHOG__;
  }
  if (typeof document === 'undefined') {
    return {};
  }
  const script = document.getElementById('rainbond-posthog-config');
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
  return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes' || value.toLowerCase() === 'on';
}

function isDisabled(value) {
  if (value === false) {
    return true;
  }
  if (typeof value !== 'string') {
    return false;
  }
  return value.toLowerCase() === 'false' || value === '0' || value.toLowerCase() === 'no' || value.toLowerCase() === 'off';
}

function firstValue() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = arguments[index];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return '';
}

function resolveBool(value, defaultValue) {
  if (isEnabled(value)) {
    return true;
  }
  if (isDisabled(value)) {
    return false;
  }
  return defaultValue;
}

function resolveEnabled(runtime, env, projectToken) {
  if (
    isEnabled(runtime.disabled) ||
    isEnabled(env.RAINBOND_TELEMETRY_DISABLED) ||
    isEnabled(env.RAINBOND_POSTHOG_DISABLED) ||
    isEnabled(env.POSTHOG_DISABLED)
  ) {
    return false;
  }
  if (runtime.enabled !== undefined) {
    return resolveBool(runtime.enabled, true) && !!projectToken;
  }
  if (env.RAINBOND_POSTHOG_ENABLED !== undefined || env.POSTHOG_ENABLED !== undefined || env.UMI_APP_POSTHOG_ENABLED !== undefined) {
    return resolveBool(firstValue(env.RAINBOND_POSTHOG_ENABLED, env.POSTHOG_ENABLED, env.UMI_APP_POSTHOG_ENABLED), true) && !!projectToken;
  }
  return !!projectToken;
}

function getPostHogConfig() {
  const runtime = readRuntimeConfig();
  const env = readProcessEnv();
  const projectToken = firstValue(
    runtime.projectToken,
    runtime.token,
    env.RAINBOND_POSTHOG_PROJECT_TOKEN,
    env.RAINBOND_POSTHOG_TOKEN,
    env.POSTHOG_PROJECT_TOKEN,
    env.POSTHOG_TOKEN,
    env.UMI_APP_POSTHOG_PROJECT_TOKEN,
    env.UMI_APP_POSTHOG_TOKEN
  );

  return {
    enabled: resolveEnabled(runtime, env, projectToken),
    projectToken,
    apiHost: firstValue(runtime.apiHost, runtime.api_host, env.RAINBOND_POSTHOG_API_HOST, env.POSTHOG_API_HOST, env.UMI_APP_POSTHOG_API_HOST, DEFAULT_API_HOST),
    uiHost: firstValue(runtime.uiHost, runtime.ui_host, env.RAINBOND_POSTHOG_UI_HOST, env.POSTHOG_UI_HOST, env.UMI_APP_POSTHOG_UI_HOST),
    defaults: firstValue(runtime.defaults, env.RAINBOND_POSTHOG_DEFAULTS, env.POSTHOG_DEFAULTS, DEFAULT_CONFIG_DATE),
    personProfiles: firstValue(runtime.personProfiles, runtime.person_profiles, env.RAINBOND_POSTHOG_PERSON_PROFILES, env.POSTHOG_PERSON_PROFILES, DEFAULT_PERSON_PROFILES),
    autocapture: resolveBool(firstValue(runtime.autocapture, env.RAINBOND_POSTHOG_AUTOCAPTURE, env.POSTHOG_AUTOCAPTURE), true),
    sessionRecording: resolveBool(firstValue(runtime.sessionRecording, runtime.session_recording, env.RAINBOND_POSTHOG_SESSION_RECORDING, env.POSTHOG_SESSION_RECORDING), false),
    maskAllText: resolveBool(firstValue(runtime.maskAllText, runtime.mask_all_text, env.RAINBOND_POSTHOG_MASK_ALL_TEXT, env.POSTHOG_MASK_ALL_TEXT), false),
    maskAllElementAttributes: resolveBool(
      firstValue(runtime.maskAllElementAttributes, runtime.mask_all_element_attributes, env.RAINBOND_POSTHOG_MASK_ALL_ELEMENT_ATTRIBUTES, env.POSTHOG_MASK_ALL_ELEMENT_ATTRIBUTES),
      true
    ),
    capturePageleave: resolveBool(firstValue(runtime.capturePageleave, runtime.capture_pageleave, env.RAINBOND_POSTHOG_CAPTURE_PAGELEAVE, env.POSTHOG_CAPTURE_PAGELEAVE), false),
    debug: resolveBool(firstValue(runtime.debug, env.RAINBOND_POSTHOG_DEBUG, env.POSTHOG_DEBUG), false)
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

function sanitizePostHogEvent(captureResult) {
  if (!captureResult || !captureResult.properties) {
    return captureResult;
  }
  const sanitized = {
    ...captureResult,
    properties: sanitizeObject(captureResult.properties)
  };
  if (sanitized.$set) {
    sanitized.$set = sanitizeObject(sanitized.$set);
  }
  if (sanitized.$set_once) {
    sanitized.$set_once = sanitizeObject(sanitized.$set_once);
  }
  return sanitized;
}

function buildPostHogUserProperties(user = {}) {
  return {
    enterprise_id: user.enterprise_id || '',
    is_enterprise_admin: !!user.is_enterprise_admin,
    team_count: Array.isArray(user.teams) ? user.teams.length : 0
  };
}

module.exports = {
  DENYLISTED_PROPERTIES,
  getPostHogConfig,
  sanitizeObject,
  sanitizePostHogEvent,
  buildPostHogUserProperties
};
