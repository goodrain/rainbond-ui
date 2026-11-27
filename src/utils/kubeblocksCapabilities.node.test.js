const assert = require('assert');
const { getEngineProfile, getScalingRules } = require('./kubeblocksCapabilities');

assert.strictEqual(getScalingRules({ resource: { replicas: 3 } }).canScaleReplicas, true);
const minio = { allowed_replicas: [4], capabilities: { horizontal_scaling: false, volume_expansion: false } };
assert.strictEqual(getEngineProfile([{ type: 'minio', profile: minio }], 'minio'), minio);
assert.deepStrictEqual(getScalingRules({ basic: { profile: minio }, resource: { replicas: 4 } }), {
  canScaleReplicas: false, canExpandVolume: false, replicas: [4]
});
assert.deepStrictEqual(getScalingRules({
  basic: { profile: { allowed_replicas: [3, 4, 5, 6, 7], capabilities: { scale_in: false } } },
  resource: { replicas: 5 }
}).replicas, [5, 6, 7]);
console.log('KubeBlocks capability checks passed');
