const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadAgentContextModule(globalUtil, hash) {
  const filename = path.join(__dirname, 'agentContext.js');
  const source = fs
    .readFileSync(filename, 'utf8')
    .replace("import globalUtil from './global';", '')
    .replace(/\bexport function /g, 'function ');
  const module = { exports: {} };

  vm.runInNewContext(
    `${source}
module.exports = {
  buildAgentContext,
  formatAgentContextMessage,
  getAgentContextSignature,
  getAgentRouteSignature,
  isAgentRouteHidden,
};`,
    {
      module,
      exports: module.exports,
      globalUtil,
      window: {
        location: {
          hash,
          pathname: '/',
          search: '',
        },
      },
    },
    { filename }
  );

  return module.exports;
}

const globalUtil = {
  getCurrEnterpriseId: () => 'eid-1',
  getCurrTeamName: () => 'demo',
  getCurrRegionName: () => 'test',
  getAppID: () => '8',
  getSlidePanelType: () => '',
  getSlidePanelComponentID: () => '',
  getComponentID: () => '',
};

const { buildAgentContext } = loadAgentContextModule(
  globalUtil,
  '#/team/demo/region/test/apps/8/overview'
);

const appOverviewContext = buildAgentContext(
  {
    pathname: '/team/demo/region/test/apps/8/overview',
    search: '',
  },
  {
    appControl: {
      appDetail: {
        service: {
          service_id: 'runtime-service-id-from-previous-component',
          service_alias: 'api',
        },
      },
    },
  }
);

assert.strictEqual(
  appOverviewContext.componentId,
  '',
  'app overview context must not reuse stale component service_id when route has no component selection'
);
assert.strictEqual(
  appOverviewContext.componentSource,
  '',
  'app overview context should not be marked as component-scoped'
);

const componentGlobalUtil = {
  ...globalUtil,
  getSlidePanelType: () => 'components',
  getSlidePanelComponentID: () => 'api',
};
const { buildAgentContext: buildComponentAgentContext } = loadAgentContextModule(
  componentGlobalUtil,
  '#/team/demo/region/test/apps/8/overview?type=components&componentID=api&tab=overview'
);
const componentContext = buildComponentAgentContext(
  {
    pathname: '/team/demo/region/test/apps/8/overview',
    search: '?type=components&componentID=api&tab=overview',
  },
  {
    appControl: {
      appDetail: {
        service: {
          service_id: 'runtime-service-id',
          service_alias: 'api',
        },
      },
    },
  }
);

assert.strictEqual(
  componentContext.componentId,
  'runtime-service-id',
  'component context should still resolve the selected component alias to runtime service_id'
);
assert.strictEqual(
  componentContext.componentAlias,
  'api',
  'component context should keep the selected component alias for navigation'
);

console.log('agent context tests passed');
