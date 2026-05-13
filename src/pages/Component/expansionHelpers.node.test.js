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

console.log('expansion helper tests passed');
