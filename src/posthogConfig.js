const SENSITIVE_KEY_RE = /(token|password|secret|authorization|cookie|key|dsn|email|phone)/i;
const SENSITIVE_VALUE_RE = /\b((?:token|password|secret|authorization|cookie|dsn|api[_-]?key|access[_-]?key|secret[_-]?key|email|phone)\s*[:=]\s*)(?:bearer\s+)?[^&\s"'<>]+/gi;
const BEARER_VALUE_RE = /\b(bearer\s+)[a-z0-9._~+/=-]+/gi;
const DEFAULT_PROJECT_TOKEN = 'phc_oCoPwcxutKCU9AZtUT63dMTNhWezUxCXCLtSZE6a4wvE';
const DEFAULT_API_HOST = '/console/posthog';
const DEFAULT_UI_HOST = 'https://posthog.goodrain.com';
const DEFAULT_CONFIG_DATE = '2026-05-30';
const DEFAULT_PERSON_PROFILES = 'identified_only';
const POSTHOG_RESERVED_PROPERTIES = {
  token: true
};
const DENYLISTED_PROPERTIES = [
  '$raw_user_agent',
  '$title',
  '$viewport_height',
  '$viewport_width',
  'password',
  'authorization',
  'cookie'
];
let md5 = null;

try {
  md5 = require('js-md5');
} catch (error) {
  md5 = null;
}

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

function safeObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value;
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
  const projectToken = DEFAULT_PROJECT_TOKEN;

  return {
    enabled: resolveEnabled(runtime, env, projectToken),
    projectToken,
    apiHost: firstValue(runtime.apiHost, runtime.api_host, env.RAINBOND_POSTHOG_API_HOST, env.POSTHOG_API_HOST, env.UMI_APP_POSTHOG_API_HOST, DEFAULT_API_HOST),
    uiHost: firstValue(runtime.uiHost, runtime.ui_host, env.RAINBOND_POSTHOG_UI_HOST, env.POSTHOG_UI_HOST, env.UMI_APP_POSTHOG_UI_HOST, DEFAULT_UI_HOST),
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
    disableFlags: resolveBool(firstValue(runtime.disableFlags, runtime.disable_flags, runtime.advanced_disable_flags, env.RAINBOND_POSTHOG_DISABLE_FLAGS, env.POSTHOG_DISABLE_FLAGS), true),
    debug: resolveBool(firstValue(runtime.debug, env.RAINBOND_POSTHOG_DEBUG, env.POSTHOG_DEBUG), false),
    instanceId: firstValue(runtime.instanceId, runtime.instance_id),
    instanceProperties: safeObject(firstValue(runtime.instanceProperties, runtime.instance_properties))
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
  const sanitizedProperties = sanitizeObject(captureResult.properties);
  Object.keys(POSTHOG_RESERVED_PROPERTIES).forEach(key => {
    if (Object.prototype.hasOwnProperty.call(captureResult.properties, key)) {
      sanitizedProperties[key] = captureResult.properties[key];
    }
  });
  const sanitized = {
    ...captureResult,
    properties: sanitizedProperties
  };
  if (sanitized.$set) {
    sanitized.$set = sanitizeObject(sanitized.$set);
  }
  if (sanitized.$set_once) {
    sanitized.$set_once = sanitizeObject(sanitized.$set_once);
  }
  return sanitized;
}

function hashString(value) {
  const normalized = String(value || '');
  if (md5) {
    return md5(normalized);
  }
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(index);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

function buildPostHogDistinctId(user = {}, instanceId = '') {
  if (!user || !user.user_id) {
    return '';
  }
  if (!instanceId) {
    return String(user.user_id);
  }
  return hashString(`${instanceId}:${user.user_id}`);
}

function buildHashedId(value, prefix = '') {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  const hashed = hashString(value);
  return prefix ? `${prefix}_${hashed}` : hashed;
}

function buildPostHogUserProperties(user = {}, instanceProperties = {}) {
  const enterpriseId = firstValue(user.enterprise_id, user.enterpriseId, user.eid);
  return {
    ...safeObject(instanceProperties),
    enterprise_id_hash: buildHashedId(enterpriseId),
    is_enterprise_admin: !!user.is_enterprise_admin,
    team_count: Array.isArray(user.teams) ? user.teams.length : 0
  };
}

function buildPostHogGroupProperties(user = {}, instanceProperties = {}) {
  const enterpriseId = firstValue(user.enterprise_id, user.enterpriseId, user.eid);
  return {
    enterpriseIdHash: buildHashedId(enterpriseId, 'enterprise'),
    enterpriseProperties: {
      ...safeObject(instanceProperties),
      is_enterprise_admin: !!user.is_enterprise_admin,
      team_count: Array.isArray(user.teams) ? user.teams.length : 0
    }
  };
}

function inferPostHogCreateStep(route = '') {
  const value = String(route || '').toLowerCase();
  if (!value) {
    return '';
  }
  if (value.indexOf('/create-plugin') > -1) {
    return 'plugin_create';
  }
  if (value.indexOf('/create/') === -1) {
    return '';
  }
  if (value.indexOf('/create/wizard') > -1) {
    return 'wizard';
  }
  if (value.indexOf('/create/code') > -1) {
    return 'source_code';
  }
  if (value.indexOf('/create/yaml') > -1) {
    return 'yaml';
  }
  if (value.indexOf('/create/database-config') > -1) {
    return 'database_config';
  }
  if (value.indexOf('/create/database') > -1) {
    return 'database';
  }
  if (value.indexOf('/create/outer') > -1) {
    return 'third_party';
  }
  if (value.indexOf('/create/market') > -1) {
    return 'market';
  }
  if (value.indexOf('/create/create-check') > -1) {
    return 'create_check';
  }
  if (value.indexOf('/create/create-compose-check') > -1) {
    return 'compose_check';
  }
  if (value.indexOf('/create/image') > -1) {
    return 'image';
  }
  if (value.indexOf('/create/vm') > -1) {
    return 'virtual_machine';
  }
  if (value.indexOf('/create/create-setting') > -1) {
    return 'create_setting';
  }
  if (value.indexOf('/create/create-configport') > -1) {
    return 'port_config';
  }
  if (value.indexOf('/create/create-configfile') > -1) {
    return 'file_config';
  }
  if (value.indexOf('/create/create-moreservice') > -1) {
    return 'more_service';
  }
  if (value.indexOf('/create/create-compose-setting') > -1) {
    return 'compose_setting';
  }
  return 'unknown_create_step';
}

function classifyPostHogInteraction(properties = {}) {
  const text = String(properties.element_text || '').toLowerCase();
  const entry = String(properties.entry || '').toLowerCase();
  const href = String(properties.element_href || '').toLowerCase();
  const combined = `${text} ${entry} ${href}`;
  if (/重试|重新|刷新|retry|again/.test(combined)) {
    return {
      event_name: 'retry_clicked',
      interaction_type: 'retry'
    };
  }
  if (/复制|copy/.test(combined)) {
    return {
      event_name: 'fix_suggestion_copied',
      interaction_type: 'fix_copy'
    };
  }
  if (/帮助|文档|客服|联系|工单|support|help|docs|doc\//.test(combined)) {
    return {
      event_name: 'support_opened',
      interaction_type: 'support'
    };
  }
  return null;
}

module.exports = {
  DENYLISTED_PROPERTIES,
  getPostHogConfig,
  sanitizeObject,
  sanitizePostHogEvent,
  buildHashedId,
  buildPostHogDistinctId,
  buildPostHogUserProperties,
  buildPostHogGroupProperties,
  classifyPostHogInteraction,
  inferPostHogCreateStep
};
