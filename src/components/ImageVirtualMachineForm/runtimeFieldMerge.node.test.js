const assert = require('assert');
const { mergeRuntimeFormValues, normalizeAssetRuntimeSnapshot } = require('./runtimeFieldMerge');

const touchedForm = {
  isFieldTouched(field) {
    return ['network_mode', 'network_name', 'fixed_ip', 'gateway', 'dns_servers'].includes(field);
  }
};

assert.deepStrictEqual(
  mergeRuntimeFormValues({
    form: touchedForm,
    currentValues: {
      network_mode: 'fixed',
      network_name: 'rbd-plugins/bridge-test',
      fixed_ip: '172.16.20.230/24',
      gateway: '172.16.20.1',
      dns_servers: '114.114.114.114,8.8.8.8'
    },
    incomingValues: {
      boot_mode: 'uefi'
    }
  }),
  {
    boot_mode: 'uefi'
  },
  'should ignore removed VM network fields when selecting a VM asset'
);

const untouchedForm = {
  isFieldTouched() {
    return false;
  }
};

assert.deepStrictEqual(
  mergeRuntimeFormValues({
    form: untouchedForm,
    currentValues: {
      network_mode: 'fixed'
    },
    incomingValues: {
      boot_mode: 'uefi'
    }
  }),
  {
    boot_mode: 'uefi'
  },
  'should pass through remaining asset runtime fields'
);

assert.deepStrictEqual(
  normalizeAssetRuntimeSnapshot({
    runtimeSnapshot: {
      boot_mode: 'uefi'
    }
  }),
  {
    boot_mode: 'uefi'
  },
  'should preserve runtime snapshot values as-is'
);

console.log('vm runtime field merge tests passed');
