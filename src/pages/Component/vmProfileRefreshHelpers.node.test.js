const assert = require('assert');
const { getVMProfileVncURL, shouldRefreshVMProfileForVNC } = require('./vmProfileRefreshHelpers');

const vmAppDetail = {
  service: {
    extend_method: 'vm'
  },
  vm_profile: {
    connections: {}
  }
};

assert.strictEqual(
  shouldRefreshVMProfileForVNC({
    appDetail: vmAppDetail,
    status: { status: 'running' },
    refreshing: false
  }),
  true,
  'should refresh VM detail while the VM is running but VNC URL is still missing'
);

assert.strictEqual(
  shouldRefreshVMProfileForVNC({
    appDetail: {
      ...vmAppDetail,
      vm_profile: {
        connections: {
          vnc_url: 'http://example.com/vnc'
        }
      }
    },
    status: { status: 'running' },
    refreshing: false
  }),
  false,
  'should stop refreshing once the VNC URL is present'
);

assert.strictEqual(
  shouldRefreshVMProfileForVNC({
    appDetail: vmAppDetail,
    status: { status: 'starting' },
    refreshing: false
  }),
  false,
  'should wait until the component status reaches running'
);

assert.strictEqual(
  shouldRefreshVMProfileForVNC({
    appDetail: {
      service: {
        extend_method: 'stateless'
      }
    },
    status: { status: 'running' },
    refreshing: false
  }),
  false,
  'should not refresh detail for non-VM components'
);

assert.strictEqual(
  shouldRefreshVMProfileForVNC({
    appDetail: vmAppDetail,
    status: { status: 'running' },
    refreshing: true
  }),
  false,
  'should avoid concurrent VM detail refresh requests'
);

assert.strictEqual(
  getVMProfileVncURL({
    vm_profile: {
      connections: {
        vnc_url: 'http://example.com/vnc'
      }
    }
  }),
  'http://example.com/vnc',
  'should read the nested VNC URL from app detail'
);

console.log('vm profile refresh helper tests passed');
