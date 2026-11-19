export function getFeaturedMarketSearchName(app, architecture) {
  const searchNames = app.searchNames || {};
  return searchNames[architecture] || searchNames.default || '';
}

export function resolveFeaturedMarketApp(app, marketApps, architecture) {
  const modelKey = app.modelKeys[architecture] || app.modelKeys.default;
  if (!modelKey || (app.requiresArchitecture && !architecture)) {
    return null;
  }
  const marketApp = (marketApps || []).find(item => item.app_id === modelKey);
  const supportedArchitectures = marketApp && Array.isArray(marketApp.arch) ? marketApp.arch : [];
  if (!marketApp || (architecture && !supportedArchitectures.includes(architecture))) {
    return null;
  }
  return { ...app, modelKey, marketApp };
}
