const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

test('device authorization confirmation does not render an insecure HTTP warning', () => {
  assert.doesNotMatch(source, /window\.location\.protocol/);
  assert.doesNotMatch(source, /deviceAuthorization\.insecure\.(title|detail)/);
});

test('device authorization checks RainSkills access after inspect and before approve', () => {
  assert.match(source, /componentDidUpdate\(prevProps\)/);
  assert.match(source, /type: 'rainskillsAccess\/check'/);
  assert.match(source, /resolveRainskillsAccessStatus\(response, error\)/);
  assert.match(source, /if \(approve[\s\S]*this\.submitDecision\('approve'\)/);
});

test('device authorization keeps approve disabled until access is explicitly allowed', () => {
  assert.match(source, /accessStatus !== 'allowed'/);
  assert.match(source, /disabled=\{status === 'submitting' \|\| accessStatus !== 'allowed'\}/);
  assert.match(source, /this\.submitDecision\(decision\)/);
});

test('device authorization ignores stale and unmounted access callbacks', () => {
  assert.match(source, /this\.mounted = false/);
  assert.match(source, /this\.accessRequestId \+= 1/);
  assert.match(source, /isCurrentAccessRequest\(this\.mounted, requestId, this\.accessRequestId\)/);
});

test('denying a device request cancels any pending approve access check', () => {
  assert.match(
    source,
    /this\.accessRequestId \+= 1;\s*this\.accessStatusRequestInFlight = false;\s*this\.submitDecision\(decision\)/
  );
});

test('device access errors can be retried without approving the request', () => {
  assert.match(source, /deviceAuthorization\.access\.retry/);
  assert.match(source, /onClick=\{\(\) => this\.checkAccess\(\)\}/);
});

test('device authorization uses the enterprise upgrade modal for restricted accounts', () => {
  assert.match(source, /Modal\.confirm\(\{/);
  assert.match(source, /deviceAuthorization\.access\.restricted\.acknowledge/);
  assert.match(source, /deviceAuthorization\.access\.restricted\.enterprise/);
  assert.match(source, /window\.open\(AGENT_ENTERPRISE_EDITION_URL/);
});
