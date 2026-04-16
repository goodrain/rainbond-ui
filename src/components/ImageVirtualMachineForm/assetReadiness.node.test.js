const assert = require('assert');
const { getSelectableVMAssets, isVMAssetSelectable } = require('./assetReadiness');

assert.strictEqual(
  isVMAssetSelectable({
    id: 1,
    source_type: 'upload',
    status: 'ready',
    image_url: 'tenant/demo:ubuntu-22.04'
  }),
  true,
  'should allow ready local assets with image_url to be selected'
);

assert.strictEqual(
  isVMAssetSelectable({
    id: 2,
    source_type: 'upload',
    status: 'exporting',
    image_url: ''
  }),
  false,
  'should block local assets whose export is still in progress'
);

assert.strictEqual(
  isVMAssetSelectable({
    id: 3,
    source_type: 'vm_export',
    status: 'ready',
    image_url: 's3://vm-assets/rootdisk.qcow2',
    extra: {
      storage_status: 'ready',
      machine_manifest: {
        disks: [{ disk_key: 'rootdisk', disk_role: 'root' }]
      }
    }
  }),
  true,
  'should allow exported VM assets only after storage and manifest are ready'
);

assert.strictEqual(
  isVMAssetSelectable({
    id: 4,
    source_type: 'vm_export',
    status: 'ready',
    image_url: 's3://vm-assets/rootdisk.qcow2',
    extra: {
      storage_status: 'exporting',
      machine_manifest: {
        disks: [{ disk_key: 'rootdisk', disk_role: 'root' }]
      }
    }
  }),
  false,
  'should block exported VM assets when storage is not ready yet'
);

assert.deepStrictEqual(
  getSelectableVMAssets([
    {
      id: 'ready-asset',
      source_type: 'upload',
      status: 'ready',
      image_url: 'tenant/demo:ready-asset'
    },
    {
      id: 'exporting-asset',
      source_type: 'upload',
      status: 'exporting',
      image_url: ''
    }
  ]).map(item => item.id),
  ['ready-asset'],
  'should only expose selectable assets to the local source selector'
);

console.log('vm asset readiness tests passed');
