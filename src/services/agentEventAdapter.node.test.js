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
    action_label: '查看应用详情',
    object_label: 'web',
    effect_label: '只读，不会修改集群',
    readonly: true,
  }
});
assert.strictEqual(approval.type, 'approval_requested', 'adapter should normalize approval request events');
assert.strictEqual(approval.approvalId, 'ap_1', 'adapter should expose approval id');
assert.strictEqual(approval.actionLabel, '查看应用详情', 'adapter should expose action_label');
assert.strictEqual(approval.objectLabel, 'web', 'adapter should expose object_label');
assert.strictEqual(approval.effectLabel, '只读，不会修改集群', 'adapter should expose effect_label');
assert.strictEqual(approval.readonly, true, 'adapter should expose readonly');

const legacyApproval = adaptAgentEvent({
  type: 'approval.requested',
  sequence: 9,
  data: {
    approval_id: 'ap_legacy',
    description: '旧审批',
    risk: 'medium',
  }
});
assert.strictEqual(legacyApproval.actionLabel, '', 'adapter should default missing action_label');
assert.strictEqual(legacyApproval.objectLabel, '', 'adapter should default missing object_label');
assert.strictEqual(legacyApproval.effectLabel, '', 'adapter should default missing effect_label');
assert.strictEqual(legacyApproval.readonly, false, 'adapter should default missing readonly');

const camelApproval = adaptAgentEvent({
  type: 'approval.requested',
  sequence: 9,
  data: {
    approval_id: 'ap_camel',
    actionLabel: '重启组件',
    objectLabel: 'api',
    effectLabel: '会短暂中断服务',
    readOnly: 'true',
  }
});
assert.strictEqual(camelApproval.actionLabel, '重启组件', 'adapter should accept camelCase actionLabel');
assert.strictEqual(camelApproval.objectLabel, 'api', 'adapter should accept camelCase objectLabel');
assert.strictEqual(camelApproval.effectLabel, '会短暂中断服务', 'adapter should accept camelCase effectLabel');
assert.strictEqual(camelApproval.readonly, true, 'adapter should accept camelCase readOnly');

const autoResolved = adaptAgentEvent({
  type: 'approval.resolved',
  sequence: 10,
  data: {
    approval_id: 'ap_1',
    status: 'approved',
    auto_approved: true,
    decision_source: 'policy',
    policy_id: 'policy_1',
    resolved_by: 'u_1'
  }
});
assert.strictEqual(autoResolved.autoApproved, true, 'adapter should preserve automatic approval state');
assert.strictEqual(autoResolved.decisionSource, 'policy', 'adapter should preserve decision source');
assert.strictEqual(autoResolved.policyId, 'policy_1', 'adapter should preserve policy id');

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
