const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, 'enterpriseMenu.js'), 'utf8');
const enterpriseMenuModule = { exports: {} };

vm.runInNewContext(
  source
    .replace(/^import .*;?$/gm, '')
    .replace('export const getMenuData =', 'const getMenuData =')
    .replace('export const getFlatMenuData =', 'const getFlatMenuData =')
    .concat('\nmodule.exports = { getMenuData };'),
  {
    module: enterpriseMenuModule,
    formatMessage: ({ defaultMessage, id }) => defaultMessage || id,
    userUtil: { isCompanyAdmin: () => false },
    isUrl: () => false,
    getMenuSvg: { getSvg: () => '' },
    PluginUtil: {
      getPluginInfo: () => ({}),
      segregatePluginsByHierarchy: () => []
    },
    isRainbondInfoAgentEnabled: () => false
  }
);

const menuData = enterpriseMenuModule.exports.getMenuData(
  'enterprise-a',
  { roles: [] },
  {},
  {},
  [{ region_name: 'rainbond' }],
  {}
);

const storageMenu = menuData
  .reduce((items, group) => items.concat(group.items), [])
  .find(item => item.path === '/enterprise/enterprise-a/region/rainbond/platform-resources');

assert.ok(
  storageMenu,
  'storage management should not require the enterprise administrator role'
);

assert.ok(
  /const gatewayMonitoringPlugin = PluginUtil\.getPluginInfo\(pluginList, 'rainbond-observability'\);/.test(source),
  'enterprise menu should read the gateway monitoring plugin'
);

assert.ok(
  /const showSelect = Object\.keys\(gatewayMonitoringPlugin\)\.length > 1;[\s\S]*name: formatMessage\(\{ id: 'menu\.enterprise\.monitoring', defaultMessage: '监控中心' \}\),[\s\S]*path: `\/enterprise\/\$\{eid\}\/plugins\/\$\{plugin\?\.name \|\| 'rainbond-observability'\}\?regionName=\$\{regionName\}\$\{showSelect \? '&showSelect=true' : ''\}`/.test(source),
  'enterprise monitoring menu item should use the gateway monitoring plugin route and only show cluster selector when multiple clusters exist'
);

assert.ok(
  !/const observabilityPlugin = PluginUtil\.getPluginInfo\(pluginList, 'rainbond-observability'\);/.test(source),
  'enterprise menu should not render the old observability plugin as monitoring center'
);

assert.ok(
  !/name: plugin\?\.display_name \|\| '网关监测'/.test(source),
  'enterprise menu should not render a separate gateway monitoring item'
);

console.log('enterprise menu monitoring center tests passed');
