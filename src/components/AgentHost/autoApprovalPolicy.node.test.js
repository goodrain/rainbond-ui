const test = require('node:test');
const assert = require('node:assert/strict');

const {
  toRememberPolicy,
  targetRefToKey,
  formatServerPolicyLabel,
  discardLegacyPolicies,
  LEGACY_STORAGE_KEY,
} = require('./autoApprovalPolicy');

test('maps UI approval choices to server policy kinds', () => {
  assert.deepEqual(toRememberPolicy('session-target'), { kind: 'session_target' });
  assert.deepEqual(toRememberPolicy('session-target-op'), { kind: 'session_target_operation' });
  assert.deepEqual(toRememberPolicy('session-op'), { kind: 'session_operation' });
  assert.deepEqual(toRememberPolicy('session-all'), { kind: 'session_all' });
  assert.equal(toRememberPolicy('unknown'), null);
});

test('targetRefToKey only detects server-backed target identities', () => {
  assert.equal(targetRefToKey({ kind: 'service', service_id: 's1' }), 'service:s1');
  assert.equal(targetRefToKey({ kind: 'app', app_id: 'a1' }), 'app:a1');
  assert.equal(targetRefToKey(null), null);
});

test('formats server-backed approval policy labels', () => {
  assert.equal(
    formatServerPolicyLabel({ kind: 'session_operation', operation_key: 'rainbond_update_component' }),
    '同类操作 rainbond_update_component'
  );
  assert.equal(
    formatServerPolicyLabel({
      kind: 'session_target_operation',
      target_key: 'service:svc-1',
      operation_key: 'rainbond_update_component'
    }),
    'service:svc-1 · rainbond_update_component'
  );
});

test('discards legacy browser policies exactly once', () => {
  const values = new Map([
    [LEGACY_STORAGE_KEY, JSON.stringify([{ kind: 'session-all' }, { kind: 'session-op' }])]
  ]);
  global.window = {
    sessionStorage: {
      getItem: key => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
      removeItem: key => values.delete(key)
    }
  };
  assert.equal(discardLegacyPolicies(), 2);
  assert.equal(values.has(LEGACY_STORAGE_KEY), false);
  assert.equal(discardLegacyPolicies(), 0);
  delete global.window;
});
