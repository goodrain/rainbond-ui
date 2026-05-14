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
  if (options.isStreaming) {
    return true;
  }
  return isNearBottom(metrics, threshold);
}

function shouldAttemptAutoScrollUpdate(options = {}) {
  const prevMessages = options.prevMessages || [];
  const nextMessages = options.nextMessages || [];
  const wasVisible = !!options.wasVisible;
  const isVisible = !!options.isVisible;
  const prevLastMessage = prevMessages[prevMessages.length - 1];
  const nextLastMessage = nextMessages[nextMessages.length - 1];
  const lastMessageChanged =
    prevLastMessage &&
    nextLastMessage &&
    prevLastMessage.id === nextLastMessage.id &&
    (
      prevLastMessage.content !== nextLastMessage.content ||
      prevLastMessage.streaming !== nextLastMessage.streaming ||
      prevLastMessage.reasoning !== nextLastMessage.reasoning ||
      prevLastMessage.reasoningStreaming !== nextLastMessage.reasoningStreaming
    );

  return (
    prevMessages.length !== nextMessages.length ||
    lastMessageChanged ||
    (!wasVisible && isVisible)
  );
}

module.exports = {
  BOTTOM_THRESHOLD_PX,
  getNextAutoScrollEnabled,
  isNearBottom,
  shouldAttemptAutoScrollUpdate,
};
