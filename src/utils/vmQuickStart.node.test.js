const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  UBUNTU_NOBLE_QCOW2_URL,
  createQuickStartImageName,
  createVmImageName,
  inferVmSourceFormat,
  normalizeVmSourceFormat,
  normalizeVmOperatingSystem,
  SUPPORTED_VM_SOURCE_FORMATS,
  isLinuxQcow2QuickStart,
  getSshUsernameError,
  getSshPublicKeyError,
  runVmQuickStart,
  runVmCreation
} = require('./vmQuickStart');

test('OS metadata is explicit, trimmed, bounded single-line text', () => {
  assert.equal(normalizeVmOperatingSystem(' Windows Server 2025 '), 'Windows Server 2025');
  assert.equal(normalizeVmOperatingSystem('操作系统 1.0'), '操作系统 1.0');
  assert.equal(normalizeVmOperatingSystem('x'.repeat(128)), 'x'.repeat(128));
  for (const value of [undefined, null, true, {}, [], '', ' ', 'x'.repeat(129), 'Ubuntu\n', 'a\u0000b', 'a\u2028b', 'a\u0085b'])
    assert.equal(normalizeVmOperatingSystem(value), null);
});

// An algorithm prefix plus opaque fixture bytes, not an actual account key.
const fixtureForAlgorithm = algorithm => {
  const prefix = Buffer.alloc(4);
  prefix.writeUInt32BE(algorithm.length);
  return `${algorithm} ${Buffer.concat([
    prefix, Buffer.from(algorithm), Buffer.from('synthetic-public-fixture')
  ]).toString('base64')}`;
};
const publicFixture = `${fixtureForAlgorithm('ssh-ed25519')} fixture-only`;
const response = extra => ({ status_code: 200, business_code: 200, ...extra });
const payload = overrides => ({
  team_name: 'team-a', group_id: 868, service_cname: 'vm-a',
  source_type: 'url', vm_url: UBUNTU_NOBLE_QCOW2_URL,
  ssh_username: 'ubuntu', ssh_public_key: publicFixture,
  resources: { cpu: 2, memory: 4, disk: 80 },
  ...overrides
});

function fakeApi(overrides = {}) {
  const calls = [];
  const defaults = {
    createVm: response({ bean: { service_alias: 'gr123abc' } }),
    getPortDetail: response({ bean: { port: {
      container_port: 22, protocol: 'tcp', is_inner_service: true, is_outer_service: false
    } } }),
    getVolumeOpts: response({ list: [
      { volume_type: 'memoryfs', name_show: 'Temporary' },
      { volume_type: 'ceph-block', name_show: 'Persistent block' }
    ] }),
    configure: response(),
    build: response()
  };
  const api = Object.keys(defaults).reduce((result, name) => {
    result[name] = async body => {
      calls.push({ name, body });
      if (Object.prototype.hasOwnProperty.call(overrides, name)) {
        const override = overrides[name];
        if (override instanceof Error) throw override;
        return typeof override === 'function' ? override(body) : override;
      }
      return defaults[name];
    };
    return result;
  }, {});
  return { api, calls };
}

test('quickstart recognizes only the explicit trusted Linux URL image', () => {
  assert.equal(isLinuxQcow2QuickStart('url', UBUNTU_NOBLE_QCOW2_URL), true);
  ['existing', 'upload', 'iso', 'public'].forEach(source => {
    assert.equal(isLinuxQcow2QuickStart(source, UBUNTU_NOBLE_QCOW2_URL), false);
  });
  [undefined, '', 'https://other.invalid/ubuntu.qcow2',
    `${UBUNTU_NOBLE_QCOW2_URL}?download=1`, 'https://example.invalid/windows.iso']
    .forEach(url => assert.equal(isLinuxQcow2QuickStart('url', url), false));
});

test('quickstart asset names are legal and distinct even in the same clock tick', t => {
  t.mock.method(Date, 'now', () => 1770000000000);
  t.mock.method(Math, 'random', () => 0.5);
  const first = createQuickStartImageName();
  const second = createQuickStartImageName();
  assert.notEqual(first, second);
  [first, second].forEach(name => {
    assert.match(name, /^ubuntu-noble-[a-z0-9]+-[a-z0-9]+-[a-z0-9]{8}$/);
    assert.match(name, /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/);
  });
});

test('ordinary imports use neutral unique asset names', () => {
  const first = createVmImageName();
  const second = createVmImageName();
  assert.match(first, /^vm-image-[a-z0-9]+-[a-z0-9]+-[a-z0-9]{8}$/);
  assert.notEqual(first, second);
});

