const assert = require('assert');
const {
  buildLogKey,
  buildDuplicateLogBudget,
  consumeDuplicateLogBudget,
  normalizeLogMessage
} = require('./logUtils');

const historyBudget = buildDuplicateLogBudget([
  {
    event_id: 'event-a',
    step: 'build-exector',
    status: 'info',
    level: 'info',
    time: '2026-05-25T10:00:00Z',
    message: 'Build app version from source code start'
  },
  {
    event_id: 'event-a',
    step: 'build-exector',
    status: 'info',
    level: 'info',
    time: '2026-05-25T10:00:01Z',
    message: 'pull or clone code successfully, start code build'
  }
]);

assert.strictEqual(
  consumeDuplicateLogBudget(historyBudget, {
    event_id: 'event-a',
    step: 'build-exector',
    status: 'info',
    level: 'info',
    time: '2026-05-25T10:00:00Z',
    message: 'Build app version from source code start'
  }),
  true,
  'socket logs already loaded from history should be skipped once'
);

assert.strictEqual(
  consumeDuplicateLogBudget(historyBudget, {
    event_id: 'event-a',
    step: 'build-exector',
    status: 'info',
    level: 'info',
    time: '2026-05-25T10:00:02Z',
    message: 'Build app version from source code start'
  }),
  false,
  'new repeated messages at a different time should still be shown'
);

assert.strictEqual(
  consumeDuplicateLogBudget(historyBudget, {
    event_id: 'event-a',
    step: 'build-exector',
    status: 'info',
    level: 'info',
    time: '2026-05-25T10:00:04Z',
    message: 'Starting CNB build'
  }),
  false,
  'new socket logs should be shown'
);

assert.strictEqual(
  normalizeLogMessage({ message: { id: 'layer-a', status: 'Downloading' } }),
  '{"id":"layer-a","status":"Downloading"}',
  'object messages should use a stable key'
);

assert.strictEqual(
  buildLogKey({ event_id: 'event-a', time: 't1', message: 'same' }) ===
    buildLogKey({ event_id: 'event-a', time: 't2', message: 'same' }),
  false,
  'time should keep separate log entries distinct'
);
