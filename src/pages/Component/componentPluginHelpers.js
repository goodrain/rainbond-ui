function shouldShowComponentPluginTab(plugin = {}, appDetail = {}) {
  const service = (appDetail && appDetail.service) || {};

  if (!plugin || !plugin.name) {
    return false;
  }

  if (plugin.name === 'rainbond-vm') {
    return service.extend_method === 'vm';
  }

  if (plugin.name === 'rainbond-sourcescan') {
    return service.service_source === 'source_code';
  }

  return true;
}

function getVisibleComponentPlugins(pluginList = [], appDetail = {}) {
  return (pluginList || []).filter(plugin =>
    shouldShowComponentPluginTab(plugin, appDetail)
  );
}

module.exports = {
  getVisibleComponentPlugins,
  shouldShowComponentPluginTab
};
