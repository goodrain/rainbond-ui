const { getPluginBaseId } = require('./pluginArchUtils');

// Only an enabled alias owned by this base installation proves the feature is bundled.
function isBundledDiskCleanup(plugin, plugins) {
  if (!plugin || getPluginBaseId(plugin.name) !== 'rainbond-disk'
    || plugin.enable_status !== 'true' || !plugin.region_app_id) return false;
  return (plugins || []).some(base => getPluginBaseId(base.name) === 'rainbond-enterprise-base'
    && base.enable_status === 'true' && base.region_app_id === plugin.region_app_id && base.namespace === plugin.namespace);
}

function bundledDiskCleanupRegions(pluginList) {
  return Object.keys(pluginList || {}).filter(region =>
    (pluginList[region] || []).some(plugin => isBundledDiskCleanup(plugin, pluginList[region])));
}

module.exports = { isBundledDiskCleanup, bundledDiskCleanupRegions };
