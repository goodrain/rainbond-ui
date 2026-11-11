function getEnabledVMServiceNames(ports = []) {
  return Array.from(new Set((ports || [])
    .filter(port => port && port.is_inner_service && port.k8s_service_name)
    .map(port => port.k8s_service_name)));
}

function getServiceClusterIP(serviceResource = {}) {
  const spec = serviceResource && serviceResource.spec;
  const clusterIP = spec && spec.clusterIP;
  if (typeof clusterIP !== 'string' || !clusterIP.trim() || clusterIP.trim() === 'None') {
    return '';
  }
  return clusterIP.trim();
}

function responseSucceeded(response) {
  if (!response || typeof response !== 'object') return false;
  const status = response.status_code === undefined ? response._code : response.status_code;
  const code = response.business_code === undefined
    ? (response._condition === undefined ? response.response_data?.code : response._condition)
    : response.business_code;
  return (status === undefined || (Number(status) >= 200 && Number(status) < 300)) &&
    (code === undefined || Number(code) === 200);
}

function isMissingService(error) {
  return Number(error?.response?.status || error?.status_code || error?.status) === 404;
}

// A ClusterIP is a service address, not evidence that the guest/port is ready.
// Read only the original port and Kubernetes Service APIs and retain why an
// address is absent, instead of treating all empty/error responses as no network.
async function readVMInternalAddress(context, api, isCurrent = () => true) {
  const result = (status, clusterIP = '') => ({ status, clusterIP });
  if (!isCurrent()) return null;
  if (!context.serviceAlias) return result('service-pending');
  let ports;
  try {
    const response = await api.getPorts({
      team_name: context.teamName,
      app_alias: context.serviceAlias,
      showLoading: false,
      showMessage: false,
      handleError: () => {}
    });
    if (!isCurrent()) return null;
    if (!responseSucceeded(response) || !Array.isArray(response.list)) return result('read-failed');
    ports = response.list;
  } catch (_) {
    return isCurrent() ? result('read-failed') : null;
  }
  const internalPorts = ports.filter(port => port && port.is_inner_service);
  if (!internalPorts.length) return result('no-inner-ports');
  const names = getEnabledVMServiceNames(internalPorts);
  if (!names.length) return result('service-pending');

  let readFailed = false;
  for (const name of names) {
    if (!isCurrent()) return null;
    let missing = false;
    try {
      const response = await api.getNsResource({
        team: context.teamName,
        region: context.regionName,
        name,
        group: '',
        version: 'v1',
        resource: 'services',
        showLoading: false,
        handleError: error => { missing = isMissingService(error); }
      });
      if (!isCurrent()) return null;
      if (!responseSucceeded(response)) {
        if (!missing && !isMissingService(response)) readFailed = true;
        continue;
      }
      if (!response.bean || typeof response.bean !== 'object') {
        readFailed = true;
        continue;
      }
      const clusterIP = getServiceClusterIP(response.bean);
      if (clusterIP) return result('ready', clusterIP);
    } catch (error) {
      if (!isCurrent()) return null;
      if (!isMissingService(error)) readFailed = true;
    }
  }
  return result(readFailed ? 'read-failed' : 'service-pending');
}

function buildVMPortManagementRoute({ teamName, regionName, appId, serviceAlias, refresh } = {}) {
  if (!teamName || !regionName || !appId || !serviceAlias) return '';
  const query = [
    'type=components',
    `componentID=${encodeURIComponent(serviceAlias)}`,
    'tab=port'
  ];
  if (refresh) query.push(`refresh=${encodeURIComponent(refresh)}`);
  return `/team/${encodeURIComponent(teamName)}/region/${encodeURIComponent(regionName)}/apps/${encodeURIComponent(appId)}/overview?${query.join('&')}`;
}

module.exports = {
  getEnabledVMServiceNames,
  getServiceClusterIP,
  readVMInternalAddress,
  buildVMPortManagementRoute
};
