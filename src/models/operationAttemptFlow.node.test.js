const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const parser = require('@babel/parser');
const generate = require('@babel/generator').default;

const root = path.join(__dirname, '..');
const createModelPath = path.join(__dirname, 'createApp.js');
const applicationModelPath = path.join(__dirname, 'application.js');
const createServicePath = path.join(root, 'services/createApp.js');
const appServicePath = path.join(root, 'services/app.js');
const applicationServicePath = path.join(root, 'services/application.js');
const operationAttemptPath = path.join(root, 'utils/operationAttempt.js');

function parse(filename) {
  return parser.parse(fs.readFileSync(filename, 'utf8'), {
    sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties', 'optionalChaining']
  }).program;
}

function declaration(program, name) {
  const node = program.body.find(item => item.type === 'FunctionDeclaration' && item.id.name === name);
  assert.ok(node, `${name} should exist`);
  return node;
}

function effect(program, name) {
  const model = program.body.find(item => item.type === 'ExportDefaultDeclaration').declaration;
  const node = model.properties.find(item => item.key.name === 'effects').value.properties.find(item => item.key.name === name);
  assert.ok(node, `${name} effect should exist`);
  return node;
}

function loadAttempts(storage) {
  const source = fs.readFileSync(operationAttemptPath, 'utf8').replace(/export function /g, 'function ');
  const code = `${source}\nmodule.exports = { startServiceAttempt, bindServiceAttempt, getServiceAttempt, clearServiceAttempt, startComposeAttempt, bindComposeAttempt, getComposeAttempt, clearComposeAttempt, createAttemptId, createRequestTelemetryOptions, getDeployType };`;
  const context = {
    module: { exports: {} },
    exports: {},
    window: { sessionStorage: {
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key)
    } },
    crypto: { getRandomValues: (() => { let value = 0; return values => values.fill(++value); })() }
  };
  vm.runInNewContext(code, context, { filename: operationAttemptPath });
  return context.module.exports;
}

function loadService(filename, name, request, attempts) {
  const program = parse(filename);
  const helper = program.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'getAttemptHeaders');
  const vmPasswordHelper = program.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'vmPasswordFieldsAtHttpBoundary');
  const node = program.body.find(item => item.type === 'ExportNamedDeclaration' && item.declaration && item.declaration.id.name === name).declaration;
  assert.ok(node, `${name} service should exist`);
  return new Function('request', 'apiconfig', 'buildAttemptHeaders', 'getServiceAttempt', 'getComposeAttempt', 'VM_LOGIN_METHODS', 'assertNoVmPasswordPayload', 'safeVmCredentialError', 'getVmPasswordUsernameError', 'getVmLoginPasswordError', 'normalizeVmLoginGroupId', 'isLinuxQcow2QuickStart', 'globalUtil', 'requestVmCreationStorage',
    `${helper ? generate(helper).code : ''}\n${vmPasswordHelper ? generate(vmPasswordHelper).code : ''}\n${generate(node).code}\nreturn ${name};`)(
    request, { baseUrl: '' },
    attemptId => attemptId ? { 'X-Rainbond-Attempt-Id': attemptId } : undefined,
    attempts.getServiceAttempt, attempts.getComposeAttempt,
    ['password'], () => {}, () => new Error('VM error'), () => '', () => '', () => 'group', () => true,
    { getCurrTeamName: () => 'team', getCurrRegionName: () => 'region' }, () => Promise.resolve({})
  );
}

function loadCreateEffect(name, dependencies, attempts, events) {
  const program = parse(createModelPath);
  const helpers = ['buildCreateAppProperties', 'getOperationDeployType', 'trackCreateStarted', 'trackCreateSucceeded', 'trackCreateFailed', 'isRequestFailure']
    .map(helper => generate(declaration(program, helper)).code).join('\n');
  const names = ['captureAppOperation', 'startServiceAttempt', 'bindServiceAttempt', 'startComposeAttempt', 'bindComposeAttempt', 'clearServiceAttempt', 'createAttemptId', 'createRequestTelemetryOptions', 'getDeployType', 'assertNoVmPasswordPayload', 'safeVmCredentialError', ...Object.keys(dependencies)];
  return new Function(...names, `${helpers}\nreturn ({${generate(effect(program, name)).code}}).${name};`)(
    (...args) => events.push(args),
    attempts.startServiceAttempt,
    attempts.bindServiceAttempt,
    attempts.startComposeAttempt,
    attempts.bindComposeAttempt,
    attempts.clearServiceAttempt,
    attempts.createAttemptId,
    attempts.createRequestTelemetryOptions,
    attempts.getDeployType,
    () => {}, () => new Error('VM error'),
    ...Object.values(dependencies)
  );
}

