// F14 — compaction lifecycle reducer.
//
// The backend (rainbond-copilot) emits four SSE event types as it
// compresses long conversation histories before re-feeding them to the
// LLM. Sequence numbers for these events live in a high band
// (2_000_000_001+) so they never collide with the regular chat stream.
//
//   compaction.started                       — async pass kicked off
//   compaction.forced_sync_due_to_pressure   — backend upgraded the
//                                              in-flight pass to sync
//                                              because token pressure
//                                              required it
//   compaction.completed                     — pass finished successfully
//   compaction.failed                        — pass aborted, original
//                                              history will be reused
//
// Before this reducer existed, agentEventAdapter dropped these events
// silently (default branch), which left the local UI with no signal that
// the LLM was waiting on a compaction round. This reducer maintains a
// dedicated `compaction` slice the UI can render as a status banner.

const defaultCompactionState = Object.freeze({
  active: false,
  mode: '',
  lastFailedAt: 0,
  lastFailedReason: '',
});

function isCompactionEventType(type) {
  return typeof type === 'string' && type.indexOf('compaction.') === 0;
}

function applyCompactionEvent(prevCompaction, event) {
  const prev = prevCompaction || defaultCompactionState;
  if (!event || typeof event !== 'object') {
    return prev;
  }
  const type = event.type;
  if (!isCompactionEventType(type)) {
    return prev;
  }

  const data = (event && event.data) || {};

  switch (type) {
    case 'compaction.started': {
      return {
        active: true,
        mode: typeof data.mode === 'string' && data.mode ? data.mode : 'async',
        lastFailedAt: prev.lastFailedAt || 0,
        lastFailedReason: prev.lastFailedReason || '',
      };
    }
    case 'compaction.forced_sync_due_to_pressure': {
      // Upgrade in-flight pass to sync; do NOT clear active.
      return {
        active: true,
        mode: 'sync_forced',
        lastFailedAt: prev.lastFailedAt || 0,
        lastFailedReason: prev.lastFailedReason || '',
      };
    }
    case 'compaction.completed': {
      return {
        active: false,
        mode: '',
        lastFailedAt: prev.lastFailedAt || 0,
        lastFailedReason: prev.lastFailedReason || '',
      };
    }
    case 'compaction.failed': {
      const reason =
        (typeof data.reason === 'string' && data.reason) ||
        (typeof data.error === 'string' && data.error) ||
        'unknown';
      return {
        active: false,
        mode: '',
        lastFailedAt: Date.now(),
        lastFailedReason: reason,
      };
    }
    default:
      return prev;
  }
}

module.exports = {
  defaultCompactionState,
  isCompactionEventType,
  applyCompactionEvent,
};
