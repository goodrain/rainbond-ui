function prepareComponentPortsState(state, appAlias, requestGeneration) {
  const normalizedAlias = String(appAlias || '');
  const shouldClear =
    Boolean(normalizedAlias) && state.portsOwner !== normalizedAlias;
  return {
    ...state,
    ports: shouldClear ? [] : state.ports,
    portsOwner: normalizedAlias,
    portsRequestGeneration: requestGeneration
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
    ports: payload.ports || []
  };
}

function clearComponentPortsState(state) {
  return {
    ...state,
    ports: [],
    portsOwner: ''
  };
}

module.exports = {
  clearComponentPortsState,
  prepareComponentPortsState,
  saveComponentPortsState
};
