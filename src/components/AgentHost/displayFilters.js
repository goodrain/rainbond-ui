function isWorkflowStatusMessage(item = {}) {
  if (!item || item.kind !== 'status' || typeof item.content !== 'string') {
    return false;
  }

  return /^已进入流程 /.test(item.content) || /^当前阶段：/.test(item.content);
}

function hasAssistantContent(item = {}) {
  return getAssistantDisplayContent(item).trim().length > 0;
}

function getAssistantDisplayContent(item = {}) {
  const content = typeof item.content === 'string' ? item.content : '';
  const normalize = value => String(value || '').replace(/[\s`*_#>\-\[\]()]/g, '');
  const existing = normalize(content);
  const legacy = (Array.isArray(item.suggestedActions) ? item.suggestedActions : []).filter(action =>
    action && action.source === 'llm_fallback' &&
    (!existing.includes(normalize(action.label)) || !existing.includes(normalize(action.description))));
  // Preserve older option descriptions as ordinary text, never executable cards.
  return [content, ...legacy.map(action => `方案 ${action.optionKey || ''}：${action.label || ''}\n${action.description || ''}`)]
    .filter(Boolean).join('\n\n');
}

function hasSuggestedActions(item = {}) {
  return getVisibleSuggestedActions(item.suggestedActions).length > 0;
}

function getVisibleSuggestedActions(actions) {
  // Old prose-derived guesses remain in storage but are not executable choices.
  return (Array.isArray(actions) ? actions : []).filter(action => action && action.source !== 'llm_fallback');
}

function shouldRenderMessageItem(item = {}) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  if (item.kind === 'context' || isWorkflowStatusMessage(item)) {
    return false;
  }
  if (item.kind === 'suggested_actions' && !hasSuggestedActions(item)) return false;

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
  getVisibleSuggestedActions,
  getAssistantDisplayContent,
  hasSuggestedActions,
  isWorkflowStatusMessage,
  shouldRenderAssistantBubble,
  shouldShowBottomThinking,
  shouldRenderMessageItem,
  shouldRenderWorkflowSummary
};
