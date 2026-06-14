const { isPluginBaseId } = require('../../utils/pluginArchUtils');

const GATEWAY_MONITORING_PLUGIN_ID = 'rainbond-gateway-monitoring';
const HTTP_PORT_PROTOCOLS = ['http', 'https', 'httptohttps', 'http2', 'grpc'];

function hasHTTPPort(ports = []) {
  return (ports || []).some(port => {
    const protocol = String((port && port.protocol) || '').toLowerCase();
    return HTTP_PORT_PROTOCOLS.includes(protocol);
  });
}

function shouldShowComponentPluginTab(plugin = {}, appDetail = {}, ports = []) {
  const service = (appDetail && appDetail.service) || {};

  if (!plugin || !plugin.name) {
    return false;
  }

  if (isPluginBaseId(plugin, GATEWAY_MONITORING_PLUGIN_ID)) {
    return hasHTTPPort(ports);
  }

  if (plugin.name === 'rainbond-vm') {
    return service.extend_method === 'vm';
  }

  if (plugin.name === 'rainbond-sourcescan') {
    return service.service_source === 'source_code';
  }

  return true;
}

function getVisibleComponentPlugins(pluginList = [], appDetail = {}, ports = []) {
  return (pluginList || []).filter(plugin =>
    shouldShowComponentPluginTab(plugin, appDetail, ports)
  );
}

function shouldClearComponentPorts(previousAppAlias, nextAppAlias) {
  return Boolean(nextAppAlias) && previousAppAlias !== nextAppAlias;
}

function getComponentPluginTabName(plugin = {}, monitorLabel = '监控', gatewayTrafficLabel = '组件流量') {
  if (isPluginBaseId(plugin, GATEWAY_MONITORING_PLUGIN_ID)) {
    return gatewayTrafficLabel;
  }

  if (plugin.name === 'rainbond-vm') {
    return monitorLabel;
  }

  return plugin.display_name || plugin.alias || plugin.name;
}

module.exports = {
  getComponentPluginTabName,
  getVisibleComponentPlugins,
  hasHTTPPort,
  shouldClearComponentPorts,
  shouldShowComponentPluginTab
};
