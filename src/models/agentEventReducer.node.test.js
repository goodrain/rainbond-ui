const assert = require('assert');

const {
  applyAgentEvent,
  createAgentMessage,
} = require('./agentEventReducer');

const baseState = {
  messages: [],
  pendingApproval: null,
  lastEventSequence: 0,
  debugPromptData: null,
};

const firstState = applyAgentEvent(baseState, {
  event: {
    type: 'chat.trace',
    sequence: 2,
    data: {
      tool_name: 'rainbond_get_component_logs',
      input: { name: 'api' }
    }
  },
  contextSnapshot: { appId: 'app-1' }
});

assert.strictEqual(firstState.messages.length, 1, 'trace event should create one trace message');
assert.strictEqual(firstState.messages[0].kind, 'trace', 'trace event should render as a trace message');
assert.strictEqual(firstState.lastEventSequence, 2, 'trace event should advance last sequence');

const approvalState = applyAgentEvent(firstState, {
  event: {
    type: 'approval.requested',
    sequence: 4,
    sessionId: 'cs_1',
    runId: 'run_1',
    data: {
      approval_id: 'ap_1',
      description: '需要审批',
      risk: 'high'
    }
  },
  contextSnapshot: { appId: 'app-1' }
});

assert.strictEqual(approvalState.pendingApproval.approvalId, 'ap_1', 'approval request should update pending approval');
assert.strictEqual(approvalState.messages.length, 2, 'approval request should append an approval message');

const resolvedState = applyAgentEvent(approvalState, {
  event: {
    type: 'approval.resolved',
    sequence: 5,
    data: {
      approval_id: 'ap_1',
      status: 'approved'
    }
  },
  contextSnapshot: { appId: 'app-1' }
});

assert.strictEqual(resolvedState.pendingApproval, null, 'approval resolve should clear matching pending approval');
assert.strictEqual(
  resolvedState.messages[1].approval.status,
  'approved',
  'approval resolve should update the existing approval message status'
);

const assistantState = applyAgentEvent(resolvedState, {
  event: {
    type: 'chat.message',
    sequence: 6,
    data: {
      role: 'assistant',
      content: '处理完成'
    }
  },
  contextSnapshot: { appId: 'app-1' }
});

assert.strictEqual(assistantState.messages.length, 3, 'assistant chat event should append a normal message');
assert.strictEqual(assistantState.messages[2].content, '处理完成', 'assistant message should preserve content');

const custom = createAgentMessage('system', 'status', '测试');
assert.strictEqual(custom.kind, 'status', 'helper should create the requested message kind');

const approvalWithTarget = applyAgentEvent(baseState, {
  event: {
    type: 'approval.requested',
    sequence: 7,
    sessionId: 'cs_2',
    runId: 'run_2',
    data: {
      approval_id: 'ap_2',
      description: '需要审批',
      risk: 'high',
      skill_id: 'rainbond_delete_component',
      target_ref: { team_name: 't1', region_name: 'r1', app_id: 'a1', service_alias: 'svc1' },
      scope: 'component',
      scope_label: '组件',
      level_label: '高风险'
    }
  },
  contextSnapshot: { appId: 'app-1' }
});

assert.strictEqual(approvalWithTarget.pendingApproval.skillId, 'rainbond_delete_component', 'pendingApproval should carry skill_id');
assert.deepStrictEqual(
  approvalWithTarget.pendingApproval.targetRef,
  { team_name: 't1', region_name: 'r1', app_id: 'a1', service_alias: 'svc1' },
  'pendingApproval should carry target_ref'
);
assert.strictEqual(approvalWithTarget.pendingApproval.scope, 'component', 'pendingApproval should carry scope');
assert.strictEqual(approvalWithTarget.pendingApproval.scopeLabel, '组件', 'pendingApproval should carry scope_label');
assert.strictEqual(approvalWithTarget.pendingApproval.levelLabel, '高风险', 'pendingApproval should carry level_label');

console.log('agent event reducer tests passed');
