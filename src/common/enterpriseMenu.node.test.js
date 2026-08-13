const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, 'enterpriseMenu.js'), 'utf8');
const enterpriseLayoutSource = fs.readFileSync(
  path.join(__dirname, '..', 'layouts', 'EnterpriseLayout.js'),
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
    .replace('export const getMenuClusterList =', 'const getMenuClusterList =')
    .replace('export const getMenuData =', 'const getMenuData =')
    .replace('export const getFlatMenuData =', 'const getFlatMenuData =')
    .concat('\nmodule.exports = { getMenuClusterList };'),
  {
    module: enterpriseMenuModule,
    formatMessage: () => '',
    userUtil: {},
    isUrl: () => false,
    getMenuSvg: {},
    PluginUtil: {},
    isRainbondInfoAgentEnabled: () => false
  }
);

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(enterpriseMenuModule.exports.getMenuClusterList(
    'enterprise-a',
    [],
    [{ enterprise_id: 'enterprise-a', region_name: 'rainbond' }]
  ))),
  [{ enterprise_id: 'enterprise-a', region_name: 'rainbond' }],
  'storage menu should fall back to the cached clusters of the current enterprise'
);

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(enterpriseMenuModule.exports.getMenuClusterList(
    'enterprise-a',
    [{ enterprise_id: 'enterprise-a', region_name: 'fresh' }],
    [{ enterprise_id: 'enterprise-a', region_name: 'cached' }]
  ))),
  [{ enterprise_id: 'enterprise-a', region_name: 'fresh' }],
  'storage menu should prefer the cluster list loaded by the layout'
);

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(enterpriseMenuModule.exports.getMenuClusterList(
    'enterprise-a',
    [],
    [{ enterprise_id: 'enterprise-b', region_name: 'other' }]
  ))),
  [],
  'storage menu must not use cached clusters from another enterprise'
);

assert.ok(
  /const menuClusterList = getMenuClusterList\(eid, clusterList, clusterInfo\);/.test(enterpriseLayoutSource),
  'enterprise layout should build menus from the local and cached cluster lists'
);

assert.ok(
  /clusterInfo: region\.cluster_info/.test(enterpriseLayoutSource),
  'enterprise layout should receive the cached enterprise cluster list from the region model'
);

assert.ok(
  /handleLoadEnterpriseClusters = \(\) => \{[\s\S]*?params: \{ eid \}[\s\S]*?enterprise_id: eid/.test(enterpriseLayoutSource),
  'enterprise layout should request clusters with the current route enterprise ID'
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
