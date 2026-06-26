const assert = require('assert');
const { getInstanceDisplayStatus } = require('./instanceStatusHelpers');

assert.strictEqual(
  getInstanceDisplayStatus('UNHEALTHY'),
  'checking',
  'should display health-check unhealthy pods as checking in the instance list'
);

assert.strictEqual(
  getInstanceDisplayStatus('RUNNING'),
  'RUNNING',
  'should keep normal running pods unchanged'
);

assert.strictEqual(
  getInstanceDisplayStatus('ABNORMAL'),
  'ABNORMAL',
  'should keep real abnormal pods unchanged'
);

console.log('instance status helper tests passed');
