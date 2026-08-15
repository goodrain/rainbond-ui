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
  buildEventLogStreamUrl,
  getEventLogTerminalState,
  shouldAppendEventLog
};
