const assert = require('assert');

// Z2 — clearConversation saga used to skip clearAgentSessionRemote whenever
// state.conversationId was 'global-default'. But sessionStorage often
// holds a real sessionId persisted by an earlier turn — so the backend
// session was never DELETEd and the user saw "cleared" UX while a zombie
// session lingered server-side.
//
// resolveClearTargetSessionId resolves the actual id to call
// clearAgentSessionRemote against:
//   1) prefer state.conversationId when it is a real id
//   2) otherwise fall back to the hydrated sessionStorage snapshot
//   3) return null only when neither source has a real id
const {
  resolveClearTargetSessionId,
} = require('./agentClearConversation');

// Case 1 — state.conversationId is a real id: use it, ignore hydrate.
{
  const got = resolveClearTargetSessionId({
    conversationId: 'cs_real_123',
    hydrateSnapshot: { conversationId: 'cs_other_456' },
  });
  assert.strictEqual(
    got,
    'cs_real_123',
    'real state.conversationId should win over hydrate snapshot'
  );
}

// Case 2 — state.conversationId is global-default: fall back to hydrate.
{
  const got = resolveClearTargetSessionId({
    conversationId: 'global-default',
    hydrateSnapshot: { conversationId: 'cs_persisted_789' },
  });
  assert.strictEqual(
    got,
    'cs_persisted_789',
    'global-default state should fall back to hydrate snapshot id'
  );
}

// Case 3 — state.conversationId is empty: fall back to hydrate.
{
  const got = resolveClearTargetSessionId({
    conversationId: '',
    hydrateSnapshot: { conversationId: 'cs_persisted_42' },
  });
  assert.strictEqual(
    got,
    'cs_persisted_42',
    'empty state.conversationId should fall back to hydrate snapshot id'
  );
}

// Case 4 — state.conversationId is null: fall back to hydrate.
{
  const got = resolveClearTargetSessionId({
    conversationId: null,
    hydrateSnapshot: { conversationId: 'cs_persisted_nullcase' },
  });
  assert.strictEqual(
    got,
    'cs_persisted_nullcase',
    'null state.conversationId should fall back to hydrate snapshot id'
  );
}

// Case 5 — state.conversationId is global-default AND hydrate is null: return null.
{
  const got = resolveClearTargetSessionId({
    conversationId: 'global-default',
    hydrateSnapshot: null,
  });
  assert.strictEqual(
    got,
    null,
    'should return null when nothing real is available'
  );
}

// Case 6 — both state and hydrate hold global-default: return null.
{
  const got = resolveClearTargetSessionId({
    conversationId: 'global-default',
    hydrateSnapshot: { conversationId: 'global-default' },
  });
  assert.strictEqual(
    got,
    null,
    'global-default in hydrate is also a sentinel and should not be used'
  );
}

// Case 7 — hydrate snapshot missing conversationId field: return null.
{
  const got = resolveClearTargetSessionId({
    conversationId: 'global-default',
    hydrateSnapshot: { somethingElse: 'x' },
  });
  assert.strictEqual(
    got,
    null,
    'hydrate snapshot without conversationId should not be used'
  );
}

// Case 8 — undefined inputs are tolerated.
{
  const got = resolveClearTargetSessionId({
    conversationId: undefined,
    hydrateSnapshot: undefined,
  });
  assert.strictEqual(got, null, 'undefined inputs should yield null');
}

console.log('agentClearConversation: 8 cases passed');
