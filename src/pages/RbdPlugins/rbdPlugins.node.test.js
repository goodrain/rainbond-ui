const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

assert.ok(
  /const GATEWAY_MONITORING_PLUGIN_ID = 'rainbond-observability';/.test(source) &&
    /getPluginTitle = \(plugin = \{\}\) => \{[\s\S]*getPluginBaseId\(plugin\.name \|\| plugin\.plugin_id\) === GATEWAY_MONITORING_PLUGIN_ID[\s\S]*menu\.enterprise\.monitoring[\s\S]*return plugin\?\.display_name;[\s\S]*\}/.test(source),
  'enterprise plugin page should render gateway monitoring with the host monitoring center title'
);

assert.ok(
  /<PageHeaderLayout[\s\S]*title=\{this\.getPluginTitle\(plugins\)\}/.test(source),
  'enterprise plugin page should use the host title resolver'
);

console.log('enterprise plugin page title tests passed');
