const {
  buildEventLogReplayBudget,
  shouldAppendEventStreamMessage
} = require('./component/LogShow/eventLogStreamHelpers');

function toReplayMessage(message) {
  return { message, time: '' };
}

function buildRuntimeLogReplayBudget(recentMessages, podName, lines) {
  const tailLines = Number(lines);
  if (!Number.isFinite(tailLines) || tailLines <= 0) {
    return buildEventLogReplayBudget([]);
  }
  const replayMessages = (Array.isArray(recentMessages) ? recentMessages : [])
    .filter(item => item && item.podName === podName)
    .slice(-tailLines)
    .map(item => toReplayMessage(item.message));
  return buildEventLogReplayBudget(replayMessages);
}

function shouldAppendRuntimeLogMessage(message, replayBudget) {
  return shouldAppendEventStreamMessage(
    toReplayMessage(message),
    replayBudget
  );
}

function rememberRuntimeLogMessage(
  recentMessages,
  podName,
  message,
  limit = 1000
) {
  if (!Array.isArray(recentMessages)) {
    return;
  }
  recentMessages.push({ podName, message });
  const historyLimit = Number(limit);
  if (Number.isFinite(historyLimit) && historyLimit >= 0) {
    const overflow = recentMessages.length - historyLimit;
    if (overflow > 0) {
      recentMessages.splice(0, overflow);
    }
  }
}

module.exports = {
  buildRuntimeLogReplayBudget,
  rememberRuntimeLogMessage,
  shouldAppendRuntimeLogMessage
};
