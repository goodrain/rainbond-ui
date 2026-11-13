const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
// React 16's browser scheduler otherwise leaves Node's MessagePorts open.
const nativeMessageChannel = global.MessageChannel;
global.MessageChannel = undefined;
const React = require('react');
const ReactDOM = require('react-dom');
const { act } = require('react-dom/test-utils');
const { renderToStaticMarkup } = require('react-dom/server');
global.MessageChannel = nativeMessageChannel;
const { transformSync } = require('@babel/core');
const { groupConversationMessages } = require('./turnPresentation');
const styles = new Proxy({}, { get: (_, key) => key });
const formatMessage = ({ id }, values = {}) => `${id}:${values.count || ''}`;
const Icon = ({ type, className }) => React.createElement('i', { 'data-icon': type, className });
function load(name, dependencies = {}) {
  const source = fs.readFileSync(`${__dirname}/${name}.js`, 'utf8')
    .replace(/^import[^;]+;\n/gm, '').replace('export default class', 'class');
  const { code } = transformSync(`${source}\nmodule.exports = ${name};`, {
    babelrc: false, configFile: false, presets: [require('@umijs/deps/compiled/babel/preset-react').default],
  });
  const context = { module: { exports: {} }, React, PureComponent: React.PureComponent,
    Icon, formatMessage, styles, ...dependencies };
  vm.runInNewContext(code, context);
  return context.module.exports;
}
const executionLabels = require('./executionLabels');
const ApprovalRecord = load('ApprovalRecord');
const ExecutionDisclosure = load('ExecutionDisclosure');
const ToolCallRow = load('ToolCallRow', { executionLabels });
const AiExecutionIndicator = load('AiExecutionIndicator');
const ExecutionTurn = load('ExecutionTurn', { ExecutionDisclosure, executionLabels, ApprovalRecord, AiExecutionIndicator });
const ConversationTurn = load('ConversationTurn', { ExecutionTurn });
function messages(count = 3, approval) {
  const rows = [{ id: 'user', role: 'user', kind: 'normal', content: 'upgrade' }];
  for (let round = 1; round <= count; round += 1) {
    rows.push({ id: `m${round}`, role: 'assistant', kind: 'normal', reasoning: `thought ${round}` });
    rows.push({ id: `t${round}`, kind: 'trace', trace: { toolCallId: `call${round}`, title: `tool ${round}` } });
  }
  if (approval) rows.push({ id: 'approval', kind: 'approval', content: 'upgrade app',
    approval: { approvalId: 'a', toolCallId: 'call1', ...approval } });
  return rows;
}
function mount(rows, live = false, Component = ExecutionTurn) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const requests = [];
  let turn;
  let harness;
  class Harness extends React.Component {
    state = { following: true };
    render() {
      return React.createElement(Component, {
        ref: instance => { turn = instance; },
        turn: this.props.turn, following: this.state.following,
        onViewChange: options => { requests.push(options); if (typeof options.follow === 'boolean') this.setState({ following: options.follow }); },
        renderTrace: item => React.createElement(ToolCallRow, { key: item.id, item }),
        renderApproval: item => React.createElement('div', { key: item.id, 'data-approval-action': item.approval.approvalId }, React.createElement('button', {}, '本次允许')),
        renderProcessAnswer: () => null, renderNotice: item => React.createElement('div', { key: item.id, 'data-notice': item.id }, item.content),
        renderAnswer: item => React.createElement('div', { key: `answer:${item.id}`, 'data-body': item.id }, item.content),
      });
    }
  }
  const update = (next, sending = live) => act(() => {
    ReactDOM.render(React.createElement(Harness, { ref: instance => { harness = instance; },
      turn: groupConversationMessages(next, { sending })[1] }), container);
  });
  update(rows);
  return { container, requests, update,
    get turn() { return turn; }, get harness() { return harness; },
    click: element => act(() => { element.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }),
    outer: () => container.querySelector('button[aria-controls$=":execution"]'),
    rounds: () => [...container.querySelectorAll('.executionNode')],
    thoughts: () => [...container.querySelectorAll('button[aria-controls$=":reasoning"]')],
    thought: () => container.querySelector('button[aria-controls$=":reasoning"][aria-expanded="true"]') || container.querySelector('button[aria-controls$=":reasoning"]'),
    destroy: () => { act(() => { ReactDOM.unmountComponentAtNode(container); }); container.remove(); },
  };
}
after(() => dom.window.close());

