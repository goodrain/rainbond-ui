function buildQuery(params = {}) {
  const entries = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => `${key}=${encodeURIComponent(params[key])}`);

  return entries.length ? `?${entries.join('&')}` : '';
}

function buildTeamIndexRoute(context = {}) {
  const teamName = context.teamName || '';
  const regionName = context.regionName || '';

  if (!teamName || !regionName) {
    return '';
  }

  return `/team/${teamName}/region/${regionName}/index`;
}

function buildAppOverviewRoute(context = {}, extraQuery = {}) {
  const teamName = context.teamName || '';
  const regionName = context.regionName || '';
  const appId = context.appId || '';

  if (!teamName || !regionName || !appId) {
    return '';
  }

  return `/team/${teamName}/region/${regionName}/apps/${appId}/overview${buildQuery(extraQuery)}`;
}

function buildAppGatewayRoute(context = {}, extraQuery = {}) {
  const teamName = context.teamName || '';
  const regionName = context.regionName || '';
  const appId = context.appId || '';

  if (!teamName || !regionName || !appId) {
    return '';
  }

  return `/team/${teamName}/region/${regionName}/apps/${appId}/gateway${buildQuery(extraQuery)}`;
}

function buildAppUpgradeRoute(context = {}, extraQuery = {}) {
  const teamName = context.teamName || '';
  const regionName = context.regionName || '';
  const appId = context.appId || '';

  if (!teamName || !regionName || !appId) {
    return '';
  }

  return `/team/${teamName}/region/${regionName}/apps/${appId}/upgrade${buildQuery(extraQuery)}`;
}

function buildAppVersionRoute(context = {}, extraQuery = {}) {
  const teamName = context.teamName || '';
  const regionName = context.regionName || '';
  const appId = context.appId || '';

  if (!teamName || !regionName || !appId) {
    return '';
  }

  return `/team/${teamName}/region/${regionName}/apps/${appId}/version${buildQuery(extraQuery)}`;
}

function buildComponentOverviewRoute(context = {}, options = {}) {
  const teamName = context.teamName || '';
  const regionName = context.regionName || '';
  const appId = context.appId || '';
  const componentAlias = options.componentAlias || context.componentAlias || '';
  const tab = options.tab || 'overview';
  const subTab = options.subTab || '';
  const refresh = options.refresh || '';

  if (!teamName || !regionName || !appId || !componentAlias) {
    return '';
  }

  return `/team/${teamName}/region/${regionName}/apps/${appId}/overview${buildQuery({
    type: 'components',
    componentID: componentAlias,
    tab,
    subTab,
    refresh,
  })}`;
}

function pickFirstItem(input) {
  if (Array.isArray(input) && input.length > 0) {
    return input[0];
  }
  return null;
}

function extractAppId(result = {}, context = {}) {
  return (
    result.app_id ||
    (result.app && (result.app.app_id || result.app.ID)) ||
    result.ID ||
    context.appId ||
    ''
  );
}

function extractComponentAlias(result = {}, context = {}) {
  const firstItem = pickFirstItem(result.items);
  return (
    result.result_ref?.service_alias ||
    result.result_ref?.component_alias ||
    result.service_alias ||
    (result.service && result.service.service_alias) ||
    (firstItem && (firstItem.service_alias || firstItem.dep_app_alias)) ||
    context.componentAlias ||
    ''
  );
}

function extractRouteRef(ref = null) {
  if (!ref || typeof ref !== 'object') {
    return null;
  }
  return ref;
}

function buildRouteContext(context = {}, ref = null) {
  const routeRef = extractRouteRef(ref);
  if (!routeRef) {
    return context;
  }

  return {
    ...context,
    teamName: routeRef.team_name || routeRef.teamName || context.teamName || '',
    regionName:
      routeRef.region_name || routeRef.regionName || context.regionName || '',
    appId: routeRef.app_id || routeRef.appId || context.appId || '',
    componentAlias:
      routeRef.service_alias ||
      routeRef.serviceAlias ||
      routeRef.component_alias ||
      routeRef.componentAlias ||
      context.componentAlias ||
      '',
    operation: routeRef.operation || routeRef.action || context.operation || '',
  };
}

