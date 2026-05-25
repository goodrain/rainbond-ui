const LOCKED_RUN_STATUSES = {
  thinking: true,
  waiting_approval: true,
  done: false,
  error: false,
  cancelled: false,
};

function getLockedStateByRunStatus(status, currentLocked) {
  if (!status || typeof status !== 'string') {
    return currentLocked;
  }

  if (Object.prototype.hasOwnProperty.call(LOCKED_RUN_STATUSES, status)) {
    return LOCKED_RUN_STATUSES[status];
  }

  return currentLocked;
}

function getNextInteractionLocked(currentLocked, event = {}) {
  if (!event || typeof event !== 'object') {
    return currentLocked;
  }

  if (event.type === 'run.error') {
    return false;
  }

  if (event.type === 'run.status') {
    const data = event.data || {};
    return getLockedStateByRunStatus(data.status, currentLocked);
  }

  return currentLocked;
}

module.exports = {
  LOCKED_RUN_STATUSES,
  getLockedStateByRunStatus,
  getNextInteractionLocked,
};
