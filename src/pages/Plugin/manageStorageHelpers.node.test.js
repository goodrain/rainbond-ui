const assert = require('assert');
const {
  buildStorageDeletePayload,
  buildStorageSavePayload,
  partitionPluginVersionConfig,
  toStorageEditorData
} = require('./manageStorageHelpers');

function makeStorageOption({
  id,
  name,
  path,
  type = 'storage',
  fileContent = ''
}) {
  return {
    ID: id,
    attr_alt_value: '',
    attr_default_value: JSON.stringify({
      volume_path: path,
      file_content: fileContent,
      attr_type: type,
      volume_name: name
    }),
    attr_info: '',
    attr_name: `plugin_storage_${name}`,
    attr_type: type,
    is_change: true,
    protocol: ''
  };
}

function run(name, test) {
  test();
  console.log(`ok - ${name}`);
}

run('partitions plugin storage and derives display fields without mutation', () => {
  const normalGroup = {
    ID: 1,
    injection: 'env',
    options: []
  };
  const storageOption = makeStorageOption({
    id: 11,
    name: 'cache',
    path: '/cache'
  });
  const storageGroup = {
    ID: 2,
    injection: 'plugin_storage',
    options: [storageOption]
  };
  const list = [normalGroup, storageGroup];
  const original = JSON.parse(JSON.stringify(list));

  const result = partitionPluginVersionConfig(list);

  assert.deepStrictEqual(
    {
      config: result.config,
      storageListData: result.storageListData,
      input: list
    },
    {
      config: [normalGroup],
      storageListData: [
        {
          ...storageOption,
          volume_path: '/cache',
          config_name: 'cache'
        }
      ],
      input: original
    }
  );
});

run('normalizes empty or missing configuration lists to arrays', () => {
  assert.deepStrictEqual(
    [partitionPluginVersionConfig([]), partitionPluginVersionConfig()],
    [
      { config: [], storageListData: [], listData: [] },
      { config: [], storageListData: [], listData: [] }
    ]
  );
});

run('keeps malformed legacy storage values readable', () => {
  const result = partitionPluginVersionConfig([
    {
      ID: 2,
      injection: 'plugin_storage',
      options: [
        {
          ID: 12,
          attr_name: 'plugin_storage_legacy',
          attr_type: 'config-file',
          attr_default_value: '{invalid'
        },
        {
          ID: 13,
          attr_name: 'plugin_storage_null',
          attr_type: 'storage',
          attr_default_value: 'null'
        }
      ]
    }
  ]);

  assert.deepStrictEqual(result.storageListData, [
    {
      ID: 12,
      attr_name: 'plugin_storage_legacy',
      attr_type: 'config-file',
      attr_default_value: '{invalid',
      volume_path: '',
      config_name: ''
    },
    {
      ID: 13,
      attr_name: 'plugin_storage_null',
      attr_type: 'storage',
      attr_default_value: 'null',
      volume_path: '',
      config_name: ''
    }
  ]);
});

run('builds the first shared storage as a new plugin storage group', () => {
  const payload = buildStorageSavePayload({
    values: {
      volume_name: 'cache',
      volume_path: '/cache',
      volume_type: 'storage'
    },
    storageListData: [],
    listData: []
  });

  assert.deepStrictEqual(payload, {
    ID: '',
    config_name: 'plugin_storage',
    injection: 'plugin_storage',
    service_meta_type: 'plugin_storage',
    options: [
      makeStorageOption({ id: '', name: 'cache', path: '/cache' })
    ]
  });
});

run('appends a configuration file to an existing storage group', () => {
  const existing = makeStorageOption({
    id: 11,
    name: 'cache',
    path: '/cache'
  });
  const payload = buildStorageSavePayload({
    values: {
      volume_name: 'agent-config',
      volume_path: '/etc/agent/config.yaml',
      volume_type: 'config-file',
      file_content: 'enabled: true'
    },
    storageListData: [existing],
    listData: [
      { ID: 2, injection: 'plugin_storage', options: [existing] }
    ]
  });

  assert.deepStrictEqual(payload, {
    ID: 2,
    config_name: 'plugin_storage',
    injection: 'plugin_storage',
    service_meta_type: 'plugin_storage',
    modify_type: true,
    options: [
      makeStorageOption({
        id: '',
        name: 'agent-config',
        path: '/etc/agent/config.yaml',
        type: 'config-file',
        fileContent: 'enabled: true'
      })
    ]
  });
});

run('editing preserves the immutable storage type and other options', () => {
  const sharedStorage = makeStorageOption({
    id: 11,
    name: 'cache',
    path: '/cache'
  });
  const configFile = makeStorageOption({
    id: 12,
    name: 'agent-config',
    path: '/etc/agent/config.yaml',
    type: 'config-file',
    fileContent: 'enabled: false'
  });
  const original = JSON.parse(JSON.stringify([sharedStorage, configFile]));

  const payload = buildStorageSavePayload({
    values: {
      volume_name: 'agent-config',
      volume_path: '/etc/agent/config.yaml',
      file_content: 'enabled: true'
    },
    data: configFile,
    isEditor: true,
    storageListData: [sharedStorage, configFile],
    listData: [
      {
        ID: 2,
        injection: 'plugin_storage',
        options: [sharedStorage, configFile]
      }
    ]
  });

  assert.deepStrictEqual(
    { payload, input: [sharedStorage, configFile] },
    {
      payload: {
        ID: 2,
        config_name: 'plugin_storage',
        injection: 'plugin_storage',
        service_meta_type: 'plugin_storage',
        options: [
          sharedStorage,
          makeStorageOption({
            id: 12,
            name: 'agent-config',
            path: '/etc/agent/config.yaml',
            type: 'config-file',
            fileContent: 'enabled: true'
          })
        ]
      },
      input: original
    }
  );
});

run('deleting one of multiple entries keeps the storage group', () => {
  const first = makeStorageOption({
    id: 11,
    name: 'cache',
    path: '/cache'
  });
  const second = makeStorageOption({
    id: 12,
    name: 'data',
    path: '/data'
  });

  const payload = buildStorageDeletePayload({
    target: first,
    storageListData: [first, second],
    listData: [
      { ID: 2, injection: 'plugin_storage', options: [first, second] }
    ]
  });

  assert.deepStrictEqual(payload, {
    ID: 2,
    config_name: 'plugin_storage',
    injection: 'plugin_storage',
    service_meta_type: 'plugin_storage',
    options: [second]
  });
});

run('deleting the last entry marks the storage group for deletion', () => {
  const only = makeStorageOption({
    id: 11,
    name: 'cache',
    path: '/cache'
  });

  const payload = buildStorageDeletePayload({
    target: only,
    storageListData: [only],
    listData: [{ ID: 2, injection: 'plugin_storage', options: [only] }]
  });

  assert.deepStrictEqual(payload, {
    ID: 2,
    config_name: 'plugin_storage',
    injection: 'plugin_storage',
    service_meta_type: 'plugin_storage',
    options: [],
    modify_type: true
  });
});

run('prepares configuration file content for the edit drawer', () => {
  const configFile = makeStorageOption({
    id: 12,
    name: 'agent-config',
    path: '/etc/agent/config.yaml',
    type: 'config-file',
    fileContent: 'enabled: true'
  });

  assert.deepStrictEqual(toStorageEditorData(configFile), {
    ...configFile,
    volume_name: 'agent-config',
    volume_path: '/etc/agent/config.yaml',
    file_content: 'enabled: true'
  });
});

console.log('plugin management storage helper tests passed');
