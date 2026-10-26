const requestGuard = require('./platformOverviewRequestGuard');

const CACHE_TTL = {
  cluster: 10000,
  metrics: 15000
};

function createInitialState() {
  return {
    shell: null,
    runtime: null,
    cluster: null,
    metrics: null,
    clusterCache: {},
    metricsCache: {},
    loading: { shell: false, runtime: false, cluster: false, metrics: false },
    errors: { shell: null, runtime: null, cluster: null, metrics: null },
    requests: {},
    contexts: {},
    updatedAt: {}
  };
}

function cacheName(section) {
  if (section === 'cluster') return 'clusterCache';
  if (section === 'metrics') return 'metricsCache';
  return null;
}

function readCacheEntry(state, section, context, now = Date.now()) {
  const name = cacheName(section);
  if (!name) return null;
  const entry = state[name] && state[name][context];
  if (!entry || now - entry.receivedAt >= CACHE_TTL[section]) return null;
  return entry;
}

function beginState(state, payload) {
  return {
    ...state,
    loading: { ...state.loading, [payload.section]: true },
    errors: { ...state.errors, [payload.section]: null },
    requests: { ...state.requests, [payload.section]: payload.requestId }
  };
}

function resolveState(state, payload) {
  if (!requestGuard.isLatestRequest(state.requests[payload.section], payload.requestId)) {
    return state;
  }
  const name = cacheName(payload.section);
  const next = {
    ...state,
    [payload.section]: payload.data,
    loading: { ...state.loading, [payload.section]: false },
    errors: { ...state.errors, [payload.section]: null },
    contexts: { ...state.contexts, [payload.section]: payload.context },
    updatedAt: { ...state.updatedAt, [payload.section]: payload.receivedAt }
  };
  if (name) {
    next[name] = {
      ...state[name],
      [payload.context]: { data: payload.data, receivedAt: payload.receivedAt }
    };
  }
  return next;
}

function rejectState(state, payload) {
  if (!requestGuard.isLatestRequest(state.requests[payload.section], payload.requestId)) {
    return state;
  }
  return {
    ...state,
    loading: { ...state.loading, [payload.section]: false },
    errors: { ...state.errors, [payload.section]: payload.error }
  };
}

module.exports = {
  CACHE_TTL,
  beginState,
  cacheName,
  createInitialState,
  readCacheEntry,
  rejectState,
  resolveState
};
