function getProposedToolAction(structuredResult = {}) {
  return structuredResult &&
    structuredResult.subflowData &&
    structuredResult.subflowData.proposedToolAction
    ? structuredResult.subflowData.proposedToolAction
    : null;
}

function getExecutedAction(structuredResult = {}) {
  return structuredResult && structuredResult.executedAction
    ? structuredResult.executedAction
    : null;
}

function getProposedActionLabel(structuredResult = {}) {
  const action = getProposedToolAction(structuredResult);
  if (!action) {
    return '';
  }

  return action.requiresApproval ? '申请执行' : '继续执行';
}

function isStandaloneExecutedActionResult(structuredResult = {}) {
  if (!structuredResult || typeof structuredResult !== 'object') {
    return false;
  }

  const executedAction = getExecutedAction(structuredResult);
  if (!executedAction) {
    return false;
  }

  if (getProposedToolAction(structuredResult)) {
    return false;
  }

  if (structuredResult.selectedWorkflow || structuredResult.workflowId) {
    return false;
  }

  const toolCalls = Array.isArray(structuredResult.tool_calls)
    ? structuredResult.tool_calls
    : [];

  return structuredResult.nextAction === 'none' && toolCalls.length === 1;
}

function getSuggestedWorkflowActions(structuredResult = {}) {
  if (
    !structuredResult ||
    typeof structuredResult !== 'object' ||
    !Array.isArray(structuredResult.suggestedActions)
  ) {
    return [];
  }

  return structuredResult.suggestedActions;
}

module.exports = {
  getExecutedAction,
  getProposedToolAction,
  getProposedActionLabel,
  getSuggestedWorkflowActions,
  isStandaloneExecutedActionResult
};
