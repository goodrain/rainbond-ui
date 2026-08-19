function buildEventLogStreamUrl(eventID, regionName) {
  return `/console/sse/v2/events/${encodeURIComponent(
    eventID
  )}/stream?region_name=${encodeURIComponent(regionName)}`;
}

function getEventLogTerminalState(message) {
  if (!message) {
    return null;
  }
  if (message.step === 'last') {
    return 'success';
  }
  if (message.step === 'callback') {
    return 'failure';
  }
  return null;
}

function getEventLogReplayTime(message) {
  const rawTime =
    message && message.time !== undefined && message.time !== null
      ? String(message.time)
      : '';
  const isoLikeTime = rawTime
    .trim()
    .match(
      /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/i
    );
  if (isoLikeTime) {
    return `wall:${isoLikeTime[1]}T${isoLikeTime[2]}`;
  }
  return `raw:${rawTime}`;
}

function getEventLogReplayKey(message) {
  const text =
    message && message.message !== undefined && message.message !== null
      ? String(message.message)
      : '';
  return JSON.stringify([text, getEventLogReplayTime(message)]);
}

function buildEventLogReplayBudget(logs) {
  const replayBudget = new Map();
  const recentLogs = Array.isArray(logs) ? logs.slice(-1000) : [];
  recentLogs.forEach(message => {
    const key = getEventLogReplayKey(message);
    replayBudget.set(key, (replayBudget.get(key) || 0) + 1);
  });
  return replayBudget;
}

function shouldAppendEventStreamMessage(message, replayBudget) {
  if (!replayBudget) {
    return true;
  }
  const key = getEventLogReplayKey(message);
  const remaining = replayBudget.get(key) || 0;
  if (remaining === 0) {
    return true;
  }
  if (remaining === 1) {
    replayBudget.delete(key);
  } else {
    replayBudget.set(key, remaining - 1);
  }
  return false;
}

function shouldAppendEventLog(message, seenMessages, deduplicateMessages) {
  if (!deduplicateMessages) {
    return true;
  }
  if (seenMessages.has(message)) {
    return false;
  }
  seenMessages.add(message);
  return true;
}

module.exports = {
  buildEventLogReplayBudget,
  buildEventLogStreamUrl,
  getEventLogTerminalState,
  getEventLogReplayKey,
  shouldAppendEventStreamMessage,
  shouldAppendEventLog
};