function loadVmWorkflowEffect(dependencies, attempts, events) {
  const program = parse(createModelPath);
  const helpers = ['buildCreateAppProperties', 'getOperationDeployType', 'trackCreateStarted', 'trackCreateSucceeded', 'trackCreateFailed', 'isRequestFailure', 'runVirtualMachineWorkflow']
    .map(helper => generate(declaration(program, helper)).code).join('\n');
  const names = ['captureAppOperation', 'startServiceAttempt', 'bindServiceAttempt', 'clearServiceAttempt', 'createRequestTelemetryOptions', 'getDeployType', 'assertNoVmPasswordPayload', 'safeVmCredentialError', 'runVmCreation', ...Object.keys(dependencies)];
  return new Function(...names, `${helpers}\nreturn ({${generate(effect(program, 'createVirtualMachineWorkflow')).code}}).createVirtualMachineWorkflow;`)(
    (...args) => events.push(args),
    attempts.startServiceAttempt,
    attempts.bindServiceAttempt,
    attempts.clearServiceAttempt,
    attempts.createRequestTelemetryOptions,
    attempts.getDeployType,
    () => {},
    () => new Error('VM error'),
    require('../utils/vmQuickStart').runVmCreation,
    ...Object.values(dependencies)
  );
}

function loadComposeBuildEffect(buildCompose, attempts) {
  const program = parse(applicationModelPath);
  return new Function('buildCompose', 'clearComposeAttempt', `return ({${generate(effect(program, 'buildCompose')).code}}).buildCompose;`)(buildCompose, attempts.clearComposeAttempt);
}

async function complete(iterator) {
  const call = iterator.next().value;
  const response = await call[0](...call.slice(1));
  iterator.next(response);
  return response;
}

function requestHeaders(calls, suffix) {
  const matching = calls.filter(item => item.url.endsWith(suffix));
  assert.ok(matching.length, `request  should be issued`);
  return matching.map(item => item.options.headers && item.options.headers['X-Rainbond-Attempt-Id']);
}

function expectedHeader(calls, suffix) {
  return requestHeaders(calls, suffix)[0];
}

test('source, image, VM, OAuth, and package creates bind generated aliases through check and build until build finishes', async () => {
  for (const [effectName, createServiceName, createSuffix] of [
    ['createAppByCode', 'createAppByCode', '/apps/source_code'],
    ['createAppByDockerrun', 'createAppByDockerrun', '/apps/docker_run'],
    ['createAppByVirtualMachine', 'createAppByVirtualMachine', '/apps/vm_run'],
    ['createThirtAppByCode', 'createThirtAppByCodes', '/apps/source_code'],
    ['createJarWarFormSubmit', 'createJarWarFormSubmit', '/apps/package_build']
  ]) {
    const storage = new Map();
    const attempts = loadAttempts(storage);
    const calls = [];
    const request = (url, options) => {
      calls.push({ url, options });
      if (url.endsWith(createSuffix)) return Promise.resolve({ bean: { service_alias: 'gr12ab34' } });
      return Promise.resolve({ status_code: 200 });
    };
    const create = loadService(createServicePath, createServiceName, request, attempts);
    const check = loadService(createServicePath, 'getCreateCheckId', request, attempts);
    const checkResult = loadService(createServicePath, 'getCreateCheckResult', request, attempts);
    const build = loadService(createServicePath, 'buildApp', request, attempts);
    const events = [];
    const createEffect = loadCreateEffect(effectName, { [createServiceName]: create }, attempts, events);
    await complete(createEffect({ payload: { team_name: 'team', k8s_component_name: 'my-api' } }, { call: (...args) => args }));
    await check({ team_name: 'team', app_alias: 'gr12ab34' });
    await checkResult({ team_name: 'team', app_alias: 'gr12ab34', check_uuid: 'check' });
    const buildEffect = loadCreateEffect('buildApps', { buildApp: build }, attempts, events);
    await complete(buildEffect({ payload: { team_name: 'team', app_alias: 'gr12ab34' } }, { call: (...args) => args }));

    const attemptId = events[0][2].attempt_id;
    assert.equal(expectedHeader(calls, createSuffix), attemptId);
    assert.deepEqual(requestHeaders(calls, '/apps/gr12ab34/check'), [attemptId, attemptId]);
    assert.equal(expectedHeader(calls, '/apps/gr12ab34/build'), attemptId);
    assert.equal(attempts.getServiceAttempt({ team_name: 'team', app_alias: 'gr12ab34' }), null);
  }
});

