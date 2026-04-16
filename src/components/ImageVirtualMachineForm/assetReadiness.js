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

const hasVMExportManifest = extra => {
  const manifest = (extra || {}).machine_manifest || {};
  return Array.isArray(manifest.disks) && manifest.disks.length > 0;
};

const isVMAssetSelectable = asset => {
  if (!asset) {
    return false;
  }
  if (asset.source_type === 'vm_export') {
    const extra = parseVMAssetExtra(asset);
    return Boolean(
      asset.status === 'ready' &&
      extra.storage_status === 'ready' &&
      hasVMExportManifest(extra)
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
