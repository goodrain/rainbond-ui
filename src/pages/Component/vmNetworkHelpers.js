function getEnabledVMServiceNames(ports = []) {
  return Array.from(new Set((ports || [])
    .filter(port => port && port.is_inner_service && port.k8s_service_name)
    .map(port => port.k8s_service_name)));
}

function getServiceClusterIP(serviceResource = {}) {
  const spec = serviceResource && serviceResource.spec;
  const clusterIP = spec && spec.clusterIP;
  if (!clusterIP || clusterIP === 'None') {
    return '';
  }
  return clusterIP;
}

module.exports = {
  getEnabledVMServiceNames,
  getServiceClusterIP
};
