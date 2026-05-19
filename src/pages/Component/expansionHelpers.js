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

function isVMStoppedStatus(status) {
  return !!(status && ['closed', 'undeploy'].includes(status.status));
}

function getRunningVMLiveUpdateChangedResource({
  method,
  status,
  currentCpu,
  currentMemory,
  nextCpu,
  nextMemory
}) {
  if (method !== 'vm' || isVMStoppedStatus(status)) {
    return '';
  }

  const cpuChanged = Number(nextCpu) !== Number(currentCpu);
  const memoryChanged = Number(nextMemory) !== Number(currentMemory);

  if (cpuChanged && memoryChanged) {
    return 'both';
  }
  if (cpuChanged) {
    return 'cpu';
  }
  if (memoryChanged) {
    return 'memory';
  }
  return '';
}

module.exports = {
  getRunningVMLiveUpdateChangedResource,
  getVmPassthroughScalingLockMessageId,
  isVmGpuPassthroughScalingLocked
};
