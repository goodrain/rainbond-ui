const assert = require('assert');

// F12 — startCrossTabRunSubscription used to forward every foreign-run SSE
// event into agent/applyStreamEvent, which made backend replay flood the
// local tab's UI with chat.message.* / approval.* / compaction.* history
// when the observed run was a stale zombie. The factory below should only
// dispatch run.status events so the auto-flush trigger still fires without
// polluting the local tab's message stream.
const {
  buildCrossTabOnEventDispatcher,
} = require('./agentCrossTab');

function makeDispatchSpy() {
  const calls = [];
  function dispatch(action) {
    calls.push(action);
  }
  return { dispatch, calls };
}

const contextSnapshot = { appId: 'app-1', teamName: 't1' };

// Case 1 — run.status terminal event SHOULD dispatch agent/applyStreamEvent.
{
  const spy = makeDispatchSpy();
  const onEvent = buildCrossTabOnEventDispatcher(spy.dispatch, contextSnapshot);
  onEvent({
    type: 'run.status',
    sequence: 100,
    data: { status: 'done' },
  });
  assert.strictEqual(
    spy.calls.length,
    1,
    'run.status terminal event should be dispatched once'
  );
  assert.strictEqual(
    spy.calls[0].type,
    'agent/applyStreamEvent',
    'dispatched action type should be agent/applyStreamEvent'
  );
  assert.strictEqual(
    spy.calls[0].payload.event.type,
    'run.status',
    'dispatched action should carry the original run.status event'
  );
  assert.deepStrictEqual(
    spy.calls[0].payload.contextSnapshot,
    contextSnapshot,
    'dispatched action should carry the captured context snapshot'
  );
}

// Case 2 — chat.message.delta event should NOT be dispatched.
// This is the core of the F12 fix: replay of historical chat deltas from
// a zombie foreign run must NEVER reach the local tab's reducer.
{
  const spy = makeDispatchSpy();
  const onEvent = buildCrossTabOnEventDispatcher(spy.dispatch, contextSnapshot);
  onEvent({
    type: 'chat.message.delta',
    sequence: 50,
    data: { message_id: 'msg_1', delta: 'leaked content' },
  });
  assert.strictEqual(
    spy.calls.length,
    0,
    'chat.message.delta from foreign run must not be dispatched'
  );
}

// Case 3 — run.status thinking (non-terminal) event SHOULD also be dispatched.
// run.status events are universally allowed; the applyStreamEvent saga
// itself decides whether the status warrants a flush.
{
  const spy = makeDispatchSpy();
  const onEvent = buildCrossTabOnEventDispatcher(spy.dispatch, contextSnapshot);
  onEvent({
    type: 'run.status',
    sequence: 200,
    data: { status: 'thinking' },
  });
  assert.strictEqual(
    spy.calls.length,
    1,
    'run.status thinking event should still be dispatched'
  );
  assert.strictEqual(
    spy.calls[0].payload.event.data.status,
    'thinking',
    'dispatched run.status payload should preserve the status field'
  );
}

// Case 4 — compaction.* events should NOT be dispatched into the local tab.
// They belong to the foreign run's lifecycle and must not surface as a
// "compressing" banner in the observer tab.
{
  const spy = makeDispatchSpy();
  const onEvent = buildCrossTabOnEventDispatcher(spy.dispatch, contextSnapshot);
  onEvent({
    type: 'compaction.started',
    sequence: 2000000010,
    data: { mode: 'async' },
  });
  onEvent({
    type: 'compaction.completed',
    sequence: 2000000011,
    data: {},
  });
  assert.strictEqual(
    spy.calls.length,
    0,
    'compaction.* events from foreign run must not be dispatched'
  );
}

// Case 5 — approval.requested from foreign run should NOT be dispatched.
// The observer tab does not own the approval flow; surfacing the modal
// from a stale run would let the user approve a run they cannot see.
{
  const spy = makeDispatchSpy();
  const onEvent = buildCrossTabOnEventDispatcher(spy.dispatch, contextSnapshot);
  onEvent({
    type: 'approval.requested',
    sequence: 75,
    data: { approval_id: 'ap_x', description: 'foreign approval' },
  });
  assert.strictEqual(
    spy.calls.length,
    0,
    'approval.requested from foreign run must not be dispatched'
  );
}

// Case 6 — null / malformed events must be tolerated without throwing.
{
  const spy = makeDispatchSpy();
  const onEvent = buildCrossTabOnEventDispatcher(spy.dispatch, contextSnapshot);
  onEvent(null);
  onEvent(undefined);
  onEvent({});
  onEvent({ type: '' });
  assert.strictEqual(
    spy.calls.length,
    0,
    'null / malformed events must not be dispatched and must not throw'
  );
}

// Case 7 — when dispatch is not provided, the factory must still produce a
// no-op callback (so the SSE reader does not crash if the DVA store is gone).
{
  const onEvent = buildCrossTabOnEventDispatcher(null, contextSnapshot);
  // Should not throw.
  onEvent({ type: 'run.status', data: { status: 'done' } });
}

console.log('agent cross-tab subscription tests passed');
