const assert = require('assert');
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const appControlPath = path.join(__dirname, 'models/appControl.js');
const createAppPath = path.join(__dirname, 'models/createApp.js');
const posthogPath = path.join(__dirname, 'posthog.js');
const {
  buildPostHogGroupSignature,
  shouldUpdatePostHogGroup
} = require('./posthogConfig');

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

function hasCall(node, calleeName) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === calleeName) {
    return true;
  }
  return Object.keys(node).some(key => {
    const value = node[key];
    if (Array.isArray(value)) return value.some(item => hasCall(item, calleeName));
    return value && typeof value === 'object' && hasCall(value, calleeName);
  });
}

function getEffects(file) {
  const ast = parse(file);
  const defaultExport = ast.program.body.find(statement => statement.type === 'ExportDefaultDeclaration');
  return findObjectProperty(defaultExport.declaration, 'effects').value.properties;
}

function assertStartedOperationsTrackFailures() {
  const appControlOperations = getEffects(appControlPath).filter(effect => hasCall(effect.body, 'captureAppOperation'));
  assert.ok(appControlOperations.length > 0, 'appControl should have tracked operations');
  appControlOperations.forEach(effect => {
    assert.ok(
      hasCall(effect.body, 'trackOperationFailed'),
      `appControl/${propertyName(effect)} should capture app_operation_failed`
    );
  });

  const createAppOperations = getEffects(createAppPath).filter(effect => hasCall(effect.body, 'trackCreateStarted'));
  assert.ok(createAppOperations.length > 0, 'createApp should have tracked operations');
  createAppOperations.forEach(effect => {
    assert.ok(
      hasCall(effect.body, 'trackCreateFailed'),
      `createApp/${propertyName(effect)} should capture app_operation_failed`
    );
  });
}

function assertPostHogGroupsUpdateOnlyWhenChanged() {
  const group = {
    enterpriseIdHash: 'enterprise_hash',
    enterpriseProperties: { instance_id: 'instance_hash', team_count: 1 }
  };
  assert.strictEqual(shouldUpdatePostHogGroup('', group), true);
  assert.strictEqual(shouldUpdatePostHogGroup(buildPostHogGroupSignature(group), group), false);
  assert.strictEqual(
    shouldUpdatePostHogGroup(
      buildPostHogGroupSignature(group),
      {
        enterpriseIdHash: group.enterpriseIdHash,
        enterpriseProperties: { team_count: 1, instance_id: 'instance_hash' }
      }
    ),
    false,
    'property key order should not trigger another group update'
  );
  assert.strictEqual(
    shouldUpdatePostHogGroup(buildPostHogGroupSignature(group), {
      ...group,
      enterpriseProperties: { ...group.enterpriseProperties, team_count: 2 }
    }),
    true
  );
  assert.ok(
    fs.readFileSync(posthogPath, 'utf8').includes('rainbond_posthog_group_signature:'),
    'posthog group signatures should be persisted in sessionStorage'
  );
  assert.strictEqual(
    (fs.readFileSync(posthogPath, 'utf8').match(/shouldUpdateStoredPostHogGroup\(/g) || []).length,
    3,
    'instance and enterprise groups should both use the persisted change guard'
  );
}

try {
  assertStartedOperationsTrackFailures();
  assertPostHogGroupsUpdateOnlyWhenChanged();
  console.log('PostHog operation and group telemetry tests passed');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
