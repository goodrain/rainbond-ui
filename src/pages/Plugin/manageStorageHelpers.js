const PLUGIN_STORAGE = 'plugin_storage';

function parseStorageValue(value) {
  if (!value) {
    return {};
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch (error) {
    return {};
  }
}

function getStorageGroup(listData) {
  const list = Array.isArray(listData) ? listData : [];
  return list.find(item => item && item.injection === PLUGIN_STORAGE);
}

function sanitizeStorageOption(option = {}) {
  return {
    ID: option.ID || '',
    attr_alt_value: option.attr_alt_value || '',
    attr_default_value: option.attr_default_value || '',
    attr_info: option.attr_info || '',
    attr_name: option.attr_name || '',
    attr_type: option.attr_type || '',
    is_change: option.is_change !== false,
    protocol: option.protocol || ''
  };
}

function normalizeVolumeCapacity(value, fallback = 10) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const capacity = Number(value);
  return Number.isFinite(capacity) ? capacity : fallback;
}

function selectVolumeAccessMode(option = {}) {
  const accessMode = option.access_mode;
  if (Array.isArray(accessMode)) {
    const modes = accessMode
      .filter(Boolean)
      .map(mode => String(mode).toUpperCase());
    if (modes.indexOf('RWX') !== -1) {
      return 'RWX';
    }
    if (modes.length > 0) {
      return modes[0];
    }
  }
  if (typeof accessMode === 'string' && accessMode.trim()) {
    return accessMode.trim().toUpperCase();
  }
  return 'RWO';
}

function buildStorageOption(values = {}, data = {}, storageType = 'storage') {
  const volumeName =
    values.volume_name || data.volume_name || data.config_name || '';
  const attrType = storageType || data.attr_type || 'storage';
  const storageValue = {
    volume_path: values.volume_path || '',
    file_content: values.file_content || '',
    attr_type: attrType,
    volume_name: volumeName
  };

  if (attrType === 'storage') {
    storageValue.volume_type =
      values.volume_type || data.volume_type || 'local-path';
    storageValue.volume_capacity = normalizeVolumeCapacity(
      values.volume_capacity !== undefined
        ? values.volume_capacity
        : data.volume_capacity
    );
    storageValue.access_mode = selectVolumeAccessMode({
      volume_type: storageValue.volume_type,
      access_mode: values.access_mode || data.access_mode
    });
  }

  return {
    ID: data.ID || '',
    attr_alt_value: data.attr_alt_value || '',
    attr_default_value: JSON.stringify(storageValue),
    attr_info: data.attr_info || '',
    attr_name: data.attr_name || `plugin_storage_${volumeName}`,
    attr_type: attrType,
    is_change: data.is_change !== false,
    protocol: data.protocol || ''
  };
}

function buildStoragePayloadBase(listData) {
  const storageGroup = getStorageGroup(listData);
  return {
    ID: (storageGroup && storageGroup.ID) || '',
    config_name: PLUGIN_STORAGE,
    injection: PLUGIN_STORAGE,
    service_meta_type: PLUGIN_STORAGE
  };
}

function partitionPluginVersionConfig(listData) {
  const list = Array.isArray(listData) ? listData : [];
  const storageGroup = getStorageGroup(list);
  const storageOptions =
    storageGroup && Array.isArray(storageGroup.options)
      ? storageGroup.options
      : [];
  const storageListData = storageOptions.map(item => {
    const value = parseStorageValue(item.attr_default_value);
    const attrType = value.attr_type || item.attr_type || 'storage';
    const storageData = {
      ...item,
      volume_path: value.volume_path || '',
      attr_type: attrType,
      config_name: value.volume_name || ''
    };
    if (attrType === 'storage') {
      storageData.volume_type = value.volume_type || 'local-path';
      storageData.volume_capacity = normalizeVolumeCapacity(
        value.volume_capacity
      );
      storageData.access_mode = selectVolumeAccessMode({
        volume_type: storageData.volume_type,
        access_mode: value.access_mode
      });
    }
    return storageData;
  });
  const configFileListData = storageListData.filter(
    item => item.attr_type === 'config-file'
  );
  const persistentStorageListData = storageListData.filter(
    item => item.attr_type !== 'config-file'
  );

  return {
    config: list.filter(item => item.injection !== PLUGIN_STORAGE),
    storageListData,
    configFileListData,
    persistentStorageListData,
    listData: list
  };
}

function buildStorageSavePayload({
  values,
  data,
  storageType,
  isEditor = false,
  storageListData,
  listData
}) {
  const storageList = Array.isArray(storageListData) ? storageListData : [];
  const payload = buildStoragePayloadBase(listData);
  const effectiveStorageType =
    storageType ||
    values.storageType ||
    values.attr_type ||
    (data && data.attr_type) ||
    'storage';

  if (isEditor && data) {
    payload.options = storageList.map(item =>
      item.ID === data.ID
        ? buildStorageOption(values, data, effectiveStorageType)
        : sanitizeStorageOption(item)
    );
    return payload;
  }

  if (storageList.length > 0) {
    payload.modify_type = true;
  }
  payload.options = [buildStorageOption(values, data, effectiveStorageType)];
  return payload;
}

function buildStorageDeletePayload({ target, storageListData, listData }) {
  const storageList = Array.isArray(storageListData) ? storageListData : [];
  const payload = buildStoragePayloadBase(listData);
  payload.options = storageList
    .filter(item => !target || item.ID !== target.ID)
    .map(sanitizeStorageOption);
  if (payload.options.length === 0) {
    payload.modify_type = true;
  }
  return payload;
}

function toStorageEditorData(data = {}) {
  const value = parseStorageValue(data.attr_default_value);
  const attrType = value.attr_type || data.attr_type || 'storage';
  const editorData = {
    ...data,
    volume_name: value.volume_name || data.config_name || '',
    volume_path: value.volume_path || data.volume_path || '',
    attr_type: attrType,
    file_content: value.file_content || ''
  };
  if (attrType === 'storage') {
    editorData.volume_type = value.volume_type || data.volume_type || 'local-path';
    editorData.volume_capacity = normalizeVolumeCapacity(
      value.volume_capacity !== undefined
        ? value.volume_capacity
        : data.volume_capacity
    );
    editorData.access_mode = selectVolumeAccessMode({
      volume_type: editorData.volume_type,
      access_mode: value.access_mode || data.access_mode
    });
  }
  return editorData;
}

module.exports = {
  buildStorageDeletePayload,
  buildStorageSavePayload,
  partitionPluginVersionConfig,
  selectVolumeAccessMode,
  toStorageEditorData
};
