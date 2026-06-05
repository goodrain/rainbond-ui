export function normalizeVolumeAccessModes(option = {}) {
  const accessModes = option.access_mode;
  if (Array.isArray(accessModes)) {
    return accessModes
      .map(item => `${item || ''}`.toUpperCase())
      .filter(Boolean);
  }
  if (typeof accessModes === 'string' && accessModes) {
    return [`${accessModes}`.toUpperCase()];
  }
  return [];
}

export function resolveVMStorageAccessMode(option = {}) {
  const accessModes = normalizeVolumeAccessModes(option);
  if (accessModes.includes('RWX')) {
    return 'RWX';
  }
  return accessModes[0] || '';
}

export function findVolumeOptionByType(volumeOptions = [], volumeType = '') {
  return (volumeOptions || []).find(
    option => option && option.volume_type === volumeType
  );
}
