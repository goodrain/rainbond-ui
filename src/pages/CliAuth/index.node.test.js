const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

test('CLI authorization checks RainAgent access before reading the loopback token', () => {
  assert.match(source, /type: 'agent\/checkAccess'/);
  assert.match(source, /resolveRainskillsAccessStatus\(response, error\)/);
  assert.match(source, /if \(authorize\) \{\s*this\.authorizeWithToken\(\)/);
  assert.match(source, /authorizeWithToken = \(\) => \{[\s\S]*cookie\.get\('token'\)/);
});

test('CLI authorization fails closed while access is unknown or denied', () => {
  assert.match(source, /status: 'checkingAccess'/);
  assert.match(source, /status: 'accessDenied'/);
  assert.match(source, /status: 'accessError'/);
  assert.match(source, /disabled=\{status !== 'ready'\}/);
});

test('CLI authorization ignores stale and unmounted access callbacks', () => {
  assert.match(source, /this\.mounted = false/);
  assert.match(source, /this\.accessRequestId \+= 1/);
  assert.match(source, /isCurrentAccessRequest\(this\.mounted, requestId, this\.accessRequestId\)/);
});
