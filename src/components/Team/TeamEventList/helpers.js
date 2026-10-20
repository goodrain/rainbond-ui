function normalizeRouteValue(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
}

function buildTeamEventTarget(teamName, regionName, event) {
  if (!event || event.target !== 'service') {
    return null;
  }
  const appID = normalizeRouteValue(event.app_id);
  const serviceAlias = normalizeRouteValue(event.service_alias);
  if (!teamName || !regionName || !appID || appID === '-1' || !serviceAlias) {
    return null;
  }
  return `/team/${encodeURIComponent(teamName)}/region/${encodeURIComponent(regionName)}/apps/${encodeURIComponent(appID)}/overview?type=components&componentID=${encodeURIComponent(serviceAlias)}&tab=overview`;
}

function getTeamEventServiceLabel(event) {
  if (!event) {
    return '';
  }
  return event.service_name || event.service_alias || event.message || '';
}

function shouldLoadTeamStorage({ billingInstalled, canViewOverview, overview } = {}) {
  return Boolean(billingInstalled && canViewOverview && overview && overview.region_health && overview.team_id);
}

function isTeamOverviewResponse(response) {
  return Boolean(response && (!response.status_code || response.status_code === 200) &&
    response.bean && typeof response.bean === 'object' && !Array.isArray(response.bean));
}

function getTeamOverviewData(snapshot, scope) {
  return snapshot && snapshot.scope === scope && snapshot.status === 'success' &&
    isTeamOverviewResponse(snapshot.response) ? snapshot.response.bean : null;
}

module.exports = {
  buildTeamEventTarget,
  getTeamEventServiceLabel,
  shouldLoadTeamStorage,
  isTeamOverviewResponse,
  getTeamOverviewData,
};