test('opening execution shows one timeline group per model message without round labels or counts', () => {
  const ui = mount(messages());
  ui.click(ui.outer());
  assert.equal(ui.rounds().length, 3);
  assert.equal(ui.rounds()[0].tagName, 'LI');
  assert.doesNotMatch(ui.container.textContent, /roundNumber|recordedRound|reasoningCount|callCount/);
  assert.equal(ui.container.querySelectorAll('button[aria-controls$=":details"]').length, 0);
  assert.equal(ui.container.querySelectorAll('.executionToolRow').length, 3);
  assert.deepEqual(ui.thoughts().map(button => button.getAttribute('aria-expanded')), ['false', 'false', 'false']);
  assert.equal(ui.thought().getAttribute('aria-expanded'), 'false');
  ui.click(ui.thoughts()[0]);
  assert.deepEqual(ui.thoughts().map(button => button.getAttribute('aria-expanded')), ['true', 'false', 'false']);
  assert.match(ui.container.textContent, /thought 1/);
  assert.doesNotMatch(ui.container.textContent, /thought 3|latestRound|previousRounds/);
  ui.destroy();
});

test('new model rounds do not automatically expand any reasoning', () => {
  const ui = mount(messages(), true);
  ui.click(ui.outer());
  assert.equal(ui.harness.state.following, true);
  ui.update(messages(4));
  assert.deepEqual(ui.thoughts().map(button => button.getAttribute('aria-expanded')), ['false', 'false', 'false', 'false']);
  ui.click(ui.thoughts()[3]);
  assert.equal(ui.harness.state.following, false);
  ui.update(messages(5));
  assert.equal(ui.thoughts()[3].getAttribute('aria-expanded'), 'true');
  assert.equal(ui.thoughts()[4].getAttribute('aria-expanded'), 'false');
  ui.destroy();
});

test('resuming outer follow preserves manually selected reasoning without opening the latest one', () => {
  const ui = mount(messages(), true);
  ui.click(ui.outer());
  ui.click(ui.thoughts()[0]);
  assert.equal(ui.harness.state.following, false);
  ui.update(messages(4));
  act(() => { ui.harness.setState({ following: true }); });
  assert.equal(ui.thoughts()[0].getAttribute('aria-expanded'), 'true');
  assert.equal(ui.thoughts()[3].getAttribute('aria-expanded'), 'false');
  ui.destroy();
});

test('explicitly collapsed reasoning stays collapsed across both deltas and new rounds', () => {
  const ui = mount(messages(), true);
  ui.click(ui.outer());
  ui.click(ui.thoughts()[2]);
  ui.click(ui.thoughts()[2]);
  const next = messages();
  next.find(item => item.id === 'm3').reasoning += ' appended';
  ui.update(next);
  ui.update(messages(4));
  assert.ok(ui.thoughts().every(button => button.getAttribute('aria-expanded') === 'false'));
  ui.destroy();
});

test('returning to the bottom preserves expanded reasoning in a completed segment', () => {
  const rows = [...messages(2), { id: 'final', role: 'assistant', kind: 'normal', content: '完成。', isFinalAnswer: true }];
  const ui = mount(rows, false, ConversationTurn);
  ui.click(ui.outer());
  ui.click(ui.thoughts()[0]);
  assert.equal(ui.harness.state.following, false);
  act(() => { ui.harness.setState({ following: true }); });
  assert.equal(ui.outer().getAttribute('aria-expanded'), 'true');
  assert.equal(ui.thoughts()[0].getAttribute('aria-expanded'), 'true');
  assert.match(ui.container.textContent, /thought 1/);
  ui.destroy();
});

