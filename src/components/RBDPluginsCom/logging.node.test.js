const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

assert.match(
  source,
  /console\.info\('\[RBDPluginsCom\] namespace resolution',/,
  'RBDPluginsCom should log namespace resolution details for plugin debugging'
);

assert.match(
  source,
  /console\.warn\('\[RBDPluginsCom\] namespace missing for plugin baseInfo',/,
  'RBDPluginsCom should warn when namespace is missing before rendering the plugin'
);

console.log('RBDPluginsCom logging test passed');
