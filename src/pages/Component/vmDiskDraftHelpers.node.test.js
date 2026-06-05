const assert = require('assert');
const {
  appendContainerDiskDraft,
  removeContainerDiskDraft,
  serializeVMDiskLayout
} = require('./vmDiskDraftHelpers');

const disks = appendContainerDiskDraft(
  [{
    disk_key: 'disk',
    disk_name: 'disk',
    disk_role: 'root',
    device_type: 'disk',
    source_kind: 'volume',
    order_index: 0,
    boot: true
  }],
  {
    volume_name: 'drivers',
    image: ' registry.example.com/team/windows-driver:virtio '
  }
);

assert.strictEqual(disks.length, 2);
assert.strictEqual(disks[1].disk_key, 'drivers');
assert.strictEqual(disks[1].device_type, 'cdrom');
assert.strictEqual(disks[1].device_path, '/cdrom');
assert.strictEqual(disks[1].source_kind, 'container_disk');
assert.strictEqual(disks[1].image, 'registry.example.com/team/windows-driver:virtio');
assert.strictEqual(disks[0].boot, true);
assert.strictEqual(disks[1].boot, false);

assert.deepStrictEqual(
  serializeVMDiskLayout(disks),
  [{
    disk_key: 'disk',
    disk_name: 'disk',
    disk_role: 'root',
    device_type: 'disk',
    source_kind: 'volume',
    image: undefined,
    order_index: 0,
    boot: true
  }, {
    disk_key: 'drivers',
    disk_name: 'drivers',
    disk_role: 'data',
    device_type: 'cdrom',
    source_kind: 'container_disk',
    image: 'registry.example.com/team/windows-driver:virtio',
    order_index: 1,
    boot: false
  }],
  'saving VM disk layout must preserve container disk image'
);

assert.deepStrictEqual(
  removeContainerDiskDraft(disks, 'drivers').map(item => item.disk_key),
  ['disk'],
  'container disk media should be removable from the VM disk draft'
);

console.log('vm disk draft helper tests passed');
