function extractWorkflowState(events = []) {
  const list = Array.isArray(events) ? events : [];
  let workflowState = null;
  let structuredResult = null;

  list.forEach(event => {
    if (!event || !event.type) {
      return;
    }

    if (event.type === 'workflow.stage') {
      workflowState = event.data || null;
    }

    if (event.type === 'workflow.completed') {
      structuredResult = event.data && event.data.structured_result
        ? event.data.structured_result
        : null;
    }
  });

  return {
    workflowState,
    structuredResult
  };
}

module.exports = {
  extractWorkflowState
};
