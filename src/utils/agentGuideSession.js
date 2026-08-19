const AGENT_GUIDE_SESSION_KEY = 'rainbond.agent.contextual-guide.v1';

function createEmptyGuideSession(userId = '') {
  return {
    userId: userId ? String(userId) : '',
    suppressAll: false,
    handledComponents: {},
  };
}

function getSessionStorage(storage) {
  if (storage) {
    return storage;
  }
  if (typeof window !== 'undefined') {
    return window.sessionStorage;
  }
  return null;
}

function readAgentGuideSession(userId, storage) {
  const targetStorage = getSessionStorage(storage);
  const emptyState = createEmptyGuideSession(userId);
  if (!targetStorage) {
    return emptyState;
  }

  try {
    const saved = JSON.parse(targetStorage.getItem(AGENT_GUIDE_SESSION_KEY) || 'null');
    if (!saved || String(saved.userId || '') !== emptyState.userId) {
      return emptyState;
    }
    return {
      ...emptyState,
      suppressAll: saved.suppressAll === true,
      handledComponents:
        saved.handledComponents && typeof saved.handledComponents === 'object'
          ? saved.handledComponents
          : {},
    };
  } catch (e) {
    return emptyState;
  }
}

function writeAgentGuideSession(state, storage) {
  const targetStorage = getSessionStorage(storage);
  if (!targetStorage) {
    return;
  }
  targetStorage.setItem(AGENT_GUIDE_SESSION_KEY, JSON.stringify(state));
}

function buildComponentGuideKey(options = {}) {
  return [
    options.enterpriseId || '',
    options.teamName || '',
    options.regionName || '',
    options.componentAlias || '',
  ].join(':');
}

function markComponentGuideHandled(userId, componentKey, storage) {
  const state = readAgentGuideSession(userId, storage);
  writeAgentGuideSession(
    {
      ...state,
      handledComponents: {
        ...state.handledComponents,
        [componentKey]: true,
      },
    },
    storage
  );
}

function suppressAgentGuidesForLogin(userId, storage) {
  const state = readAgentGuideSession(userId, storage);
  writeAgentGuideSession({ ...state, suppressAll: true }, storage);
}

function canShowComponentGuide(userId, componentKey, storage) {
  const state = readAgentGuideSession(userId, storage);
  return !state.suppressAll && !state.handledComponents[componentKey];
}

function clearAgentGuideSession(storage) {
  const targetStorage = getSessionStorage(storage);
  if (targetStorage) {
    targetStorage.removeItem(AGENT_GUIDE_SESSION_KEY);
  }
}

module.exports = {
  AGENT_GUIDE_SESSION_KEY,
  buildComponentGuideKey,
  canShowComponentGuide,
  clearAgentGuideSession,
  createEmptyGuideSession,
  markComponentGuideHandled,
  readAgentGuideSession,
  suppressAgentGuidesForLogin,
};
