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
