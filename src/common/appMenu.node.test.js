const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'appMenu.js'), 'utf8');

assert.ok(
  /const GATEWAY_MONITORING_PLUGIN_ID = 'rainbond-gateway-monitoring';/.test(source) &&
    /function getApplicationPluginMenuName\(plugin\) \{[\s\S]*isPluginBaseId\(plugin, GATEWAY_MONITORING_PLUGIN_ID\)[\s\S]*menu\.app\.gatewayMonitoring\.applicationTraffic[\s\S]*return plugin\.display_name;[\s\S]*\}/.test(source),
  'app menu should render the gateway monitoring application plugin with a host-defined title'
);

assert.ok(
  /const pluginItems = pluginArr\.map\(item => \(\{[\s\S]*name: getApplicationPluginMenuName\(item\),[\s\S]*path: `team\/\$\{teamName\}\/region\/\$\{regionName\}\/apps\/\$\{appID\}\/plugins\/\$\{item\.name\}`/.test(source),
  'app menu plugin items should use the host title resolver while preserving the plugin route'
);

console.log('app menu plugin title tests passed');
