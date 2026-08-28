const assert = require('assert');

const {
  STORAGE_NAME_ERROR_INVALID,
  STORAGE_NAME_ERROR_TOO_LONG,
  hasDuplicateStorageName,
  hasDuplicateStoragePath,
  validatePluginStorageName
} = require('./storageConfigHelpers');

const storageList = [
  {
    ID: 1,
    attr_name: 'plugin_storage_cache',
    config_name: 'cache',
    volume_name: 'cache',
    volume_path: '/cache'
  },
  {
    ID: 2,
    attr_name: 'plugin_storage_config',
    config_name: 'config',
    volume_name: 'config',
    volume_path: '/etc/agent/config.yaml'
  }
];

assert.strictEqual(validatePluginStorageName('cache'), null);
assert.strictEqual(validatePluginStorageName('agent-cache-1'), null);
assert.strictEqual(validatePluginStorageName('a'.repeat(23)), null);
assert.strictEqual(
  validatePluginStorageName('Agent'),
  STORAGE_NAME_ERROR_INVALID,
  'uppercase storage names should be rejected'
);
assert.strictEqual(
  validatePluginStorageName('agent_cache'),
  STORAGE_NAME_ERROR_INVALID,
  'underscores should be rejected'
);
assert.strictEqual(validatePluginStorageName('-agent'), STORAGE_NAME_ERROR_INVALID);
assert.strictEqual(validatePluginStorageName('agent-'), STORAGE_NAME_ERROR_INVALID);
assert.strictEqual(
  validatePluginStorageName('a'.repeat(24)),
  STORAGE_NAME_ERROR_TOO_LONG,
  'the generated Kubernetes volume name must stay within 63 characters'
);

assert.strictEqual(hasDuplicateStorageName(storageList, null, 'cache'), true);
assert.strictEqual(hasDuplicateStorageName(storageList, null, 'new-cache'), false);
assert.strictEqual(
  hasDuplicateStorageName(storageList, storageList[0], 'cache'),
  false,
  'editing a storage item should not conflict with itself'
);

assert.strictEqual(hasDuplicateStoragePath(storageList, null, '/cache'), true);
assert.strictEqual(hasDuplicateStoragePath(storageList, null, '/new-cache'), false);
assert.strictEqual(
  hasDuplicateStoragePath(storageList, storageList[0], '/cache'),
  false,
  'editing a storage item should not conflict with itself'
);
assert.strictEqual(
  hasDuplicateStoragePath(
    storageList,
    { attr_name: 'plugin_storage_cache' },
    '/cache'
  ),
  false,
  'attr_name should identify the current item when an ID is unavailable'
);

console.log('storage config helper tests passed');
