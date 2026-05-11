// F12 — cross-tab SSE subscription event filter.
//
// When tab B hits 409 (another run is in flight in tab A), F5 opens an SSE
// stream against the foreign run so the local model can react to its
// terminal status (the `applyStreamEvent` saga uses run.status terminal
// transitions to flush a pending draft via auto-resend).
//
// The original implementation forwarded every foreign event into
// `agent/applyStreamEvent`. The backend's `streamRunEvents` first does a
// `broker.replay(runId, afterSequence)`. If the foreign run is a stale
// zombie (e.g. status field stuck on 'running' but events table already
// has a `done` event), replay returns the entire historical event stream:
// chat.message.delta, reasoning.delta, tool calls, approval modals,
// compaction notifications, etc. Forwarding all of those into the local
// reducer made the local tab's UI re-render the foreign run's full
// conversation as if it were live.
//
// Fix: only forward `run.status` events to the local reducer. The
// auto-flush trigger lives in the saga's terminal-status branch, so it
// keeps working. All other event types (chat.message.*, chat.trace,
// approval.*, compaction.*, workflow.*, etc.) are dropped — they belong
// to the foreign run's lifecycle and must not pollute the observer tab.

const ALLOWED_FOREIGN_EVENT_TYPES = new Set(['run.status']);

function isAllowedForeignEvent(event) {
  if (!event || typeof event !== 'object') {
    return false;
  }
  const type = event.type;
  if (!type || typeof type !== 'string') {
    return false;
  }
  return ALLOWED_FOREIGN_EVENT_TYPES.has(type);
}

function buildCrossTabOnEventDispatcher(dispatch, contextSnapshot) {
  const safeContext = contextSnapshot || {};
  return function onEvent(event) {
    if (typeof dispatch !== 'function') return;
    if (!isAllowedForeignEvent(event)) return;
    dispatch({
      type: 'agent/applyStreamEvent',
      payload: { event, contextSnapshot: safeContext },
    });
  };
}

module.exports = {
  ALLOWED_FOREIGN_EVENT_TYPES,
  buildCrossTabOnEventDispatcher,
  isAllowedForeignEvent,
};
