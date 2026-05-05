const test = require('node:test');
const assert = require('node:assert/strict');

// Mock sessionStorage in Node environment
global.window = global.window || {};
const storage = (() => {
  let data = {};
  return {
    getItem: k => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: k => { delete data[k]; },
    clear: () => { data = {}; },
  };
})();
global.window.sessionStorage = storage;

const {
  getPolicies,
  addPolicy,
  removePolicy,
  clearPolicies,
  matches,
} = require('./autoApprovalPolicy');

test.beforeEach(() => storage.clear());

test('addPolicy persists and getPolicies returns it', () => {
  addPolicy({ kind: 'session-target', targetKey: 'service:s1' });
  assert.deepEqual(getPolicies(), [
    { kind: 'session-target', targetKey: 'service:s1' },
  ]);
});

test('addPolicy dedupes identical entries', () => {
  addPolicy({ kind: 'session-op', skillId: 'foo' });
  addPolicy({ kind: 'session-op', skillId: 'foo' });
  assert.equal(getPolicies().length, 1);
});

test('matches returns false for high risk regardless of policy', () => {
  addPolicy({ kind: 'session-all' });
  assert.equal(
    matches({ risk: 'high', skillId: 'foo', targetRef: null }),
    false
  );
});

test('session-target matches by targetKey', () => {
  addPolicy({ kind: 'session-target', targetKey: 'service:s1' });
  assert.equal(
    matches({
      risk: 'low',
      skillId: 'any',
      targetRef: { kind: 'service', id: 's1' },
    }),
    true
  );
  assert.equal(
    matches({
      risk: 'low',
      skillId: 'any',
      targetRef: { kind: 'service', id: 's2' },
    }),
    false
  );
});

test('session-target-op requires both targetKey and skillId match', () => {
  addPolicy({
    kind: 'session-target-op',
    targetKey: 'service:s1',
    skillId: 'rainbond_restart',
  });
  assert.equal(
    matches({
      risk: 'low',
      skillId: 'rainbond_restart',
      targetRef: { kind: 'service', id: 's1' },
    }),
    true
  );
  assert.equal(
    matches({
      risk: 'low',
      skillId: 'rainbond_other',
      targetRef: { kind: 'service', id: 's1' },
    }),
    false
  );
});

test('session-op matches by skillId only', () => {
  addPolicy({ kind: 'session-op', skillId: 'rainbond_restart' });
  assert.equal(
    matches({
      risk: 'low',
      skillId: 'rainbond_restart',
      targetRef: null,
    }),
    true
  );
});

test('session-all matches non-high risk', () => {
  addPolicy({ kind: 'session-all' });
  assert.equal(
    matches({ risk: 'low', skillId: 'x', targetRef: null }),
    true
  );
  assert.equal(
    matches({ risk: 'medium', skillId: 'x', targetRef: null }),
    true
  );
  assert.equal(
    matches({ risk: 'high', skillId: 'x', targetRef: null }),
    false
  );
});

test('targetRef null does not match target-scoped policies', () => {
  addPolicy({ kind: 'session-target', targetKey: 'service:s1' });
  assert.equal(
    matches({ risk: 'low', skillId: 'x', targetRef: null }),
    false
  );
});

test('multiple policies: any match wins', () => {
  addPolicy({ kind: 'session-op', skillId: 'restart' });
  addPolicy({ kind: 'session-target', targetKey: 'service:s9' });
  assert.equal(
    matches({
      risk: 'low',
      skillId: 'restart',
      targetRef: { kind: 'service', id: 'other' },
    }),
    true
  );
});

test('removePolicy removes matching entry', () => {
  addPolicy({ kind: 'session-op', skillId: 'a' });
  addPolicy({ kind: 'session-op', skillId: 'b' });
  removePolicy({ kind: 'session-op', skillId: 'a' });
  assert.deepEqual(getPolicies(), [
    { kind: 'session-op', skillId: 'b' },
  ]);
});

test('clearPolicies wipes all', () => {
  addPolicy({ kind: 'session-all' });
  clearPolicies();
  assert.deepEqual(getPolicies(), []);
});

test('corrupted storage falls back to empty', () => {
  storage.setItem('agent.autoApprove.session', 'not-json');
  assert.deepEqual(getPolicies(), []);
});