test('VM workflow binds one attempt through vm_run, volume options, check update, and build', async () => {
  const storage = new Map();
  const attempts = loadAttempts(storage);
  const calls = [];
  const request = (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/apps/vm_run')) return Promise.resolve({ status_code: 200, bean: { service_alias: 'gr12ab34' } });
    if (url.endsWith('/volume-opts')) return Promise.resolve({ status_code: 200, list: [{ volume_type: 'rbd' }] });
    return Promise.resolve({ status_code: 200 });
  };
  const dependencies = {
    createAppByVirtualMachine: loadService(createServicePath, 'createAppByVirtualMachine', request, attempts),
    getPortDetail: loadService(appServicePath, 'getPortDetail', request, attempts),
    getVolumeOpts: loadService(appServicePath, 'getVolumeOpts', request, attempts),
    editAppCreateInfo: loadService(appServicePath, 'editAppCreateInfo', request, attempts),
    buildApp: loadService(createServicePath, 'buildApp', request, attempts)
  };
  const events = [];
  const workflow = loadVmWorkflowEffect(dependencies, attempts, events);
  const iterator = workflow({ payload: {
    team_name: 'team', group_id: 1, service_cname: 'vm', k8s_component_name: 'vm',
    source_type: 'upload', event_id: 'upload-event', arch: 'amd64', disk_volume_type: 'rbd'
  } }, { call: (...args) => args });
  const call = iterator.next().value;
  const result = await call[0](...call.slice(1));
  assert.equal(iterator.next(result).done, true);
  assert.equal(result.status, 'submitted', result.error);

  const attemptId = events[0][2].attempt_id;
  assert.equal(events[1][2].attempt_id, attemptId);
  assert.equal(expectedHeader(calls, '/apps/vm_run'), attemptId);
  assert.equal(expectedHeader(calls, '/volume-opts'), attemptId);
  assert.equal(expectedHeader(calls, '/check_update'), attemptId);
  assert.equal(expectedHeader(calls, '/apps/gr12ab34/build'), attemptId);
  assert.equal(attempts.getServiceAttempt({ team_name: 'team', app_alias: 'gr12ab34' }), null);
});

test('compose create response binds group and compose IDs through check and compose build', async () => {
  const storage = new Map();
  const attempts = loadAttempts(storage);
  const calls = [];
  const request = (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/apps/docker_compose')) return Promise.resolve({ bean: { group_id: 'group', compose_id: 'compose-1' } });
    return Promise.resolve({ status_code: 200 });
  };
  const create = loadService(createServicePath, 'createAppByCompose', request, attempts);
  const check = loadService(createServicePath, 'getCreateComposeCheckInfo', request, attempts);
  const checkResult = loadService(createServicePath, 'getCreateComposeCheckResult', request, attempts);
  const build = loadService(applicationServicePath, 'buildCompose', request, attempts);
  const events = [];
  const createEffect = loadCreateEffect('createAppByCompose', { createAppByCompose: create }, attempts, events);
  await complete(createEffect({ payload: { team_name: 'team', k8s_component_name: 'compose-name' } }, { call: (...args) => args }));
  await check({ team_name: 'team', group_id: 'group', compose_id: 'compose-1' });
  await checkResult({ team_name: 'team', group_id: 'group', compose_id: 'compose-1', check_uuid: 'check' });
  const buildEffect = loadComposeBuildEffect(build, attempts);
  await complete(buildEffect({ payload: { team_name: 'team', group_id: 'group', compose_id: 'compose-1' } }, { call: (...args) => args }));

  const attemptId = events[0][2].attempt_id;
  assert.deepEqual(requestHeaders(calls, '/groups/group/check'), [attemptId, attemptId]);
  assert.equal(expectedHeader(calls, '/groups/group/compose_build'), attemptId);
  assert.equal(attempts.getComposeAttempt({ team_name: 'team', group_id: 'group', compose_id: 'compose-1' }), null);
});

test('first deployment success is marked as frontend and does not emit meaningful_active', () => {
  const posthogPath = path.join(root, 'posthog.js');
  const program = parse(posthogPath);
  const exported = program.body.find(item => item.type === 'ExportNamedDeclaration' && item.declaration && item.declaration.id.name === 'captureFirstAppDeploySuccess').declaration;
  assert.ok(exported, 'captureFirstAppDeploySuccess should exist');
  const captured = [];
  const captureFirstAppDeploySuccess = new Function('capturePostHogEvent', 'getCurrentRouteProperties', 'buildContextProperties',
    `${generate(exported).code}\nreturn captureFirstAppDeploySuccess;`)(
    (...args) => captured.push(args),
    properties => properties,
    properties => properties
  );
  captureFirstAppDeploySuccess({ deploy_type: 'source_code', attempt_id: 'attempt' });
  assert.deepEqual(captured, [[
    'first_app_deploy_success',
    { deploy_type: 'source_code', attempt_id: 'attempt', action_type: 'first_app_deploy', source: 'frontend' }
  ]]);
  assert.equal(captured.some(([eventName]) => eventName === 'meaningful_active'), false);
});