test('closing execution details keeps outer follow enabled and reopening keeps reasoning collapsed', () => {
  const ui = mount(messages(), true);
  ui.click(ui.outer());
  ui.click(ui.outer());
  ui.update(messages(4));
  assert.equal(ui.outer().getAttribute('aria-expanded'), 'false');
  assert.equal(ui.harness.state.following, true);
  ui.click(ui.outer());
  assert.ok(ui.thoughts().every(button => button.getAttribute('aria-expanded') === 'false'));
  assert.equal(ui.harness.state.following, true);
  ui.destroy();
});

test('approval decisions stay inside their timeline group and pending actions stay outside', () => {
  for (const status of ['pending', 'approved', 'rejected', 'cancelled']) {
    const ui = mount(messages(3, { status }), false, ConversationTurn);
    assert.equal(ui.outer().getAttribute('aria-expanded'), 'false');
    assert.equal(ui.harness.state.following, true);
    const actions = ui.container.querySelectorAll('[data-approval-action="a"]');
    assert.equal(actions.length, status === 'pending' ? 1 : 0);
    if (actions.length) assert.equal(actions[0].closest('.executionProcess'), null);
    ui.click(ui.outer());
    const records = ui.container.querySelectorAll('[data-approval-record="a"]');
    assert.equal(records.length, 1);
    assert.ok(records[0].closest('.executionNode'));
    assert.equal(records[0].querySelector('button'), null);
    ui.destroy();
  }
});

test('a late pending approval stays outside while the outer conversation follows with details collapsed', () => {
  const ui = mount(messages(), true, ConversationTurn);
  ui.update(messages(3, { status: 'pending' }), false);
  assert.equal(ui.outer().getAttribute('aria-expanded'), 'false');
  assert.equal(ui.harness.state.following, true);
  assert.ok(ui.container.querySelector('[data-approval-action="a"] button'));
  assert.equal(ui.container.querySelectorAll('[data-approval-record]').length, 0);
  ui.click(ui.outer());
  assert.ok(ui.container.querySelector('[data-approval-record="a"]'));
  ui.destroy();
});

test('reasoning remains complete for long text and no execution layer adds a vertical scroll', () => {
  const rows = messages(1);
  rows[1].reasoning = '完整思考内容'.repeat(8000);
  const ui = mount(rows);
  ui.click(ui.outer());
  ui.click(ui.thoughts()[0]);
  assert.equal(ui.container.querySelector('.executionThoughtContent').textContent, rows[1].reasoning);
  const less = fs.readFileSync(`${__dirname}/index.less`, 'utf8');
  for (const selector of ['executionLog', 'executionThoughtContent']) {
    const rule = less.match(new RegExp(`\\.${selector}\\s*\\{([^}]+)\\}`))[1];
    assert.doesNotMatch(rule, /max-height|overflow-y|overscroll-behavior/);
  }
  ui.destroy();
});

test('large histories keep the previous tool layout and expand one thought at a time', () => {
  const ui = mount(messages(80));
  ui.click(ui.outer());
  assert.equal(ui.rounds().length, 80);
  assert.equal(ui.container.querySelectorAll('.executionToolRow').length, 80);
  assert.equal(ui.container.querySelectorAll('.executionThoughtContent:not([hidden])').length, 0);
  ui.click(ui.thoughts()[0]);
  assert.equal(ui.container.querySelectorAll('.executionToolRow').length, 80);
  assert.match(ui.container.textContent, /thought 1/);
  ui.destroy();
});

test('tool rows show semantic action icons without parameters, results or failure warnings', () => {
  for (const [toolName, icon] of [['query_pods', 'search'], ['skill', 'book'], ['rainbond_upgrade_app', 'code'], ['custom_tool', 'api']]) {
    const item = { trace: { toolName, displayTitle: '查看组件 Pod', status: 'returned',
      target: 'private target', inputDetail: 'secret input', outputDetail: 'large output',
      sources: [{ url: 'https://example.com/private', title: 'source title' }] } };
    const markup = renderToStaticMarkup(React.createElement(ToolCallRow, { item }));
    assert.match(markup, new RegExp(`data-icon="${icon}"`));
    assert.doesNotMatch(markup, /button|private|secret|large output|source title|toolReturned|已返回|tool-detail/);
  }
});

