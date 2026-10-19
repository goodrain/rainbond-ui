const ACTIVE_POLL_DELAY = 5000;
const STABLE_POLL_DELAY = 15000;
const FAILURE_BASE_POLL_DELAY = 10000;
const MAX_FAILURE_POLL_DELAY = 60000;

const TRANSITIONAL_STATUSES = {
  checking: true,
  creating: true,
  restoring: true,
  starting: true,
  stoping: true,
  stopping: true,
  upgrade: true,
  waiting: true
};

function getComponentPollingDelay({ status = '', failureCount = 0 } = {}) {
  const normalizedFailureCount = Math.max(0, Number(failureCount) || 0);
  if (normalizedFailureCount > 0) {
    return Math.min(
      FAILURE_BASE_POLL_DELAY * Math.pow(2, normalizedFailureCount - 1),
      MAX_FAILURE_POLL_DELAY
    );
  }

  const normalizedStatus = String(status).toLowerCase();
  return !normalizedStatus || TRANSITIONAL_STATUSES[normalizedStatus]
    ? ACTIVE_POLL_DELAY
    : STABLE_POLL_DELAY;
}

module.exports = {
  ACTIVE_POLL_DELAY,
  STABLE_POLL_DELAY,
  MAX_FAILURE_POLL_DELAY,
  getComponentPollingDelay
};