test('explicit source suffixes preserve ISO, QCOW2, raw, and generic img hints', () => {
  [
    ['windows.ISO', 'iso'], ['disk.qcow2', 'qcow2'], ['/uploads/disk.raw', 'raw'], ['guest.img', 'img'],
    ['https://images.invalid/install.iso?download=1', 'iso'],
    ['https://images.invalid/image%2Eqcow2#fragment', 'qcow2']
  ].forEach(([source, format]) => assert.equal(inferVmSourceFormat(source), format));
  [undefined, '', 'download?name=installer.iso',
    'https://images.invalid/download?file=installer.iso', 'unknown-disk']
    .forEach(source => assert.equal(inferVmSourceFormat(source), ''));
});

const sourceFormatCases = [
  ['disk.img', 'img'], ['installer.iso', 'iso'], ['disk.qcow2', 'qcow2'], ['disk.raw', 'raw'],
  ['archive.tar.gz', 'tar.gz'], ['archive.tar.xz', 'tar.xz'],
  ['archive.gz', 'gz'], ['archive.xz', 'xz'], ['archive.tar', 'tar'],
  ['installer.iso.gz', 'iso'], ['installer.iso.xz', 'iso'],
  ['disk.qcow2.gz', 'qcow2'], ['disk.qcow2.xz', 'qcow2'],
  ['disk.raw.gz', 'raw'], ['disk.raw.xz', 'raw'], ['disk.img.gz', 'img'], ['disk.img.xz', 'img']
];

test('format normalization is finite and preserves compound archive formats', () => {
  assert.deepEqual(SUPPORTED_VM_SOURCE_FORMATS, ['img', 'iso', 'qcow2', 'raw', 'tar.gz', 'tar.xz', 'gz', 'xz', 'tar']);
  sourceFormatCases.forEach(([filename, expected]) => assert.equal(inferVmSourceFormat(filename), expected));
  assert.equal(normalizeVmSourceFormat(' TAR.GZ '), 'tar.gz');
  ['not-format', 'qcow2.extra', 'zip', 'tar.bz2', undefined].forEach(value =>
    assert.equal(normalizeVmSourceFormat(value), ''));
  ['disk.zip', 'disk.tar.bz2', 'disk.qcow2.gz.extra', 'download?filename=disk.raw.gz'].forEach(filename =>
    assert.equal(inferVmSourceFormat(filename), ''));
});

sourceFormatCases.forEach(([filename, expected]) => {
  test(`upload ${filename} passes its supported source format in the first create request`, async () => {
    const { api, calls } = fakeApi();
    const result = await runVmCreation({ payload: {
      team_name: 'team-a', group_id: 868, source_type: 'upload', event_id: 'real-upload-event',
      arch: 'amd64', format: inferVmSourceFormat(filename)
    } }, api);
    assert.equal(result.status, 'submitted');
    assert.equal(calls[0].body.format, expected);
    assert.match(calls[0].body.image_name, /^vm-image-/);
    assert.equal(calls[0].body.event_id, 'real-upload-event');
    assert.equal(calls[0].body.ssh_public_key, undefined);
    assert.equal(calls[0].body.os_family, undefined);
    assert.equal(calls[0].body.boot_mode, undefined);
    assert.deepEqual(calls.map(call => call.name), ['createVm', 'getVolumeOpts', 'configure', 'build']);
  });
});

test('independent creations use fresh asset names and alias retries generate none', async t => {
  const random = t.mock.method(Math, 'random', () => 0.5);
  const first = fakeApi({ build: undefined });
  const failed = await runVmQuickStart({ payload: payload({ image_name: 'caller-fixed-name' }) }, first.api);
  const second = fakeApi();
  await runVmQuickStart({ payload: payload({ image_name: 'caller-fixed-name' }) }, second.api);
  const firstName = first.calls[0].body.image_name;
  const secondName = second.calls[0].body.image_name;
  assert.notEqual(firstName, 'caller-fixed-name');
  assert.notEqual(secondName, 'caller-fixed-name');
  assert.notEqual(firstName, secondName);
  assert.equal(random.mock.callCount(), 2);
  const retry = fakeApi();
  const done = await runVmQuickStart({ payload: { team_name: 'team-a' }, resume: failed }, retry.api);
  assert.equal(done.status, 'submitted');
  assert.deepEqual(retry.calls.map(call => call.name), ['getPortDetail', 'build']);
  assert.equal(random.mock.callCount(), 2);
});

test('credential validation returns fixed codes and rejects private or multiline material', () => {
  assert.equal(getSshUsernameError('ubuntu'), '');
  assert.equal(getSshUsernameError('root'), 'sshUsernameRootUnsupported');
  assert.equal(getSshUsernameError(' root '), 'sshUsernameRootUnsupported');
  assert.equal(getSshUsernameError(''), 'sshUsernameRequired');
  ['root!', 'a'.repeat(33), 'two users', 'ubuntu\nother'].forEach(value =>
    assert.equal(getSshUsernameError(value), 'sshUsernameInvalid'));
  assert.equal(getSshPublicKeyError(publicFixture), '');
  assert.equal(getSshPublicKeyError(''), 'sshPublicKeyRequired');
  [undefined, '', '   '].forEach(value => assert.equal(getSshPublicKeyError(value), 'sshPublicKeyRequired'));
  ['PRIVATE KEY opaque sentinel', 'not-a-key',
    `${publicFixture}\r${publicFixture}`, `ssh-rsa ${'A'.repeat(8200)}`,
    'ssh-ed25519 AAA', publicFixture.replace('ssh-ed25519 ', 'ssh-rsa ')]
    .forEach(value => assert.equal(getSshPublicKeyError(value), 'sshPublicKeyInvalid'));
});

