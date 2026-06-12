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
let clickTrackingInstalled = false;

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
  return {
    route,
    action: 'click',
    element_tag: String(element.tagName || '').toLowerCase(),
    element_type: normalizeText(element.getAttribute('type')),
    element_role: normalizeText(element.getAttribute('role')),
    element_text: getElementLabel(element),
    element_href: getElementHref(element)
  };
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
      capturePostHogEvent('rainbond_ui_click', buildClickProperties(element));
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
