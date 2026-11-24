const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const generate = require('@babel/generator').default;

const createModelPath = path.join(__dirname, 'createApp.js');
const appModelPath = path.join(__dirname, 'appControl.js');
const createServicePath = path.join(__dirname, '../services/createApp.js');
const appServicePath = path.join(__dirname, '../services/app.js');
const applicationServicePath = path.join(__dirname, '../services/application.js');
const kubeBlocksServicePath = path.join(__dirname, '../services/kubeblocks.js');
const apiServicePath = path.join(__dirname, '../services/api.js');

function parse(file) {
  return parser.parse(fs.readFileSync(file, 'utf8'), {
    sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties', 'optionalChaining']
  }).program;
}

function functionNode(program, name) {
  const node = program.body.find(item => item.type === 'FunctionDeclaration' && item.id.name === name);
  assert.ok(node, `${name} should be declared`);
  return node;
}

function effectNode(program, name) {
  const definition = program.body.find(item => item.type === 'ExportDefaultDeclaration').declaration;
  const effects = definition.properties.find(item => item.key.name === 'effects').value.properties;
  const effect = effects.find(item => item.key.name === name);
  assert.ok(effect, `${name} effect should exist`);
  return effect;
}

function callExpressions(node, values = []) {
  if (!node || typeof node !== 'object') return values;
  if (node.type === 'CallExpression') values.push(node);
  Object.values(node).forEach(value => {
    if (Array.isArray(value)) value.forEach(item => callExpressions(item, values));
    else if (value && typeof value === 'object') callExpressions(value, values);
  });
  return values;
}

function assertEffectUsesAttempt(program, effectName, serviceName) {
  const effect = effectNode(program, effectName);
  const calls = callExpressions(effect.body);
  const serviceCall = calls.find(call => call.callee.name === 'call' && call.arguments[0].name === serviceName);
  assert.ok(serviceCall, `${effectName} should call ${serviceName}`);
  assert.equal(serviceCall.arguments[1].type, 'Identifier', `${effectName} should pass the original payload to ${serviceName}`);
  assert.equal(serviceCall.arguments[1].name, 'payload', `${effectName} should not add attempt_id to the request payload`);
  const telemetryOptions = serviceCall.arguments.find(argument => argument.type === 'CallExpression' && argument.callee.name === 'createRequestTelemetryOptions');
  assert.ok(telemetryOptions, `${effectName} should pass request options created from its attempt id`);
  assert.equal(telemetryOptions.arguments[0].name, 'attemptId', `${effectName} should reuse its started event attempt id`);
}

const createModel = parse(createModelPath);
const appModel = parse(appModelPath);
assert.match(fs.readFileSync(createModelPath, 'utf8'), /from '..\/utils\/operationAttempt'/);
assert.match(fs.readFileSync(appModelPath, 'utf8'), /from '..\/utils\/operationAttempt'/);

[
  ['installHelmApp', 'installHelmApp'],
  ['createAppByCode', 'createAppByCode'],
  ['createThirtAppByCode', 'createThirtAppByCodes'],
  ['createThirdPartyServices', 'createThirdPartyServices'],
  ['createAppByCompose', 'createAppByCompose'],
  ['createAppByDockerrun', 'createAppByDockerrun'],
  ['installHelmAppCmd', 'installHelmAppCmd'],
  ['installRamAppCmd', 'installRamAppCmd'],
  ['createAppByVirtualMachine', 'createAppByVirtualMachine'],
  ['installHelmUploadApp', 'installHelmUploadApp']
].forEach(([effectName, serviceName]) => assertEffectUsesAttempt(createModel, effectName, serviceName));
assertEffectUsesAttempt(appModel, 'putDeploy', 'deploy');

function assertServiceAttemptHeader(file, name, args, storedAttemptType) {
  const program = parse(file);
  const exported = program.body.find(item => item.type === 'ExportNamedDeclaration' && item.declaration && item.declaration.id.name === name).declaration;
  const helper = program.body.find(item => item.type === 'FunctionDeclaration' && item.id.name === 'getAttemptHeaders');
  const calls = [];
  const service = new Function('request', 'apiconfig', 'buildAttemptHeaders', 'getServiceAttempt', 'getComposeAttempt',
    `${helper ? generate(helper).code : ''}
${generate(exported).code}
return ${name};`)(
    (url, options) => { calls.push({ url, options }); return Promise.resolve({}); }, { baseUrl: '' },
    attemptId => attemptId ? { 'X-Rainbond-Attempt-Id': attemptId } : undefined, () => storedAttemptType === 'service' ? attempt : null, () => storedAttemptType === 'compose' ? attempt : null
  );
  const attempt = '123e4567-e89b-42d3-a456-426614174000';
  return Promise.resolve(service(...args(attempt))).then(() => {
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.headers['X-Rainbond-Attempt-Id'], attempt, `${name} should set the request header`);
    assert.notEqual(calls[0].options.data && calls[0].options.data.attempt_id, attempt, `${name} should not put the attempt id in the request body`);
    assert.equal(JSON.stringify(calls[0].options.data || {}).includes(attempt), false, `${name} should keep the attempt id out of the request body`);
  });
}

