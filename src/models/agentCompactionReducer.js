// Compaction lifecycle reducer.
//
// The backend (rainbond-copilot) emits SSE event types as it compresses
// long conversation histories at the end of each turn (after the LLM has
// already responded). Sequence numbers live in a high band (2_000_000_001+)
// so they never collide with the regular chat stream.
//
//   compaction.started    — compaction LLM call kicked off
//   compaction.completed  — pass finished successfully
//   compaction.failed     — pass aborted, original history will be reused
//
// In the post-turn design, compaction.completed always arrives before
// run.status:done. The run.status reset below is a safety net for edge
// cases (network replay, partial streams) that would otherwise leave the
// banner stuck in the active state.

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

  // Safety net: clear the banner whenever the run terminates. In the
  // post-turn design compaction.completed always arrives before
  // run.status:done, but this guard ensures the banner can never get
  // permanently stuck due to partial streams or missed events.
  if (
    type === 'run.status' &&
    event.data &&
    (event.data.status === 'done' ||
      event.data.status === 'error' ||
      event.data.status === 'cancelled')
  ) {
    return { ...defaultCompactionState };
  }

  if (!isCompactionEventType(type)) {
    return prev;
  }

  const data = (event && event.data) || {};

  switch (type) {
    case 'compaction.started': {
      return {
        active: true,
        mode: 'post_turn',
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
