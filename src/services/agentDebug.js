const UI_DEBUG_PREFIX = '[agent-ui-debug]';
const UI_DEBUG_STAGES = {
  'message:send:error': true,
  'sse:reader:terminal-error': true,
  'model:sendMessage:error': true,
  'model:resolveApproval:error': true,
};

function summarizeEvent(event = {}) {
  const data = event.data || {};
  return {
    type: event.type || '',
    sequence: event.sequence || 0,
    runId: event.runId || '',
    sessionId: event.sessionId || '',
    status: data.status || '',
    approvalId: data.approval_id || '',
    traceId: data.trace_id || '',
    toolCallId: data.tool_call_id || '',
    toolName: data.tool_name || '',
    messageId: data.message_id || '',
    deltaLength: typeof data.delta === 'string' ? data.delta.length : 0,
    contentLength: typeof data.content === 'string' ? data.content.length : 0,
    hasOutput: typeof data.output !== 'undefined',
  };
}

function summarizeContext(context = {}) {
  return {
    view: context.view || '',
    teamName: context.teamName || '',
    regionName: context.regionName || '',
    appId: context.appId || '',
    componentId: context.componentId || '',
    pathname: context.pathname || '',
  };
}

function logAgentUi(stage, payload = {}) {
  if (typeof console === 'undefined' || !console.info) {
    return;
  }
  if (!UI_DEBUG_STAGES[stage]) {
    return;
  }

  console.info(UI_DEBUG_PREFIX, stage, payload);
}

module.exports = {
  logAgentUi,
  summarizeContext,
  summarizeEvent,
};
