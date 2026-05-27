function resolvePluginRegionName(options = {}) {
  const { currRegionName, queryRegionName, routeRegionId } = options;
  return currRegionName || queryRegionName || routeRegionId || '';
}

module.exports = {
  resolvePluginRegionName
};
