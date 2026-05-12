const isVMAssetSelectable = asset => {
  if (!asset) {
    return false;
  }
  return Boolean(asset.status === 'ready' && asset.image_url);
};

const getSelectableVMAssets = assets => {
  return (assets || []).filter(isVMAssetSelectable);
};

module.exports = {
  getSelectableVMAssets,
  isVMAssetSelectable
};
