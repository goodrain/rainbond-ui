function deliveryTargetPath(task) {
  if (!task || task.kind !== 'delivery' || !['running', 'succeeded'].includes(task.status)) return '';
  const target = task.target;
  if (!target || !target.team_name || !target.region_name || !target.app_id) return '';
  return `/team/${encodeURIComponent(target.team_name)}/region/${encodeURIComponent(target.region_name)}/apps/${encodeURIComponent(String(target.app_id))}/overview`;
}

function deliveryTargetIsCached(user, task) {
  const target = task && task.target;
  return !!target && (user && user.teams || []).some(team => team.team_name === target.team_name &&
    (team.region || []).some(region => region.team_region_name === target.region_name));
}

module.exports = { deliveryTargetPath, deliveryTargetIsCached };
