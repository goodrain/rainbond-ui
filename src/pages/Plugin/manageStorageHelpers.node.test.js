const assert = require('assert');
const {
  buildStorageDeletePayload,
  buildStorageSavePayload,
  partitionPluginVersionConfig,
  selectVolumeAccessMode,
  toStorageEditorData
} = require('./manageStorageHelpers');

function makeStorageOption({
  id,
  name,
  path,
  type = 'storage',
  fileContent = '',
  volumeType,
  volumeCapacity,
  accessMode
}) {
  const storageValue = {
    volume_path: path,
    file_content: fileContent,
    attr_type: type,
    volume_name: name
  };
  if (volumeType !== undefined) {
    storageValue.volume_type = volumeType;
  }
  if (volumeCapacity !== undefined) {
    storageValue.volume_capacity = volumeCapacity;
  }
  if (accessMode !== undefined) {
    storageValue.access_mode = accessMode;
  }

  return {
    ID: id,
    attr_alt_value: '',
    attr_default_value: JSON.stringify(storageValue),
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
          config_name: 'cache',
          volume_type: 'local-path',
          volume_capacity: 10,
          access_mode: 'RWO'
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
      {
        config: [],
        storageListData: [],
        configFileListData: [],
        persistentStorageListData: [],
        listData: []
      },
      {
        config: [],
        storageListData: [],
        configFileListData: [],
        persistentStorageListData: [],
        listData: []
      }
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
      config_name: '',
      volume_type: 'local-path',
      volume_capacity: 10,
      access_mode: 'RWO'
    }
  ]);
});

run('serializes a persistent storage class separately from its attr type', () => {
  const payload = buildStorageSavePayload({
    storageType: 'storage',
    values: {
      volume_name: 'cache',
      volume_path: '/cache',
      volume_type: 'fast-sc',
      volume_capacity: 25,
      access_mode: 'RWX'
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
      makeStorageOption({
        id: '',
        name: 'cache',
        path: '/cache',
        volumeType: 'fast-sc',
        volumeCapacity: 25,
        accessMode: 'RWX'
      })
    ]
  });
});

run('serializes a configuration file without treating its attr type as a class', () => {
  const existing = makeStorageOption({
    id: 11,
    name: 'cache',
    path: '/cache'
  });
  const payload = buildStorageSavePayload({
    storageType: 'config-file',
    values: {
      volume_name: 'agent-config',
      volume_path: '/etc/agent/config.yaml',
      volume_type: 'config-file',
      volume_capacity: 99,
      access_mode: 'RWX',
      file_content: 'enabled: true'
    },
    storageListData: [existing],
    listData: [
      { ID: 2, injection: 'plugin_storage', options: [existing] }
    ]
  });

  const savedValue = JSON.parse(payload.options[0].attr_default_value);
  assert.strictEqual(savedValue.attr_type, 'config-file');
  assert.strictEqual(savedValue.file_content, 'enabled: true');
  ['volume_type', 'volume_capacity', 'access_mode'].forEach(field => {
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(savedValue, field),
      false,
      `configuration files must not persist ${field}`
    );
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
    storageType: 'config-file',
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

run('editing persistent storage preserves its kind and sibling options', () => {
  const persistentStorage = makeStorageOption({
    id: 31,
    name: 'cache',
    path: '/cache',
    volumeType: 'fast-sc',
    volumeCapacity: 20,
    accessMode: 'RWO'
  });
  const configFile = makeStorageOption({
    id: 32,
    name: 'agent-config',
    path: '/etc/agent/config.yaml',
    type: 'config-file',
    fileContent: 'enabled: true'
  });
  const storageListData = [persistentStorage, configFile];
  const original = JSON.parse(JSON.stringify(storageListData));

  const payload = buildStorageSavePayload({
    storageType: 'storage',
    values: {
      volume_name: 'cache',
      volume_path: '/var/cache',
      volume_type: 'fast-sc',
      volume_capacity: 25,
      access_mode: 'RWX'
    },
    data: persistentStorage,
    isEditor: true,
    storageListData,
    listData: [
      {
        ID: 2,
        injection: 'plugin_storage',
        options: storageListData
      }
    ]
  });
  const editedValue = JSON.parse(payload.options[0].attr_default_value);

  assert.deepStrictEqual(
    {
      attr_type: editedValue.attr_type,
      volume_type: editedValue.volume_type,
      volume_capacity: editedValue.volume_capacity,
      access_mode: editedValue.access_mode
    },
    {
      attr_type: 'storage',
      volume_type: 'fast-sc',
      volume_capacity: 25,
      access_mode: 'RWX'
    }
  );
  assert.deepStrictEqual(payload, {
    ID: 2,
    config_name: 'plugin_storage',
    injection: 'plugin_storage',
    service_meta_type: 'plugin_storage',
    options: [
      makeStorageOption({
        id: 31,
        name: 'cache',
        path: '/var/cache',
        volumeType: 'fast-sc',
        volumeCapacity: 25,
        accessMode: 'RWX'
      }),
      configFile
    ]
  });
  assert.deepStrictEqual(storageListData, original);
});

run('partitions configuration files and persistent storage explicitly', () => {
  const configFile = makeStorageOption({
    id: 21,
    name: 'agent-config',
    path: '/etc/agent/config.yaml',
    type: 'config-file',
    fileContent: 'enabled: true'
  });
  const persistentStorage = makeStorageOption({
    id: 22,
    name: 'cache',
    path: '/cache',
    volumeType: 'fast-sc',
    volumeCapacity: 25,
    accessMode: 'RWX'
  });

  const result = partitionPluginVersionConfig([
    {
      ID: 2,
      injection: 'plugin_storage',
      options: [configFile, persistentStorage]
    }
  ]);

  assert.deepStrictEqual(
    result.configFileListData.map(item => item.ID),
    [21]
  );
  assert.deepStrictEqual(
    result.persistentStorageListData.map(item => item.ID),
    [22]
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

run('applies compatible defaults when old persistent storage is edited', () => {
  const legacyStorage = makeStorageOption({
    id: 23,
    name: 'legacy-data',
    path: '/data'
  });
  const result = partitionPluginVersionConfig([
    {
      ID: 2,
      injection: 'plugin_storage',
      options: [legacyStorage]
    }
  ]);

  assert.deepStrictEqual(
    {
      volume_type: result.persistentStorageListData[0].volume_type,
      volume_capacity: result.persistentStorageListData[0].volume_capacity,
      access_mode: result.persistentStorageListData[0].access_mode
    },
    {
      volume_type: 'local-path',
      volume_capacity: 10,
      access_mode: 'RWO'
    }
  );
  assert.deepStrictEqual(
    {
      volume_type: toStorageEditorData(legacyStorage).volume_type,
      volume_capacity: toStorageEditorData(legacyStorage).volume_capacity,
      access_mode: toStorageEditorData(legacyStorage).access_mode
    },
    {
      volume_type: 'local-path',
      volume_capacity: 10,
      access_mode: 'RWO'
    }
  );
});

run('selects stable access modes from list and string volume options', () => {
  assert.strictEqual(
    selectVolumeAccessMode({
      volume_type: 'local-path',
      access_mode: 'RWO'
    }),
    'RWO'
  );
  assert.strictEqual(
    selectVolumeAccessMode({
      volume_type: 'fast-sc',
      access_mode: ['RWO', 'RWX']
    }),
    'RWX'
  );
});

console.log('plugin management storage helper tests passed');
