// Helpers for matching platform plugins by base id, ignoring optional
// architecture suffixes (-ARM64 / -AMD64). Keeps UI hard-coded checks
// stable whether the market/license uses base ids (rainbond-agent) or
// arch-suffixed ids (rainbond-agent-ARM64).

const ARCH_SUFFIXES = ['-ARM64', '-AMD64'];

function getPluginBaseId(pluginId) {
  if (pluginId === null || pluginId === undefined) {
    return '';
  }
  const value = String(pluginId);
  if (!value) {
    return '';
  }
  const upper = value.toUpperCase();
  for (let i = 0; i < ARCH_SUFFIXES.length; i += 1) {
    const suffix = ARCH_SUFFIXES[i];
    if (upper.endsWith(suffix)) {
      return value.slice(0, -suffix.length);
    }
  }
  return value;
}

function isPluginBaseId(plugin, baseId) {
  if (!plugin || !baseId) {
    return false;
  }
  if (getPluginBaseId(plugin.plugin_id) === baseId) {
    return true;
  }
  if (getPluginBaseId(plugin.name) === baseId) {
    return true;
  }
  return false;
}

function isInstalledPlugin(plugin, baseId) {
  if (!isPluginBaseId(plugin, baseId)) {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(plugin, 'installed')) {
    return plugin.installed === true;
  }
  return true;
}

function shouldFetchUserBalanceForPlugins(pluginsList) {
  const pluginList = Array.isArray(pluginsList) ? pluginsList : [];
  return pluginList.some(item => isInstalledPlugin(item, 'rainbond-bill'));
}

module.exports = {
  getPluginBaseId,
  isPluginBaseId,
  shouldFetchUserBalanceForPlugins
};
