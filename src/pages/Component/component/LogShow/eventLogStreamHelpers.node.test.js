const assert = require('assert');
const {
  buildEventLogStreamUrl,
  getEventLogTerminalState
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

console.log('event log stream helper tests passed');
