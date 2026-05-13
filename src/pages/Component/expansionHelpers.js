function getVmPassthroughScalingLockMessageId({ method, vmRuntime, extendInfo }) {
  if (method !== 'vm') {
    return '';
  }

  const runtime = vmRuntime || {};
  const legacyExtendInfo = extendInfo || {};
  const runtimeGpuEnabled = !!runtime.gpu_enabled;
  const runtimeUsbEnabled = !!runtime.usb_enabled;
  const runtimeGpuCount = Number(runtime.gpu_count) || 0;
  const currentGpu = Number(legacyExtendInfo.current_gpu) || 0;

  if (runtimeGpuEnabled || runtimeGpuCount > 0 || currentGpu > 0) {
    return 'componentOverview.body.tab.overview.vmGpuPassthroughScalingLocked';
  }
  if (runtimeUsbEnabled) {
    return 'componentOverview.body.tab.overview.vmUsbPassthroughScalingLocked';
  }
  return '';
}

function isVmGpuPassthroughScalingLocked(options) {
  return !!getVmPassthroughScalingLockMessageId(options);
}

module.exports = {
  getVmPassthroughScalingLockMessageId,
  isVmGpuPassthroughScalingLocked
};
