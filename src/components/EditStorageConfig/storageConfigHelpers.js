const STORAGE_NAME_MAX_LENGTH = 23;
const STORAGE_NAME_ERROR_INVALID = 'invalid';
const STORAGE_NAME_ERROR_TOO_LONG = 'too_long';

function validatePluginStorageName(value) {
  if (!value) {
    return null;
  }
  if (value.length > STORAGE_NAME_MAX_LENGTH) {
    return STORAGE_NAME_ERROR_TOO_LONG;
  }
  if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(value)) {
    return STORAGE_NAME_ERROR_INVALID;
  }
  return null;
}

function isSameStorage(left, right) {
  if (!left || !right) {
    return false;
  }
  if (left.ID && right.ID) {
    return String(left.ID) === String(right.ID);
  }
  if (left.attr_name && right.attr_name) {
    return left.attr_name === right.attr_name;
  }
  return left === right;
}

function hasDuplicateStorageName(storageList, currentStorage, value) {
  if (!value || !Array.isArray(storageList)) {
    return false;
  }
  return storageList.some(item => {
    if (!item || isSameStorage(item, currentStorage)) {
      return false;
    }
    return (item.config_name || item.volume_name) === value;
  });
}

function hasDuplicateStoragePath(storageList, currentStorage, value) {
  if (!value || !Array.isArray(storageList)) {
    return false;
  }
  return storageList.some(
    item =>
      item &&
      !isSameStorage(item, currentStorage) &&
      item.volume_path === value
  );
}

module.exports = {
  STORAGE_NAME_ERROR_INVALID,
  STORAGE_NAME_ERROR_TOO_LONG,
  hasDuplicateStorageName,
  hasDuplicateStoragePath,
  validatePluginStorageName
};