function isThirdPartyComponent(appDetail) {
  return !!(appDetail && appDetail.is_third);
}

const MUTATION_ROUTE_POLICIES = {
  rainbond_build_component: {
    post: { routeKind: 'component-refresh', tab: 'overview' },
  },
  rainbond_delete_component: {
    pre: { routeKind: 'component', tab: 'overview' },
    post: { routeKind: 'app-overview-refresh' },
  },
  rainbond_delete_app: {
    pre: { routeKind: 'app-overview' },
    post: { routeKind: 'team-index' },
  },
  rainbond_manage_component_envs: {
    pre: { routeKind: 'component', tab: 'environmentConfiguration' },
    post: { routeKind: 'component-refresh', tab: 'environmentConfiguration' },
  },
  rainbond_manage_component_connection_envs: {
    pre: { routeKind: 'component', tab: 'connectionInformation' },
    post: { routeKind: 'component-refresh', tab: 'connectionInformation' },
  },
  rainbond_manage_component_dependency: {
    pre: { routeKind: 'component', tab: 'relation' },
    post: { routeKind: 'component-refresh', tab: 'relation' },
  },
  rainbond_manage_component_ports: {
    pre: { routeKind: 'component-port' },
    post: { routeKind: 'component-port-refresh' },
  },
  rainbond_manage_component_storage: {
    pre: { routeKind: 'component', tab: 'advancedSettings', subTab: 'mnt' },
    post: { routeKind: 'component-refresh', tab: 'advancedSettings', subTab: 'mnt' },
  },
  rainbond_manage_component_probe: {
    pre: { routeKind: 'component', tab: 'advancedSettings', subTab: 'setting' },
    post: { routeKind: 'component-refresh', tab: 'advancedSettings', subTab: 'setting' },
  },
  rainbond_manage_component_autoscaler: {
    pre: { routeKind: 'component', tab: 'expansion' },
    post: { routeKind: 'component-refresh', tab: 'expansion' },
  },
  rainbond_horizontal_scale_component: {
    pre: { routeKind: 'component', tab: 'expansion' },
    post: { routeKind: 'component-refresh', tab: 'expansion' },
  },
  rainbond_vertical_scale_component: {
    pre: { routeKind: 'component', tab: 'expansion' },
    post: { routeKind: 'component-refresh', tab: 'expansion' },
  },
  rainbond_change_component_image: {
    pre: { routeKind: 'component', tab: 'advancedSettings', subTab: 'resource' },
    post: { routeKind: 'component-refresh', tab: 'advancedSettings', subTab: 'resource' },
  },
  rainbond_update_component_build_source: {
    pre: { routeKind: 'component', tab: 'advancedSettings', subTab: 'resource' },
    post: { routeKind: 'component-refresh', tab: 'advancedSettings', subTab: 'resource' },
  },
  rainbond_operate_app: {
    post: { routeKind: 'app-overview-refresh' },
  },
  rainbond_create_app: {
    pre: { routeKind: 'team-index' },
    post: { routeKind: 'created-app-overview' },
  },
  rainbond_create_app_from_yaml: {
    pre: { routeKind: 'team-index' },
    post: { routeKind: 'created-app-overview' },
  },
  rainbond_create_app_from_snapshot_version: {
    pre: { routeKind: 'team-index' },
    post: { routeKind: 'created-app-overview' },
  },
  rainbond_create_component: {
    pre: { routeKind: 'app-overview' },
    post: { routeKind: 'created-component-overview' },
  },
  rainbond_create_component_from_image: {
    pre: { routeKind: 'app-overview' },
    post: { routeKind: 'created-component-overview' },
  },
  rainbond_create_component_from_source: {
    pre: { routeKind: 'app-overview' },
    post: { routeKind: 'created-component-overview' },
  },
  rainbond_create_component_from_package: {
    pre: { routeKind: 'app-overview' },
    post: { routeKind: 'created-component-overview' },
  },
  rainbond_create_component_from_local_package: {
    pre: { routeKind: 'app-overview' },
    post: { routeKind: 'created-component-overview' },
  },
  rainbond_create_app_version_snapshot: {
    pre: { routeKind: 'app-version' },
    post: { routeKind: 'app-version-refresh' },
  },
  rainbond_delete_app_version_snapshot: {
    pre: { routeKind: 'app-version' },
    post: { routeKind: 'app-version-refresh' },
  },
  rainbond_rollback_app_version_snapshot: {
    pre: { routeKind: 'app-version' },
    post: { routeKind: 'app-version-refresh' },
  },
  rainbond_delete_app_version_rollback_record: {
    pre: { routeKind: 'app-version' },
    post: { routeKind: 'app-version-refresh' },
  },
  rainbond_create_app_share_record: {
    pre: { routeKind: 'app-version' },
    post: { routeKind: 'app-version-refresh' },
  },
  rainbond_delete_app_share_record: {
    pre: { routeKind: 'app-version' },
    post: { routeKind: 'app-version-refresh' },
  },
  rainbond_submit_app_share_info: {
    post: { routeKind: 'route-query-refresh' },
  },
  rainbond_start_app_share_event: {
    post: { routeKind: 'route-query-refresh' },
  },
  rainbond_complete_app_share: {
    post: { routeKind: 'route-query-refresh' },
  },
  rainbond_giveup_app_share: {
    post: { routeKind: 'route-query-refresh' },
  },
  rainbond_create_gateway_rules: {
    pre: { routeKind: 'app-gateway' },
    post: { routeKind: 'app-gateway-refresh' },
  },
  rainbond_create_app_upgrade_record: {
    pre: { routeKind: 'app-upgrade' },
    post: { routeKind: 'app-upgrade-refresh' },
  },
  rainbond_execute_app_upgrade_record: {
    pre: { routeKind: 'app-upgrade' },
    post: { routeKind: 'app-upgrade-refresh' },
  },
  rainbond_deploy_app_upgrade_record: {
    pre: { routeKind: 'app-upgrade' },
    post: { routeKind: 'app-upgrade-refresh' },
  },
  rainbond_rollback_app_upgrade_record: {
    pre: { routeKind: 'app-upgrade' },
    post: { routeKind: 'app-upgrade-refresh' },
  },
  rainbond_upgrade_app: {
    pre: { routeKind: 'app-upgrade' },
    post: { routeKind: 'app-upgrade-refresh' },
  },
};

