const assert = require('assert');
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const modelPath = path.join(__dirname, 'appControl.js');
const servicePath = path.join(__dirname, '../services/app.js');

function parse(file) {
  return parser.parse(fs.readFileSync(file, 'utf8'), {
    sourceType: 'module',
    plugins: ['jsx', 'decorators-legacy']
  });
}

function propertyName(property) {
  if (!property || property.computed) return undefined;
  return property.key.type === 'Identifier' ? property.key.name : property.key.value;
}

function findObjectProperty(objectExpression, name) {
  return objectExpression.properties.find(property => propertyName(property) === name);
}

function assertModelForwardsHandleError() {
  const ast = parse(modelPath);
  const defaultExport = ast.program.body.find(
    statement => statement.type === 'ExportDefaultDeclaration'
  );
  const effects = findObjectProperty(defaultExport.declaration, 'effects');
  const createServiceEffect = findObjectProperty(effects.value, 'createService');
  const actionFields = createServiceEffect.params[0].properties.map(propertyName);
  assert.ok(
    actionFields.includes('handleError'),
    'appControl/createService should accept the caller error callback'
  );

  const serviceCall = createServiceEffect.body.body
    .map(statement => statement.type === 'VariableDeclaration' && statement.declarations[0].init)
    .find(expression => expression && expression.type === 'YieldExpression')
    .argument;
  assert.strictEqual(serviceCall.arguments[2].name, 'handleError');
}

function assertServiceForwardsHandleError() {
  const source = fs.readFileSync(servicePath, 'utf8');
  const ast = parse(servicePath);
  const declaration = ast.program.body.find(
    statement =>
      statement.type === 'ExportNamedDeclaration' &&
      statement.declaration &&
      statement.declaration.id &&
      statement.declaration.id.name === 'createService'
  ).declaration;
  const requestCalls = [];
  const createService = new Function(
    'request',
    'apiconfig',
    `${source.slice(declaration.start, declaration.end)}\nreturn createService;`
  )((url, options) => {
    requestCalls.push({ url, options });
    return Promise.resolve({});
  }, { baseUrl: '/api' });
  const handleError = () => {};

  return createService({
    team_name: 'team-1',
    app_alias: 'component-1',
    service_infos: [{ cname: 'api' }]
  }, handleError).then(() => {
    assert.strictEqual(requestCalls.length, 1);
    assert.strictEqual(requestCalls[0].options.handleError, handleError);
  });
}

Promise.resolve()
  .then(assertModelForwardsHandleError)
  .then(assertServiceForwardsHandleError)
  .then(() => console.log('multi component creation error contract tests passed'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
