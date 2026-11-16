function adaptAgentEvent(event = {}) {
  if (!event || !event.type) {
    return null;
  }

  const sequence = event.sequence || 0;
  const data = event.data || {};

  switch (event.type) {
    case 'chat.progress':
      return { type: 'progress_message', sequence, progressId: data.progress_id || '', content: data.content || '',
        afterMessageId: data.after_message_id || '', afterToolCallId: data.after_tool_call_id || '' };
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
        runId: event.runId || '',
        role: data.role === 'user' ? 'user' : 'assistant',
        content: data.content || '',
        messageKind: data.message_kind || '',
        messageId: data.message_id || '',
      };
    case 'chat.suggested_actions':
      return {
        type: 'suggested_actions',
        sequence,
        summary: data.summary || '',
        actions: Array.isArray(data.actions) ? data.actions : [],
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
        toolCallId: data.tool_call_id || data.call_id || '',
        description: data.description || '',
        input: data.input,
        autoApprovalEligible: typeof data.auto_approval_eligible === 'boolean' ? data.auto_approval_eligible : undefined,
        autoApproved: data.auto_approved === true,
        decisionSource: data.decision_source || '',
        policyId: data.policy_id || '',
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
        autoApproved: data.auto_approved === true,
        decisionSource: data.decision_source || '',
        policyId: data.policy_id || '',
        resolvedBy: data.resolved_by || '',
        reason: data.reason || '',
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
