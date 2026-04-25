function isWorkflowStatusMessage(item = {}) {
  if (!item || item.kind !== 'status' || typeof item.content !== 'string') {
    return false;
  }

  return /^已进入流程 /.test(item.content) || /^当前阶段：/.test(item.content);
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

function shouldRenderWorkflowSummary() {
  return false;
}

module.exports = {
  isWorkflowStatusMessage,
  shouldRenderMessageItem,
  shouldRenderWorkflowSummary
};
