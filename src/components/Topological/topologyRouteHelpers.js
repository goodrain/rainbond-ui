function buildTopologyWebConsolePath(teamName, regionName, appAlias) {
  const values = [teamName, regionName, appAlias].map(value => (
    value === undefined || value === null ? '' : String(value).trim()
  ));
  if (values.some(value => !value)) {
    return null;
  }
  return `/team/${encodeURIComponent(values[0])}/region/${encodeURIComponent(values[1])}/components/${encodeURIComponent(values[2])}/webconsole`;
}

module.exports = {
  buildTopologyWebConsolePath,
};
