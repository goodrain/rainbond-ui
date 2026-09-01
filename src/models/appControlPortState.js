const HTTP_PORT_PROTOCOLS = ['http', 'https', 'httptohttps', 'http2', 'grpc'];

function hasHTTPPort(ports = []) {
  return (ports || []).some(port =>
    HTTP_PORT_PROTOCOLS.includes(String((port && port.protocol) || '').toLowerCase())
  );
}

function prepareComponentPortsState(state, appAlias, requestGeneration) {
  const normalizedAlias = String(appAlias || '');
  const shouldClear =
    Boolean(normalizedAlias) && state.portsOwner !== normalizedAlias;
  return {
    ...state,
    ports: shouldClear ? [] : state.ports,
    portsOwner: normalizedAlias,
    portsRequestGeneration: requestGeneration,
    gatewayTrafficTabVisible: Boolean(state.gatewayTrafficTabVisible)
  };
}

function saveComponentPortsState(state, payload = {}) {
  if (
    state.portsOwner !== payload.appAlias ||
    state.portsRequestGeneration !== payload.requestGeneration
  ) {
    return state;
  }
  return {
    ...state,
    ports: payload.ports || [],
    gatewayTrafficTabVisible: hasHTTPPort(payload.ports)
  };
}

function clearComponentPortsState(state) {
  return {
    ...state,
    ports: [],
    portsOwner: '',
    gatewayTrafficTabVisible: Boolean(state.gatewayTrafficTabVisible)
  };
}

module.exports = {
  clearComponentPortsState,
  prepareComponentPortsState,
  saveComponentPortsState
};