const createServices = [
  'createAppByCode', 'createThirtAppByCodes', 'createThirdPartyServices', 'createAppByCompose',
  'createAppByDockerrun', 'createAppByVirtualMachine', 'installHelmApp'
];
const commandCreateServices = ['installHelmAppCmd', 'installRamAppCmd', 'installHelmUploadApp'];

test('create and deploy services send attempt IDs only in headers', async () => {
  await Promise.all([
    ...createServices.map(name => assertServiceAttemptHeader(createServicePath, name, attempt => [{ team_name: 'team' }, { returnErrorMetadata: true, attemptId: attempt }])),
    ...commandCreateServices.map(name => assertServiceAttemptHeader(createServicePath, name, attempt => [{ team_name: 'team' }, undefined, { returnErrorMetadata: true, attemptId: attempt }])),
    assertServiceAttemptHeader(appServicePath, 'deploy', attempt => [{ team_name: 'team', app_alias: 'app' }, undefined, { returnErrorMetadata: true, attemptId: attempt }]),
    assertServiceAttemptHeader(createServicePath, 'installApp', attempt => [{ team_name: 'team', app_id: 'market' }, undefined, { returnErrorMetadata: true, attemptId: attempt }]),
    assertServiceAttemptHeader(createServicePath, 'getCreateCheckId', () => [{ team_name: 'team', app_alias: 'app', event_id: 'event' }], 'service'),
    assertServiceAttemptHeader(createServicePath, 'getCreateCheckResult', () => [{ team_name: 'team', app_alias: 'app', check_uuid: 'check', event_id: 'event' }], 'service'),
    assertServiceAttemptHeader(createServicePath, 'buildApp', () => [{ team_name: 'team', app_alias: 'app' }], 'service'),
    assertServiceAttemptHeader(createServicePath, 'getCreateComposeCheckInfo', () => [{ team_name: 'team', group_id: 'group', compose_id: 'compose' }], 'compose'),
    assertServiceAttemptHeader(createServicePath, 'getCreateComposeCheckResult', () => [{ team_name: 'team', group_id: 'group', compose_id: 'compose', check_uuid: 'check' }], 'compose'),
    assertServiceAttemptHeader(applicationServicePath, 'buildCompose', () => [{ team_name: 'team', group_id: 'group', compose_id: 'compose' }], 'compose'),
    assertServiceAttemptHeader(kubeBlocksServicePath, 'createDatabaseCluster', attempt => [{ team_name: 'team', config: {} }, undefined, { attemptId: attempt }]),
    assertServiceAttemptHeader(apiServicePath, 'getAppRedeploy', attempt => [{ team_name: 'team', group_id: 'group', record_id: 'record' }, undefined, { attemptId: attempt }])
  ]);
});

function runDeployEffect(response, thrownError) {
  const events = [];
  const appProgram = parse(appModelPath);
  const declarations = [
    'buildAppControlProperties', 'trackOperationSucceeded', 'trackOperationFailed', 'isRequestFailure'
  ].map(name => generate(functionNode(appProgram, name)).code).join('\n');
  const putDeploy = effectNode(appProgram, 'putDeploy');
  const execute = new Function('REQUEST_TELEMETRY_OPTIONS', 'captureAppOperation', 'captureTopologyOperation', 'deploy', 'startServiceAttempt', 'createRequestTelemetryOptions', 'getDeployType',
    `${declarations}\nreturn ({${generate(putDeploy).code}}).putDeploy;`)({ returnErrorMetadata: true },
    (...args) => events.push(args),
    () => () => {},
    () => {},
    () => '123e4567-e89b-42d3-a456-426614174000',
    attemptId => ({ returnErrorMetadata: true, attemptId }),
    () => 'other'
  );
  const iterator = execute({ payload: { team_name: 'team', app_alias: 'app' } }, { call: (...args) => args });
  const requestCall = iterator.next().value;
  if (thrownError) {
    assert.throws(() => iterator.throw(thrownError), value => value === thrownError);
  } else {
    iterator.next(response);
  }
  return { events, requestCall };
}

