const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const parser = require('@babel/parser');
const {
  fetchVmCreationStorage,
  normalizeVmCreationStorageOptions,
  requestVmCreationStorage
} = require('./vmCreationStorage');
const { runVmCreation } = require('./vmQuickStart');

const scope = { team_name: 'team-a', region_name: 'region-a' };
const success = fields => ({ status_code: 200, business_code: 200, ...fields });
const persistent = { volume_type: 'ceph-block', name_show: 'Persistent block' };

function fakeApi(overrides = {}) {
  const calls = [];
  const defaults = {
    getCapabilities: success({ bean: { storage_options: [persistent], storage_options_error: false } }),
    getLegacyVolumeOpts: success({ list: [persistent] })
  };
  const api = Object.fromEntries(Object.keys(defaults).map(name => [name, async payload => {
    calls.push({ name, payload });
    if (!Object.prototype.hasOwnProperty.call(overrides, name)) return defaults[name];
    if (overrides[name] instanceof Error) throw overrides[name];
    return typeof overrides[name] === 'function' ? overrides[name](payload) : overrides[name];
  }]));
  return { calls, api };
}

test('capability storage options are authoritative and never call the old plugin route', async () => {
  const fake = fakeApi();
  const result = await fetchVmCreationStorage({ payload: scope }, fake.api);
  assert.deepEqual(result, {
    status: 'ready', reason: 'available', options: [{ value: 'ceph-block', label: 'Persistent block' }]
  });
  assert.deepEqual(fake.calls, [{ name: 'getCapabilities', payload: scope }]);
});

test('explicit empty options mean empty storage, not a reason to use the legacy route', async () => {
  const fake = fakeApi({ getCapabilities: success({ bean: { storage_options: [], storage_options_error: false } }) });
  assert.deepEqual(await fetchVmCreationStorage({ payload: scope }, fake.api), {
    status: 'empty', reason: 'no-persistent-storage', options: []
  });
  assert.equal(fake.calls.length, 1);
});

test('the capability error flag blocks empty and populated options without a fallback', async () => {
  for (const storage_options of [[], [persistent]]) {
    const fake = fakeApi({ getCapabilities: success({ bean: { storage_options, storage_options_error: true } }) });
    const result = await fetchVmCreationStorage({ payload: scope }, fake.api);
    assert.equal(result.status, 'failed');
    assert.equal(result.reason, 'capability-error');
    assert.equal(fake.calls.length, 1);
  }
});

test('only confirmed nonpersistent types and enable:false are filtered; results contain safe display metadata', () => {
  const options = normalizeVmCreationStorageOptions([
    null, {}, { volume_type: '' }, { volume_type: 'memoryfs' }, { volume_type: 'config-file' },
    { volume_type: 'off', enable: false }, persistent, { ...persistent, name_show: 'duplicate' },
    { volume_type: 'legacy-flags', disabled: true, is_disabled: true, ephemeral: true, name_show: 'Legacy' },
    { volume_type: 'valid-id', name_show: 'Name', token: 'RAW_STORAGE_SENTINEL', url: 'RAW_STORAGE_SENTINEL' },
    { volume_type: 'invalid type' }, { volume_type: 'https://invalid.example' }
  ]);
  assert.deepEqual(options, [
    { value: 'ceph-block', label: 'Persistent block' },
    { value: 'legacy-flags', label: 'Legacy' }, { value: 'valid-id', label: 'Name' }
  ]);
  assert.equal(JSON.stringify(options).includes('RAW_STORAGE_SENTINEL'), false);
});

test('missing storage options fall back to the existing plugin volume list for older Console', async () => {
  const fake = fakeApi({ getCapabilities: success({ bean: { gpu_supported: true } }) });
  const result = await fetchVmCreationStorage({ payload: scope }, fake.api);
  assert.equal(result.status, 'ready');
  assert.deepEqual(fake.calls.map(call => call.name), ['getCapabilities', 'getLegacyVolumeOpts']);
  assert.deepEqual(fake.calls[1].payload, scope);
});

test('only a legacy fallback HTTP 403 permits deferred storage confirmation', async () => {
  for (const rejection of [Object.assign(new Error('RAW_STORAGE_SENTINEL'), { status: 403 }), { status_code: 403 }]) {
    const fake = fakeApi({ getCapabilities: success({ bean: {} }), getLegacyVolumeOpts: rejection });
    assert.deepEqual(await fetchVmCreationStorage({ payload: scope }, fake.api), {
      status: 'deferred', reason: 'legacy-permission', options: []
    });
  }
  const forbiddenCapabilities = fakeApi({ getCapabilities: Object.assign(new Error('RAW_STORAGE_SENTINEL'), { status: 403 }) });
  assert.equal((await fetchVmCreationStorage({ payload: scope }, forbiddenCapabilities.api)).status, 'failed');
  assert.equal(forbiddenCapabilities.calls.length, 1);
});

