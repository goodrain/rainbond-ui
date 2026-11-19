const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
assert.doesNotMatch(
  source,
  /console\.(?:info|log|warn|debug)\([\s\S]*?(?:baseInfo|currentUser|\.token)/,
  'plugin context and credentials must not be dumped to the browser console'
);
console.log('RBDPluginsCom context logging test passed');
