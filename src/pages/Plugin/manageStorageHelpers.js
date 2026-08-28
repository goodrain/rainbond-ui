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

function buildStorageOption(values = {}, data = {}) {
  const volumeName =
    values.volume_name || data.volume_name || data.config_name || '';
  const attrType = values.volume_type || data.attr_type || 'storage';

  return {
    ID: data.ID || '',
    attr_alt_value: data.attr_alt_value || '',
    attr_default_value: JSON.stringify({
      volume_path: values.volume_path || '',
      file_content: values.file_content || '',
      attr_type: attrType,
      volume_name: volumeName
    }),
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
    return {
      ...item,
      volume_path: value.volume_path || '',
      attr_type: value.attr_type || item.attr_type || '',
      config_name: value.volume_name || ''
    };
  });

  return {
    config: list.filter(item => item.injection !== PLUGIN_STORAGE),
    storageListData,
    listData: list
  };
}

function buildStorageSavePayload({
  values,
  data,
  isEditor = false,
  storageListData,
  listData
}) {
  const storageList = Array.isArray(storageListData) ? storageListData : [];
  const payload = buildStoragePayloadBase(listData);

  if (isEditor && data) {
    payload.options = storageList.map(item =>
      item.ID === data.ID
        ? buildStorageOption(values, data)
        : sanitizeStorageOption(item)
    );
    return payload;
  }

  if (storageList.length > 0) {
    payload.modify_type = true;
  }
  payload.options = [buildStorageOption(values, data)];
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
  return {
    ...data,
    volume_name: value.volume_name || data.config_name || '',
    volume_path: value.volume_path || data.volume_path || '',
    attr_type: value.attr_type || data.attr_type || '',
    file_content: value.file_content || ''
  };
}

module.exports = {
  buildStorageDeletePayload,
  buildStorageSavePayload,
  partitionPluginVersionConfig,
  toStorageEditorData
};
