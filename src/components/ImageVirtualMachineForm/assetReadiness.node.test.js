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
    image_url: 'https://download/rootdisk.qcow2',
    extra: {
      disks: [
        { disk_key: 'rootdisk', disk_role: 'root', download_url: 'https://download/rootdisk.qcow2' },
        { disk_key: 'data-1', disk_role: 'data', download_url: 'https://download/data-1.qcow2' }
      ]
    }
  }),
  true,
  'should allow exported VM assets only after all live export urls are ready'
);

assert.strictEqual(
  isVMAssetSelectable({
    id: 4,
    source_type: 'vm_export',
    status: 'ready',
    image_url: 'https://download/rootdisk.qcow2',
    extra: {
      disks: [
        { disk_key: 'rootdisk', disk_role: 'root', download_url: 'https://download/rootdisk.qcow2' },
        { disk_key: 'data-1', disk_role: 'data' }
      ]
    }
  }),
  false,
  'should block exported VM assets when a live export url is missing'
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
