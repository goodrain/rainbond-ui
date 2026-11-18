(async () => {
  const assertModule = await import('assert');
  const scrollBehaviorModule = await import('./scrollBehavior.js');
  const assert = assertModule.default || assertModule;
  const scrollBehavior = scrollBehaviorModule.default || scrollBehaviorModule;
  const {
    getNextAutoScrollEnabled,
    isNearBottom,
    shouldAttemptAutoScrollUpdate,
  } = scrollBehavior;

  assert.strictEqual(
    isNearBottom({
      scrollTop: 176,
      clientHeight: 320,
      scrollHeight: 520,
    }),
    true,
    'positions within the bottom threshold should still count as near-bottom'
  );

  assert.strictEqual(
    isNearBottom({
      scrollTop: 120,
      clientHeight: 320,
      scrollHeight: 520,
    }),
    false,
    'positions meaningfully above the bottom should disable follow mode'
  );

  assert.strictEqual(
    getNextAutoScrollEnabled(false, {
      scrollTop: 120,
      clientHeight: 320,
      scrollHeight: 520,
    }, { isStreaming: true }),
    false,
    'reading earlier messages during active output should disable follow mode'
  );

  assert.strictEqual(
    getNextAutoScrollEnabled(false, {
      scrollTop: 176,
      clientHeight: 320,
      scrollHeight: 520,
    }),
    true,
    'manual scroll back to the bottom should re-enable follow mode'
  );

  assert.strictEqual(
    getNextAutoScrollEnabled(true, {
      scrollTop: 120,
      clientHeight: 320,
      scrollHeight: 520,
    }),
    false,
    'leaving the bottom should disable follow mode once output has stopped'
  );

  assert.strictEqual(
    shouldAttemptAutoScrollUpdate({
      prevMessages: [
        { id: 'msg_1', content: '', streaming: true, reasoning: '', reasoningStreaming: true }
      ],
      nextMessages: [
        { id: 'msg_1', content: '', streaming: true, reasoning: 'step 1', reasoningStreaming: true }
      ],
      wasVisible: true,
      isVisible: true,
    }),
    true,
    'reasoning deltas should trigger an auto-scroll attempt when follow mode is on'
  );

  assert.strictEqual(
    shouldAttemptAutoScrollUpdate({
      prevMessages: [
        { id: 'msg_1', content: 'done', streaming: false, reasoning: '', reasoningStreaming: false }
      ],
      nextMessages: [
        { id: 'msg_1', content: 'done', streaming: false, reasoning: '', reasoningStreaming: false }
      ],
      wasVisible: true,
      isVisible: true,
    }),
    false,
    'unchanged message state should not trigger a new auto-scroll attempt'
  );

  console.log('agent host scroll behavior tests passed');
})().catch(error => {
  console.error(error);
  process.exit(1);
});

const followAssert = require('node:assert/strict');
const follow = require('./scrollBehavior');
const aboveBottom = { scrollTop: 120, clientHeight: 320, scrollHeight: 900 };
followAssert.equal(follow.getNextAutoScrollEnabled(true, aboveBottom, { isStreaming: true, userInitiated: false }), true,
  'layout growth must not turn off an active follow mode');
followAssert.equal(follow.getNextAutoScrollEnabled(true, aboveBottom, { isStreaming: true, userInitiated: true }), false,
  'explicit scrolling away from the bottom pauses follow mode');
followAssert.equal(follow.getNextAutoScrollEnabled(false, aboveBottom, { isStreaming: true, userInitiated: false }), false,
  'new tokens must not steal the position from a reader looking back');
followAssert.equal(follow.shouldAttemptAutoScrollUpdate({
  prevMessages: [{ id: 'answer', content: 'partial' }, { id: 'trace', kind: 'trace' }],
  nextMessages: [{ id: 'answer', content: 'finished answer' }, { id: 'trace', kind: 'trace' }],
  wasVisible: true, isVisible: true,
}), true, 'an answer updated before a trailing tool row must still trigger follow');
