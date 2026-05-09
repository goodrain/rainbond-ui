const assert = require('assert');
const {
  getLockedStateByRunStatus,
  getNextInteractionLocked,
} = require('./agentInteractionLock');

assert.strictEqual(
  getLockedStateByRunStatus('thinking', false),
  true,
  'thinking status should lock the app viewport'
);

assert.strictEqual(
  getLockedStateByRunStatus('waiting_approval', false),
  true,
  'waiting_approval should keep the app viewport locked between approvals'
);

assert.strictEqual(
  getLockedStateByRunStatus('done', true),
  false,
  'done status should unlock the app viewport'
);

assert.strictEqual(
  getNextInteractionLocked(true, {
    type: 'approval.resolved',
    data: { approval_id: 'ap_1', status: 'approved' },
  }),
  true,
  'approval resolution alone should not unlock the app viewport'
);

assert.strictEqual(
  getNextInteractionLocked(true, {
    type: 'run.status',
    data: { status: 'waiting_approval' },
  }),
  true,
  'the next approval in the same run should remain locked'
);

assert.strictEqual(
  getNextInteractionLocked(true, {
    type: 'run.error',
    data: { message: 'boom' },
  }),
  false,
  'run.error should unlock the app viewport'
);

console.log('agent interaction lock tests passed');
