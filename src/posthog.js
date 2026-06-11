import posthog from 'posthog-js';
import { history } from 'umi';
import { getPathPattern } from './sentryConfig';
import {
  DENYLISTED_PROPERTIES,
  buildPostHogUserProperties,
  getPostHogConfig,
  sanitizePostHogEvent
} from './posthogConfig';

let initialized = false;
let historyUnlisten = null;

function getLocationPath(location) {
  if (location && location.pathname) {
    return `${location.pathname}${location.search || ''}${location.hash || ''}`;
  }
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.pathname}${window.location.search || ''}${window.location.hash || ''}`;
  }
  return '';
}

export function capturePostHogPageview(location) {
  if (!initialized) {
    return;
  }
  const route = getPathPattern(getLocationPath(location));
  posthog.capture('$pageview', {
    route,
    $current_url: route
  });
}

function installHistoryTracking() {
  if (!history || typeof history.listen !== 'function' || historyUnlisten) {
    return;
  }
  historyUnlisten = history.listen(location => {
    capturePostHogPageview(location);
  });
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
  posthog.init(config.projectToken, {
    api_host: config.apiHost,
    ui_host: config.uiHost || null,
    defaults: config.defaults,
    person_profiles: config.personProfiles,
    autocapture: config.autocapture,
    capture_pageview: false,
    capture_pageleave: config.capturePageleave,
    disable_session_recording: !config.sessionRecording,
    mask_all_text: config.maskAllText,
    mask_all_element_attributes: config.maskAllElementAttributes,
    mask_personal_data_properties: true,
    property_denylist: DENYLISTED_PROPERTIES,
    debug: config.debug,
    before_send: sanitizeRouteProperties,
    loaded: () => {
      capturePostHogPageview(history && history.location);
    }
  });
  installHistoryTracking();
  return true;
}

export function identifyPostHogUser(user = {}) {
  if (!initialized || !user || !user.user_id) {
    return;
  }
  posthog.identify(String(user.user_id), buildPostHogUserProperties(user));
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
  posthog.capture(eventName, properties);
}
