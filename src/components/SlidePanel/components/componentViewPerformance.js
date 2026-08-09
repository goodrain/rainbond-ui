const { getPluginBaseId } = require('../../../utils/pluginArchUtils');

const NON_UPDATABLE_STATUSES = [
  'undeploy',
  'closed',
  'stopping',
  'succeeded'
];

function getGroupDetailIdentity(groupDetail = {}) {
  const identity = [
    groupDetail.group_id,
    groupDetail.ID,
    groupDetail.id,
    groupDetail.app_id
  ].find(value => value !== undefined && value !== null && value !== '');

  return identity === undefined || identity === null ? '' : String(identity);
}

function canReuseGroupDetail(groupDetail = {}, groupId) {
  if (groupId === undefined || groupId === null || groupId === '') {
    return false;
  }

  return getGroupDetailIdentity(groupDetail) === String(groupId);
}

function shouldLoadStorageUsage(pluginsList = []) {
  return (pluginsList || []).some(
    plugin => getPluginBaseId(plugin && plugin.name) === 'rainbond-bill'
  );
}

function canUpdateComponent(hasUpdatePermission, status = {}) {
  return Boolean(hasUpdatePermission) &&
    !NON_UPDATABLE_STATUSES.includes(status && status.status);
}

module.exports = {
  canReuseGroupDetail,
  canUpdateComponent,
  getGroupDetailIdentity,
  shouldLoadStorageUsage
};
