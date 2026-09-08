const assert = require('assert');
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const modelPath = path.join(__dirname, 'application.js');
const servicePath = path.join(__dirname, '../services/application.js');

function loadAddGroup(request) {
  const source = fs
    .readFileSync(servicePath, 'utf8')
    .replace(
      "import apiconfig from '../../config/api.config';",
      "const apiconfig = { baseUrl: '/api' };"
    )
    .replace(
      "import request from '../utils/request';",
      'const request = global.__request;'
    )
    .replace(/export async function/g, 'async function')
    .replace(/export function/g, 'function')
    .concat('\nmodule.exports = { addGroup };\n');
  const serviceModule = { exports: {} };
  const load = new Function('global', 'module', 'exports', source);
  load({ __request: request }, serviceModule, serviceModule.exports);
  return serviceModule.exports.addGroup;
}

function propertyName(property) {
  if (!property || property.computed) {
    return undefined;
  }
  if (property.key.type === 'Identifier') {
    return property.key.name;
  }
  if (property.key.type === 'StringLiteral') {
    return property.key.value;
  }
  return undefined;
}

function findObjectProperty(objectExpression, name) {
  return objectExpression.properties.find(
    property => propertyName(property) === name
  );
}

function assertModelForwardsHandleError() {
  const ast = parser.parse(fs.readFileSync(modelPath, 'utf8'), {
    sourceType: 'module'
  });
  const defaultExport = ast.program.body.find(
    statement => statement.type === 'ExportDefaultDeclaration'
  );
  const effects = findObjectProperty(defaultExport.declaration, 'effects');
  const addGroupEffect = findObjectProperty(effects.value, 'addGroup');
  const actionFields = addGroupEffect.params[0].properties.map(propertyName);

  assert.ok(
    actionFields.includes('handleError'),
    'application/addGroup should accept the caller error callback'
  );

  const serviceCall = addGroupEffect.body.body
    .map(statement => statement.type === 'VariableDeclaration' && statement.declarations[0].init)
    .find(expression => expression && expression.type === 'YieldExpression')
    .argument;

  assert.strictEqual(serviceCall.arguments[2].name, 'handleError');
}

async function assertServiceForwardsHandleError() {
  let requestOptions;
  const addGroup = loadAddGroup((url, options) => {
    requestOptions = options;
    return Promise.resolve();
  });
  const handleError = () => {};

  await addGroup(
    {
      team_name: 'team-1',
      region_name: 'region-1',
      group_name: 'duplicate-app',
      k8s_app: 'duplicate-app'
    },
    handleError
  );

  assert.strictEqual(
    requestOptions.handleError,
    handleError,
    'addGroup service should pass the caller error callback to request'
  );
}

Promise.resolve()
  .then(assertModelForwardsHandleError)
  .then(assertServiceForwardsHandleError)
  .then(() => console.log('application add group error tests passed'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