test('copied public key whitespace is trimmed while internal lines and controls are rejected', () => {
  [
    `${publicFixture}\n`, `${publicFixture}\r\n`,
    `  ${publicFixture}  `, `\t ${publicFixture} \t\r\n`,
    `\n${publicFixture}\n`
  ].forEach(value => assert.equal(getSshPublicKeyError(value), ''));
  [
    `${publicFixture}\nsecond line`, `${publicFixture}\r\nsecond line`,
    `${fixtureForAlgorithm('ssh-ed25519')}\n${fixtureForAlgorithm('ssh-rsa')}`,
    `\u0000${publicFixture}`, `${publicFixture}\u0000`,
    `\u007f${publicFixture}`, `${publicFixture}\u007f`
  ].forEach(value => assert.equal(getSshPublicKeyError(value), 'sshPublicKeyInvalid'));
});

test('public key comments are optional printable text, not ignored extra key fields', () => {
  const withoutComment = fixtureForAlgorithm('ssh-ed25519');
  [withoutComment, `${withoutComment} office desktop`, `${withoutComment} alice@example.invalid workstation`]
    .forEach(value => assert.equal(getSshPublicKeyError(value), ''));
  [
    `${publicFixture} ${fixtureForAlgorithm('ssh-rsa')}`,
    `${publicFixture} note ${fixtureForAlgorithm('ecdsa-sha2-nistp256')} second`,
    `${publicFixture} ${fixtureForAlgorithm('sk-ssh-ed25519@openssh.com')}`,
    `${publicFixture} -----BEGIN PUBLIC KEY-----`,
    `${publicFixture} ---- BEGIN SSH2 PUBLIC KEY ----`,
    `${publicFixture} BEGIN PUBLIC KEY`,
    `${publicFixture} -----END OPENSSH PRIVATE KEY-----`,
    `${publicFixture} broken\u0008comment`,
    `${publicFixture} hidden\u007fcomment`,
    `${publicFixture}\u2028another line`,
    `${publicFixture}\u2029another paragraph`,
    `${withoutComment}\tcomment`
  ].forEach(value => assert.equal(getSshPublicKeyError(value), 'sshPublicKeyInvalid'));
});

