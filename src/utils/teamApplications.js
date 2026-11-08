// Shared workspace identity, quota conversion and team/application row mapping.
function identity(user) {
  if (!user || !user.enterprise_id || user.user_id == null) throw new Error('workspace.unavailable');
  return { enterprise: String(user.enterprise_id), applicant: String(user.user_id) };
}

function requestedQuota(quota) {
  if (!quota || ['cpu_millicores', 'memory_mib', 'storage_gib'].some(key =>
    !Number.isSafeInteger(quota[key]) || quota[key] <= 0)) throw new Error('workspace.invalidQuota');
  return { cpu_millicores: quota.cpu_millicores, memory_mib: quota.memory_mib, storage_gib: quota.storage_gib };
}

function quotaToFields(quota) {
  if (!quota) return {};
  return { cpu_cores: quota.cpu_millicores == null ? undefined : quota.cpu_millicores / 1000,
    memory_gb: quota.memory_mib == null ? undefined : quota.memory_mib / 1024,
    storage_gb: quota.storage_gib };
}

function quotaFromFields(fields) {
  if (['cpu_cores', 'memory_gb', 'storage_gb'].some(key =>
    typeof fields[key] !== 'number' || !Number.isFinite(fields[key]) || fields[key] <= 0)) throw new Error('workspace.invalidQuota');
  return requestedQuota({ cpu_millicores: Math.round(fields.cpu_cores * 1000),
    memory_mib: Math.round(fields.memory_gb * 1024), storage_gib: fields.storage_gb });
}

function workspaceLanding(user) {
  if (!user) return null;
  const team = (user.teams || []).find(item => item.team_name && (item.region || []).some(region => region.team_region_name));
  if (team) return `/team/${encodeURIComponent(team.team_name)}/region/${encodeURIComponent(team.region.find(region => region.team_region_name).team_region_name)}/index`;
  if (user.is_enterprise_admin && user.enterprise_id) return `/enterprise/${encodeURIComponent(user.enterprise_id)}/index`;
  return '/account/center/teams';
}

function workspaceRows(teams, applications) {
  const linked = new Set();
  const joined = teams.map(team => {
    const application = applications.find(row => {
      if (row.status !== 'approved') return false;
      const teamId = team.team_id || team.tenant_id;
      if (row.team_id && teamId) return String(row.team_id) === String(teamId);
      if (row.team_name && team.team_name) return row.team_name === team.team_name;
      return !!(row.namespace && team.namespace && row.namespace === team.namespace &&
        teams.filter(candidate => candidate.namespace === row.namespace).length === 1);
    });
    if (application) linked.add(application.id);
    return {
      id: `team:${team.team_id || team.team_name}`, team_alias: team.team_alias || team.team_name,
      region_labels: (team.region || []).map(region => region.team_region_alias || region.team_region_name),
      submitted_at: application ? application.submitted_at : team.create_time || team.created_at,
      status: 'joined', team, application
    };
  });
  return [...joined, ...applications.filter(row => !linked.has(row.id)).map(application => ({
    ...application, id: `application:${application.id}`, application
  }))];
}

module.exports = { identity, workspaceLanding, workspaceRows, requestedQuota,
  quotaToFields, quotaFromFields };
