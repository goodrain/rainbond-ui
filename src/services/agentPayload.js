function buildAgentSessionPayload(context = {}) {
  return {
    context: {
      view: context.view || '',
      enterprise_id: context.enterpriseId || '',
      team_name: context.teamName || '',
      region_name: context.regionName || '',
      app_id: context.appId || '',
      app_name: context.appName || context.appId || '',
      component_id: context.componentId || '',
      component_source: context.componentSource || '',
      page: context.pathname || '',
      page_title: context.pageTitle || '',
      locale: context.locale || '',
      route_signature: context.routeSignature || context.pathname || '',
      resource: {
        type: context.componentId ? 'component' : context.appId ? 'app' : 'page',
        id: context.componentId || context.appId || context.pathname || '',
        name: context.componentId || context.appId || context.pathname || ''
      }
    }
  };
}

module.exports = {
  buildAgentSessionPayload
};