test('public key algorithms match the Console supported set', () => {
  ['ssh-ed25519', 'ssh-rsa', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', 'ecdsa-sha2-nistp521']
    .forEach(algorithm => assert.equal(getSshPublicKeyError(fixtureForAlgorithm(algorithm)), ''));
  ['sk-ssh-ed25519@openssh.com', 'sk-ecdsa-sha2-nistp256@openssh.com', 'ssh-dss']
    .forEach(algorithm => assert.equal(getSshPublicKeyError(fixtureForAlgorithm(algorithm)), 'sshPublicKeyInvalid'));
});

test('requests are serial and use real resource units without frontend port mutations', async () => {
  const { api, calls } = fakeApi();
  const progress = [];
  const result = await runVmQuickStart({ payload: payload(), onProgress: step => progress.push(step) }, api);
  assert.deepEqual(calls.map(call => call.name), ['createVm', 'getPortDetail', 'getVolumeOpts', 'configure', 'build']);
  assert.deepEqual(progress.map(step => step.stage), ['create', 'ssh', 'storage', 'configure', 'build']);
  assert.ok(progress.every(step => step.status === undefined));
  assert.equal(result.status, 'submitted');
  assert.equal(result.stage, 'build');
  assert.equal(result.serviceAlias, 'gr123abc');
  assert.equal(result.portConfigured, true);
  assert.equal(result.resourceConfigured, true);
  assert.deepEqual(result.storageOptions, [{ value: 'ceph-block', label: 'Persistent block' }]);
  assert.deepEqual(calls[1].body, { team_name: 'team-a', app_alias: 'gr123abc', port: 22, sensitiveError: true });
  assert.deepEqual(calls[3].body, {
    team_name: 'team-a', app_alias: 'gr123abc', min_cpu: 2000,
    min_memory: 4096, disk_cap: 80, disk_volume_type: 'ceph-block', sensitiveError: true
  });
  assert.deepEqual(calls[4].body, {
    team_name: 'team-a', app_alias: 'gr123abc', is_deploy: true, sensitiveError: true
  });
  assert.ok(!JSON.stringify({ result, progress }).includes(publicFixture));
  assert.ok(!JSON.stringify(calls.slice(1)).includes(publicFixture));
});

test('creation forwards only the paired public credentials and trusted guest metadata', async () => {
  const { api, calls } = fakeApi();
  await runVmQuickStart({ payload: payload({
    os_name: 'wrong', os_family: 'windows', format: 'iso', boot_mode: 'bios',
    password: 'opaque-should-be-omitted', private_key: 'opaque-should-be-omitted'
  }) }, api);
  const created = calls[0].body;
  assert.equal(created.os_name, 'Ubuntu 24.04');
  assert.equal(created.os_family, 'linux');
  assert.equal(created.format, 'qcow2');
  assert.equal(created.boot_mode, 'uefi');
  assert.equal(created.ssh_username, 'ubuntu');
  assert.equal(created.ssh_public_key, publicFixture);
  ['password', 'private_key', 'resources', 'disk_volume_type'].forEach(name =>
    assert.equal(Object.prototype.hasOwnProperty.call(created, name), false));
});

test('an invalid source, resource, or firmware never reaches creation', async () => {
  for (const overrides of [
    { source_type: 'existing' }, { vm_url: 'https://example.invalid/windows.iso' },
    { ssh_public_key: 'invalid-public-input' }, { boot_mode: 'disk' },
    { resources: { cpu: 0, memory: 4, disk: 80 } }
  ]) {
    const { api, calls } = fakeApi();
    const result = await runVmQuickStart({ payload: payload(overrides) }, api);
    assert.equal(result.status, 'failed');
    assert.equal(result.error, 'quickStartInvalidRequest');
    assert.equal(calls.length, 0);
  }
});

test('creation must provide a successful HTTP result with a real alias', async () => {
  for (const createVm of [undefined, response({ bean: {} }),
    { status_code: 400, bean: { service_alias: 'gr123abc' } },
    new Error('opaque-response-sentinel')]) {
    const { api, calls } = fakeApi({ createVm });
    const result = await runVmQuickStart({ payload: payload() }, api);
    assert.equal(result.error, 'quickStartCreateFailed');
    assert.equal(result.serviceAlias, '');
    assert.equal(calls.length, 1);
    assert.ok(!JSON.stringify(result).includes('opaque-response-sentinel'));
  }
});

test('missing, unsafe, or unconfirmed SSH configuration prevents every later request', async () => {
  const base = { container_port: 22, protocol: 'tcp', is_inner_service: true, is_outer_service: false };
  for (const getPortDetail of [undefined, new Error('opaque-response-sentinel'), response({ bean: {} }),
    ...[{ protocol: 'http' }, { container_port: 23 }, { is_outer_service: true },
      { is_inner_service: false }, { is_inner_service: 'true' }, { is_outer_service: undefined }]
      .map(change => response({ bean: { port: { ...base, ...change } } }))]) {
    const { api, calls } = fakeApi({ getPortDetail });
    const result = await runVmQuickStart({ payload: payload() }, api);
    assert.equal(result.error, 'quickStartSshUnconfirmed');
    assert.equal(result.stage, 'ssh');
    assert.equal(result.serviceAlias, 'gr123abc');
    assert.equal(result.portConfigured, false);
    assert.deepEqual(calls.map(call => call.name), ['createVm', 'getPortDetail']);
  }
});

test('multiple persistent types require an explicit choice and resume never creates again', async () => {
  const getVolumeOpts = response({ list: [
    { volume_type: 'memoryfs' }, { volume_type: 'type-a', name_show: 'A' },
    { volume_type: 'type-b', name_show: 'B' }
  ] });
  const first = fakeApi({ getVolumeOpts });
  const waiting = await runVmQuickStart({ payload: payload() }, first.api);
  assert.equal(waiting.status, 'storage-required');
  assert.equal(waiting.error, 'quickStartStorageRequired');
  assert.equal(waiting.portConfigured, true);
  assert.equal(first.calls.length, 3);
  assert.deepEqual(waiting.storageOptions, [{ value: 'type-a', label: 'A' }, { value: 'type-b', label: 'B' }]);
  const retry = fakeApi({ getVolumeOpts });
  const done = await runVmQuickStart({
    payload: { team_name: 'team-a', disk_volume_type: 'type-b' }, resume: waiting
  }, retry.api);
  assert.equal(done.status, 'submitted');
  assert.deepEqual(retry.calls.map(call => call.name), ['getPortDetail', 'getVolumeOpts', 'configure', 'build']);
  assert.equal(retry.calls[2].body.disk_volume_type, 'type-b');
  assert.equal(retry.calls[2].body.min_cpu, 2000);
  assert.ok(!JSON.stringify(retry.calls).includes(publicFixture));
});

test('unavailable storage fails without guessing memoryfs or a fake standard type', async () => {
  for (const getVolumeOpts of [undefined, response({ list: [] }),
    response({ list: [{ volume_type: 'memoryfs' }] }), new Error('opaque-response-sentinel')]) {
    const { api, calls } = fakeApi({ getVolumeOpts });
    const result = await runVmQuickStart({ payload: payload() }, api);
    assert.equal(result.stage, 'storage');
    assert.equal(result.error, 'quickStartStorageFailed');
    assert.equal(calls.length, 3);
  }
  const { api, calls } = fakeApi();
  const result = await runVmQuickStart({ payload: payload({ disk_volume_type: 'standard' }) }, api);
  assert.equal(result.status, 'storage-required');
  assert.equal(calls.length, 3);
});

test('configure failures preserve the created component and never request build', async () => {
  for (const configure of [undefined, { status_code: 500 }, new Error('opaque-response-sentinel')]) {
    const { api, calls } = fakeApi({ configure });
    const result = await runVmQuickStart({ payload: payload() }, api);
    assert.equal(result.error, 'quickStartConfigureFailed');
    assert.equal(result.serviceAlias, 'gr123abc');
    assert.equal(result.portConfigured, true);
    assert.equal(result.resourceConfigured, false);
    assert.equal(calls.length, 4);
  }
});

test('build failures are resumable with no credentials and do not claim running', async () => {
  for (const build of [undefined, { status_code: 500 }, new Error('opaque-response-sentinel')]) {
    const { api } = fakeApi({ build });
    const result = await runVmQuickStart({ payload: payload() }, api);
    assert.equal(result.status, 'failed');
    assert.equal(result.stage, 'build');
    assert.equal(result.error, 'quickStartBuildFailed');
    assert.equal(result.resourceConfigured, true);
    const retry = fakeApi();
    const done = await runVmQuickStart({ payload: { team_name: 'team-a' }, resume: result }, retry.api);
    assert.equal(done.status, 'submitted');
    assert.deepEqual(retry.calls.map(call => call.name), ['getPortDetail', 'build']);
    assert.equal(done.resourceConfigured, true);
    assert.ok(!JSON.stringify({ result, done }).includes('opaque-response-sentinel'));
  }
});

test('changed resources cannot reuse a prior configuration confirmation', async () => {
  const first = fakeApi({ build: undefined });
  const failed = await runVmQuickStart({ payload: payload(), }, first.api);
  const retry = fakeApi();
  const done = await runVmQuickStart({ payload: {
    team_name: 'team-a', resources: { cpu: 4, memory: 8, disk: 100 }
  }, resume: failed }, retry.api);
  assert.equal(done.status, 'submitted');
  assert.deepEqual(retry.calls.map(call => call.name), ['getPortDetail', 'getVolumeOpts', 'configure', 'build']);
  assert.equal(retry.calls[2].body.disk_cap, 100);
});

test('DVA catches unexpected helper failures and its telemetry excludes credential fields', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const vm = require('node:vm');
  const source = fs.readFileSync(path.join(__dirname, '../models/createApp.js'), 'utf8')
    .replace(/^import[\s\S]*?from '[^']+';/gm, '')
    .replace('export default', 'module.exports =');
  const tracking = [];
  const module = { exports: {} };
  const noop = () => {};
  vm.runInNewContext(source, {
    ...require('./vmLoginCredentials'),
    module,
    captureAppOperation: (...args) => tracking.push(args),
    captureMarketInstall: noop,
    runVmQuickStart: noop,
    runVmCreation: noop,
    createAppByVirtualMachine: noop,
    getPortDetail: noop,
    getVolumeOpts: noop,
    editAppCreateInfo: noop,
    buildApp: noop
  });
  let callbackResult;
  const effect = module.exports.effects.quickStartVirtualMachine({
    payload: payload(), callback: result => { callbackResult = result; }
  }, { call: () => 'injected-helper-operation' });
  assert.equal(effect.next().value, 'injected-helper-operation');
  assert.equal(effect.throw(new Error('opaque-helper-failure')).done, true);
  assert.equal(callbackResult.status, 'failed');
  assert.equal(callbackResult.error, 'quickStartInvalidRequest');
  assert.ok(!JSON.stringify({ callbackResult, tracking }).includes(publicFixture));
  assert.ok(!JSON.stringify({ callbackResult, tracking }).includes('opaque-helper-failure'));
  assert.ok(!JSON.stringify(tracking).includes('ssh_public_key'));
});

