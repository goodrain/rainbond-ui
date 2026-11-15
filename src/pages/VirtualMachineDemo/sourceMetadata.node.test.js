const assert = require('node:assert/strict');
const test = require('node:test');
const { OFFICIAL_IMAGE_URL, validImageUrl, describeSource, describeUrl, describeAssets } = require('./sourceMetadata');

test('official URL is a known boot-disk candidate with an explicit login boundary', () => {
  assert.equal(OFFICIAL_IMAGE_URL, 'https://cloud-images.ubuntu.com/minimal/releases/noble/release/ubuntu-24.04-minimal-cloudimg-amd64.img');
  assert.deepEqual(describeUrl(OFFICIAL_IMAGE_URL), {
    name: 'ubuntu-24.04-minimal-cloudimg-amd64.img',
    mediaKind: 'image',
    os: 'Ubuntu 24.04 Minimal',
    architecture: 'amd64',
    format: 'qcow2',
    firmware: 'UEFI / GPT',
    requiresLoginSetup: true
  });
});

test('URL validation checks structure without requiring import or network results', () => {
  assert.equal(validImageUrl('https://cluster-only.invalid/cloud.img?download=1'), true);
  assert.equal(validImageUrl('ftp://host.invalid/cloud.img'), false);
  assert.equal(validImageUrl('https://user:password@host.invalid/cloud.img'), false);
  assert.equal(validImageUrl('not a URL'), false);
  assert.deepEqual(describeUrl('not a URL'), {});
});

test('media hints come from metadata or filename paths without inventing format or architecture', () => {
  assert.deepEqual(describeUrl('https://host.invalid/install.ISO?name=cloud.qcow2'), { name: 'install.ISO', mediaKind: 'iso', format: 'iso' });
  assert.deepEqual(describeSource({ name: 'guest.img' }), { name: 'guest.img', mediaKind: 'image', format: 'img' });
  assert.deepEqual(describeSource({ name: 'opaque-download' }), { name: 'opaque-download', mediaKind: 'unknown' });
  assert.equal(describeSource({ name: 'opaque-download', format: 'iso' }).mediaKind, 'iso');
});

test('existing assets reuse native readiness and separate creation identity from display metadata', () => {
  const assets = describeAssets([
    { id: 1, name: 'installer', display_name: 'OS installer', status: 'ready', image_url: 'https://host.invalid/install.iso?private=hidden', extra: { data: 'excluded' }, blob: { type: 'excluded' } },
    { id: 2, name: 'disk', status: 'pending', image_url: 'https://host.invalid/guest.img' },
    { id: 3, name: 'unavailable', status: 'ready' },
    null
  ]);
  assert.deepEqual(assets[0], {
    key: '1', selectable: true, creation: { asset_id: '1', image_name: 'installer' },
    source: { id: '1', name: 'OS installer', mediaKind: 'iso', format: 'iso' }
  });
  assert.equal(assets[1].selectable, false);
  assert.equal(assets[2].selectable, false);
  assert.equal(JSON.stringify(assets).includes('hidden'), false);
  assert.equal(JSON.stringify(assets).includes('extra'), false);
  assert.equal(JSON.stringify(assets).includes('blob'), false);
});

test('asset creation preserves original name and bounded runtime fields without source URLs or credentials', () => {
  const [asset] = describeAssets([{
    id: 42, name: 'windows-image', display_name: 'Windows server display',
    status: 'ready', image_url: 'registry.invalid/actual-image:tag?token=opaque-hidden',
    arch: 'arm64', format: 'qcow2', os_name: 'Windows Server 2025', os_type: 'obsolete',
    boot_mode: 'uefi', firmware: 'obsolete',
    extra: { runtime_snapshot: {
      boot_mode: 'bios', gpu_enabled: true, gpu_resources: ['vendor.example/gpu'], gpu_count: 2,
      usb_enabled: true, usb_resources: ['kubevirt.io/usb-1234'],
      ssh_public_key: 'opaque-hidden', password: 'opaque-hidden', private_key: 'opaque-hidden',
      vm_url: 'https://opaque-hidden.invalid', nested: { token: 'opaque-hidden' }
    } }
  }]);
  assert.equal(asset.source.name, 'Windows server display');
  assert.equal(asset.source.os, 'Windows Server 2025');
  assert.equal(asset.source.firmware, 'uefi');
  assert.deepEqual(asset.creation, {
    asset_id: '42', image_name: 'windows-image', arch: 'arm64', format: 'qcow2',
    boot_mode: 'uefi', gpu_enabled: true, gpu_resources: ['vendor.example/gpu'], gpu_count: 2,
    usb_enabled: true, usb_resources: ['kubevirt.io/usb-1234']
  });
  assert.equal(JSON.stringify(asset).includes('opaque-hidden'), false);
  assert.equal(JSON.stringify(asset).includes('runtime_snapshot'), false);
});

test('asset metadata keeps absent fields absent and rejects malformed creation runtime values', () => {
  const [legacy, malformed] = describeAssets([
    { id: 5, name: 'legacy', status: 'ready', image_url: 'registry/legacy', os_type: 'legacy OS', firmware: 'legacy firmware' },
    { id: 6, name: 'invalid asset name', status: 'ready', image_url: 'registry/invalid', arch: 'bad arch', format: 'QCOW2',
      extra: { runtime_snapshot: { boot_mode: 'disk', gpu_count: -1, gpu_enabled: 'true', gpu_resources: [
        { raw: 'excluded' }, 'https://excluded.invalid', 'not a resource', 'vendor.example/gpu'
      ], usb_resources: ['kubevirt.io/usb-1234'] } } }
  ]);
  assert.equal(legacy.source.os, 'legacy OS');
  assert.equal(legacy.source.firmware, 'legacy firmware');
  assert.deepEqual(legacy.creation, { asset_id: '5', image_name: 'legacy' });
  assert.deepEqual(malformed.creation, {
    asset_id: '6', format: 'qcow2', gpu_resources: ['vendor.example/gpu'], usb_resources: ['kubevirt.io/usb-1234']
  });
});

test('compressed source names use the same finite media hints and preserve archive metadata', () => {
  const installer = describeSource({ name: 'installer.iso.gz' });
  assert.equal(installer.format, 'iso');
  assert.equal(installer.mediaKind, 'iso');
  const disk = describeSource({ name: 'disk.qcow2.xz' });
  assert.equal(disk.format, 'qcow2');
  assert.equal(disk.mediaKind, 'image');
  assert.equal(describeSource({ name: 'disk.img.gz' }).format, 'img');
  const [asset] = describeAssets([{
    id: 8, name: 'archived-root', status: 'ready', image_url: 'registry/root', format: 'tar.gz'
  }]);
  assert.equal(asset.creation.format, 'tar.gz');
  assert.equal(asset.source.format, 'tar.gz');
});

test('asset firmware falls back to the snapshot only when the top-level value is absent', () => {
  const [asset] = describeAssets([{
    id: 7, name: 'legacy-snapshot', status: 'ready', image_url: 'registry/legacy',
    extra: { runtime_snapshot: { boot_mode: 'bios' } }
  }]);
  assert.equal(asset.creation.boot_mode, 'bios');
});
