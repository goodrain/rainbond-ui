const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildMilestones,
  classifyTracePhase,
  getApprovalDisplayMeta,
  getTraceStatus,
  mergeAdjacentApprovals,
  splitTracesByRun
} = require('./milestones');

function traceMessage(id, toolName, title, extra = {}) {
  return {
    id,
    kind: 'trace',
    trace: {
      toolName,
      title,
      displayTitle: title,
      hasOutput: true,
      ...extra
    }
  };
}

function approvalMessage(id, description, status = 'approved') {
  return {
    id,
    kind: 'approval',
    content: description,
    approval: {
      approvalId: `ap_${id}`,
      description,
      status
    }
  };
}

test('classifies tool traces into the pipeline phases', () => {
  assert.equal(
    classifyTracePhase({
      toolName: 'rainbond_create_app',
      displayTitle: '创建应用'
    }),
    'create_app'
  );
  assert.equal(
    classifyTracePhase({
      toolName: 'rainbond_create_component_from_image',
      displayTitle: '从镜像创建组件'
    }),
    'create_component'
  );
  assert.equal(
    classifyTracePhase({
      toolName: 'rainbond_manage_component_ports',
      displayTitle: '管理组件端口'
    }),
    'configure_port'
  );
  assert.equal(
    classifyTracePhase({
      toolName: 'rainbond_build_component',
      displayTitle: '构建组件'
    }),
    'build'
  );
  assert.equal(
    classifyTracePhase({
      toolName: 'rainbond_operate_app',
      displayTitle: '启动组件'
    }),
    'deploy'
  );
  assert.equal(
    classifyTracePhase({
      toolName: 'rainbond_wait_component_ready',
      displayTitle: '等待实例就绪'
    }),
    'wait_instance'
  );
  assert.equal(
    classifyTracePhase({
      toolName: 'rainbond_create_gateway_rules',
      displayTitle: '创建网关规则'
    }),
    'verify_access'
  );
  assert.equal(
    classifyTracePhase({
      toolName: 'rainbond_get_component_build_logs',
      displayTitle: '查看构建日志'
    }),
    'diagnose'
  );
  assert.equal(
    classifyTracePhase({
      toolName: 'some_unknown_tool',
      displayTitle: '未知操作'
    }),
    'other'
  );
});

test('merges adjacent traces of the same phase and label', () => {
  const milestones = buildMilestones([
    traceMessage('t1', 'rainbond_get_component_build_logs', '查看构建日志'),
    traceMessage('t2', 'rainbond_get_component_build_logs', '查看构建日志'),
    traceMessage('t3', 'rainbond_get_component_build_logs', '查看构建日志'),
    traceMessage('t4', 'rainbond_get_component_build_logs', '查看构建日志')
  ]);

  assert.equal(milestones.length, 1);
  assert.equal(milestones[0].phaseLabel, '排障诊断');
  assert.equal(milestones[0].count, 4);
  assert.equal(milestones[0].resultText, '查看构建日志 ×4');
  assert.equal(milestones[0].status, 'done');
});

test('does not merge different phases even when adjacent', () => {
  const milestones = buildMilestones([
    traceMessage('t1', 'rainbond_build_component', '构建组件'),
    traceMessage('t2', 'rainbond_operate_app', '启动组件'),
    traceMessage('t3', 'rainbond_build_component', '构建组件')
  ]);

  assert.equal(milestones.length, 3);
  assert.deepEqual(
    milestones.map(item => item.phaseKey),
    ['build', 'deploy', 'build']
  );
});

test('does not merge the same phase with different labels', () => {
  const milestones = buildMilestones([
    traceMessage('t1', 'rainbond_get_component_events', '查看组件事件'),
    traceMessage('t2', 'rainbond_get_component_logs', '查看运行日志')
  ]);

  assert.equal(milestones.length, 2);
});

test('marks streaming and failed milestones', () => {
  const streaming = buildMilestones(
    [
      traceMessage('t1', 'rainbond_build_component', '构建组件', {
        hasOutput: false
      })
    ],
    { sending: true }
  );
  assert.equal(streaming[0].status, 'running');

  const failed = buildMilestones([
    traceMessage('t1', 'rainbond_build_component', '构建组件', {
      error: 'boom'
    })
  ]);
  assert.equal(failed[0].status, 'failed');

  assert.equal(getTraceStatus({ hasOutput: true }), 'done');
  assert.equal(getTraceStatus({ hasOutput: false }), 'running');
  assert.equal(getTraceStatus({ ok: false }), 'failed');
});

