const BOTTOM_THRESHOLD_PX = 24;

function isNearBottom(metrics = {}, threshold = BOTTOM_THRESHOLD_PX) {
  const scrollTop = Number(metrics.scrollTop || 0);
  const clientHeight = Number(metrics.clientHeight || 0);
  const scrollHeight = Number(metrics.scrollHeight || 0);

  return scrollHeight - (scrollTop + clientHeight) <= threshold;
}

function getNextAutoScrollEnabled(
  currentEnabled,
  metrics = {},
  options = {}
) {
  const threshold =
    typeof options.threshold === 'number'
      ? options.threshold
      : BOTTOM_THRESHOLD_PX;
  if (isNearBottom(metrics, threshold)) return true;
  // Content growth, browser scroll anchoring and programmatic scrolling do
  // not mean the reader asked to stop following the output.
  if (options.userInitiated === false || (options.isStreaming && options.userInitiated !== true)) {
    return !!currentEnabled;
  }
  return false;
}

function shouldAttemptAutoScrollUpdate(options = {}) {
  const prevMessages = options.prevMessages || [];
  const nextMessages = options.nextMessages || [];
  const wasVisible = !!options.wasVisible;
  const isVisible = !!options.isVisible;
  const renderedFields = ['id', 'content', 'streaming', 'reasoning', 'reasoningStreaming',
    'trace', 'approval', 'runStatus', 'isFinalAnswer', 'suggestedActions'];
  const messagesChanged = prevMessages.length !== nextMessages.length ||
    nextMessages.some((item, index) => {
      const previous = prevMessages[index];
      if (!previous || !item) return previous !== item;
      return renderedFields.some(field => previous[field] !== item[field]);
    });

  return messagesChanged || (!wasVisible && isVisible) ||
    options.wasSending !== options.isSending;
}

module.exports = {
  BOTTOM_THRESHOLD_PX,
  getNextAutoScrollEnabled,
  isNearBottom,
  shouldAttemptAutoScrollUpdate,
};
