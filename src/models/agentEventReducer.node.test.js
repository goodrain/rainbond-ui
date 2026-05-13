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

const suggestedState = applyAgentEvent(assistantState, {
  event: {
    type: 'chat.suggested_actions',
    sequence: 7,
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
  },
  contextSnapshot: { appId: 'app-1' }
});

assert.strictEqual(suggestedState.messages.length, 3, 'suggested action event should attach to the latest assistant message');
assert.strictEqual(suggestedState.messages[2].kind, 'normal', 'assistant message kind should stay normal');
assert.deepStrictEqual(suggestedState.messages[2].suggestedActions, [
  {
    actionId: 'sa_scale_component_memory',
    optionKey: 'A',
    label: '调回合理资源',
    description: '将组件调整到 250m CPU / 512MB 内存',
    requiresApproval: true,
    source: 'workflow'
  }
], 'latest assistant message should carry parsed suggested actions');

const workflowFallbackState = applyAgentEvent(assistantState, {
  event: {
    type: 'workflow.completed',
    sequence: 8,
    data: {
      structured_result: {
        summary: '分析完成',
        suggestedActions: [
          {
            actionId: 'sa_get_component_logs',
            optionKey: '1',
            label: '先抓日志',
            description: '先查看最近 200 行日志再决定是否修复',
            requiresApproval: false,
            source: 'workflow'
          }
        ]
      }
    }
  },
  contextSnapshot: { appId: 'app-1' }
});

assert.deepStrictEqual(workflowFallbackState.messages[2].suggestedActions, [
  {
    actionId: 'sa_get_component_logs',
    optionKey: '1',
    label: '先抓日志',
    description: '先查看最近 200 行日志再决定是否修复',
    requiresApproval: false,
    source: 'workflow'
  }
], 'workflow completion should backfill suggested actions when chat.suggested_actions is absent');

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

// Regression: concurrent SSE streams may deliver the same approval.requested
// event twice. The reducer must dedupe by approvalId so only one approval
// card is rendered.
const dedupeBase = {
  messages: [],
  pendingApproval: null,
  lastEventSequence: 0,
  debugPromptData: null,
};
const dedupeFirst = applyAgentEvent(dedupeBase, {
  event: {
    type: 'approval.requested',
    sequence: 10,
    sessionId: 'cs_dup',
    runId: 'run_dup',
    data: {
      approval_id: 'ap_dup',
      description: '重复审批',
      risk: 'high'
    }
  },
  contextSnapshot: { appId: 'app-1' }
});
const dedupeSecond = applyAgentEvent(dedupeFirst, {
  event: {
    type: 'approval.requested',
    sequence: 11,
    sessionId: 'cs_dup',
    runId: 'run_dup',
    data: {
      approval_id: 'ap_dup',
      description: '重复审批',
      risk: 'high'
    }
  },
  contextSnapshot: { appId: 'app-1' }
});

const dedupeApprovalMessages = dedupeSecond.messages.filter(
  m => m.kind === 'approval' && m.approval && m.approval.approvalId === 'ap_dup'
);
assert.strictEqual(
  dedupeApprovalMessages.length,
  1,
  'duplicate approval.requested events should produce only one approval message'
);
assert.strictEqual(
  dedupeSecond.pendingApproval && dedupeSecond.pendingApproval.approvalId,
  'ap_dup',
  'pendingApproval should still reflect the approval after dedupe'
);

// F14 — backend emits compaction.started / compaction.completed /
// compaction.failed / compaction.forced_sync_due_to_pressure SSE events
// in the 2_000_000_001+ sequence band. The local reducer must surface a
// `compaction` slice so the UI can show a "compressing" banner while the
// async pass is in flight (and a brief warning if the pass failed).
const {
  applyCompactionEvent,
  defaultCompactionState,
} = require('./agentCompactionReducer');

// Case 1: compaction.started → active=true, mode captured.
const startedState = applyCompactionEvent(defaultCompactionState, {
  type: 'compaction.started',
  data: { mode: 'async', input_chars: 14000, turn: 3 },
});
assert.strictEqual(startedState.active, true, 'compaction.started should set active=true');
assert.strictEqual(startedState.mode, 'async', 'compaction.started should record the mode');
assert.strictEqual(startedState.lastFailedAt, 0, 'compaction.started should not touch lastFailedAt');
assert.strictEqual(startedState.lastFailedReason, '', 'compaction.started should not touch lastFailedReason');

// Case 2: compaction.completed clears active.
const completedState = applyCompactionEvent(startedState, {
  type: 'compaction.completed',
  data: { output_chars: 4200 },
});
assert.strictEqual(completedState.active, false, 'compaction.completed should clear active');
// Mode is allowed to be retained or cleared; spec says active=false is the requirement.

// Case 3: compaction.failed clears active and records failure context.
const failedState = applyCompactionEvent(startedState, {
  type: 'compaction.failed',
  data: { reason: 'llm_timeout' },
});
assert.strictEqual(failedState.active, false, 'compaction.failed should clear active');
assert.strictEqual(failedState.lastFailedReason, 'llm_timeout', 'compaction.failed should record the reason');
assert.ok(
  failedState.lastFailedAt > 0,
  'compaction.failed should record lastFailedAt as a positive timestamp'
);

// Case 4: compaction.forced_sync_due_to_pressure upgrades mode to sync_forced
// (active stays true because the upgrade is mid-flight; backend follows up
// with completed / failed afterwards).
const upgradedState = applyCompactionEvent(startedState, {
  type: 'compaction.forced_sync_due_to_pressure',
  data: {},
});
assert.strictEqual(upgradedState.active, true, 'forced_sync upgrade should keep active=true');
assert.strictEqual(
  upgradedState.mode,
  'sync_forced',
  'forced_sync upgrade should set mode=sync_forced'
);

// Case 5 (extra robustness): non-compaction events leave the slice untouched
// by reference equality — the UI relies on this for shallow re-render skip.
const passthroughState = applyCompactionEvent(startedState, {
  type: 'chat.message',
  data: {},
});
assert.strictEqual(passthroughState, startedState, 'unrelated events should return the same reference');

// Case 6: malformed events are tolerated.
const safeState = applyCompactionEvent(defaultCompactionState, null);
assert.strictEqual(safeState, defaultCompactionState, 'null event should not mutate compaction state');
const safeState2 = applyCompactionEvent(defaultCompactionState, { type: '' });
assert.strictEqual(safeState2, defaultCompactionState, 'empty type event should not mutate compaction state');

console.log('agent event reducer tests passed');
