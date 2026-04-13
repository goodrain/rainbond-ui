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
      network_mode: 'random',
      network_name: undefined,
      fixed_ip: undefined,
      gateway: undefined,
      dns_servers: undefined
    }
  }),
  {
    network_mode: 'fixed',
    network_name: 'rbd-plugins/bridge-test',
    fixed_ip: '172.16.20.230/24',
    gateway: '172.16.20.1',
    dns_servers: '114.114.114.114,8.8.8.8'
  },
  'should preserve user-edited fixed IP settings when selecting a VM asset'
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
      os_family: 'windows',
      network_mode: 'random',
      network_name: undefined,
      fixed_ip: undefined
    }
  }),
  {
    os_family: 'windows',
    network_mode: 'random',
    network_name: undefined,
    fixed_ip: undefined
  },
  'should use asset defaults when the user has not touched runtime network fields'
);

assert.deepStrictEqual(
  normalizeAssetRuntimeSnapshot({
    asset: {
      source_type: 'vm_export'
    },
    runtimeSnapshot: {
      os_family: 'windows',
      network_mode: 'fixed',
      network_name: 'rbd-plugins/bridge-test',
      fixed_ip: '172.16.20.230/24',
      gateway: '172.16.20.1',
      dns_servers: '114.114.114.114,8.8.8.8',
      boot_mode: 'uefi'
    }
  }),
  {
    os_family: 'windows',
    network_mode: 'random',
    network_name: undefined,
    fixed_ip: undefined,
    gateway: undefined,
    dns_servers: undefined,
    boot_mode: 'uefi'
  },
  'should clear fixed network defaults when using an exported VM asset'
);

assert.deepStrictEqual(
  normalizeAssetRuntimeSnapshot({
    asset: {
      source_type: 'upload'
    },
    runtimeSnapshot: {
      network_mode: 'fixed',
      network_name: 'rbd-plugins/bridge-test',
      fixed_ip: '172.16.20.230/24'
    }
  }),
  {
    network_mode: 'fixed',
    network_name: 'rbd-plugins/bridge-test',
    fixed_ip: '172.16.20.230/24'
  },
  'should preserve fixed network defaults for non-exported assets'
);

console.log('vm runtime field merge tests passed');
