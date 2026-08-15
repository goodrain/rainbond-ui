const assert = require('assert');
const {
  buildEventLogStreamUrl,
  getEventLogTerminalState,
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

console.log('event log stream helper tests passed');
