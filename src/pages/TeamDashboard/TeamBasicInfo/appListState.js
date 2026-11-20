export function normalizeAppListQuery(query) {
  return String(query || '').trim();
}

export function shouldShowFirstDeployGuide({
  appListLoading,
  appListLoaded,
  isAppList,
  appListQuery,
  appListTotal
}) {
  return !appListLoading && appListLoaded && isAppList && !appListQuery && appListTotal === 0;
}

export function shouldLoadFirstDeployMarket(appListTotal, query) {
  return appListTotal === 0 && !normalizeAppListQuery(query);
}
