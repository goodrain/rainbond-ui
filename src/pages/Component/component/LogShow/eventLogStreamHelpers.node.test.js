const assert = require('assert');
const {
  buildEventLogReplayBudget,
  buildEventLogStreamUrl,
  getEventLogTerminalState,
  getEventLogReplayKey,
  shouldAppendEventStreamMessage,
  shouldAppendEventLog
} = require('./eventLogStreamHelpers');

assert.strictEqual(
  buildEventLogStreamUrl('event#id', 'region&name=1'),
  '/console/sse/v2/events/event%23id/stream?region_name=region%26name%3D1',
  'should reuse the generic SSE proxy and encode its event and region values'
);

assert.strictEqual(
  getEventLogTerminalState({ step: 'last' }),
  'success',
  'last should preserve the successful PubSub terminal meaning'
);
assert.strictEqual(
  getEventLogTerminalState({ step: 'callback' }),
  'failure',
  'callback should preserve the failed PubSub terminal meaning'
);
assert.strictEqual(
  getEventLogTerminalState({ step: 'build' }),
  null,
  'ordinary event messages should not be terminal'
);
assert.strictEqual(
  getEventLogTerminalState(null),
  null,
  'missing event messages should not be terminal'
);

const repeatedMessage = 'the same valid log line';
const operationLogMessages = new Set();
assert.strictEqual(
  shouldAppendEventLog(repeatedMessage, operationLogMessages, false),
  true,
  'operation and build logs should append the first ordinary log line'
);
assert.strictEqual(
  shouldAppendEventLog(repeatedMessage, operationLogMessages, false),
  true,
  'operation and build logs should preserve identical ordinary log lines'
);

const appShareMessages = new Set();
assert.strictEqual(
  shouldAppendEventLog(repeatedMessage, appShareMessages, true),
  true,
  'the dedicated app-share socket should keep its first ordinary log line'
);
assert.strictEqual(
  shouldAppendEventLog(repeatedMessage, appShareMessages, true),
  false,
  'the dedicated app-share socket should retain its existing replay deduplication'
);

const eventTime = '2026-05-06T17:53:45+08:00';
const httpHistoryRecord = {
  message: repeatedMessage,
  time: '2026-05-06T17:53:45Z',
  utime: 1
};
const sseReplayRecord = {
  event_id: 'event-1',
  step: 'build-executor',
  status: 'running',
  message: repeatedMessage,
  level: 'info',
  time: eventTime
};
assert.strictEqual(
  getEventLogReplayKey(httpHistoryRecord),
  getEventLogReplayKey(sseReplayRecord),
  'HTTP history and SSE replay should match by message and wall-clock second without applying timezone offsets'
);
assert.strictEqual(
  getEventLogReplayKey({ ...sseReplayRecord, step: 'another-step' }),
  getEventLogReplayKey(sseReplayRecord),
  'SSE-only fields must not participate in the cross-transport replay key'
);
assert.strictEqual(
  getEventLogReplayKey({
    message: repeatedMessage,
    time: '2026-05-06 17:53:45.987'
  }),
  getEventLogReplayKey({
    message: repeatedMessage,
    time: '2026-05-06T17:53:45+0800'
  }),
  'ISO-like times should normalize T or space separators and ignore milliseconds and timezone suffixes'
);
assert.notStrictEqual(
  getEventLogReplayKey({
    message: repeatedMessage,
    time: 'not-a-date',
    utime: 1778061225
  }),
  getEventLogReplayKey(sseReplayRecord),
  'HTTP-only utime must not override the shared time field'
);

assert.strictEqual(
  getEventLogReplayKey({ message: 'fallback', time: 'not-a-date' }),
  getEventLogReplayKey({
    message: 'fallback',
    time: 'not-a-date',
    utime: 0
  }),
  'unparseable times should fall back to the original time instead of the backend zero sentinel'
);
assert.notStrictEqual(
  getEventLogReplayKey({ message: 'fallback', time: 'not-a-date' }),
  getEventLogReplayKey({ message: 'fallback', time: 'another-invalid-date' }),
  'different raw times should stay distinguishable when parsing fails'
);

const repeatedHistory = [
  { message: repeatedMessage, time: '2026-05-06T17:53:45Z', utime: 1 },
  { message: repeatedMessage, time: '2026-05-06 17:53:45.999' }
];
const replayBudget = buildEventLogReplayBudget(repeatedHistory);
assert.strictEqual(
  shouldAppendEventStreamMessage(sseReplayRecord, replayBudget),
  false,
  'the first replay copy should consume one matching HTTP history copy'
);
assert.strictEqual(
  shouldAppendEventStreamMessage(sseReplayRecord, replayBudget),
  false,
  'the second replay copy should consume the second matching HTTP history copy'
);
assert.strictEqual(
  shouldAppendEventStreamMessage(sseReplayRecord, replayBudget),
  true,
  'a third replay copy should remain visible when HTTP history contained only two copies'
);
assert.strictEqual(
  shouldAppendEventStreamMessage(sseReplayRecord, null),
  true,
  'after replay-complete the same legitimate live line should always be appended'
);

const moreThanReplayLimit = Array.from({ length: 1001 }, (_, index) => ({
  message: `line-${index}`,
  time: eventTime
}));
const limitedBudget = buildEventLogReplayBudget(moreThanReplayLimit);
assert.strictEqual(
  shouldAppendEventStreamMessage(
    { message: 'line-0', time: eventTime },
    limitedBudget
  ),
  true,
  'reconnect reconciliation should ignore UI lines older than the server 1000-line replay window'
);
assert.strictEqual(
  shouldAppendEventStreamMessage(
    { message: 'line-1', time: eventTime },
    limitedBudget
  ),
  false,
  'reconnect reconciliation should include the oldest line inside the server replay window'
);

console.log('event log stream helper tests passed');
