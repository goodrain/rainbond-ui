const assert = require('node:assert/strict');
const test = require('node:test');
const { inspectVmUploadFormat, inferVmSourceFormat } = require('./vmQuickStart');

function file(bytes, name = 'disk.img', footer = new Uint8Array(512), reads = []) {
  const size = 20 * 1024 ** 3;
  return { name, size, slice(start, end) {
    reads.push([start, end]);
    if (start === 0) {
      assert.equal(end, 64 * 1024, 'large images must not be read in full');
      return { arrayBuffer: async () => bytes.buffer };
    }
    assert.equal(start, size - 512, 'VHD detection reads the actual trailing footer');
    assert.equal(end, size);
    return { arrayBuffer: async () => footer.buffer };
  } };
}

function vhdFooter(type = 2) {
  const bytes = new Uint8Array(512);
  bytes.set(Buffer.from('conectix'));
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 2);
  view.setUint32(12, 0x00010000);
  if (type === 2) bytes.fill(0xff, 16, 24);
  else view.setUint32(20, 512);
  view.setUint32(60, type);
  const sum = bytes.reduce((total, value) => total + value, 0);
  view.setUint32(64, (~sum) >>> 0);
  return bytes;
}

test('recognizes QCOW2 versions 2 and 3 behind an IMG filename', async () => {
  for (const version of [2, 3]) {
    const bytes = new Uint8Array([0x51, 0x46, 0x49, 0xfb, 0, 0, 0, version]);
    assert.equal(await inspectVmUploadFormat(file(bytes)), 'qcow2');
  }
});

test('recognizes the ISO9660 primary descriptor within the bounded header', async () => {
  const bytes = new Uint8Array(64 * 1024);
  bytes.set([1, 67, 68, 48, 48, 49, 1], 32768);
  assert.equal(await inspectVmUploadFormat(file(bytes, 'installer.iso')), 'iso');
});

test('recognizes VMDK signatures behind neutral file names without reading the whole disk', async () => {
  for (const magic of ['KDMV', 'COWD']) {
    assert.equal(await inspectVmUploadFormat(file(Uint8Array.from(Buffer.from(magic)), 'renamed.img')), 'vmdk');
  }
});

test('VDI and VHDX headers identify content behind neutral names', async () => {
  const vdi = new Uint8Array(72);
  vdi.set([0x7f, 0x10, 0xda, 0xbe], 64);
  new DataView(vdi.buffer).setUint32(68, 0x00010001, true);
  assert.equal(await inspectVmUploadFormat(file(vdi, 'neutral.img')), 'vdi');
  assert.equal(await inspectVmUploadFormat(file(Uint8Array.from(Buffer.from('vhdxfile')), 'neutral.raw')), 'vhdx');
  for (const name of ['disk.vdi', 'disk.vhd', 'disk.vhdx'])
    assert.equal(await inspectVmUploadFormat(file(new Uint8Array(72), name)), '', 'extensions never establish inspected format');
});

test('VHD recognition reads and checks its final footer without treating guest ISO bytes as an optical disc', async () => {
  const bytes = new Uint8Array(64 * 1024);
  bytes.set([1, 67, 68, 48, 48, 49, 1], 32768);
  const reads = [];
  assert.equal(await inspectVmUploadFormat(file(bytes, 'neutral.img', vhdFooter(), reads)), 'vhd');
  assert.deepEqual(reads, [[0, 64 * 1024], [20 * 1024 ** 3 - 512, 20 * 1024 ** 3]]);
  const damaged = vhdFooter(); damaged[85] ^= 1;
  assert.equal(await inspectVmUploadFormat(file(new Uint8Array(72), 'disk.vhd', damaged)), '');
  assert.equal(await inspectVmUploadFormat(file(vhdFooter(), 'disk.vhd')), '', 'a header copy alone is not the trailing footer');
  assert.equal(await inspectVmUploadFormat(file(new Uint8Array(72), 'neutral.img', vhdFooter(3))), 'vhd');
  assert.equal(await inspectVmUploadFormat(file(new Uint8Array(72), 'disk.vhd', vhdFooter(4))), '', 'differencing metadata is not a supported single-file hint');
});

test('existing gzip and xz streams keep transport hints despite payload header signatures', async () => {
  for (const [name, prefix] of [['disk.raw.gz', [0x1f, 0x8b, 8, 0]], ['disk.img.xz', [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0]]]) {
    const bytes = new Uint8Array(72);
    bytes.set(prefix);
    bytes.set([0x7f, 0x10, 0xda, 0xbe], 64);
    assert.equal(await inspectVmUploadFormat(file(bytes, name)), '');
  }
});

test('a standalone VMDK descriptor is rejected with a safe consolidate instruction code', async () => {
  const bytes = Uint8Array.from(Buffer.from('# Disk DescriptorFile\nRW 4096 SPARSE "external-test-extent.vmdk"\n'));
  await assert.rejects(inspectVmUploadFormat(file(bytes, 'disk.vmdk')), error =>
    error.code === 'vm_vmdk_requires_single_file' && !error.message.includes('external-test-extent'));
});

test('unknown, raw and compressed headers retain the existing extension hint', async () => {
  for (const [name, bytes] of [
    ['disk.raw', [0, 1, 2, 3]],
    ['disk.img.gz', [0x1f, 0x8b, 8, 0]],
    ['disk.img.xz', [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0]],
    ['disk.img', [0x51, 0x46, 0x49, 0xfb, 0, 0, 0, 99]]
  ]) {
    assert.equal(await inspectVmUploadFormat(file(new Uint8Array(bytes), name)), '');
    assert.ok(inferVmSourceFormat(name));
  }
});

test('a failed local read rejects without exposing file contents', async () => {
  await assert.rejects(inspectVmUploadFormat({ slice() {
    return { arrayBuffer: async () => { throw new Error('read failed'); } };
  } }));
});
