function getEngineProfile(databaseTypes, type) {
  const addon = (databaseTypes || []).find(item => item.type === type);
  return addon && addon.profile;
}

function getScalingRules(detail) {
  const profile = detail && detail.basic && detail.basic.profile;
  const current = detail && detail.resource && detail.resource.replicas;
  const capabilities = (profile && profile.capabilities) || {};
  return {
    canScaleReplicas: capabilities.horizontal_scaling !== false,
    canExpandVolume: capabilities.volume_expansion !== false,
    replicas: profile && profile.allowed_replicas
      ? profile.allowed_replicas.filter(value => capabilities.scale_in !== false || value >= current)
      : undefined
  };
}

module.exports = { getEngineProfile, getScalingRules };
