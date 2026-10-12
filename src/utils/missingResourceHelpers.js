function errorData(error) {
  return (error && error.data) || (error && error.response && error.response.data) || {};
}

function isMissingResourceError(error) {
  const data = errorData(error);
  const status = Number(
    (error && error.status) ||
    (error && error.response && error.response.status) ||
    data.code ||
    0
  );
  const message = String(data.msg_show || data.msg || '').toLowerCase();
  return status === 404 || message.includes('不存在') || message.includes('not found');
}

function getFallbackRoute(currentUser, excludedTeamName = '') {
  const teams = currentUser && Array.isArray(currentUser.teams) ? currentUser.teams : [];
  for (const team of teams) {
    if (team && team.team_name === excludedTeamName) {
      continue;
    }
    const regions = team && Array.isArray(team.region) ? team.region : [];
    const region = regions.find(item => item && item.team_region_name);
    if (team && team.team_name && region) {
      return `/team/${team.team_name}/region/${region.team_region_name}/index`;
    }
  }
  if (currentUser && currentUser.is_enterprise_admin && currentUser.enterprise_id) {
    return `/enterprise/${currentUser.enterprise_id}/index`;
  }
  return '/';
}

module.exports = {
  getFallbackRoute,
  isMissingResourceError,
};