export function getAgentMutationRoutePolicy(toolName) {
  return MUTATION_ROUTE_POLICIES[toolName] || null;
}

export function isSupportedAgentMutationTool(toolName) {
  return !!getAgentMutationRoutePolicy(toolName);
}

export function shouldHandleApprovedMutationTrace({
  toolName,
  pendingMutationTool,
}) {
  return !!(
    toolName &&
    pendingMutationTool &&
    toolName === pendingMutationTool &&
    isSupportedAgentMutationTool(toolName)
  );
}

function isSlidePanelRefreshRouteKind(routeKind) {
  return (
    routeKind === 'component-refresh' ||
    routeKind === 'component-port-refresh'
  );
}

export function shouldUseSlidePanelContentRefresh(toolName) {
  const policy = getAgentMutationRoutePolicy(toolName);
  return !!(
    policy &&
    policy.post &&
    isSlidePanelRefreshRouteKind(policy.post.routeKind)
  );
}

export function shouldUseRouteQueryRefresh(toolName) {
  const policy = getAgentMutationRoutePolicy(toolName);
  return !!(
    policy &&
    policy.post &&
    policy.post.routeKind === 'route-query-refresh'
  );
}

function resolveRouteByKind(kind, context = {}, appDetail, result, routeMeta = {}, ref = null) {
  const refresh = routeMeta.refresh || '';
  const routeContext = buildRouteContext(context, ref || (result && result.result_ref));

  switch (kind) {
    case 'team-index':
      return buildTeamIndexRoute(routeContext);
    case 'app-overview':
      return buildAppOverviewRoute(routeContext, refresh ? { refresh } : {});
    case 'app-overview-refresh':
      return buildAppOverviewRoute(routeContext, { refresh: refresh || Date.now() });
    case 'app-version':
      return buildAppVersionRoute(routeContext, refresh ? { refresh } : {});
    case 'app-version-refresh':
      return buildAppVersionRoute(routeContext, { refresh: refresh || Date.now() });
    case 'app-gateway':
      return buildAppGatewayRoute(routeContext, refresh ? { refresh } : {});
    case 'app-gateway-refresh':
      return buildAppGatewayRoute(routeContext, { refresh: refresh || Date.now() });
    case 'app-upgrade':
      return buildAppUpgradeRoute(routeContext, refresh ? { refresh } : {});
    case 'app-upgrade-refresh':
      return buildAppUpgradeRoute(routeContext, { refresh: refresh || Date.now() });
    case 'component': {
      return buildComponentOverviewRoute(routeContext, {
        tab: routeMeta.tab,
        subTab: routeMeta.subTab,
        refresh,
      });
    }
    case 'component-refresh': {
      return buildComponentOverviewRoute(routeContext, {
        tab: routeMeta.tab,
        subTab: routeMeta.subTab,
        refresh: refresh || Date.now(),
      });
    }
    case 'component-port': {
      if (isThirdPartyComponent(appDetail)) {
        return buildComponentOverviewRoute(routeContext, {
          tab: 'port',
          refresh,
        });
      }
      return buildComponentOverviewRoute(routeContext, {
        tab: 'advancedSettings',
        subTab: 'port',
        refresh,
      });
    }
    case 'component-port-refresh': {
      if (isThirdPartyComponent(appDetail)) {
        return buildComponentOverviewRoute(routeContext, {
          tab: 'port',
          refresh: refresh || Date.now(),
        });
      }
      return buildComponentOverviewRoute(routeContext, {
        tab: 'advancedSettings',
        subTab: 'port',
        refresh: refresh || Date.now(),
      });
    }
    case 'created-app-overview': {
      const appId = routeContext.appId || extractAppId(result, context);
      if (!appId) return '';
      return buildAppOverviewRoute({ ...routeContext, appId });
    }
    case 'created-component-overview': {
      const appId = routeContext.appId || extractAppId(result, context);
      const componentAlias =
        routeContext.componentAlias || extractComponentAlias(result, context);
      if (!appId || !componentAlias) return '';
      return buildComponentOverviewRoute(
        { ...routeContext, appId, componentAlias },
        { tab: 'overview', refresh: Date.now() }
      );
    }
    default:
      return '';
  }
}

