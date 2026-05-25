function isSseConversationStreaming(agent = {}) {
  if (!agent) {
    return false;
  }

  return !!(
    agent.sending &&
    agent.activeRunId &&
    !agent.cancellingRun
  );
}

function shouldConfirmClose(agent = {}) {
  return isSseConversationStreaming(agent);
}

module.exports = {
  isSseConversationStreaming,
  shouldConfirmClose,
};
