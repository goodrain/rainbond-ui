function normalizeList(value) {
  return Array.isArray(value) ? value : [];
}

function getTeamRegions(teamInfo, team) {
  const teamInfoRegions = teamInfo && teamInfo.region;
  if (Array.isArray(teamInfoRegions)) {
    return teamInfoRegions;
  }
  return normalizeList(team && team.region);
}

module.exports = {
  getTeamRegions,
  normalizeList
};
