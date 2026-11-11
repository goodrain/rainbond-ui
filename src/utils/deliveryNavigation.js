function deliveryTargetPath(task) {
  if (!task || task.kind !== 'delivery' || !['running', 'succeeded'].includes(task.status)) return '';
  const target = task.target;
  if (!target || !target.team_name || !target.region_name || !target.app_id) return '';
  return `/team/${encodeURIComponent(target.team_name)}/region/${encodeURIComponent(target.region_name)}/apps/${encodeURIComponent(String(target.app_id))}/overview`;
}

module.exports = { deliveryTargetPath };
