const normalizeLogMessage = log => {
  if (!log || log.message === undefined || log.message === null) {
    return '';
  }

  if (typeof log.message === 'string') {
    return log.message;
  }

  try {
    return JSON.stringify(log.message);
  } catch (e) {
    return String(log.message);
  }
};

const buildLogKey = log => {
  if (!log) {
    return '';
  }

  return [
    log.event_id || '',
    log.step || '',
    log.status || '',
    log.level || '',
    log.time || '',
    normalizeLogMessage(log)
  ].join('|');
};

const buildDuplicateLogBudget = (logs = []) =>
  logs.reduce((budget, log) => {
    const key = buildLogKey(log);
    if (key) {
      budget.set(key, (budget.get(key) || 0) + 1);
    }
    return budget;
  }, new Map());

const consumeDuplicateLogBudget = (budget, log) => {
  if (!budget) {
    return false;
  }
  const key = buildLogKey(log);
  const count = key ? budget.get(key) : 0;
  if (!count) {
    return false;
  }
  if (count === 1) {
    budget.delete(key);
  } else {
    budget.set(key, count - 1);
  }
  return true;
};

module.exports = {
  buildLogKey,
  buildDuplicateLogBudget,
  consumeDuplicateLogBudget,
  normalizeLogMessage
};
