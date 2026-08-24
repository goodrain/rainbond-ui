const test = require('node:test');
const assert = require('node:assert/strict');
const {
  AGENT_GUIDE_SESSION_KEY,
  buildComponentGuideKey,
  canShowComponentGuide,
  clearAgentGuideSession,
  markComponentGuideHandled,
  suppressAgentGuidesForLogin,
} = require('./agentGuideSession');

function createStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

test('tracks handled components within the current login', () => {
  const storage = createStorage();
  const key = buildComponentGuideKey({
    enterpriseId: 'e1', teamName: 't1', regionName: 'r1', componentAlias: 'c1',
  });
  assert.equal(canShowComponentGuide(1, key, storage), true);
  markComponentGuideHandled(1, key, storage);
  assert.equal(canShowComponentGuide(1, key, storage), false);
  assert.equal(canShowComponentGuide(2, key, storage), true);
});

test('suppresses every abnormal guide until session state is cleared', () => {
  const storage = createStorage();
  suppressAgentGuidesForLogin(1, storage);
  assert.equal(canShowComponentGuide(1, 'component', storage), false);
  clearAgentGuideSession(storage);
  assert.equal(storage.getItem(AGENT_GUIDE_SESSION_KEY), null);
  assert.equal(canShowComponentGuide(1, 'component', storage), true);
});
