const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'global.js'), 'utf8');

assert.match(
  source,
  /navigator\.serviceWorker\.ready\.then\(registration => \{[\s\S]*?registration &&[\s\S]*?typeof registration\.unregister === 'function'[\s\S]*?registration\.unregister\(\)/,
  'service worker cleanup should ignore a missing or incomplete registration'
);

console.log('service worker cleanup guard tests passed');
