import globalUtil from './global';

function getWindowRouteSignature(location = {}) {
  if (typeof window !== 'undefined') {
    if (window.location.hash) {
      return window.location.hash.replace(/^#/, '') || '/';
    }
    return `${window.location.pathname || '/'}${window.location.search || ''}`;
  }
  return `${location.pathname || '/'}${location.search || ''}`;
}

function normalizeRoutePath(routeSignature = '') {
  const signature = routeSignature || '/';
  return signature.split('?')[0] || '/';
}

function inferView(pathname) {
  if (/^\/team\//.test(pathname)) {
    return 'team';
  }
  if (/^\/enterprise\//.test(pathname)) {
    return 'enterprise';
  }
  if (/^\/explore\//.test(pathname)) {
    return 'explore';
  }
  if (/^\/account\//.test(pathname)) {
    return 'account';
  }
  return 'unknown';
}

function resolveEnterpriseId(state) {
  const currentEnterprise =
    state &&
    state.enterprise &&
    state.enterprise.currentEnterprise &&
    state.enterprise.currentEnterprise.enterprise_id;
  const globalEnterprise =
    state && state.global && state.global.enterprise && state.global.enterprise.enterprise_id;
  const currentUser =
    state && state.user && state.user.currentUser && state.user.currentUser.enterprise_id;

  return (
    globalUtil.getCurrEnterpriseId() ||
    currentEnterprise ||
    globalEnterprise ||
    currentUser ||
    ''
  );
}

function resolveComponentContext() {
  const slideType = globalUtil.getSlidePanelType();
  const queryComponentId = globalUtil.getSlidePanelComponentID();
  const routeComponentId = globalUtil.getComponentID();

  if (slideType === 'components' && queryComponentId) {
    return {
      componentId: queryComponentId,
      componentAlias: queryComponentId,
      componentSource: 'query'
    };
  }

  if (routeComponentId) {
    return {
      componentId: routeComponentId,
      componentAlias: routeComponentId,
      componentSource: 'route'
    };
  }

  return { componentId: '', componentAlias: '', componentSource: '' };
}

function resolveComponentRuntimeId(state = {}, fallbackComponentId = '') {
  if (!fallbackComponentId) {
    return '';
  }

  const appDetail =
    state &&
    state.appControl &&
    state.appControl.appDetail &&
    state.appControl.appDetail.service;

  if (!appDetail || !appDetail.service_id) {
    return fallbackComponentId;
  }

  const runtimeServiceId = appDetail.service_id;
  const aliases = [
    appDetail.service_alias,
    appDetail.service_cname,
    appDetail.service_id,
    appDetail.service_key
  ].filter(Boolean);

  if (!fallbackComponentId || aliases.indexOf(fallbackComponentId) > -1) {
    return runtimeServiceId;
  }

  return fallbackComponentId;
}

export function getAgentRouteSignature(location = {}) {
  return getWindowRouteSignature(location);
}

export function isAgentRouteHidden(location = {}) {
  const pathname = normalizeRoutePath(getWindowRouteSignature(location));

  return (
    /^\/user(\/|$)/.test(pathname) ||
    /^\/oauth(\/|$)/.test(pathname) ||
    /^\/enterprise\/[^/]+\/shell(\/|$)/.test(pathname) ||
    /^\/team\/[^/]+\/region\/[^/]+\/components\/[^/]+\/webconsole(\/|$)/.test(pathname)
  );
}

export function buildAgentContext(location = {}, state = {}) {
  const routeSignature = getWindowRouteSignature(location);
  const pathname = normalizeRoutePath(routeSignature);
  const resolvedComponent = resolveComponentContext();
  const componentId = resolveComponentRuntimeId(
    state,
    resolvedComponent.componentId
  );

  return {
    view: inferView(pathname),
    enterpriseId: resolveEnterpriseId(state),
    teamName: globalUtil.getCurrTeamName(),
    regionName: globalUtil.getCurrRegionName(),
    appId: globalUtil.getAppID(),
    componentId,
    componentAlias: resolvedComponent.componentAlias,
    componentSource: resolvedComponent.componentSource,
    pathname
  };
}

export function getAgentContextSignature(context = {}) {
  return [
    context.view || '',
    context.enterpriseId || '',
    context.teamName || '',
    context.regionName || '',
    context.appId || '',
    context.componentId || '',
    context.componentAlias || '',
    context.componentSource || ''
  ].join('|');
}

export function formatAgentContextMessage(context = {}) {
  const segments = [];

  if (context.view === 'enterprise' && context.enterpriseId) {
    segments.push(`企业 ${context.enterpriseId}`);
  } else if (context.enterpriseId && !context.teamName) {
    segments.push(`企业 ${context.enterpriseId}`);
  }

  if (context.teamName) {
    segments.push(`团队 ${context.teamName}`);
  }

  if (context.regionName) {
    segments.push(`集群 ${context.regionName}`);
  }

  if (context.appId) {
    segments.push(`应用 ${context.appId}`);
  }

  if (context.componentId) {
    segments.push(`组件 ${context.componentId}`);
  }

  return segments.length > 0 ? `已切换到 ${segments.join(' / ')}` : '已切换上下文';
}
