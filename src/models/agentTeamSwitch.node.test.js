const assert = require('assert');

const { shouldResetOnTeamSwitch } = require('./agentTeamSwitch');

// Case 1 — team changes with a live conversation: reset.
{
  const got = shouldResetOnTeamSwitch({
    previousContext: { teamName: 'dhn9y6sk' },
    nextContext: { teamName: 'c45s8exn' },
    conversationId: 'cs_1778517815620_1',
  });
  assert.strictEqual(got, true, 'team switch with live conversation should reset');
}

// Case 2 — same team: do not reset.
{
  const got = shouldResetOnTeamSwitch({
    previousContext: { teamName: 'dhn9y6sk' },
    nextContext: { teamName: 'dhn9y6sk' },
    conversationId: 'cs_real',
  });
  assert.strictEqual(got, false, 'same team should not reset');
}

// Case 3 — initial sync (no previous team yet): do not reset.
{
  const got = shouldResetOnTeamSwitch({
    previousContext: {},
    nextContext: { teamName: 'c45s8exn' },
    conversationId: 'cs_real',
  });
  assert.strictEqual(got, false, 'initial population is not a transition');
}

// Case 4 — team switch but no live conversation: do not reset.
{
  const got = shouldResetOnTeamSwitch({
    previousContext: { teamName: 'dhn9y6sk' },
    nextContext: { teamName: 'c45s8exn' },
    conversationId: 'global-default',
  });
  assert.strictEqual(got, false, 'no live conversation means nothing to reset');
}

// Case 5 — team switch and conversationId missing: do not reset.
{
  const got = shouldResetOnTeamSwitch({
    previousContext: { teamName: 'a' },
    nextContext: { teamName: 'b' },
    conversationId: '',
  });
  assert.strictEqual(got, false, 'empty conversationId means nothing to reset');
}

// Case 6 — undefined inputs are tolerated and resolve to false.
{
  const got = shouldResetOnTeamSwitch({});
  assert.strictEqual(got, false, 'undefined inputs should yield false');
}

// Case 7 — no-arg invocation is tolerated.
{
  const got = shouldResetOnTeamSwitch();
  assert.strictEqual(got, false, 'no-arg invocation should yield false');
}

console.log('agentTeamSwitch: 7 cases passed');