test('controlled disclosures retain native buttons and place the reasoning chevron on the right', () => {
  const ui = mount(messages());
  act(() => ui.outer().click());
  const first = ui.thoughts()[0];
  act(() => first.click());
  assert.equal(first.getAttribute('aria-expanded'), 'true');
  const children = [...ui.thought().children];
  assert.equal(children[0].getAttribute('data-icon'), 'bulb');
  assert.equal(children.at(-1).getAttribute('data-icon'), 'down');
  ui.destroy();
});

test('checkpoint prose stays visible and each next execution card waits for an explicit click', () => {
  const rows = messages(2);
  const ui = mount(rows, true, ConversationTurn);
  ui.click(ui.outer());
  const checkpoint = { id: 'checkpoint', streamMessageId: 'checkpoint', role: 'assistant', kind: 'normal',
    reasoning: 'confirmed evidence', content: '问题已经定位，正在修复。', messageKind: 'progress', streaming: true };
  ui.update([...rows, checkpoint]);
  const body = ui.container.querySelector('[data-body="checkpoint"]');
  assert.ok(body);
  assert.equal(body.closest('.executionProcess'), null);
  assert.equal(ui.outer().getAttribute('aria-expanded'), 'true');
  const repair = { id: 'repair', kind: 'trace', trace: { toolCallId: 'repair', title: '更新配置' } };
  ui.update([...rows, { ...checkpoint, streaming: false }, repair]);
  const processes = [...ui.container.querySelectorAll('button[aria-controls$=":execution"]')];
  assert.deepEqual(processes.map(button => button.getAttribute('aria-expanded')), ['true', 'false']);
  assert.equal(ui.harness.state.following, true);
  ui.click(processes[1]);
  assert.equal(ui.harness.state.following, true);
  assert.equal(ui.container.querySelector('[data-body="checkpoint"]'), body);
  assert.match(ui.container.textContent, /更新配置/);
  const final = { id: 'final', role: 'assistant', kind: 'normal', content: '修复并验证完成。', isFinalAnswer: true };
  ui.update([...rows, { ...checkpoint, streaming: false }, repair, final], false);
  assert.equal(ui.container.querySelectorAll('[data-body]').length, 2);
  assert.equal(ui.container.querySelectorAll('.messageRole').length, 1);
  assert.match(ui.container.textContent, /问题已经定位/);
  assert.match(ui.container.textContent, /修复并验证完成/);
  ui.destroy();
});

test('reading an earlier segment pauses follow and resume opens only the current segment', () => {
  const checkpoint = { id: 'checkpoint', role: 'assistant', kind: 'normal', content: '已确认原因。' };
  const rows = [...messages(2), checkpoint, { id: 'repair', kind: 'trace', trace: { toolCallId: 'repair', title: '修复' } }];
  const ui = mount(rows, true, ConversationTurn);
  ui.click(ui.outer());
  assert.equal(ui.harness.state.following, false);
  ui.update([...rows, { id: 'next', role: 'assistant', kind: 'normal', reasoning: 'verify' }]);
  let processes = [...ui.container.querySelectorAll('button[aria-controls$=":execution"]')];
  assert.deepEqual(processes.map(button => button.getAttribute('aria-expanded')), ['true', 'false']);
  ui.click(processes[1]);
  processes = [...ui.container.querySelectorAll('button[aria-controls$=":execution"]')];
  assert.deepEqual(processes.map(button => button.getAttribute('aria-expanded')), ['false', 'true']);
  assert.equal(ui.harness.state.following, true);
  ui.destroy();
});

test('execution warnings are hidden while actual prose results remain visible', () => {
  const rows = [...messages(1), { id: 'error', kind: 'error', content: 'runtime error warning' },
    { id: 'final', role: 'assistant', kind: 'normal', content: '构建未通过，请检查配置。', isFinalAnswer: true }];
  rows[2].trace.isError = true;
  const ui = mount(rows, false, ConversationTurn);
  ui.click(ui.outer());
  assert.doesNotMatch(ui.container.textContent, /runtime error warning|failedCallCount|toolFailed|执行失败/);
  assert.equal(ui.container.querySelectorAll('.executionFailure, .executionToolFailed').length, 0);
  assert.match(ui.container.textContent, /构建未通过，请检查配置/);
  ui.destroy();
});