test('splits trace runs at user messages and approvals only', () => {
  const assistant = {
    id: 'm1',
    kind: 'normal',
    role: 'assistant',
    content: '继续'
  };
  const { runs, runIndexByTraceId } = splitTracesByRun([
    traceMessage('t1', 'rainbond_build_component', '构建组件'),
    assistant,
    traceMessage('t2', 'rainbond_get_component_logs', '查看运行日志'),
    {
      id: 'a1',
      kind: 'approval',
      approval: { description: '部署', status: 'pending' }
    },
    traceMessage('t3', 'rainbond_operate_app', '启动组件'),
    { id: 'u1', kind: 'normal', role: 'user', content: '继续' },
    traceMessage('t4', 'rainbond_build_component', '构建组件')
  ]);

  assert.equal(runs.length, 3);
  assert.equal(runs[0].length, 2);
  assert.equal(runs[1].length, 1);
  assert.equal(runs[2].length, 1);
  assert.equal(runIndexByTraceId.get('t1'), 0);
  assert.equal(runIndexByTraceId.get('t2'), 0);
  assert.equal(runIndexByTraceId.get('t3'), 1);
  assert.equal(runIndexByTraceId.get('t4'), 2);
});

test('merges adjacent approvals with the same description', () => {
  const merged = mergeAdjacentApprovals([
    approvalMessage('a1', '部署当前应用'),
    approvalMessage('a2', '部署当前应用'),
    approvalMessage('a3', '部署当前应用')
  ]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].mergedApprovalCount, 3);
  assert.equal(merged[0].mergedReuseCount, 2);
  assert.equal(merged[0].content, '部署当前应用');
});

test('keeps a pending approval interactive when folded with resolved ones', () => {
  const merged = mergeAdjacentApprovals([
    approvalMessage('a1', '部署当前应用', 'approved'),
    approvalMessage('a2', '部署当前应用', 'pending')
  ]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].approval.status, 'pending');
  assert.equal(merged[1], undefined);
});

test('does not merge approvals separated by another item or with another description', () => {
  const merged = mergeAdjacentApprovals([
    approvalMessage('a1', '部署当前应用'),
    traceMessage('t1', 'rainbond_build_component', '构建组件'),
    approvalMessage('a2', '部署当前应用'),
    approvalMessage('a3', '删除当前应用')
  ]);

  assert.equal(merged.length, 4);
  assert.equal(merged[0].mergedApprovalCount, undefined);
  assert.equal(merged[2].mergedApprovalCount, undefined);
  assert.equal(merged[3].mergedApprovalCount, undefined);
});

test('handles empty input', () => {
  assert.deepEqual(buildMilestones([]), []);
  assert.deepEqual(buildMilestones(), []);
  assert.deepEqual(mergeAdjacentApprovals([]), []);
  assert.deepEqual(mergeAdjacentApprovals(), []);
});

test('reads new approval display fields with legacy fallbacks', () => {
  const readonly = getApprovalDisplayMeta(
    {
      description: '查看应用详情',
      action_label: '查看应用详情',
      object_label: 'web',
      effect_label: '只读，不会修改集群',
      readonly: true,
      risk: 'high'
    },
    { content: '查看应用详情' }
  );

  assert.equal(readonly.actionLabel, '查看应用详情');
  assert.equal(readonly.objectLabel, 'web');
  assert.equal(readonly.effectLabel, '只读，不会修改集群');
  assert.equal(readonly.readonly, true);

  const camelCase = getApprovalDisplayMeta(
    {
      actionLabel: '重启组件',
      objectLabel: 'api',
      effectLabel: '会短暂中断服务',
      readOnly: 'true'
    },
    {}
  );
  assert.equal(camelCase.actionLabel, '重启组件');
  assert.equal(camelCase.objectLabel, 'api');
  assert.equal(camelCase.readonly, true);

  const fallback = getApprovalDisplayMeta({}, { content: '回滚当前应用' });
  assert.equal(fallback.actionLabel, '回滚当前应用');
  assert.equal(fallback.objectLabel, '');
  assert.equal(fallback.effectLabel, '');
  assert.equal(fallback.readonly, false);
});
