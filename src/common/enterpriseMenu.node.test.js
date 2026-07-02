const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'enterpriseMenu.js'), 'utf8');

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
