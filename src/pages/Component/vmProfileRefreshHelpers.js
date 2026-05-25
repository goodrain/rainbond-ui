function getVMProfileVncURL(appDetail = {}) {
  const vmProfile = appDetail && appDetail.vm_profile;
  const connections = vmProfile && vmProfile.connections;
  return (connections && connections.vnc_url) || '';
}

function shouldRefreshVMProfileForVNC({ appDetail, status, refreshing }) {
  const service = appDetail && appDetail.service;
  const currentStatus = status && status.status;

  if (refreshing || !service || service.extend_method !== 'vm') {
    return false;
  }

  return currentStatus === 'running' && !getVMProfileVncURL(appDetail);
}

module.exports = {
  getVMProfileVncURL,
  shouldRefreshVMProfileForVNC
};
