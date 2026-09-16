const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'enterpriseMenu.js'), 'utf8');

assert.ok(
  /const gatewayMonitoringPlugin = PluginUtil\.getPluginInfo\(pluginList, 'rainbond-observability'\);/.test(source),
  'enterprise menu should read the gateway monitoring plugin'
);

assert.ok(
  /name: formatMessage\(\{ id: 'menu\.enterprise\.monitoring', defaultMessage: '监控中心' \}\),[\s\S]*path: buildPlatformPluginPath\(eid, plugin\?\.name \|\| 'rainbond-observability', Object\.keys\(gatewayMonitoringPlugin\)\)/.test(source),
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

assert.ok(
  /groupPluginsByLogicalId/.test(source) &&
    /const platformPluginGroups = groupPluginsByLogicalId\(pluginObj\);/.test(source),
  'enterprise platform plugin menus should be grouped by stable plugin id across regions'
);

assert.ok(
  /platformPluginGroups\.map\(\(\{ logicalId, plugin, regionNames \}\) =>/.test(source) &&
    /path: buildPlatformPluginPath\(eid, logicalId, regionNames\)/.test(source) &&
    /if \(regionNames\.length > 1\) \{[\s\S]*query\.push\('showSelect=true'\);[\s\S]*pluginRegions=\$\{encodeURIComponent\(regionNames\.join\(','\)\)\}/.test(source),
  'a multi-region platform plugin should render one menu item with its installed regions'
);

assert.ok(
  /buildPlatformPluginPath\(eid, 'rainbond-agent', Object\.keys\(agentPlugin \|\| \{\}\)\)/.test(source) &&
    /buildPlatformPluginPath\(eid, 'rainbond-bill', Object\.keys\(billPlugin\)\)/.test(source) &&
    /buildPlatformPluginPath\(eid, plugin\?\.name \|\| 'rainbond-enterprise-alarm', Object\.keys\(alarmPlugin\)\)/.test(source) &&
    /buildPlatformPluginPath\(eid, plugin\?\.name \|\| 'rainbond-enterprise-logs', Object\.keys\(lokiPlugin\)\)/.test(source),
  'categorized platform plugins should use the same multi-region route behavior'
);

assert.ok(
  !/Object\.entries\(pluginObj\)\.forEach\(\(\[regionName, plugins\]\) => \{[\s\S]*plugins\.forEach\(plugin => \{[\s\S]*pluginItems\.push/.test(source),
  'enterprise platform plugin menus should not render one item per region'
);

console.log('enterprise menu monitoring center tests passed');
