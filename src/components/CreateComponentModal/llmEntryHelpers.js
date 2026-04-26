function normalizeLlmModelStatus(status) {
  return String(status || '').toLowerCase();
}

function getReadyLlmModels(models = []) {
  return (models || []).filter((item) => normalizeLlmModelStatus(item && item.status) === 'ready');
}

function resolveCurrentTeamNamespace(currentUser = {}, teamName = '') {
  const teams = currentUser && Array.isArray(currentUser.teams) ? currentUser.teams : [];
  const matchedTeam = teams.find((item) => item && item.team_name === teamName);
  return (matchedTeam && matchedTeam.namespace) || '';
}

function buildLlmPluginNavigation({
  pluginName = 'rainbond-ai-engine',
  teamName = '',
  regionName = '',
  modelKey = '',
}) {
  return {
    pathname: `/team/${teamName}/region/${regionName}/plugins/${pluginName}`,
    query: {
      autoOpenModelDrawer: 'true',
      modelKey,
    },
  };
}

function getLlmPluginFromList(list = []) {
  const plugins = list || [];
  return (
    plugins.find((plugin) => plugin && plugin.name === 'rainbond-ai-engine') ||
    plugins.find((plugin) => {
      const pluginLabels = [plugin && plugin.name, plugin && plugin.alias, plugin && plugin.display_name];
      return pluginLabels.some((label) => typeof label === 'string' && /(llm|大模型)/i.test(label));
    }) ||
    null
  );
}

module.exports = {
  buildLlmPluginNavigation,
  getLlmPluginFromList,
  getReadyLlmModels,
  normalizeLlmModelStatus,
  resolveCurrentTeamNamespace,
};
