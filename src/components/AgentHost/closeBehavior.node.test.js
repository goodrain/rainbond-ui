(async () => {
  const assertModule = await import('assert');
  const closeBehaviorModule = await import('./closeBehavior.js');
  const assert = assertModule.default || assertModule;
  const closeBehavior = closeBehaviorModule.default || closeBehaviorModule;
  const { isSseConversationStreaming, shouldConfirmClose } = closeBehavior;

  assert.strictEqual(
    isSseConversationStreaming({
      sending: true,
      activeRunId: 'run_1',
      cancellingRun: false,
    }),
    true,
    'an active streaming run should be treated as an SSE conversation in progress'
  );

  assert.strictEqual(
    shouldConfirmClose({
      sending: false,
      activeRunId: 'run_1',
      interactionLocked: true,
    }),
    false,
    'approval-waiting state should close directly without confirmation'
  );

  assert.strictEqual(
    shouldConfirmClose({
      sending: false,
      activeRunId: 'run_1',
    }),
    false,
    'stale run ids without an active SSE stream should not trigger confirmation'
  );

  assert.strictEqual(
    shouldConfirmClose({
      sending: true,
      activeRunId: 'run_1',
      cancellingRun: true,
    }),
    false,
    'once the run is already stopping the close button should close directly'
  );

  assert.strictEqual(
    shouldConfirmClose({
      sending: false,
      messages: [{ id: 'msg_1', role: 'assistant', kind: 'normal', content: '历史消息' }],
    }),
    false,
    'history messages alone should never trigger the close confirmation'
  );

  console.log('agent host close behavior tests passed');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
