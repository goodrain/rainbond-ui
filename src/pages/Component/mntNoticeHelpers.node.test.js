const assert = require('assert');
const {
  getVMStorageAlertKey,
  getVolumeSubmitNoticeKey,
  isVMStoppedStatus,
  resolveVolumeSubmitMode,
  shouldShowRestartTipsAfterVolumeSubmit,
} = require('./mntNoticeHelpers');

assert.strictEqual(isVMStoppedStatus({ status: 'closed' }), true);
assert.strictEqual(isVMStoppedStatus({ status: 'undeploy' }), true);
assert.strictEqual(isVMStoppedStatus({ status: 'running' }), false);
assert.strictEqual(isVMStoppedStatus(undefined), false);

assert.strictEqual(
  resolveVolumeSubmitMode({ method: 'vm', status: { status: 'running' }, editing: false }),
  'hotplug',
  'running vm should hotplug a newly added data disk'
);

assert.strictEqual(
  resolveVolumeSubmitMode({ method: 'vm', status: { status: 'closed' }, editing: false }),
  'restart',
  'stopped vm should persist the disk change for the next start'
);

assert.strictEqual(
  resolveVolumeSubmitMode({ method: 'vm', status: { status: 'running' }, editing: true }),
  'restart',
  'editing an existing vm disk should not be treated as online hotplug'
);

assert.strictEqual(
  resolveVolumeSubmitMode({ method: 'state_singleton', status: { status: 'running' }, editing: false }),
  'restart',
  'non-vm components should keep the original restart semantics'
);

assert.strictEqual(
  shouldShowRestartTipsAfterVolumeSubmit({ method: 'vm', status: { status: 'running' }, editing: false }),
  false
);
assert.strictEqual(
  shouldShowRestartTipsAfterVolumeSubmit({ method: 'state_singleton', status: { status: 'running' }, editing: false }),
  true
);

assert.strictEqual(
  getVolumeSubmitNoticeKey({ method: 'vm', status: { status: 'running' }, editing: false }),
  'componentOverview.body.mnt.vmHotplugSuccess'
);
assert.strictEqual(
  getVolumeSubmitNoticeKey({ method: 'vm', status: { status: 'closed' }, editing: false }),
  'componentOverview.body.mnt.vmHotplugStoppedTip'
);
assert.strictEqual(
  getVolumeSubmitNoticeKey({ method: 'state_singleton', status: { status: 'running' }, editing: false }),
  'notification.success.succeeded'
);

assert.strictEqual(
  getVMStorageAlertKey({ status: 'running' }),
  'componentOverview.body.mnt.vmRuntimeMixedTip'
);
assert.strictEqual(
  getVMStorageAlertKey({ status: 'closed' }),
  'componentOverview.body.mnt.vmRuntimeStoppedTip'
);

console.log('mnt notice helper tests passed');
