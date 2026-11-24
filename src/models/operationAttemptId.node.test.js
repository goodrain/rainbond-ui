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
const createAttemptId = functionNode(createModel, 'createAttemptId');
const createRequestTelemetryOptions = functionNode(createModel, 'createRequestTelemetryOptions');
const buildCreateAppProperties = functionNode(createModel, 'buildCreateAppProperties');
const trackCreateStarted = functionNode(createModel, 'trackCreateStarted');

const events = [];
const helpers = new Function(
  'REQUEST_TELEMETRY_OPTIONS',
  'captureAppOperation',
  `${generate(createAttemptId).code}\n${generate(createRequestTelemetryOptions).code}\n${generate(buildCreateAppProperties).code}\n${generate(trackCreateStarted).code}\nreturn { createAttemptId, createRequestTelemetryOptions, trackCreateStarted };`
)({ returnErrorMetadata: true }, (...args) => events.push(args));
const attemptId = helpers.createAttemptId();
assert.match(attemptId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
assert.deepEqual(helpers.createRequestTelemetryOptions(attemptId), { returnErrorMetadata: true, attemptId });
helpers.trackCreateStarted('source_code_create', { team_name: 'team' }, attemptId);
assert.equal(events[0][0], 'source_code_create');
assert.equal(events[0][1], 'started');
assert.equal(events[0][2].attempt_id, attemptId);

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

function assertServiceAttemptHeader(file, name, args) {
  const program = parse(file);
  const helper = functionNode(program, 'buildAttemptHeaders');
  const exported = program.body.find(item => item.type === 'ExportNamedDeclaration' && item.declaration && item.declaration.id.name === name).declaration;
  const calls = [];
  const service = new Function('request', 'apiconfig', `${generate(helper).code}\n${generate(exported).code}\nreturn ${name};`)(
    (url, options) => { calls.push({ url, options }); return Promise.resolve({}); }, { baseUrl: '' }
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

Promise.all([
  ...createServices.map(name => assertServiceAttemptHeader(createServicePath, name, attempt => [{ team_name: 'team' }, { returnErrorMetadata: true, attemptId: attempt }])),
  ...commandCreateServices.map(name => assertServiceAttemptHeader(createServicePath, name, attempt => [{ team_name: 'team' }, undefined, { returnErrorMetadata: true, attemptId: attempt }])),
  assertServiceAttemptHeader(appServicePath, 'deploy', attempt => [{ team_name: 'team', app_alias: 'app' }, undefined, { returnErrorMetadata: true, attemptId: attempt }])
]).then(() => console.log('operation attempt id tests passed'));

function runDeployEffect(response, thrownError) {
  const events = [];
  const appProgram = parse(appModelPath);
  const declarations = [
    'createAttemptId', 'createRequestTelemetryOptions', 'buildAppControlProperties',
    'trackOperationSucceeded', 'trackOperationFailed', 'isRequestFailure'
  ].map(name => generate(functionNode(appProgram, name)).code).join('\n');
  const putDeploy = effectNode(appProgram, 'putDeploy');
  const execute = new Function('REQUEST_TELEMETRY_OPTIONS', 'captureAppOperation', 'captureTopologyOperation', 'deploy',
    `${declarations}\nreturn ({${generate(putDeploy).code}}).putDeploy;`)({ returnErrorMetadata: true },
    (...args) => events.push(args),
    () => () => {},
    () => {}
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
