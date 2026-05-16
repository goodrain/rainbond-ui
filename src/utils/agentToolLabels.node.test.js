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
assert.ok(
  humanizeUnknownTool('rainbond_get_unicorn').startsWith('查看'),
  'get_* should humanize to 查看'
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
