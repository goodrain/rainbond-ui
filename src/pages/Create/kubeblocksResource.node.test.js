const assert = require('assert');
const {
  formatKubeBlocksCpuValue,
  formatKubeBlocksMemoryValue,
  parseKubeBlocksCpuValue,
  parseKubeBlocksMemoryValue
} = require('./kubeblocksResource');

assert.strictEqual(
  formatKubeBlocksCpuValue(parseKubeBlocksCpuValue(0)),
  '100m',
  'slider value 0 should map to a valid positive KubeBlocks CPU request'
);

assert.strictEqual(
  formatKubeBlocksMemoryValue(parseKubeBlocksMemoryValue(0)),
  '128Mi',
  'slider value 0 should map to a valid positive KubeBlocks memory request'
);

assert.strictEqual(
  formatKubeBlocksCpuValue(parseKubeBlocksCpuValue('0')),
  '100m',
  'string zero CPU should not be submitted as 0m'
);

assert.strictEqual(
  formatKubeBlocksMemoryValue(parseKubeBlocksMemoryValue('0')),
  '128Mi',
  'string zero memory should not be submitted as 0Mi'
);

assert.strictEqual(
  formatKubeBlocksCpuValue(parseKubeBlocksCpuValue(4)),
  '1',
  'existing default CPU slider value should remain 1 core'
);

assert.strictEqual(
  formatKubeBlocksMemoryValue(parseKubeBlocksMemoryValue(4)),
  '1Gi',
  'existing default memory slider value should remain 1Gi'
);

assert.strictEqual(
  formatKubeBlocksCpuValue(parseKubeBlocksCpuValue(8)),
  '16',
  'highest CPU slider value should remain 16 cores'
);

assert.strictEqual(
  formatKubeBlocksMemoryValue(parseKubeBlocksMemoryValue(9)),
  '32Gi',
  'highest memory slider value should remain 32Gi'
);

console.log('kubeblocks resource helper tests passed');
