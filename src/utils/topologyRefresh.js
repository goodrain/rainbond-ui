// Page-lifetime coordination only: never cache topology data or permission-dependent results.
let subscriptions = [];

function topologyScope(team, region, application) {
  if (!team || !region || application === undefined || application === null || application === '') return '';
  return JSON.stringify([String(team), String(region), String(application)]);
}

function routeScope(location) {
  const match = location && /^#\/team\/([^/]+)\/region\/([^/]+)\/apps\/([^/?]+)/.exec(location.hash || '');
  if (!match) return null;
  try { return match.slice(1).map(decodeURIComponent); } catch (_) { return null; }
}

function subscribeTopologyRefresh(scope, refresh, getComponents) {
  const subscription = { scope, refresh, getComponents };
  subscriptions.push(subscription);
  return () => { subscriptions = subscriptions.filter(item => item !== subscription); };
}

function succeeded(response) {
  if (!response || typeof response !== 'object') return false;
  const status = response.status_code === undefined ? response.code : response.status_code;
  const businessCode = response.business_code === undefined
    ? (response._condition === undefined ? response.code : response._condition) : response.business_code;
  return Number(status) === 200 && Number(businessCode) === 200;
}

function captureTopologyOperation(payload = {}, location = typeof window === 'undefined' ? null : window.location) {
  const route = routeScope(location);
  if (!route || !payload.team_name || String(payload.team_name) !== route[0] ||
      ((payload.region_name || payload.region) && String(payload.region_name || payload.region) !== route[1]) ||
      (payload.group_id !== undefined && String(payload.group_id) !== route[2])) return () => {};
  const scope = topologyScope(...route);
  // Capture subscriber identity as well as scope. Late completion cannot refresh a later mount.
  const targets = subscriptions.filter(item => item.scope === scope);
  const alias = payload.app_alias || payload.service_alias;
  const serviceIds = payload.serviceIds || payload.service_ids;
  const ids = (Array.isArray(serviceIds) ? serviceIds : (typeof serviceIds === 'string' ? serviceIds.split(',') : []))
    .map(value => String(value).trim()).filter(Boolean);
  const componentId = payload.service_id && String(payload.service_id);
  const application = payload.group_id === undefined ? payload.app_id : payload.group_id;
  return response => {
    if (!succeeded(response)) return;
    targets.forEach(item => {
      if (subscriptions.indexOf(item) === -1) return;
      try {
        const suppliedComponents = item.getComponents ? item.getComponents() : [];
        const components = Array.isArray(suppliedComponents) ? suppliedComponents : [];
        const matches = (application !== undefined && String(application) === route[2]) || components.some(component => component && (
          (alias && component.service_alias === alias) ||
          (componentId && String(component.service_id) === componentId) || ids.indexOf(String(component.service_id)) !== -1));
        if (matches) item.refresh();
      } catch (_) { /* A view listener must not change a successful mutation result. */ }
    });
  };
}

function postTopologyRefresh(iframe, scope, type = 'rainbond:topology-refresh', expectedOrigin = typeof window === 'undefined' ? '' : window.location.origin) {
  if (!iframe || !iframe.contentWindow || !scope || !expectedOrigin) return false;
  try {
    const origin = new URL(iframe.src, expectedOrigin).origin;
    if (origin !== expectedOrigin) return false;
    iframe.contentWindow.postMessage({ type, scope }, origin);
    return true;
  } catch (_) { return false; }
}

module.exports = { topologyScope, subscribeTopologyRefresh, captureTopologyOperation, postTopologyRefresh };
