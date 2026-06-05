const assert = require('assert');
const {
  getEnabledVMServiceNames,
  getServiceClusterIP
} = require('./vmNetworkHelpers');

assert.deepStrictEqual(
  getEnabledVMServiceNames([
    { is_inner_service: false, k8s_service_name: 'vm-demo' },
    { is_inner_service: true, k8s_service_name: 'vm-demo' },
    { is_inner_service: true, k8s_service_name: 'vm-demo' },
    { is_inner_service: true, k8s_service_name: '' }
  ]),
  ['vm-demo'],
  'should return unique service names only for enabled internal ports'
);

assert.deepStrictEqual(
  getEnabledVMServiceNames([
    { is_inner_service: false, k8s_service_name: 'vm-demo' }
  ]),
  [],
  'should hide cluster ip when no internal port is enabled'
);

assert.strictEqual(
  getServiceClusterIP({ spec: { clusterIP: '10.43.12.9' } }),
  '10.43.12.9',
  'should read cluster ip from service spec'
);

assert.strictEqual(
  getServiceClusterIP({ spec: { clusterIP: 'None' } }),
  '',
  'should ignore headless services'
);

console.log('vm network helper tests passed');
