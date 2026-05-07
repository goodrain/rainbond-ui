function isWorkflowStatusMessage(item = {}) {
  if (!item || item.kind !== 'status' || typeof item.content !== 'string') {
    return false;
  }

  return /^已进入流程 /.test(item.content) || /^当前阶段：/.test(item.content);
}

function hasAssistantContent(item = {}) {
  return typeof item.content === 'string' && item.content.trim().length > 0;
}

function hasSuggestedActions(item = {}) {
  return Array.isArray(item.suggestedActions) && item.suggestedActions.length > 0;
}

function shouldRenderMessageItem(item = {}) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  if (item.kind === 'context') {
    return false;
  }

  if (isWorkflowStatusMessage(item)) {
    return false;
  }

  return true;
}

function shouldRenderAssistantBubble(item = {}) {
  if (!item || item.role !== 'assistant' || item.kind !== 'normal') {
    return false;
  }

  return hasAssistantContent(item) || hasSuggestedActions(item);
}

function shouldShowBottomThinking(options = {}) {
  const { sending, messages } = options;

  if (!sending) {
    return false;
  }

  if (!Array.isArray(messages)) {
    return true;
  }

  return !messages.some(
    item =>
      item &&
      item.role === 'assistant' &&
      item.kind === 'normal' &&
      item.reasoningStreaming
  );
}

function shouldRenderWorkflowSummary() {
  return false;
}

module.exports = {
  hasAssistantContent,
  hasSuggestedActions,
  isWorkflowStatusMessage,
  shouldRenderAssistantBubble,
  shouldShowBottomThinking,
  shouldRenderMessageItem,
  shouldRenderWorkflowSummary
};
