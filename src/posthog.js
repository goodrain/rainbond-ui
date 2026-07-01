import posthog from 'posthog-js';
import { history } from 'umi';
import { getPathPattern } from './sentryConfig';
import {
  DENYLISTED_PROPERTIES,
  buildHashedId,
  buildPostHogDistinctId,
  buildPostHogGroupProperties,
  buildPostHogUserProperties,
  classifyPostHogInteraction,
  getPostHogConfig,
  inferPostHogCreateStep,
  sanitizePostHogEvent
} from './posthogConfig';

let initialized = false;
let historyUnlisten = null;
let clickTrackingInstalled = false;
let activeConfig = null;

const CLICKABLE_SELECTOR = [
  'button',
  'a',
  '[role="button"]',
  '[role="menuitem"]',
  '[role="tab"]',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  '[data-posthog-action]',
  '[data-tracking-id]'
].join(',');

function getLocationPath(location) {
  if (location && location.pathname) {
    return `${location.pathname}${location.search || ''}${location.hash || ''}`;
  }
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.pathname}${window.location.search || ''}${window.location.hash || ''}`;
  }
  return '';
}

function getCommonProperties() {
  if (!activeConfig || !activeConfig.instanceProperties) {
    return {};
  }
  return activeConfig.instanceProperties;
}

function inferModule(route) {
  const value = route || '';
  if (value.indexOf('appstore') >= 0 || value.indexOf('market') >= 0) {
    return 'app_store';
  }
  if (value.indexOf('plugin') >= 0) {
    return 'plugin';
  }
  if (value.indexOf('gateway') >= 0 || value.indexOf('domain') >= 0) {
    return 'gateway';
  }
  if (value.indexOf('team') >= 0 || value.indexOf('member') >= 0) {
    return 'team';
  }
  if (value.indexOf('monitor') >= 0) {
    return 'monitor';
  }
  if (value.indexOf('create') >= 0 || value.indexOf('source') >= 0 || value.indexOf('image') >= 0) {
    return 'component_create';
  }
  return 'unknown';
}

function buildRouteProperties(route, extra = {}) {
  return {
    ...getCommonProperties(),
    route,
    module: inferModule(route),
    ...extra
  };
}

function getCurrentRouteProperties(extra = {}) {
  const route = getPathPattern(getLocationPath(history && history.location));
  return buildRouteProperties(route, extra);
}

function buildContextProperties(properties = {}) {
  const allowPublicAppName = !!properties.allow_public_app_name || !!properties.allowPublicAppName;
  const marketAppName = allowPublicAppName
    ? properties.market_app_name || properties.marketAppName || properties.template_name || properties.templateName || ''
    : '';
  return {
    team_name_hash: buildHashedId(properties.team_name || properties.teamName),
    app_alias_hash: buildHashedId(properties.app_alias || properties.appAlias || properties.service_alias),
    app_id_hash: buildHashedId(properties.app_id || properties.appId || properties.group_id),
    component_id_hash: buildHashedId(properties.component_id || properties.componentId || properties.service_id),
    install_source: properties.install_source || properties.installSource || '',
    deploy_type: properties.deploy_type || properties.deployType || '',
    action_type: properties.action_type || properties.actionType || '',
    stage: properties.stage || '',
    error_code: properties.error_code || properties.errorCode || '',
    error_category: properties.error_category || properties.errorCategory || '',
    duration_ms: properties.duration_ms || properties.durationMs || 0,
    attempt_id: properties.attempt_id || properties.attemptId || '',
    retry_result: properties.retry_result || properties.retryResult || '',
    app_name: marketAppName,
    template_id: properties.template_id || properties.templateId || '',
    template_name: allowPublicAppName ? properties.template_name || properties.templateName || '' : '',
    version: properties.version || properties.app_version || properties.appVersion || '',
    category: properties.category || '',
    source: properties.source || ''
  };
}

export function capturePostHogPageview(location) {
  if (!initialized) {
    return;
  }
  const route = getPathPattern(getLocationPath(location));
  posthog.capture('$pageview', buildRouteProperties(route, {
    $current_url: route
  }));
  posthog.capture('rainbond_module_entered', buildRouteProperties(route, {
    entry: 'page'
  }));
  const createStep = inferPostHogCreateStep(route);
  if (createStep) {
    posthog.capture('create_step_viewed', buildRouteProperties(route, {
      action_type: 'create_step_view',
      step: createStep
    }));
  }
}

function installHistoryTracking() {
  if (!history || typeof history.listen !== 'function' || historyUnlisten) {
    return;
  }
  historyUnlisten = history.listen(location => {
    capturePostHogPageview(location);
  });
}

function normalizeText(value, maxLength = 120) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function getClickableElement(target) {
  if (!target || typeof target.closest !== 'function') {
    return null;
  }
  return target.closest(CLICKABLE_SELECTOR);
}

function getIconName(element) {
  if (!element || typeof element.querySelector !== 'function') {
    return '';
  }
  const icon = element.querySelector('[class*="anticon-"], [data-icon]');
  if (!icon) {
    return '';
  }
  const dataIcon = icon.getAttribute('data-icon');
  if (dataIcon) {
    return normalizeText(dataIcon);
  }
  const className = typeof icon.className === 'string' ? icon.className : '';
  const iconClass = className.split(/\s+/).find(name => name.indexOf('anticon-') === 0 && name !== 'anticon');
  return iconClass || '';
}

function getElementLabel(element) {
  const label = firstNonEmpty(
    element.getAttribute('data-posthog-action'),
    element.getAttribute('data-tracking-id'),
    element.getAttribute('aria-label'),
    element.getAttribute('title'),
    element.getAttribute('name'),
    element.tagName === 'INPUT' ? element.getAttribute('value') : '',
    element.innerText,
    element.textContent,
    getIconName(element)
  );
  return normalizeText(label);
}

function firstNonEmpty() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = normalizeText(arguments[index]);
    if (value) {
      return value;
    }
  }
  return '';
}

function getElementHref(element) {
  if (!element || element.tagName !== 'A') {
    return '';
  }
  const href = element.getAttribute('href') || '';
  if (!href || href.indexOf('javascript:') === 0) {
    return '';
  }
  return getPathPattern(href);
}

function buildClickProperties(element) {
  const route = getPathPattern(getLocationPath(history && history.location));
  return buildRouteProperties(route, {
    action: 'click',
    entry: firstNonEmpty(element.getAttribute('data-posthog-entry'), element.getAttribute('data-posthog-action'), element.getAttribute('data-tracking-id')),
    element_tag: String(element.tagName || '').toLowerCase(),
    element_type: normalizeText(element.getAttribute('type')),
    element_role: normalizeText(element.getAttribute('role')),
    element_text: getElementLabel(element),
    element_href: getElementHref(element)
  });
}

function installClickTracking() {
  if (clickTrackingInstalled || typeof document === 'undefined') {
    return;
  }
  clickTrackingInstalled = true;
  document.addEventListener(
    'click',
    event => {
      const element = getClickableElement(event.target);
      if (!element) {
        return;
      }
      const clickProperties = buildClickProperties(element);
      capturePostHogEvent('rainbond_ui_click', clickProperties);
      const classified = classifyPostHogInteraction(clickProperties);
      if (classified) {
        capturePostHogEvent(classified.event_name, {
          ...clickProperties,
          interaction_type: classified.interaction_type
        });
      }
    },
    true
  );
}

function sanitizeRouteProperties(captureResult) {
  const sanitized = sanitizePostHogEvent(captureResult);
  if (!sanitized || !sanitized.properties) {
    return sanitized;
  }
  if (!sanitized.properties.route) {
    sanitized.properties.route = getPathPattern(getLocationPath(history && history.location));
  }
  ['$current_url', '$pathname', '$referrer', 'current_url', 'href'].forEach(key => {
    if (typeof sanitized.properties[key] === 'string') {
      sanitized.properties[key] = getPathPattern(sanitized.properties[key]);
    }
  });
  return sanitized;
}

export function initPostHog() {
  const config = getPostHogConfig();
  if (!config.enabled || initialized) {
    return false;
  }
  initialized = true;
  activeConfig = config;
  posthog.init(config.projectToken, {
    api_host: config.apiHost,
    ui_host: config.uiHost || null,
    defaults: config.defaults,
    person_profiles: config.personProfiles,
    autocapture: config.autocapture,
    capture_pageview: false,
    capture_pageleave: config.capturePageleave,
    advanced_disable_flags: config.disableFlags,
    disable_session_recording: !config.sessionRecording,
    mask_all_text: config.maskAllText,
    mask_all_element_attributes: config.maskAllElementAttributes,
    mask_personal_data_properties: true,
    property_denylist: DENYLISTED_PROPERTIES,
    debug: config.debug,
    before_send: sanitizeRouteProperties,
    loaded: () => {
      if (config.instanceId && typeof posthog.group === 'function') {
        posthog.group('instance', config.instanceId, config.instanceProperties || {});
      }
      capturePostHogPageview(history && history.location);
    }
  });
  installHistoryTracking();
  installClickTracking();
  return true;
}

export function identifyPostHogUser(user = {}) {
  if (!initialized || !user || !user.user_id) {
    return;
  }
  const distinctId = buildPostHogDistinctId(user, activeConfig && activeConfig.instanceId);
  posthog.identify(distinctId, buildPostHogUserProperties(user, activeConfig && activeConfig.instanceProperties));
  const group = buildPostHogGroupProperties(user, activeConfig && activeConfig.instanceProperties);
  if (group.enterpriseIdHash && typeof posthog.group === 'function') {
    posthog.group('enterprise', group.enterpriseIdHash, group.enterpriseProperties);
  }
}

export function resetPostHogUser() {
  if (!initialized) {
    return;
  }
  posthog.reset();
}

export function capturePostHogEvent(eventName, properties = {}) {
  if (!initialized || !eventName) {
    return;
  }
  posthog.capture(eventName, {
    ...getCommonProperties(),
    ...properties
  });
}

export function captureMeaningfulActive(actionType, properties = {}) {
  capturePostHogEvent(
    'meaningful_active',
    getCurrentRouteProperties({
      ...buildContextProperties(properties),
      action_type: actionType || properties.action_type || properties.actionType || 'unknown'
    })
  );
}

export function captureAppOperation(actionType, status, properties = {}) {
  const safeActionType = actionType || properties.action_type || properties.actionType || 'unknown';
  const safeStatus = status || properties.status || 'started';
  const eventName = `app_operation_${safeStatus}`;
  capturePostHogEvent(
    eventName,
    getCurrentRouteProperties({
      ...buildContextProperties(properties),
      action_type: safeActionType,
      status: safeStatus
    })
  );
  if (safeStatus === 'succeeded') {
    captureMeaningfulActive(safeActionType, properties);
  }
}

export function captureErrorViewed(errorCategory, properties = {}) {
  capturePostHogEvent(
    'error_viewed',
    getCurrentRouteProperties({
      ...buildContextProperties(properties),
      action_type: properties.action_type || properties.actionType || 'error_viewed',
      error_category: errorCategory || properties.error_category || properties.errorCategory || 'unknown',
      error_code: properties.error_code || properties.errorCode || '',
      stage: properties.stage || '',
      status: properties.status || 'viewed'
    })
  );
}

export function captureFirstAppDeploySuccess(properties = {}) {
  capturePostHogEvent(
    'first_app_deploy_success',
    getCurrentRouteProperties({
      ...buildContextProperties(properties),
      action_type: 'first_app_deploy'
    })
  );
  captureMeaningfulActive('first_app_deploy', properties);
}

export function captureMarketInstall(status, properties = {}) {
  const safeStatus = status || properties.status || 'started';
  capturePostHogEvent(
    `market_install_${safeStatus}`,
    getCurrentRouteProperties({
      ...buildContextProperties({
        ...properties,
        allow_public_app_name: true
      }),
      action_type: 'market_install',
      status: safeStatus
    })
  );
  if (safeStatus === 'succeeded') {
    captureMeaningfulActive('market_install', properties);
  }
}

export function captureAgentRetentionEvent(eventName, properties = {}) {
  capturePostHogEvent(
    eventName,
    getCurrentRouteProperties({
      session_id_hash: buildHashedId(properties.session_id || properties.sessionId),
      run_id_hash: buildHashedId(properties.run_id || properties.runId),
      action_type: properties.action_type || properties.actionType || 'agent_question',
      status: properties.status || '',
      error_code: properties.error_code || properties.errorCode || '',
      error_category: properties.error_category || properties.errorCategory || ''
    })
  );
  if (eventName === 'agent_question_created') {
    captureMeaningfulActive('agent_question', properties);
  }
}