test('observers and raw response fields cannot leak credentials or reorder operations', async () => {
  const { api, calls } = fakeApi({ createVm: response({ bean: {
    service_alias: 'gr123abc', ssh_public_key: publicFixture, details: 'opaque-response-sentinel'
  } }) });
  const result = await runVmQuickStart({ payload: payload(), onProgress: () => {
    throw new Error('opaque-observer-sentinel');
  } }, api);
  assert.equal(result.status, 'submitted');
  assert.deepEqual(Object.keys(result).sort(), [
    'status', 'stage', 'serviceAlias', 'groupId', 'portConfigured',
    'resourceConfigured', 'sshRequired', 'storageOptions', 'resources', 'error'
  ].sort());
  assert.equal(calls.length, 5);
  const serialized = JSON.stringify(result);
  [publicFixture, 'opaque-response-sentinel', 'opaque-observer-sentinel', 'ssh_public_key']
    .forEach(value => assert.ok(!serialized.includes(value)));
});

test('ordinary URL, upload, and existing media all use real creation without SSH or Linux defaults', async () => {
  const sources = [
    { source_type: 'url', vm_url: 'https://images.invalid/windows.iso', arch: 'amd64', format: 'iso' },
    { source_type: 'upload', event_id: 'real-upload-event', arch: 'arm64' },
    { source_type: 'existing', asset_id: '42', image_name: 'windows-asset-original', arch: 'arm64',
      format: 'qcow2', boot_mode: 'bios', gpu_enabled: true, gpu_resources: ['vendor.example/gpu'], gpu_count: 2 }
  ];
  for (const source of sources) {
    const { api, calls } = fakeApi();
    const progress = [];
    const result = await runVmCreation({ payload: {
      team_name: 'team-a', group_id: 868, service_cname: 'normal-vm',
      resources: { cpu: 2, memory: 4, disk: 80 }, ...source,
      ssh_username: 'ubuntu', ssh_public_key: publicFixture, os_family: 'linux', os_name: ' Windows Server 2025 '
    }, onProgress: step => progress.push(step) }, api);
    assert.equal(result.status, 'submitted');
    assert.equal(result.sshRequired, false);
    assert.equal(result.portConfigured, false);
    assert.deepEqual(calls.map(call => call.name), ['createVm', 'getVolumeOpts', 'configure', 'build']);
    assert.deepEqual(progress.map(step => step.stage), ['create', 'storage', 'configure', 'build']);
    const created = calls[0].body;
    assert.equal(created.source_type, source.source_type);
    assert.equal(created.arch, source.arch);
    assert.equal(created.os_name, 'Windows Server 2025');
    ['ssh_username', 'ssh_public_key', 'os_family'].forEach(key =>
      assert.equal(Object.prototype.hasOwnProperty.call(created, key), false));
    if (source.source_type === 'url') {
      assert.equal(created.vm_url, source.vm_url);
      assert.equal(created.format, 'iso');
      assert.equal(created.boot_mode, undefined);
      assert.equal(created.event_id, undefined);
      assert.equal(created.asset_id, undefined);
      assert.match(created.image_name, /^vm-image-/);
    } else if (source.source_type === 'upload') {
      assert.equal(created.event_id, 'real-upload-event');
      assert.equal(created.vm_url, undefined);
      assert.equal(created.asset_id, undefined);
      assert.equal(created.format, undefined);
      assert.equal(created.boot_mode, undefined);
      assert.match(created.image_name, /^vm-image-/);
    } else {
      assert.equal(created.asset_id, '42');
      assert.equal(created.image_name, 'windows-asset-original');
      assert.equal(created.boot_mode, 'bios');
      assert.equal(created.gpu_count, 2);
      assert.equal(created.vm_url, undefined);
      assert.equal(created.event_id, undefined);
    }
    assert.equal(JSON.stringify(result).includes(publicFixture), false);
  }
});

