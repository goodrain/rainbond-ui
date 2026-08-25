const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

test('CLI authorization checks RainSkills access before reading the loopback token', () => {
  assert.match(source, /type: 'rainskillsAccess\/check'/);
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

test('CLI authorization shows one inline restriction notice without a modal', () => {
  assert.doesNotMatch(source, /Modal\.confirm\(\{/);
  assert.doesNotMatch(source, /showAccessRestrictedModal/);
  assert.match(source, /renderAccessDenied\(\)/);
  assert.match(source, /cliAuth\.access\.restricted\.enterprise/);
  assert.match(source, /href=\{AGENT_ENTERPRISE_EDITION_URL\}/);
});
