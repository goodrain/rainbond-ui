function createSessionPersistenceScheduler(options = {}) {
  const delayMs = typeof options.delayMs === 'number' ? options.delayMs : 400;
  const persistFn = options.persistFn || function noop() {};
  let timer = null;
  let pending = null;

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function flush() {
    clearTimer();
    if (!pending) {
      return;
    }
    const nextPending = pending;
    pending = null;
    persistFn(nextPending.snapshot, nextPending.userId);
  }

  function schedule(snapshot, userId, extra = {}) {
    pending = { snapshot, userId };
    clearTimer();

    if (extra.immediate) {
      flush();
      return;
    }

    timer = setTimeout(() => {
      flush();
    }, delayMs);
  }

  function cancel() {
    clearTimer();
    pending = null;
  }

  return {
    schedule,
    flush,
    cancel,
    hasPending() {
      return !!pending;
    },
  };
}

module.exports = {
  createSessionPersistenceScheduler,
};
