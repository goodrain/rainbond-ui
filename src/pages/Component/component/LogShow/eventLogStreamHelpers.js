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

module.exports = {
  buildEventLogStreamUrl,
  getEventLogTerminalState
};
