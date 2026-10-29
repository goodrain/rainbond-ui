const assert = require('assert');
const {
  formatToolLabel,
  humanizeUnknownTool,
  BASE_LABELS,
} = require('./agentToolLabels');

// Known tools resolve to their curated label.
assert.strictEqual(
  formatToolLabel('rainbond_get_component_summary'),
  '查看组件概况'
);
assert.strictEqual(
  formatToolLabel('rainbond_query_cloud_markets'),
  '查询云市场列表'
);
assert.strictEqual(
  formatToolLabel('rainbond_kube_list_resources'),
  '查询 Kubernetes 资源'
);
assert.strictEqual(
  formatToolLabel('rainbond_kube_describe_resource'),
  '查看 Kubernetes 资源详情'
);
assert.strictEqual(
  formatToolLabel('rainbond_kube_get_logs'),
  '查看 Kubernetes 日志'
);
assert.strictEqual(
  formatToolLabel('rainbond_kube_delete_resource'),
  '删除 Kubernetes 资源'
);

// Manage_* family refines by input.operation when present.
assert.strictEqual(
  formatToolLabel('rainbond_manage_component_envs', { operation: 'create' }),
  '新增环境变量'
);
assert.strictEqual(
  formatToolLabel('rainbond_manage_component_envs', { operation: 'delete' }),
  '删除环境变量'
);
assert.strictEqual(
  formatToolLabel('rainbond_manage_component_envs', { operation: 'summary' }),
  '查看环境变量'
);
assert.strictEqual(
  formatToolLabel('rainbond_manage_component_envs', { operation: 'replace_build_envs' }),
  '修改构建源'
);
// Without operation, falls back to the base label.
assert.strictEqual(
  formatToolLabel('rainbond_manage_component_envs', {}),
  '管理环境变量'
);
assert.strictEqual(
  formatToolLabel('rainbond_update_component_build_source', {}),
  '修改构建源'
);

// Operate_app refines by operation too.
assert.strictEqual(
  formatToolLabel('rainbond_operate_app', { operation: 'restart' }),
  '重启组件'
);
assert.strictEqual(
  formatToolLabel('rainbond_operate_app', { operation: 'stop' }),
  '停止组件'
);
assert.strictEqual(
  formatToolLabel('rainbond_operate_app', { operation: 'deploy' }),
  '部署组件'
);

// Unknown tool falls back to humanized prefix verb.
assert.strictEqual(
  formatToolLabel('rainbond_brand_new_thing'),
  formatToolLabel('rainbond_brand_new_thing', undefined)
);
assert.strictEqual(
  humanizeUnknownTool('rainbond_get_unicorn'),
  '调用平台能力',
  'unknown tools must not leak English segments into visible copy'
);

// Empty / missing tool name yields the safe default.
assert.strictEqual(formatToolLabel(''), '工具调用');
assert.strictEqual(formatToolLabel(undefined), '工具调用');

// Sanity: BASE_LABELS exposes a non-trivial table.
assert.ok(
  Object.keys(BASE_LABELS).length > 30,
  'BASE_LABELS should cover the common tool surface'
);

console.log('agent tool label tests passed');

// 曾经缺失、导致英文名直出的两个工具
assert.strictEqual(formatToolLabel('rainbond_get_app_health_overview'), '查看应用健康概览');
assert.strictEqual(formatToolLabel('rainbond_probe_delivery_url'), '验证访问地址');

// 定时任务工具（此前会原样输出英文名）
assert.strictEqual(formatToolLabel('schedule_list_runs'), '查看定时任务运行记录');
assert.strictEqual(formatToolLabel('schedule_create_task'), '创建定时任务');
assert.strictEqual(humanizeUnknownTool('schedule_unknown_thing'), '定时任务操作');
