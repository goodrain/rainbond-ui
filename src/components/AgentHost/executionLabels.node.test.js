const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { describeExecution, describeTool } = require('./executionLabels');
const context = { module: { exports: {} } };
vm.runInNewContext(fs.readFileSync(`${__dirname}/../../locales/zh-CN/agentExecution.js`, 'utf8')
  .replace('export default', 'module.exports ='), context);
const t = (id, values = {}) => context.module.exports[`agent.execution.${id}`]
  .replace(/\{(\w+)\}/g, (_, key) => values[key] || '');
const trace = (name, extra = {}) => ({ kind: 'trace', trace: { toolName: name, ...extra } });
function turn(process, extra = {}) {
  return { process, nodes: [], pendingApprovals: [], running: true, waiting: false, ...extra };
}

test('skill activity names come from the selected skill and actual module file', () => {
  assert.equal(describeTool({ toolName: 'select_skill_rainbond-app-assistant' }, t).name, '选择「应用部署」技能');
  assert.equal(describeTool({ toolName: 'read_skill_module', inputSignature: JSON.stringify({
    skill_id: 'rainbond-app-assistant', module_path: 'modules/static-build.md',
  }) }, t).name, '读取「应用部署」技能：static-build');
  assert.match(describeTool({ toolName: 'skill', inputSignature: '{"name":"custom-skill"}' }, t).name, /custom-skill/);
});

test('live API activity changes to analysis only after returned information is available', () => {
  const query = trace('rainbond_get_component_summary', { target: 'app', hasOutput: false });
  assert.equal(describeExecution(turn([query]), t).text, '查看组件概况 · app');
  const returned = { ...query, trace: { ...query.trace, hasOutput: true } };
  assert.equal(describeExecution(turn([returned], { nodes: [{ output: { reasoningStreaming: true } }] }), t).text,
    '分析组件概况的返回信息…');
  assert.equal(describeExecution(turn([]), t).text, '正在分析你的请求…');
});

test('repeated queries use stable activity text without cycling counts or synthetic stages', () => {
  const rows = [1, 2, 3, 4].map(id => trace('rainbond_get_component_build_logs', { toolCallId: id, target: 'app' }));
  const third = describeExecution(turn(rows.slice(0, 3)), t).text;
  assert.equal(third, '持续查看构建日志 · app…');
  assert.equal(describeExecution(turn(rows), t).text, third);
});

test('closed card titles prefer real business operations and never turn failed attempts into success claims', () => {
  const rows = [trace('skill', { inputSignature: '{"name":"rainbond-app-assistant"}' }),
    trace('rainbond_create_app', { target: 'demo-2048', isError: true }), trace('rainbond_get_app_detail')];
  const text = describeExecution(turn(rows, { running: false, failed: true }), t).text;
  assert.equal(text, '创建应用 · demo-2048');
  assert.doesNotMatch(text, /此前执行记录|失败|错误|成功|完成/);
  assert.equal(rows[1].trace.isError, true);
});

test('manager actions use their actual operation and approvals identify the requested action', () => {
  assert.equal(describeTool({ toolName: 'rainbond_manage_component_env_vars', inputSignature: '{"operation":"delete"}' }, t).rank, 2);
  const pending = { content: '创建源码组件 app', approval: { status: 'pending' } };
  assert.equal(describeExecution(turn([], { waiting: true, pendingApprovals: [pending] }), t).text, '等待批准：创建源码组件 app');
});