test('failed capability reads and network or server failures block rather than defer', async () => {
  for (const getCapabilities of [undefined, { status_code: 500 }, new Error('RAW_STORAGE_SENTINEL')]) {
    const fake = fakeApi({ getCapabilities });
    const result = await fetchVmCreationStorage({ payload: scope }, fake.api);
    assert.equal(result.status, 'failed');
    assert.equal(fake.calls.length, 1);
    assert.equal(JSON.stringify(result).includes('RAW_STORAGE_SENTINEL'), false);
  }
  for (const getLegacyVolumeOpts of [undefined, { status_code: 500 }, new Error('RAW_STORAGE_SENTINEL'),
    Object.assign(new Error('RAW_STORAGE_SENTINEL'), { status: 500 })]) {
    const fake = fakeApi({ getCapabilities: success({ bean: {} }), getLegacyVolumeOpts });
    const result = await fetchVmCreationStorage({ payload: scope }, fake.api);
    assert.equal(result.status, 'failed');
    assert.equal(result.reason, 'request-failed');
  }
});

test('malformed successful data is blocked instead of treated as an empty list', async () => {
  for (const bean of [undefined, [], { storage_options: null }, { storage_options: {} }]) {
    const fake = fakeApi({ getCapabilities: success({ bean }) });
    assert.equal((await fetchVmCreationStorage({ payload: scope }, fake.api)).status, 'failed');
    assert.equal(fake.calls.length, 1);
  }
});

test('leaving the creation scope after capabilities stops the legacy request', async () => {
  let active = true;
  const fake = fakeApi({ getCapabilities: () => { active = false; return success({ bean: {} }); } });
  const result = await fetchVmCreationStorage({ payload: scope, isActive: () => active }, fake.api);
  assert.equal(result.reason, 'cancelled');
  assert.equal(fake.calls.length, 1);
  const alreadyInactive = fakeApi();
  await fetchVmCreationStorage({ payload: scope, isActive: () => false }, alreadyInactive.api);
  assert.equal(alreadyInactive.calls.length, 0);
});

function loadStorageService(file, name, request, current = scope) {
  const source = fs.readFileSync(path.join(__dirname, '../services', file), 'utf8');
  const declaration = parser.parse(source, { sourceType: 'module' }).program.body.find(node =>
    node.type === 'ExportNamedDeclaration' && node.declaration && node.declaration.id && node.declaration.id.name === name
  ).declaration;
  return new Function('request', 'apiconfig', 'globalUtil', 'requestVmCreationStorage',
    `${source.slice(declaration.start, declaration.end)}\nreturn ${name};`
  )(request, { baseUrl: '/backend' }, {
    getCurrTeamName: () => current.team_name, getCurrRegionName: () => current.region_name
  }, requestVmCreationStorage);
}

test('both storage service GETs capture only safe status metadata and explicitly scope headers', async () => {
  for (const [file, name, suffix] of [
    ['createApp.js', 'getVMCapabilities', '/vm/capabilities'],
    ['plugin.js', 'getPluginVolumeOpts', '/plugins/volume-opts']
  ]) {
    const calls = [], errors = [];
    const get = loadStorageService(file, name, (url, options) => {
      calls.push({ url, options });
      if (!options.validateStatus) return;
      options.validateStatus(403);
      options.handleError(Object.assign(new Error('RAW_STORAGE_SENTINEL'), { response: { data: 'RAW_STORAGE_SENTINEL' } }));
    });
    await get({ ...scope, creationStorageRead: true }, error => errors.push(error));
    assert.equal(calls[0].url, `/backend/console/teams/team-a${suffix}`);
    assert.equal(calls[0].options.method, 'get');
    assert.deepEqual(calls[0].options.headers, { X_REGION_NAME: 'region-a', X_TEAM_NAME: 'team-a' });
    assert.equal(calls[0].options.sensitiveError, true);
    assert.equal(calls[0].options.showMessage, false);
    assert.equal(calls[0].options.data, undefined);
    assert.equal(errors[0].status, 403);
    assert.equal(errors[0].message, 'VM storage request failed');
    assert.equal(errors[0].response, undefined);
    assert.equal(JSON.stringify(errors).includes('RAW_STORAGE_SENTINEL'), false);
    await get({ team_name: 'team-a' });
    assert.deepEqual(calls[1].options, { method: 'get' });
  }
});