test('an explicitly invalid OS is rejected before any API request while omitted legacy OS stays compatible', async () => {
  for (const osName of [undefined, null, {}, '', ' ', 'Ubuntu\n24.04', 'bad\u0000OS', 'x'.repeat(129)]) {
    const { api, calls } = fakeApi();
    const result = await runVmCreation({ payload: {
      team_name: 'team-a', group_id: 868, source_type: 'url', arch: 'amd64',
      vm_url: 'https://images.invalid/installer.iso', os_name: osName
    } }, api);
    assert.equal(result.status, 'failed');
    assert.equal(result.error, 'quickStartInvalidRequest');
    assert.equal(calls.length, 0);
  }
  const { api, calls } = fakeApi();
  const result = await runVmCreation({ payload: {
    team_name: 'team-a', group_id: 868, source_type: 'url', arch: 'amd64',
    vm_url: 'https://images.invalid/installer.iso'
  } }, api);
  assert.equal(result.status, 'submitted');
  assert.equal(Object.hasOwn(calls[0].body, 'os_name'), false);
});

test('uploaded ISO media keeps its actual format despite a neutral import asset name', async () => {
  const { api, calls } = fakeApi();
  const result = await runVmCreation({ payload: {
    team_name: 'team-a', group_id: 868, source_type: 'upload', event_id: 'real-upload-event',
    arch: 'amd64', format: inferVmSourceFormat('Windows-server.ISO')
  } }, api);
  assert.equal(result.status, 'submitted');
  const creation = calls[0].body;
  assert.match(creation.image_name, /^vm-image-/);
  assert.equal(creation.format, 'iso');
  assert.equal(creation.os_family, undefined);
  assert.equal(creation.boot_mode, undefined);
  assert.deepEqual(calls.map(call => call.name), ['createVm', 'getVolumeOpts', 'configure', 'build']);
  const url = fakeApi();
  await runVmCreation({ payload: {
    team_name: 'team-a', group_id: 868, source_type: 'url',
    vm_url: 'https://images.invalid/install.iso?download=1', arch: 'amd64'
  } }, url.api);
  assert.equal(url.calls[0].body.format, 'iso');
});

