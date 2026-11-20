const GROUP_ID = /^[1-9]\d*$/;
const SCOPE_NAME = /^[A-Za-z0-9_-]+$/;

function normalizeVmTargetGroupId(value) {
  if (!['string', 'number'].includes(typeof value)) return '';
  const text = String(value);
  return GROUP_ID.test(text) && Number.isSafeInteger(Number(text)) ? text : '';
}

function vmEntryQuery(location = {}) {
  return { ...Object.fromEntries(new URLSearchParams(location.search || '')), ...(location.query || {}) };
}

function requestedVmTargetGroup(props = {}, currentApplication) {
  const query = vmEntryQuery(props.location);
  return normalizeVmTargetGroupId(props.groupId) || normalizeVmTargetGroupId(query.group_id) ||
    normalizeVmTargetGroupId(currentApplication);
}

function vmCreationEntryDestination(scope, groupId, sourceType) {
  const target = normalizeVmTargetGroupId(groupId);
  if (!target || !scope || !SCOPE_NAME.test(scope.team || '') || !SCOPE_NAME.test(scope.region || '')) return null;
  return {
    pathname: `/team/${scope.team}/region/${scope.region}/apps/${target}/overview`,
    query: { type: 'vm-create', ...(['url', 'upload', 'existing'].includes(sourceType) ? { source_type: sourceType } : {}) }
  };
}

function vmCreationTargetGroups(groups) {
  return (Array.isArray(groups) ? groups : []).filter(group =>
    group && normalizeVmTargetGroupId(group.group_id));
}

function vmCreationEntryPermissions(roleUtil, permissionData, groupId) {
  const target = normalizeVmTargetGroupId(groupId);
  let team = {}, application = {};
  try { team = roleUtil.queryPermissionsInfo(permissionData, 'team_app_create') || {}; } catch (_) { /* Unloaded permissions deny access. */ }
  if (target) {
    try { application = roleUtil.queryPermissionsInfo(permissionData, 'app_overview', `app_${target}`) || {}; } catch (_) { /* Unloaded permissions deny access. */ }
  }
  return { canCreateApplication: Boolean(team.isAccess),
    canCreateInApplication: Boolean(target && application.isCreate && application.isConstruct) };
}

module.exports = { normalizeVmTargetGroupId, requestedVmTargetGroup, vmCreationEntryDestination, vmCreationTargetGroups, vmEntryQuery, vmCreationEntryPermissions };
