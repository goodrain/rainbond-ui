const assert = require('assert');
const {
  buildRuntimeLogReplayBudget,
  rememberRuntimeLogMessage,
  shouldAppendRuntimeLogMessage
} = require('./runtimeLogReplayHelpers');

const repeatedLine = '2026-08-17T10:00:00.000000000Z repeated output';
const recentMessages = [
  { podName: 'pod-a', message: repeatedLine },
  { podName: 'pod-b', message: repeatedLine },
  { podName: 'pod-a', message: repeatedLine }
];
const replayBudget = buildRuntimeLogReplayBudget(
  recentMessages,
  'pod-a',
  100
);

assert.strictEqual(
  shouldAppendRuntimeLogMessage(repeatedLine, replayBudget),
  false,
  'the first replay copy should consume one matching line from the same pod'
);
assert.strictEqual(
  shouldAppendRuntimeLogMessage(repeatedLine, replayBudget),
  false,
  'the second replay copy should consume the second matching line from the same pod'
);
assert.strictEqual(
  shouldAppendRuntimeLogMessage(repeatedLine, replayBudget),
  true,
  'a third identical line should remain visible when only two copies were previously accepted'
);

const otherPodBudget = buildRuntimeLogReplayBudget(
  [{ podName: 'pod-b', message: repeatedLine }],
  'pod-a',
  100
);
assert.strictEqual(
  shouldAppendRuntimeLogMessage(repeatedLine, otherPodBudget),
  true,
  'a matching line from another pod must not suppress this pod output'
);

const tailBudget = buildRuntimeLogReplayBudget(
  [
    { podName: 'pod-a', message: 'old-line' },
    { podName: 'pod-a', message: 'new-line-1' },
    { podName: 'pod-a', message: 'new-line-2' }
  ],
  'pod-a',
  2
);
assert.strictEqual(
  shouldAppendRuntimeLogMessage('old-line', tailBudget),
  true,
  'lines older than the requested server tail should not enter the replay budget'
);
assert.strictEqual(
  shouldAppendRuntimeLogMessage('new-line-1', tailBudget),
  false,
  'the oldest line inside the requested server tail should be reconciled'
);

const sameContentAtAnotherTime =
  '2026-08-17T10:00:01.000000000Z repeated output';
assert.strictEqual(
  shouldAppendRuntimeLogMessage(sameContentAtAnotherTime, replayBudget),
  true,
  'the Kubernetes timestamp keeps a legitimate later line distinct'
);

const boundedHistory = [];
['line-1', 'line-2', 'line-3', 'line-4'].forEach(message => {
  rememberRuntimeLogMessage(boundedHistory, 'pod-a', message, 3);
});
assert.deepStrictEqual(
  boundedHistory,
  [
    { podName: 'pod-a', message: 'line-2' },
    { podName: 'pod-a', message: 'line-3' },
    { podName: 'pod-a', message: 'line-4' }
  ],
  'accepted runtime log history should stay globally bounded'
);

console.log('runtime log replay helper tests passed');