test('deploy started, terminal event, and request header share one attempt id', () => {
  const success = runDeployEffect({ status_code: 200, event_id: 'event' });
  const successAttempt = success.events[0][2].attempt_id;
  assert.match(successAttempt, /^[0-9a-f-]{36}$/i);
  assert.equal(success.events[1][1], 'succeeded');
  assert.equal(success.events[1][2].attempt_id, successAttempt);
  assert.equal(success.requestCall[3].attemptId, successAttempt);

  const failure = runDeployEffect(undefined, new Error('request failed'));
  const failureAttempt = failure.events[0][2].attempt_id;
  assert.equal(failure.events[1][1], 'failed');
  assert.equal(failure.events[1][2].attempt_id, failureAttempt);
  assert.equal(failure.requestCall[3].attemptId, failureAttempt);
});

function runCreateEffect(response) {
  const events = [];
  const program = parse(createModelPath);
  const declarations = ['buildCreateAppProperties', 'getOperationDeployType', 'trackCreateStarted', 'trackCreateSucceeded', 'trackCreateFailed', 'isRequestFailure']
    .map(name => generate(functionNode(program, name)).code).join('\n');
  const effect = effectNode(program, 'createAppByCode');
  const execute = new Function('captureAppOperation', 'startServiceAttempt', 'createRequestTelemetryOptions', 'getDeployType', 'createAppByCode',
    `${declarations}\nreturn ({${generate(effect).code}}).createAppByCode;`)(
    (...args) => events.push(args),
    () => '123e4567-e89b-42d3-a456-426614174000',
    attemptId => ({ returnErrorMetadata: true, attemptId }),
    () => 'source_code',
    () => {}
  );
  const iterator = execute({ payload: { team_name: 'team', service_cname: 'app' } }, { call: (...args) => args });
  const requestCall = iterator.next().value;
  iterator.next(response);
  return { events, requestCall };
}

test('create success and failure reuse the started attempt id', () => {
  const success = runCreateEffect({ status_code: 200 });
  assert.equal(success.events[0][1], 'started');
  assert.equal(success.events[1][1], 'succeeded');
  assert.equal(success.events[0][2].attempt_id, success.events[1][2].attempt_id);
  assert.equal(success.requestCall[2].attemptId, success.events[0][2].attempt_id);

  const failure = runCreateEffect({ __rainbondRequestFailure: true });
  assert.equal(failure.events[0][1], 'started');
  assert.equal(failure.events[1][1], 'failed');
  assert.equal(failure.events[0][2].attempt_id, failure.events[1][2].attempt_id);
  assert.equal(failure.requestCall[2].attemptId, failure.events[0][2].attempt_id);
});

function runMarketInstallEffect(response) {
  const events = [];
  let callbacks = 0;
  const program = parse(createModelPath);
  const declarations = ['buildCreateAppProperties', 'isRequestFailure']
    .map(name => generate(functionNode(program, name)).code).join('\n');
  const effect = effectNode(program, 'installApp');
  const execute = new Function('captureMarketInstall', 'startServiceAttempt', 'createRequestTelemetryOptions', 'getDeployType', 'installApp',
    `${declarations}\nreturn ({${generate(effect).code}}).installApp;`)(
    (...args) => events.push(args),
    () => '123e4567-e89b-42d3-a456-426614174000',
    attemptId => ({ returnErrorMetadata: true, attemptId }),
    () => 'app_market',
    () => {}
  );
  const iterator = execute({ payload: { team_name: 'team', app_id: 'market' }, callback: () => { callbacks += 1; } }, { call: (...args) => args });
  const requestCall = iterator.next().value;
  iterator.next(response);
  return { events, callbacks, requestCall };
}

test('market install failure metadata is not reported or handled as success', () => {
  const result = runMarketInstallEffect({ __rainbondRequestFailure: true, error_category: 'network_error', error_code: 'network_error' });
  assert.equal(result.events[0][0], 'started');
  assert.equal(result.events[1][0], 'failed');
  assert.equal(result.callbacks, 0);
  assert.equal(result.requestCall[3].attemptId, result.events[0][1].attempt_id);
});
