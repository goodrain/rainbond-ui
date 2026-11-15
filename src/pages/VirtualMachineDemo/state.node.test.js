const assert = require('node:assert/strict');
const test = require('node:test');
const { applyDemoAction, createVmTemplate, createValues } = require('./state');

const emptyData = () => ({ components: [], edges: [], nextId: 2 });
const values = (overrides = {}) => ({
  ...createValues(),
  name: 'local-vm',
  url: 'https://images.example.org/boot.qcow2',
  source: { name: 'boot.qcow2', mediaKind: 'image', os: 'Linux' },
  os: 'Linux',
  ...overrides
});
const create = (overrides, data = emptyData()) =>
  applyDemoAction(data, { type: 'create', values: values(overrides) });

test('URL structure is sufficient without claiming import or reachability success', () => {
  const data = create({ importReady: false });
  assert.equal(data.components[0].sourceType, 'url');
  assert.equal(data.components[0].status, 'running');
  assert.equal(Object.hasOwn(data.components[0], 'importReady'), false);
  assert.equal(createValues().sourceType, 'url');
});

test('each transport can carry ISO install media independently of sourceType', () => {
  ['url', 'upload', 'existing'].forEach((sourceType) => {
    const data = create({
      sourceType,
      source: { id: 'asset-4', name: 'installer.iso', mediaKind: 'iso' }
    });
    const vm = data.components[0];
    assert.equal(vm.sourceType, sourceType);
    assert.equal(vm.status, 'install');
    assert.equal(vm.iso, true);
    const stopped = applyDemoAction(data, {
      type: 'power', id: vm.id, values: { operation: 'stop' }
    });
    const started = applyDemoAction(stopped, {
      type: 'power', id: vm.id, values: { operation: 'start' }
    });
    assert.equal(started.components[0].status, 'install');
    const finished = applyDemoAction(started, {
      type: 'finish', id: vm.id, values: { confirm: true }
    });
    const restarted = applyDemoAction(finished, {
      type: 'power', id: vm.id, values: { operation: 'restart' }
    });
    assert.equal(restarted.components[0].status, 'running');
    assert.equal(restarted.components[0].iso, false);
  });
});

test('legacy ISO/image creates and existing ISO records remain usable without migration', () => {
  const legacy = {
    ...createVmTemplate(), id: 'vm-2', name: 'existing-iso', source: 'iso',
    os: 'Windows', iso: true, status: 'install', port: 30402
  };
  const previous = { components: [legacy], edges: [], nextId: 3 };
  const result = create({}, previous);
  assert.deepEqual(result.components[0], legacy);
  assert.equal(previous.components.length, 1);
  ['iso', 'image'].forEach((source) => {
    const data = create({ sourceType: undefined, source });
    assert.equal(data.components[0].status, source === 'iso' ? 'install' : 'running');
  });
});

test('create persists only selected display metadata and safe source location', () => {
  const file = new Blob(['not uploaded']);
  const data = create({
    url: 'https://images.example.org/boot.qcow2?download=1#private-fragment',
    source: {
      id: 4, name: 'boot.qcow2', mediaKind: 'image', format: 'qcow2',
      os: 'Linux', architecture: 'amd64', firmware: 'UEFI', requiresLoginSetup: true,
      apiRecord: { authorization: 'redacted' }, file, payload: 'discard'
    },
    apiRecord: { ignored: true }, file, password: 'discard',
    status: 'stopped', backendReference: { ignored: true }
  });
  const vm = data.components[0];
  assert.deepEqual(vm.source, {
    id: '4', name: 'boot.qcow2', format: 'qcow2', os: 'Linux',
    architecture: 'amd64', firmware: 'UEFI', mediaKind: 'image', requiresLoginSetup: true
  });
  assert.equal(vm.url, 'https://images.example.org/boot.qcow2');
  ['apiRecord', 'file', 'password', 'backendReference', 'payload'].forEach((key) => {
    assert.equal(Object.hasOwn(vm, key), false);
  });
  assert.equal(vm.status, 'running');
});

test('invalid URL and source metadata cannot bypass final create validation', () => {
  ['file:///disk.qcow2', 'https://user:secret@images.example.org/disk.qcow2', 'invalid'].forEach((url) => {
    assert.throws(() => create({ url }), /importRequired/);
  });
  ['upload', 'existing'].forEach((sourceType) => {
    assert.throws(() => create({ sourceType, source: {} }), /imageRequired/);
  });
});
