const parseVMAssetExtra = asset => {
  if (!asset) {
    return {};
  }
  if (asset.extra && typeof asset.extra === 'object') {
    return asset.extra;
  }
  if (typeof asset.extra_json !== 'string' || !asset.extra_json) {
    return {};
  }
  try {
    const parsed = JSON.parse(asset.extra_json);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
};

const getVMExportDisks = extra => {
  return Array.isArray((extra || {}).disks) ? extra.disks : [];
};

const isVMAssetSelectable = asset => {
  if (!asset) {
    return false;
  }
  if (asset.source_type === 'vm_export') {
    const extra = parseVMAssetExtra(asset);
    const disks = getVMExportDisks(extra);
    const rootReady = disks.some(
      disk => disk && disk.disk_role === 'root' && disk.download_url
    );
    const allReady = disks.length > 0 && disks.every(disk => disk && disk.download_url);
    return Boolean(
      asset.status === 'ready' &&
      rootReady &&
      allReady
    );
  }
  return Boolean(asset.status === 'ready' && asset.image_url);
};

const getSelectableVMAssets = assets => {
  return (assets || []).filter(isVMAssetSelectable);
};

module.exports = {
  getSelectableVMAssets,
  isVMAssetSelectable,
  parseVMAssetExtra
};
