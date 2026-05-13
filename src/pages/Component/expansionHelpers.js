function isVmGpuPassthroughScalingLocked({ method, vmRuntime, extendInfo }) {
  if (method !== 'vm') {
    return false;
  }

  const runtime = vmRuntime || {};
  const legacyExtendInfo = extendInfo || {};
  const runtimeGpuEnabled = !!runtime.gpu_enabled;
  const runtimeGpuCount = Number(runtime.gpu_count) || 0;
  const currentGpu = Number(legacyExtendInfo.current_gpu) || 0;

  return runtimeGpuEnabled || runtimeGpuCount > 0 || currentGpu > 0;
}

module.exports = {
  isVmGpuPassthroughScalingLocked
};
