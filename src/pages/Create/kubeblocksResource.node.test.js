const assert = require('assert');
const {
  formatKubeBlocksCpuValue,
  formatKubeBlocksMemoryValue,
  parseKubeBlocksCpuValue,
  parseKubeBlocksMemoryValue,
  sortKubeBlocksVersionsLatestFirst
} = require('./kubeblocksResource');

assert.strictEqual(
  formatKubeBlocksCpuValue(parseKubeBlocksCpuValue(0)),
  '250m',
  'slider value 0 should map to the minimum database CPU request'
);

assert.strictEqual(
  formatKubeBlocksMemoryValue(parseKubeBlocksMemoryValue(0)),
  '512Mi',
  'slider value 0 should map to the minimum database memory request'
);

assert.strictEqual(
  formatKubeBlocksCpuValue(parseKubeBlocksCpuValue('0')),
  '250m',
  'string zero CPU should not be submitted below the database minimum'
);

assert.strictEqual(
  formatKubeBlocksMemoryValue(parseKubeBlocksMemoryValue('0')),
  '512Mi',
  'string zero memory should not be submitted below the database minimum'
);

assert.strictEqual(
  formatKubeBlocksCpuValue(parseKubeBlocksCpuValue(100)),
  '250m',
  'direct 100m CPU should not be submitted below the database minimum'
);

assert.strictEqual(
  formatKubeBlocksCpuValue(parseKubeBlocksCpuValue(2)),
  '250m',
  'database default CPU slider value should be 250m'
);

assert.strictEqual(
  formatKubeBlocksCpuValue(parseKubeBlocksCpuValue(3)),
  '500m',
  'next CPU slider value should remain 500m'
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

assert.deepStrictEqual(
  sortKubeBlocksVersionsLatestFirst([
    '5.7.44',
    '8.0.30',
    '8.0.31',
    '8.0.32',
    '8.0.33',
    '8.0.34',
    '8.0.35',
    '8.0.36'
  ]),
  [
    '8.0.36',
    '8.0.35',
    '8.0.34',
    '8.0.33',
    '8.0.32',
    '8.0.31',
    '8.0.30',
    '5.7.44'
  ],
  'database versions should be displayed latest first'
);

console.log('kubeblocks resource helper tests passed');
