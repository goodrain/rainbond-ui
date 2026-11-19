const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appServicePath = path.join(__dirname, 'app.js');
const createServicePath = path.join(__dirname, 'createApp.js');
const appModelPath = path.join(__dirname, '../models/appControl.js');
const createModelPath = path.join(__dirname, '../models/createApp.js');

const appService = fs.readFileSync(appServicePath, 'utf8');
const createService = fs.readFileSync(createServicePath, 'utf8');
const appModel = fs.readFileSync(appModelPath, 'utf8');
const createModel = fs.readFileSync(createModelPath, 'utf8');

const appServices = [
  'deploy', 'upgrade', 'updateRolling', 'restart', 'start', 'stop', 'batchOperation',
  'bindDomain', 'addInnerEnvs', 'addOuterEnvs', 'editEvns', 'addVolume', 'horizontal', 'vertical', 'newVertical'
];
const createServices = [
  'installHelmApp', 'createAppByCode', 'createThirtAppByCodes', 'createThirdPartyServices',
  'createAppByCompose', 'createAppByDockerrun', 'installHelmAppCmd', 'installRamAppCmd',
  'createAppByVirtualMachine', 'installHelmUploadApp'
];

function assertServiceOptIn(source, name) {
  const definition = source.indexOf(`function ${name}(`);
  assert.ok(definition >= 0, `${name} should be declared`);
  const nextDefinition = source.indexOf('\nexport ', definition + 1);
  const body = source.slice(definition, nextDefinition < 0 ? source.length : nextDefinition);
  assert.ok(body.includes('telemetryOptions = {}'), `${name} should default telemetry options`);
  assert.ok(
    body.includes('returnErrorMetadata: telemetryOptions.returnErrorMetadata'),
    `${name} should pass telemetry metadata only from its optional argument`
  );
  assert.ok(!body.includes('returnErrorMetadata: true'), `${name} must not opt in direct callers by default`);
}

appServices.forEach(name => assertServiceOptIn(appService, name));
createServices.forEach(name => assertServiceOptIn(createService, name));

assert.ok(appModel.includes('const REQUEST_TELEMETRY_OPTIONS = { returnErrorMetadata: true };'));
assert.ok(createModel.includes('const REQUEST_TELEMETRY_OPTIONS = { returnErrorMetadata: true };'));
assert.ok(!appModel.includes('yield call(restart, payload, handleError)'));
assert.ok(!appModel.includes('yield call(stop, payload, handleError)'));
assert.ok(!createModel.includes('yield call(createAppByCode, payload, handleError)'));

console.log('service telemetry opt-in tests passed');
