const assert = require('assert');
const {
  shouldPersistAgentSnapshotImmediately,
} = require('./rootShellPersistence');

assert.strictEqual(
  shouldPersistAgentSnapshotImmediately(
    {
      sending: false,
      pendingApproval: {
        approvalId: 'ap_1',
        status: 'pending',
      },
    },
    { panelClosed: false }
  ),
  false,
  'pending approvals should avoid synchronous snapshot persistence during approval-card render'
);

assert.strictEqual(
  shouldPersistAgentSnapshotImmediately(
    {
      sending: false,
      pendingApproval: null,
    },
    { panelClosed: false }
  ),
  true,
  'idle snapshots without a pending approval can still persist immediately'
);

assert.strictEqual(
  shouldPersistAgentSnapshotImmediately(
    {
      sending: true,
      pendingApproval: null,
    },
    { panelClosed: true }
  ),
  true,
  'closing the panel should still flush immediately so the latest visibility state is saved'
);

console.log('root shell persistence tests passed');
