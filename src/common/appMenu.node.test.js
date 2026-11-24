const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'appMenu.js'), 'utf8');

assert.ok(
  /const GATEWAY_MONITORING_PLUGIN_ID = 'rainbond-observability';/.test(source) &&
    /function getApplicationPluginMenuName\(plugin\) \{[\s\S]*isPluginBaseId\(plugin, GATEWAY_MONITORING_PLUGIN_ID\)[\s\S]*menu\.app\.gatewayMonitoring\.applicationTraffic[\s\S]*return plugin\.display_name;[\s\S]*\}/.test(source),
  'app menu should render the gateway monitoring application plugin with a host-defined title'
);

assert.ok(
  /const pluginItems = pluginArr\.map\(item => \(\{[\s\S]*name: getApplicationPluginMenuName\(item\),[\s\S]*path: `team\/\$\{teamName\}\/region\/\$\{regionName\}\/apps\/\$\{appID\}\/plugins\/\$\{item\.name\}`/.test(source),
  'app menu plugin items should use the host title resolver while preserving the plugin route'
);

console.log('app menu plugin title tests passed');

const vm = require('vm');
const menuBody = source.slice(source.indexOf('function menuData('), source.indexOf('/**\n * 格式化菜单项路径'));
const flags = { isAppUpgrade: true };
const makeMenu = vm.runInNewContext(`(function(){${menuBody};return menuData;})()`, {
  PluginUtil: { segregatePluginsByHierarchy: () => [], isInstallEnterprisePlugin: () => false }, roleUtil: { queryTeamOrAppPermissionsInfo: () => flags },
  formatMessage: ({ id }) => id, getMenuSvg: { getSvg: name => name }
});
let items = makeMenu('team', 'region', 'app', { team: {} }, [], {}, {}).flatMap(group => group.items);
assert.ok(items.some(item => item.path.endsWith('/upgrade') && item.name === 'menu.app.upgrade'));
flags.isAppUpgrade = false;
items = makeMenu('team', 'region', 'app', { team: {} }, [], {}, {}).flatMap(group => group.items);
assert.ok(!items.some(item => item.path.endsWith('/upgrade')));
console.log('app upgrade navigation permission tests passed');
