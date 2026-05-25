// Z2 — clearConversation saga helper.
//
// The DVA model used to call clearAgentSessionRemote only when
// `state.conversationId` was a real sessionId (i.e. not 'global-default').
// But the per-tab sessionStorage cache often holds a real sessionId from
// a previous turn even when the in-memory DVA state has been reset back
// to 'global-default' (e.g. after a hot reload, after a stop-and-clear,
// or before the first message of a new tab that hydrated an existing
// session). The result was that "清空对话" looked successful in the UI
// while the backend session lived on indefinitely.
//
// The fix is to always call the remote DELETE when *any* source — DVA
// state or sessionStorage hydrate snapshot — yields a real sessionId.
// 'global-default' and empty values are sentinels and must not be
// passed to the backend.

const SENTINEL_CONVERSATION_ID = 'global-default';

function isRealSessionId(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value !== SENTINEL_CONVERSATION_ID
  );
}

function resolveClearTargetSessionId({ conversationId, hydrateSnapshot } = {}) {
  if (isRealSessionId(conversationId)) {
    return conversationId;
  }
  const hydrated = hydrateSnapshot && hydrateSnapshot.conversationId;
  if (isRealSessionId(hydrated)) {
    return hydrated;
  }
  return null;
}

module.exports = {
  SENTINEL_CONVERSATION_ID,
  isRealSessionId,
  resolveClearTargetSessionId,
};
