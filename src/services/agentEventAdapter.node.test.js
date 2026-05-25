const assert = require('assert');
const { adaptAgentEvent } = require('./agentEventAdapter');

const messageStarted = adaptAgentEvent({
  type: 'chat.message.started',
  sequence: 7,
  data: {
    message_id: 'msg_1',
    role: 'assistant',
  }
});
assert.deepStrictEqual(
  messageStarted,
  {
    type: 'message_started',
    sequence: 7,
    role: 'assistant',
    messageId: 'msg_1',
  },
  'adapter should normalize assistant stream start events'
);

const trace = adaptAgentEvent({
  type: 'chat.trace',
  sequence: 4,
  data: {
    trace_id: 'trace_1',
    tool_call_id: 'call_1',
    tool_name: 'rainbond_get_current_user',
    input: {},
  }
});
assert.strictEqual(trace.type, 'trace', 'adapter should normalize trace events');
assert.strictEqual(trace.traceId, 'trace_1', 'adapter should expose trace_id');
assert.strictEqual(trace.toolCallId, 'call_1', 'adapter should expose tool_call_id');

const approval = adaptAgentEvent({
  type: 'approval.requested',
  sequence: 9,
  sessionId: 'cs_1',
  runId: 'run_1',
  data: {
    approval_id: 'ap_1',
    description: '需要审批',
    risk: 'high',
    scope: 'component',
    scope_label: '组件级',
    level_label: '高风险',
  }
});
assert.strictEqual(approval.type, 'approval_requested', 'adapter should normalize approval request events');
assert.strictEqual(approval.approvalId, 'ap_1', 'adapter should expose approval id');

const completed = adaptAgentEvent({
  type: 'workflow.completed',
  sequence: 11,
  data: {
    structured_result: {
      summary: 'done',
    }
  }
});
assert.strictEqual(completed.type, 'workflow_completed', 'adapter should normalize workflow completion');
assert.deepStrictEqual(completed.structuredResult, { summary: 'done' }, 'adapter should keep structured result payload');

const suggestedActions = adaptAgentEvent({
  type: 'chat.suggested_actions',
  sequence: 12,
  data: {
    summary: '当前建议优先走方案A。',
    actions: [
      {
        actionId: 'sa_scale_component_memory',
        optionKey: 'A',
        label: '调回合理资源',
        description: '将组件调整到 250m CPU / 512MB 内存',
        requiresApproval: true,
        source: 'workflow'
      }
    ]
  }
});
assert.strictEqual(suggestedActions.type, 'suggested_actions', 'adapter should normalize suggested action events');
assert.strictEqual(suggestedActions.summary, '当前建议优先走方案A。', 'adapter should expose suggested action summary');
assert.deepStrictEqual(suggestedActions.actions, [
  {
    actionId: 'sa_scale_component_memory',
    optionKey: 'A',
    label: '调回合理资源',
    description: '将组件调整到 250m CPU / 512MB 内存',
    requiresApproval: true,
    source: 'workflow'
  }
], 'adapter should expose suggested action items');

console.log('agent event adapter tests passed');
