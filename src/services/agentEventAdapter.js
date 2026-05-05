function adaptAgentEvent(event = {}) {
  if (!event || !event.type) {
    return null;
  }

  const sequence = event.sequence || 0;
  const data = event.data || {};

  switch (event.type) {
    case 'chat.message.started':
      return {
        type: 'message_started',
        sequence,
        role: data.role === 'user' ? 'user' : 'assistant',
        messageId: data.message_id || '',
      };
    case 'chat.message.delta':
      return {
        type: 'message_delta',
        sequence,
        messageId: data.message_id || '',
        delta: data.delta || '',
      };
    case 'chat.message.completed':
      return {
        type: 'message_completed',
        sequence,
        messageId: data.message_id || '',
        content: data.content || '',
      };
    case 'chat.message.reasoning.started':
      return {
        type: 'message_reasoning_started',
        sequence,
        messageId: data.message_id || '',
      };
    case 'chat.message.reasoning.delta':
      return {
        type: 'message_reasoning_delta',
        sequence,
        messageId: data.message_id || '',
        delta: data.delta || '',
      };
    case 'chat.message.reasoning.completed':
      return {
        type: 'message_reasoning_completed',
        sequence,
        messageId: data.message_id || '',
        reasoning: data.reasoning || '',
      };
    case 'chat.message':
      return {
        type: 'message',
        sequence,
        role: data.role === 'user' ? 'user' : 'assistant',
        content: data.content || '',
        messageId: data.message_id || '',
      };
    case 'chat.trace':
      return {
        type: 'trace',
        sequence,
        traceId: data.trace_id || '',
        toolCallId: data.tool_call_id || '',
        traceData: data,
      };
    case 'approval.requested':
      return {
        type: 'approval_requested',
        sequence,
        sessionId: event.sessionId || '',
        runId: event.runId || '',
        approvalId: data.approval_id || '',
        description: data.description || '',
        risk: data.risk || 'medium',
        scope: data.scope || '',
        scopeLabel: data.scope_label || '',
        levelLabel: data.level_label || '',
        skillId: data.skill_id || '',
        targetRef: data.target_ref || null,
      };
    case 'approval.resolved':
      return {
        type: 'approval_resolved',
        sequence,
        approvalId: data.approval_id || '',
        status: data.status || 'approved',
      };
    case 'run.status':
      return {
        type: 'run_status',
        sequence,
        status: data.status || '',
      };
    case 'run.error':
      return {
        type: 'run_error',
        sequence,
        message: data.message || data.error || '执行过程中发生错误，请稍后重试。',
      };
    case 'workflow.selected':
      return {
        type: 'workflow_selected',
        sequence,
        workflowName: data.workflow_name || 'workflow',
      };
    case 'workflow.stage':
      return {
        type: 'workflow_stage',
        sequence,
        workflowStage: data.workflow_stage || 'unknown',
      };
    case 'workflow.completed':
      return {
        type: 'workflow_completed',
        sequence,
        structuredResult: data.structured_result || null,
      };
    default:
      return {
        type: event.type,
        sequence,
        data,
      };
  }
}

module.exports = {
  adaptAgentEvent,
};
