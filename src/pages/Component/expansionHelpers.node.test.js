const assert = require('assert');

let helpers = {};
try {
  helpers = require('./expansionHelpers');
} catch (error) {
  helpers = {};
}

assert.strictEqual(
  typeof helpers.isVmGpuPassthroughScalingLocked,
  'function',
  'should expose a helper for detecting vm gpu passthrough scaling lock state'
);

assert.strictEqual(
  typeof helpers.getVmPassthroughScalingLockMessageId,
  'function',
  'should expose a helper for selecting the vm passthrough scaling lock message'
);

assert.strictEqual(
  typeof helpers.getRunningVMLiveUpdateChangedResource,
  'function',
  'should expose a helper for detecting running vm live update resource changes'
);

assert.strictEqual(
  helpers.isVmGpuPassthroughScalingLocked({
    method: 'vm',
    vmRuntime: {
      gpu_enabled: true,
      gpu_count: 1
    },
    extendInfo: {
      current_gpu: 0
    }
  }),
  true,
  'should lock scaling when the virtual machine runtime has gpu passthrough enabled'
);

assert.strictEqual(
  helpers.getVmPassthroughScalingLockMessageId({
    method: 'vm',
    vmRuntime: {
      gpu_enabled: true,
      usb_enabled: false,
      gpu_count: 1
    },
    extendInfo: {
      current_gpu: 0
    }
  }),
  'componentOverview.body.tab.overview.vmGpuPassthroughScalingLocked',
  'should use the gpu lock message when gpu passthrough is enabled'
);

assert.strictEqual(
  helpers.isVmGpuPassthroughScalingLocked({
    method: 'vm',
    vmRuntime: {
      gpu_enabled: false,
      gpu_count: 0
    },
    extendInfo: {
      current_gpu: 1
    }
  }),
  true,
  'should also lock scaling when the legacy extend info still reports bound gpu resources'
);

assert.strictEqual(
  helpers.isVmGpuPassthroughScalingLocked({
    method: 'vm',
    vmRuntime: {
      gpu_enabled: false,
      usb_enabled: true,
      gpu_count: 0
    },
    extendInfo: {
      current_gpu: 0
    }
  }),
  true,
  'should lock scaling when the virtual machine runtime has usb passthrough enabled'
);

assert.strictEqual(
  helpers.getVmPassthroughScalingLockMessageId({
    method: 'vm',
    vmRuntime: {
      gpu_enabled: false,
      usb_enabled: true,
      gpu_count: 0
    },
    extendInfo: {
      current_gpu: 0
    }
  }),
  'componentOverview.body.tab.overview.vmUsbPassthroughScalingLocked',
  'should use the usb lock message when usb passthrough is enabled'
);

assert.strictEqual(
  helpers.isVmGpuPassthroughScalingLocked({
    method: 'vm',
    vmRuntime: {
      gpu_enabled: false,
      usb_enabled: false,
      gpu_count: 0
    },
    extendInfo: {
      current_gpu: 0
    }
  }),
  false,
  'should keep scaling available for vm components without gpu passthrough'
);

assert.strictEqual(
  helpers.getVmPassthroughScalingLockMessageId({
    method: 'vm',
    vmRuntime: {
      gpu_enabled: false,
      usb_enabled: false,
      gpu_count: 0
    },
    extendInfo: {
      current_gpu: 0
    }
  }),
  '',
  'should not return a lock message when no passthrough resources are enabled'
);

assert.strictEqual(
  helpers.isVmGpuPassthroughScalingLocked({
    method: 'stateless_multiple',
    vmRuntime: {
      gpu_enabled: true,
      gpu_count: 1
    },
    extendInfo: {
      current_gpu: 1
    }
  }),
  false,
  'should ignore gpu markers for non-vm components'
);

assert.strictEqual(
  helpers.getRunningVMLiveUpdateChangedResource({
    method: 'vm',
    status: { status: 'running' },
    currentCpu: 8000,
    currentMemory: 16384,
    nextCpu: 10000,
    nextMemory: 16384
  }),
  'cpu',
  'should detect cpu-only changes for a running vm'
);

assert.strictEqual(
  helpers.getRunningVMLiveUpdateChangedResource({
    method: 'vm',
    status: { status: 'running' },
    currentCpu: 8000,
    currentMemory: 16384,
    nextCpu: 8000,
    nextMemory: 24576
  }),
  'memory',
  'should detect memory-only changes for a running vm'
);

assert.strictEqual(
  helpers.getRunningVMLiveUpdateChangedResource({
    method: 'vm',
    status: { status: 'running' },
    currentCpu: 8000,
    currentMemory: 16384,
    nextCpu: 10000,
    nextMemory: 24576
  }),
  'both',
  'should detect combined cpu and memory changes for a running vm'
);

assert.strictEqual(
  helpers.getRunningVMLiveUpdateChangedResource({
    method: 'vm',
    status: { status: 'closed' },
    currentCpu: 8000,
    currentMemory: 16384,
    nextCpu: 10000,
    nextMemory: 24576
  }),
  '',
  'should not lock resource edits for a stopped vm'
);

assert.strictEqual(
  helpers.getRunningVMLiveUpdateChangedResource({
    method: 'vm',
    status: { status: 'running' },
    hotUpdateSupported: false,
    currentCpu: 8000,
    currentMemory: 16384,
    nextCpu: 10000,
    nextMemory: 24576
  }),
  '',
  'should not lock resource edits when a running vm will use restart fallback instead of hot update'
);

assert.strictEqual(
  helpers.getRunningVMLiveUpdateChangedResource({
    method: 'stateless_multiple',
    status: { status: 'running' },
    currentCpu: 8000,
    currentMemory: 16384,
    nextCpu: 10000,
    nextMemory: 24576
  }),
  '',
  'should ignore resource change locks for non-vm components'
);

console.log('expansion helper tests passed');
