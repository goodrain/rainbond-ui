const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs
  .readFileSync(path.join(__dirname, 'nodeDisk.js'), 'utf8')
  .replace(/export const /g, 'const ');
const loadUtils = new Function(
  `${source}; return { normalizeNodeDiskUsage };`
);
const { normalizeNodeDiskUsage } = loadUtils();

const alerts = normalizeNodeDiskUsage(
  [
    {
      name: '172.16.0.2',
      req_docker_partition: 76,
      cap_docker_partition: 100
    },
    {
      name: '172.16.0.4',
      req_docker_partition: 82,
      cap_docker_partition: 100
    },
    {
      name: '172.16.0.6',
      req_docker_partition: 60,
      cap_docker_partition: 100
    }
  ],
  { region_name: 'test-region', region_id: 'test-id' }
);

assert.deepStrictEqual(
  alerts.map(alert => ({ node: alert.node, usagePercent: alert.usagePercent })),
  [
    { node: '172.16.0.2', usagePercent: 76 },
    { node: '172.16.0.4', usagePercent: 82 }
  ]
);
assert.ok(alerts.every(alert => alert.regionName === 'test-region'));

console.log('node disk usage tests passed');
