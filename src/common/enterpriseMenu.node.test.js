const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, 'enterpriseMenu.js'), 'utf8');
const platformResourcesEntrySource = fs.readFileSync(
  path.join(__dirname, '..', 'pages', 'PlatformResources', 'Entry.js'),
  'utf8'
);
const userUtilSource = fs.readFileSync(
  path.join(__dirname, '..', 'utils', 'user.js'),
  'utf8'
);
const userUtilModule = { exports: {} };

vm.runInNewContext(
  userUtilSource
    .replace(/^import .*;$/gm, '')
    .replace('export default userUtil;', 'module.exports = userUtil;'),
  { module: userUtilModule }
);

assert.strictEqual(
  userUtilModule.exports.isCompanyAdmin({ is_enterprise_admin: true, roles: [] }),
  true,
  'enterprise admin checks should honor the canonical is_enterprise_admin flag returned by the console'
);

assert.strictEqual(
  userUtilModule.exports.isCompanyAdmin({ roles: ['admin'] }),
  true,
  'enterprise admin checks should retain support for role-based responses'
);

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
    userUtil: userUtilModule.exports,
    isUrl: () => false,
    getMenuSvg: { getSvg: () => '' },
    PluginUtil: { getPluginInfo: () => ({}) },
    isRainbondInfoAgentEnabled: () => false
  }
);

const menuData = enterpriseMenuModule.exports.getMenuData(
  'enterprise-a',
  { is_enterprise_admin: true, roles: [] },
  {},
  {},
  [],
  {}
);

const storageMenu = menuData
  .reduce((items, group) => items.concat(group.items), [])
  .find(item => item.path === '/enterprise/enterprise-a/platform-resources');

assert.ok(
  storageMenu,
  'enterprise admins should always see the storage management sidebar item'
);

const regularUserMenuData = enterpriseMenuModule.exports.getMenuData(
  'enterprise-a',
  { is_enterprise_admin: false, roles: [] },
  {},
  {},
  [],
  {}
);

const regularUserStorageMenu = regularUserMenuData
  .reduce((items, group) => items.concat(group.items), [])
  .find(item => item.path === '/enterprise/enterprise-a/platform-resources');

assert.ok(
  regularUserStorageMenu,
  'storage management should always be visible in the platform management sidebar'
);

assert.ok(
  /type: 'region\/fetchEnterpriseClusters'/.test(platformResourcesEntrySource),
  'storage management entry should load the enterprise clusters only after it is selected'
);

assert.ok(
  /routerRedux\.replace\([\s\S]*?`\/enterprise\/\$\{eid\}\/region\/\$\{firstCluster\.region_name\}\/platform-resources`/.test(platformResourcesEntrySource),
  'storage management entry should redirect to the first available cluster'
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
