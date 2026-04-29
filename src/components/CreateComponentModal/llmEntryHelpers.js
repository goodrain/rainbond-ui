function normalizeLlmModelStatus(status) {
  return String(status || '').toLowerCase();
}

function getReadyLlmModels(models = []) {
  return (models || []).filter((item) => normalizeLlmModelStatus(item && item.status) === 'ready');
}

function getLlmModelParameterScale(model = {}) {
  const candidates = [
    model.parameters,
    model.display_name,
    model.model_source,
    model.source_uri,
    model.model_id,
  ];

  for (let index = 0; index < candidates.length; index += 1) {
    const match = String(candidates[index] || '').match(/(\d+(?:\.\d+)?)\s*b\b/i);
    if (match) return `${match[1]}B`;
  }

  return '';
}

function findExistingLlmAssetForCatalog(model, teamModels = []) {
  const sourceURI = model && (model.model_source || model.source_uri || '');
  return (
    (teamModels || []).find((item) => {
      if (!item || !model) return false;
      if (sourceURI && item.source_uri === sourceURI) return true;
      if (model.model_id && item.model_id === model.model_id) return true;
      return !!(model.display_name && item.display_name === model.display_name);
    }) || null
  );
}

function buildLlmCatalogDownloadPayload(model = {}) {
  return {
    model_id: model.model_id || '',
    display_name: model.display_name || model.model_id || '',
    source_type: 'modelscope',
    source_uri: model.model_source || model.source_uri || '',
    engine_type: model.default_engine || 'vLLM',
    parameters: getLlmModelParameterScale(model),
  };
}

function buildLlmAssetDownloadPayload(asset = {}) {
  return {
    model_id: asset.model_id || '',
    display_name: asset.display_name || asset.model_id || asset.model_key || '',
    source_type: String(asset.source_type || 'modelscope').toLowerCase(),
    source_uri: asset.source_uri || '',
    engine_type: asset.engine_type || 'vLLM',
    parameters: asset.parameters || '',
  };
}

function buildLlmRepositoryEntries(catalogModels = [], teamModels = []) {
  const catalogEntries = (catalogModels || [])
    .filter((model) => model && model.model_id)
    .map((model) => ({
      type: 'catalog',
      key: `catalog-${model.model_id}`,
      model,
      asset: findExistingLlmAssetForCatalog(model, teamModels),
    }));

  const assetEntries = (teamModels || [])
    .filter((asset) => {
      if (!asset) return false;
      return !catalogEntries.some((entry) => entry.asset === asset);
    })
    .map((asset) => ({
      type: 'asset',
      key: asset.model_key || asset.model_id || asset.display_name,
      asset,
    }));

  return catalogEntries.concat(assetEntries);
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
  const navigation = {
    pathname: `/team/${teamName}/region/${regionName}/plugins/${pluginName}`,
  };

  if (modelKey) {
    navigation.query = {
      autoOpenModelDrawer: 'true',
      modelKey,
    };
  }

  return navigation;
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
  buildLlmAssetDownloadPayload,
  buildLlmCatalogDownloadPayload,
  buildLlmPluginNavigation,
  buildLlmRepositoryEntries,
  findExistingLlmAssetForCatalog,
  getLlmPluginFromList,
  getLlmModelParameterScale,
  getReadyLlmModels,
  normalizeLlmModelStatus,
  resolveCurrentTeamNamespace,
};
