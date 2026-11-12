const assert = require('node:assert/strict');
const test = require('node:test');
const { inspectVmUploadFormat, inferVmSourceFormat } = require('./vmQuickStart');

function file(bytes, name = 'disk.img') {
  return { name, size: 20 * 1024 ** 3, slice(start, end) {
    assert.equal(start, 0);
    assert.equal(end, 64 * 1024, 'large images must not be read in full');
    return { arrayBuffer: async () => bytes.buffer };
  } };
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
