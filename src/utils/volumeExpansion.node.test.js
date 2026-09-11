const assert = require('assert');
const {
  canEditVolumeCapacity,
  isCapacityExpansion,
  isExpansionInProgress,
  minimumExpansionCapacity
} = require('./volumeExpansion');

assert.strictEqual(isExpansionInProgress('resizing'), true);
assert.strictEqual(isExpansionInProgress('filesystem_resize_pending'), true);
assert.strictEqual(isExpansionInProgress('ready'), false);

assert.strictEqual(
  minimumExpansionCapacity({
    volume_capacity: 20,
    requested_capacity: 30,
    actual_capacity: 25
  }),
  30
);
assert.strictEqual(isCapacityExpansion({ volume_capacity: 20 }, 21), true);
assert.strictEqual(isCapacityExpansion({ volume_capacity: 20 }, 20), false);
assert.strictEqual(
  isCapacityExpansion(
    { volume_capacity: 30, requested_capacity: 10, actual_capacity: 10 },
    30
  ),
  true,
  'a stored target ahead of the PVC runtime capacity still needs expansion'
);

assert.strictEqual(
  canEditVolumeCapacity({ expansion_status: 'unsupported', allow_expansion: false }, true),
  false
);
assert.strictEqual(
  canEditVolumeCapacity({ expansion_status: 'ready', allow_expansion: true }, true),
  true
);
assert.strictEqual(
  canEditVolumeCapacity({ allow_expansion: false }, true),
  true,
  'legacy responses without expansion_status remain editable'
);
assert.strictEqual(canEditVolumeCapacity({ volume_type: 'config-file' }, true), false);
assert.strictEqual(canEditVolumeCapacity({}, false), true);

console.log('volume expansion helpers passed');
