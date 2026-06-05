const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

assert.match(
  source,
  /const resolvedNamespace = this\.getPluginNamespace\(\);[\s\S]*namespace:\s*resolvedNamespace,/,
  'RBDPluginsCom should pass the current team namespace into plugin baseInfo'
);

console.log('RBDPluginsCom namespace passthrough test passed');