test('uploaded img media sends its generic disk hint without guessing QCOW2 or raw', async () => {
  const { api, calls } = fakeApi();
  const result = await runVmCreation({ payload: {
    team_name: 'team-a', group_id: 868, source_type: 'upload', event_id: 'real-img-upload-event',
    arch: 'amd64', format: inferVmSourceFormat('uploaded-system.img')
  } }, api);
  assert.equal(result.status, 'submitted');
  assert.equal(calls[0].body.format, 'img');
  assert.match(calls[0].body.image_name, /^vm-image-/);
  assert.equal(calls[0].body.event_id, 'real-img-upload-event');
  assert.equal(calls[0].body.vm_url, undefined);
  assert.equal(calls[0].body.os_family, undefined);
  assert.equal(calls[0].body.boot_mode, undefined);
  assert.deepEqual(calls.map(call => call.name), ['createVm', 'getVolumeOpts', 'configure', 'build']);
});

test('ordinary sources require actual arch and source IDs before any backend request', async () => {
  for (const source of [
    { source_type: 'url', vm_url: 'https://images.invalid/cloud.img' },
    { source_type: 'url', vm_url: 'not-a-url', arch: 'amd64' },
    { source_type: 'upload', arch: 'amd64' },
    { source_type: 'existing', image_name: 'asset-name', arch: 'amd64' },
    { source_type: 'existing', asset_id: '42', image_name: 'wrong display name', arch: 'amd64' },
    { source_type: 'upload', event_id: 'real-event', vm_url: 'https://images.invalid/other.img', arch: 'amd64' }
  ]) {
    const { api, calls } = fakeApi();
    const result = await runVmCreation({ payload: { team_name: 'team-a', group_id: 868, ...source } }, api);
    assert.equal(result.error, 'quickStartInvalidRequest');
    assert.equal(calls.length, 0);
  }
});

test('ordinary storage failures retain a retryable alias and do not create a second VM', async () => {
  const first = fakeApi({ getVolumeOpts: undefined });
  const failed = await runVmCreation({ payload: {
    team_name: 'team-a', group_id: 868, source_type: 'upload', event_id: 'real-upload', arch: 'amd64'
  } }, first.api);
  assert.equal(failed.status, 'failed');
  assert.equal(failed.stage, 'storage');
  assert.equal(failed.serviceAlias, 'gr123abc');
  assert.equal(failed.sshRequired, false);
  const retry = fakeApi();
  const done = await runVmCreation({ payload: { team_name: 'team-a' }, resume: failed }, retry.api);
  assert.equal(done.status, 'submitted');
  assert.deepEqual(retry.calls.map(call => call.name), ['getVolumeOpts', 'configure', 'build']);
});

test('generic creation keeps the Noble SSH requirement on fresh requests and partial retries', async () => {
  const missing = fakeApi();
  const invalid = await runVmCreation({ payload: payload({ ssh_public_key: '' }) }, missing.api);
  assert.equal(invalid.error, 'quickStartInvalidRequest');
  assert.equal(invalid.sshRequired, true);
  assert.equal(missing.calls.length, 0);
  const first = fakeApi({ getPortDetail: undefined });
  const failed = await runVmCreation({ payload: payload() }, first.api);
  assert.equal(failed.sshRequired, true);
  assert.equal(failed.portConfigured, false);
  const retry = fakeApi();
  const done = await runVmCreation({ payload: { team_name: 'team-a' }, resume: failed }, retry.api);
  assert.equal(done.status, 'submitted');
  assert.equal(done.sshRequired, true);
  assert.deepEqual(retry.calls.map(call => call.name), ['getPortDetail', 'getVolumeOpts', 'configure', 'build']);
});