function isBuildSourceEnvMutation(toolName, ref = null) {
  const routeRef = extractRouteRef(ref);
  const operation = routeRef && (routeRef.operation || routeRef.action);
  return (
    toolName === 'rainbond_manage_component_envs' &&
    operation === 'replace_build_envs'
  );
}

function resolveRouteMeta(toolName, routeMeta = {}, ref = null) {
  if (isBuildSourceEnvMutation(toolName, ref)) {
    return {
      ...routeMeta,
      tab: 'advancedSettings',
      subTab: 'resource',
    };
  }
  return routeMeta;
}

export function resolvePreActionRoute({ toolName, context, appDetail, targetRef }) {
  const policy = getAgentMutationRoutePolicy(toolName);
  if (!policy || !policy.pre) return '';
  const routeMeta = resolveRouteMeta(toolName, policy.pre, targetRef);
  return resolveRouteByKind(
    routeMeta.routeKind,
    context,
    appDetail,
    null,
    routeMeta,
    targetRef
  );
}

export function resolvePostActionRoute({ toolName, context, appDetail, result, resultRef }) {
  const policy = getAgentMutationRoutePolicy(toolName);
  if (!policy || !policy.post) return '';
  const routeMeta = resolveRouteMeta(toolName, policy.post, resultRef || (result && result.result_ref));
  return resolveRouteByKind(
    routeMeta.routeKind,
    context,
    appDetail,
    result,
    routeMeta,
    resultRef
  );
}
