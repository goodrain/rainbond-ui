const assert = require('assert');
const { buildAgentSessionPayload } = require('./agentPayload');

const payload = buildAgentSessionPayload({
  view: 'team',
  enterpriseId: 'eid-1',
  teamName: 'team-a',
  regionName: 'region-a',
  appId: 'app-001',
  componentId: 'svc-1',
  componentSource: 'route',
  pathname: '/team/team-a/region/region-a/apps/app-001',
  routeSignature: '/team/team-a/region/region-a/apps/app-001',
  pageTitle: '应用概览',
  locale: 'zh-CN',
});

assert.deepStrictEqual(payload, {
  context: {
    view: 'team',
    enterprise_id: 'eid-1',
    team_name: 'team-a',
    region_name: 'region-a',
    app_id: 'app-001',
    app_name: 'app-001',
    component_id: 'svc-1',
    component_source: 'route',
    page: '/team/team-a/region/region-a/apps/app-001',
    page_title: '应用概览',
    locale: 'zh-CN',
    route_signature: '/team/team-a/region/region-a/apps/app-001',
    resource: {
      type: 'component',
      id: 'svc-1',
      name: 'svc-1',
    },
  },
});

console.log('agent session payload tests passed');