test('the general DVA effect calls the real pipeline and emits only its safe result', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const vm = require('node:vm');
  const source = fs.readFileSync(path.join(__dirname, '../models/createApp.js'), 'utf8')
    .replace(/^import[\s\S]*?from '[^']+';/gm, '').replace('export default', 'module.exports =');
  const module = { exports: {} };
  const noop = () => {};
  const generalRunner = () => {};
  vm.runInNewContext(source, {
    ...require('./vmLoginCredentials'),
    module, captureAppOperation: noop, captureMarketInstall: noop,
    runVmQuickStart: noop, runVmCreation: generalRunner,
    createAppByVirtualMachine: noop, getPortDetail: noop, getVolumeOpts: noop,
    editAppCreateInfo: noop, buildApp: noop
  });
  const actions = [];
  let callbackResult;
  const effect = module.exports.effects.createVirtualMachineWorkflow({
    payload: { team_name: 'team-a', source_type: 'upload', event_id: 'real-event' },
    callback: result => { callbackResult = result; }
  }, {
    call: (runner, options, api) => ({ runner, options, api }),
    put: action => { actions.push(action); }
  });
  const operation = effect.next().value;
  assert.equal(operation.runner, generalRunner);
  assert.equal(operation.options.payload.event_id, 'real-event');
  assert.deepEqual(Object.keys(operation.api).sort(), ['createVm', 'getPortDetail', 'getVolumeOpts', 'configure', 'build'].sort());
  const safe = { status: 'submitted', serviceAlias: 'gr123abc', sshRequired: false };
  assert.equal(effect.next(safe).done, true);
  assert.equal(callbackResult, safe);
  assert.deepEqual(actions, []);
});

function workflowModelWithServices(services) {
  const fs = require('node:fs');
  const path = require('node:path');
  const vm = require('node:vm');
  const source = fs.readFileSync(path.join(__dirname, '../models/createApp.js'), 'utf8')
    .replace(/^import[\s\S]*?from '[^']+';/gm, '').replace('export default', 'module.exports =');
  const module = { exports: {} };
  vm.runInNewContext(source, {
    ...require('./vmLoginCredentials'),
    module, captureAppOperation: () => {}, captureMarketInstall: () => {},
    runVmQuickStart, runVmCreation,
    createAppByVirtualMachine: services.createVm,
    getPortDetail: services.getPortDetail,
    getVolumeOpts: services.getVolumeOpts,
    editAppCreateInfo: services.configure,
    buildApp: services.build
  });
  return module.exports;
}

test('leaving scope during an in-flight create prevents every later request and stale UI update', async () => {
  for (const creationPayload of [payload(), {
    team_name: 'team-a', group_id: 868, source_type: 'upload', event_id: 'real-event', arch: 'amd64'
  }]) {
    let active = true;
    let resolveCreate;
    const fake = fakeApi({ createVm: () => new Promise(resolve => { resolveCreate = resolve; }) });
    const model = workflowModelWithServices(fake.api);
    const progress = [];
    const callbacks = [];
    const effect = model.effects.createVirtualMachineWorkflow({
      payload: creationPayload, isActive: () => active,
      onProgress: step => progress.push(step), callback: result => callbacks.push(result)
    }, { call: (runner, options, api) => ({ runner, options, api }) });
    const operation = effect.next().value;
    const inFlight = operation.runner(operation.options, operation.api);
    assert.deepEqual(fake.calls.map(call => call.name), ['createVm']);
    active = false;
    resolveCreate(response({ bean: { service_alias: 'gr123abc' } }));
    const result = await inFlight;
    assert.equal(effect.next(result).done, true);
    assert.equal(result.serviceAlias, 'gr123abc', 'an already-created component is not retracted');
    assert.deepEqual(fake.calls.map(call => call.name), ['createVm']);
    assert.deepEqual(progress.map(step => step.stage), ['create']);
    assert.equal(callbacks.length, 0);
  }
});

test('all VM workflow adapters guard inactive scope with a fixed cancellation error', async () => {
  let active = true;
  const fake = fakeApi();
  const model = workflowModelWithServices(fake.api);
  const effect = model.effects.createVirtualMachineWorkflow({
    payload: payload(), isActive: () => active
  }, { call: (runner, options, api) => ({ runner, options, api }) });
  const operation = effect.next().value;
  active = false;
  Object.values(operation.api).forEach(invoke => {
    assert.throws(() => invoke({}), error => error.name === 'VmCreationCancelled' &&
      error.message === 'VM creation cancelled' && !error.response && !error.config);
  });
  assert.equal(fake.calls.length, 0);
});

test('VM workflow callers without an activity guard retain the existing serial behavior', async () => {
  const fake = fakeApi();
  const model = workflowModelWithServices(fake.api);
  let callbackResult;
  const effect = model.effects.createVirtualMachineWorkflow({
    payload: payload(), callback: result => { callbackResult = result; }
  }, { call: (runner, options, api) => ({ runner, options, api }) });
  const operation = effect.next().value;
  const result = await operation.runner(operation.options, operation.api);
  assert.equal(effect.next(result).done, true);
  assert.equal(callbackResult.status, 'submitted');
  assert.deepEqual(fake.calls.map(call => call.name), ['createVm', 'getPortDetail', 'getVolumeOpts', 'configure', 'build']);
});
