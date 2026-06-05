const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'teamMenu.js'), 'utf8');

assert.ok(
  /const AI_ENGINE_PLUGIN_NAME = 'rainbond-ai-engine';/.test(source) &&
    /const aiEnginePlugin = \(pluginArr \|\| \[\]\)\.find\(item =>[\s\S]*getPluginBaseId\(item && \(item\.name \|\| item\.plugin_id\)\) === AI_ENGINE_PLUGIN_NAME[\s\S]*\);/.test(source),
  'team menu should resolve the AI model plugin from the installed team plugin list'
);

assert.ok(
  /overviewItems\.push\(\{[\s\S]*name: aiEnginePlugin\.display_name \|\| aiEnginePlugin\.alias \|\| aiEnginePlugin\.name,[\s\S]*icon: getMenuSvg\.getSvg\('aiEngine'\),[\s\S]*path: `team\/\$\{teamName\}\/region\/\$\{regionName\}\/plugins\/\$\{aiEnginePlugin\.name\}`,[\s\S]*\}\);/.test(source),
  'team menu should place the AI model entry in the overview group near K8S native resources'
);

assert.ok(
  /const teamPluginArr = \(pluginArr \|\| \[\]\)\.filter\(item =>[\s\S]*getPluginBaseId\(item && \(item\.name \|\| item\.plugin_id\)\) !== AI_ENGINE_PLUGIN_NAME[\s\S]*\);/.test(source) &&
    /const pluginItems = teamPluginArr\.map\(item =>/.test(source),
  'team menu plugin group should exclude the AI model plugin'
);

console.log('team menu AI model placement tests passed');
