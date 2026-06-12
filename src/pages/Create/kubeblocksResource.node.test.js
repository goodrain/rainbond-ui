const assert = require('assert');
const {
  formatKubeBlocksCpuValue,
  formatKubeBlocksMemoryValue,
  parseKubeBlocksCpuValue,
  parseKubeBlocksMemoryValue
} = require('./kubeblocksResource');

assert.strictEqual(
  formatKubeBlocksCpuValue(parseKubeBlocksCpuValue(0)),
  '500m',
  'slider value 0 should map to the minimum database CPU request'
);

assert.strictEqual(
  formatKubeBlocksMemoryValue(parseKubeBlocksMemoryValue(0)),
  '512Mi',
  'slider value 0 should map to the minimum database memory request'
);

assert.strictEqual(
  formatKubeBlocksCpuValue(parseKubeBlocksCpuValue('0')),
  '500m',
  'string zero CPU should not be submitted below the database minimum'
);

assert.strictEqual(
  formatKubeBlocksMemoryValue(parseKubeBlocksMemoryValue('0')),
  '512Mi',
  'string zero memory should not be submitted below the database minimum'
);

assert.strictEqual(
  formatKubeBlocksCpuValue(parseKubeBlocksCpuValue(3)),
  '500m',
  'database default CPU slider value should be 500m'
);

assert.strictEqual(
  formatKubeBlocksMemoryValue(parseKubeBlocksMemoryValue(3)),
  '512Mi',
  'database default memory slider value should be 512Mi'
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
