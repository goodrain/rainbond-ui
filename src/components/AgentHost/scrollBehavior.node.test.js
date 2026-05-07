const assert = require('assert');
const {
  getNextAutoScrollEnabled,
  isNearBottom,
  shouldAttemptAutoScrollUpdate,
} = require('./scrollBehavior');

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
  'leaving the bottom should disable follow mode'
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
