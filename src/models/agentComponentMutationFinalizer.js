const FINALIZE_COMPONENT_TOOLS = {
  rainbond_manage_component_envs: true,
  rainbond_manage_component_connection_envs: true,
  rainbond_manage_component_dependency: true,
  rainbond_manage_component_ports: true,
  rainbond_manage_component_storage: true,
  rainbond_manage_component_probe: true,
  rainbond_manage_component_autoscaler: true,
  rainbond_horizontal_scale_component: true,
  rainbond_vertical_scale_component: true,
  rainbond_change_component_image: true,
};

function shouldFinalizeToComponentOverview(toolName) {
  return !!FINALIZE_COMPONENT_TOOLS[toolName];
}

function resolveComponentMutationTarget(options = {}) {
  const context = options.context || {};
  const targetRef = options.targetRef || {};
  const componentAlias =
    targetRef.service_alias ||
    targetRef.component_alias ||
    targetRef.componentAlias ||
    context.componentAlias ||
    '';

  return {
    teamName: targetRef.team_name || targetRef.teamName || context.teamName || '',
    regionName:
      targetRef.region_name || targetRef.regionName || context.regionName || '',
    appId: targetRef.app_id || targetRef.appId || context.appId || '',
    componentAlias,
  };
}

function hasCompleteComponentMutationTarget(target = {}) {
  return !!(
    target.teamName &&
    target.regionName &&
    target.appId &&
    target.componentAlias
  );
}

function buildFinalComponentOverviewRoute(target = {}, refreshKey) {
  if (!hasCompleteComponentMutationTarget(target)) {
    return '';
  }

  const refresh = refreshKey || `${Date.now()}`;

  return `/team/${target.teamName}/region/${target.regionName}/apps/${target.appId}/overview?type=components&componentID=${encodeURIComponent(
    target.componentAlias
  )}&tab=overview&refresh=${encodeURIComponent(refresh)}`;
}

function createClearedComponentMutationTrackingState() {
  return {
    lastComponentMutationAlias: '',
    lastComponentMutationAppId: '',
    lastComponentMutationTeamName: '',
    lastComponentMutationRegionName: '',
    lastComponentMutationTool: '',
  };
}

function buildComponentMutationTrackingPatch(options = {}) {
  const toolName = options.toolName || '';
  if (!shouldFinalizeToComponentOverview(toolName)) {
    return createClearedComponentMutationTrackingState();
  }

  const target = resolveComponentMutationTarget(options);

  return {
    lastComponentMutationAlias: target.componentAlias,
    lastComponentMutationAppId: target.appId,
    lastComponentMutationTeamName: target.teamName,
    lastComponentMutationRegionName: target.regionName,
    lastComponentMutationTool: toolName,
  };
}

function buildFinalComponentOverviewNavigationPayload(state = {}) {
  if (!shouldFinalizeToComponentOverview(state.lastComponentMutationTool)) {
    return null;
  }

  const route = buildFinalComponentOverviewRoute({
    teamName: state.lastComponentMutationTeamName,
    regionName: state.lastComponentMutationRegionName,
    appId: state.lastComponentMutationAppId,
    componentAlias: state.lastComponentMutationAlias,
  });

  if (!route) {
    return null;
  }

  return {
    pendingMutationRoute: route,
    pendingMutationNavigationKey: `${state.lastComponentMutationTool}_${Date.now()}_finalize`,
  };
}

module.exports = {
  buildComponentMutationTrackingPatch,
  buildFinalComponentOverviewNavigationPayload,
  buildFinalComponentOverviewRoute,
  createClearedComponentMutationTrackingState,
  hasCompleteComponentMutationTarget,
  resolveComponentMutationTarget,
  shouldFinalizeToComponentOverview,
};
