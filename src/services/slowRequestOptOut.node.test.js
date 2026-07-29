const assert = require('assert');
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

function parseService(fileName) {
  const filePath = path.join(__dirname, fileName);
  return parser.parse(fs.readFileSync(filePath, 'utf8'), {
    sourceType: 'module'
  });
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

function findRequestOptions(functionNode) {
  const requestOptions = [];

  function visit(node) {
    if (!node || typeof node !== 'object') {
      return;
    }
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      node.callee.name === 'request'
    ) {
      assert.strictEqual(
        node.arguments.length >= 2,
        true,
        'request call must include an options argument'
      );
      assert.strictEqual(
        node.arguments[1].type,
        'ObjectExpression',
        'request options must be an object literal'
      );
      requestOptions.push(node.arguments[1]);
      return;
    }

    Object.keys(node).forEach(key => {
      if (key === 'loc' || key === 'start' || key === 'end') {
        return;
      }
      const value = node[key];
      if (Array.isArray(value)) {
        value.forEach(visit);
      } else {
        visit(value);
      }
    });
  }

  visit(functionNode.body);
  assert.strictEqual(
    requestOptions.length,
    1,
    `${functionNode.id.name} must contain exactly one request call`
  );
  return requestOptions[0];
}

function exportedFunctions(ast) {
  const functions = {};

  ast.program.body.forEach(statement => {
    if (
      statement.type !== 'ExportNamedDeclaration' ||
      !statement.declaration ||
      statement.declaration.type !== 'FunctionDeclaration'
    ) {
      return;
    }

    const declaration = statement.declaration;
    functions[declaration.id.name] = declaration;
  });

  return functions;
}

function getOption(options, name) {
  return options.properties.find(property => propertyName(property) === name);
}

function requestOptionsFor(functions, functionName) {
  const functionNode = functions[functionName];
  assert.ok(functionNode, `${functionName} must be an exported function`);
  return findRequestOptions(functionNode);
}

function assertOptedOut(functions, functionName) {
  const options = requestOptionsFor(functions, functionName);
  const optOut = getOption(options, 'skipSlowRequestTelemetry');
  assert.ok(optOut, `${functionName} must opt out of slow request telemetry`);
  assert.strictEqual(optOut.type, 'ObjectProperty');
  assert.strictEqual(optOut.value.type, 'BooleanLiteral');
  assert.strictEqual(optOut.value.value, true);
}

function assertEligible(functions, functionName) {
  const options = requestOptionsFor(functions, functionName);
  assert.strictEqual(
    getOption(options, 'skipSlowRequestTelemetry'),
    undefined,
    `${functionName} must remain eligible for slow request telemetry`
  );
}

function hasOptOutProperty(functionNode) {
  let found = false;

  function visit(node) {
    if (!node || typeof node !== 'object' || found) {
      return;
    }
    if (
      node.type === 'ObjectProperty' &&
      propertyName(node) === 'skipSlowRequestTelemetry'
    ) {
      found = true;
      return;
    }
    Object.keys(node).forEach(key => {
      const value = node[key];
      if (Array.isArray(value)) {
        value.forEach(visit);
      } else {
        visit(value);
      }
    });
  }

  visit(functionNode.body);
  return found;
}

function optedOutFunctions(functions) {
  return Object.keys(functions)
    .filter(name => hasOptOutProperty(functions[name]))
    .sort();
}

const aiEngineFunctions = exportedFunctions(parseService('aiEngine.js'));
const createAppFunctions = exportedFunctions(parseService('createApp.js'));

assertOptedOut(aiEngineFunctions, 'uploadTeamLlmArtifact');
assertOptedOut(createAppFunctions, 'uploadChunk');

assertEligible(aiEngineFunctions, 'createTeamLlmDownload');
[
  'initChunkUpload',
  'completeChunkUpload',
  'getChunkUploadStatus',
  'cancelChunkUpload'
].forEach(name => assertEligible(createAppFunctions, name));

assert.deepStrictEqual(optedOutFunctions(aiEngineFunctions), [
  'uploadTeamLlmArtifact'
]);
assert.deepStrictEqual(optedOutFunctions(createAppFunctions), ['uploadChunk']);

console.log('ok - upload transfers opt out and control requests remain eligible');