test('GET services reject a changed team or region synchronously before constructing a request', async () => {
  for (const current of [{ ...scope, team_name: 'another-team' }, { ...scope, region_name: 'another-region' }]) {
    const calls = [], errors = [];
    const get = loadStorageService('createApp.js', 'getVMCapabilities', (...args) => calls.push(args), current);
    assert.equal(await get({ ...scope, creationStorageRead: true }, error => errors.push(error)), undefined);
    assert.equal(calls.length, 0);
    assert.equal(errors[0].reason, 'scope-changed');
  }
});

function storageModel(services) {
  const source = fs.readFileSync(path.join(__dirname, '../models/createApp.js'), 'utf8')
    .replace(/^import[\s\S]*?from '[^']+';/gm, '').replace('export default', 'module.exports =');
  const module = { exports: {} };
  vm.runInNewContext(source, { module, fetchVmCreationStorage,
    getVMCapabilities: services.getCapabilities, getPluginVolumeOpts: services.getLegacyVolumeOpts });
  return module.exports;
}

test('DVA returns safe results without a reducer and suppresses callbacks after scope changes', async () => {
  let active = true;
  const calls = [], callbacks = [];
  const model = storageModel({
    getCapabilities: async body => { calls.push(body); active = false; return success({ bean: {} }); },
    getLegacyVolumeOpts: async () => { throw new Error('must not call'); }
  });
  const effect = model.effects.fetchVMCreationStorage({ payload: scope, isActive: () => active,
    callback: result => callbacks.push(result) }, { call: (runner, options, api) => ({ runner, options, api }) });
  const operation = effect.next().value;
  const result = await operation.runner(operation.options, operation.api);
  assert.equal(effect.next(result).done, true);
  assert.equal(callbacks.length, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].creationStorageRead, true);
});

test('the selected precreation type must still match the actual component storage options', async () => {
  const calls = [];
  const result = await runVmCreation({ payload: {
    team_name: 'team-a', group_id: 868, source_type: 'upload', event_id: 'ready-event', arch: 'amd64', disk_volume_type: 'old-preselected'
  } }, {
    createVm: async () => success({ bean: { service_alias: 'gr123abc' } }),
    getVolumeOpts: async () => success({ list: [{ volume_type: 'old-preselected', enable: false }, persistent] }),
    configure: async () => { calls.push('configure'); }, build: async () => { calls.push('build'); }
  });
  assert.equal(result.status, 'storage-required');
  assert.deepEqual(result.storageOptions, [{ value: 'ceph-block', label: 'Persistent block' }]);
  assert.deepEqual(calls, []);
});

test('configuration retries preserve the chosen type among multiple live options without recreating a VM', async () => {
  const calls = [];
  const list = [{ volume_type: 'type-a', name_show: 'A' }, { volume_type: 'type-b', name_show: 'B' }];
  let configureOk = false;
  const api = {
    createVm: async () => { calls.push({ name: 'create' }); return success({ bean: { service_alias: 'gr123abc' } }); },
    getVolumeOpts: async () => { calls.push({ name: 'options' }); return success({ list }); },
    configure: async body => { calls.push({ name: 'configure', type: body.disk_volume_type }); return configureOk ? success({}) : undefined; },
    build: async () => { calls.push({ name: 'build' }); return success({}); }
  };
  const failed = await runVmCreation({ payload: {
    team_name: 'team-a', group_id: 868, source_type: 'upload', event_id: 'ready-event', arch: 'amd64', disk_volume_type: 'type-b'
  } }, api);
  assert.equal(failed.stage, 'configure');
  assert.equal(failed.status, 'failed');
  configureOk = true;
  calls.length = 0;
  const done = await runVmCreation({ payload: { team_name: 'team-a', disk_volume_type: 'type-b' }, resume: failed }, api);
  assert.equal(done.status, 'submitted');
  assert.deepEqual(calls, [{ name: 'options' }, { name: 'configure', type: 'type-b' }, { name: 'build' }]);
  calls.length = 0;
  const invalid = await runVmCreation({ payload: { team_name: 'team-a', disk_volume_type: 'no-longer-available' }, resume: failed }, api);
  assert.equal(invalid.status, 'storage-required');
  assert.deepEqual(calls, [{ name: 'options' }]);
});
