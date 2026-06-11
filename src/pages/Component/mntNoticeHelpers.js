function isVMStoppedStatus(status) {
  const current = status && status.status;
  return current === 'closed' || current === 'undeploy';
}

function resolveVolumeSubmitMode({ method, status, editing }) {
  if (method !== 'vm') {
    return 'restart';
  }
  if (editing) {
    return 'restart';
  }
  if (isVMStoppedStatus(status)) {
    return 'restart';
  }
  return 'hotplug';
}

function shouldShowRestartTipsAfterVolumeSubmit(options) {
  return resolveVolumeSubmitMode(options) !== 'hotplug';
}

function getVolumeSubmitNoticeKey(options) {
  if (options.method !== 'vm') {
    return 'notification.success.succeeded';
  }
  return resolveVolumeSubmitMode(options) === 'hotplug'
    ? 'componentOverview.body.mnt.vmHotplugSuccess'
    : 'componentOverview.body.mnt.vmHotplugStoppedTip';
}

function getVMStorageAlertKey(status) {
  return isVMStoppedStatus(status)
    ? 'componentOverview.body.mnt.vmRuntimeStoppedTip'
    : 'componentOverview.body.mnt.vmRuntimeMixedTip';
}

module.exports = {
  getVMStorageAlertKey,
  getVolumeSubmitNoticeKey,
  isVMStoppedStatus,
  resolveVolumeSubmitMode,
  shouldShowRestartTipsAfterVolumeSubmit,
};
