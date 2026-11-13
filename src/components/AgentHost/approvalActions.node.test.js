const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const React = require('react');
const { transformSync } = require('@babel/core');
const policy = require('./autoApprovalPolicy');

function card(approval, decide) {
  const source = fs.readFileSync(`${__dirname}/index.js`, 'utf8');
  const component = source.slice(source.indexOf('class ApprovalMessageCard'), source.indexOf('class SuggestedActionsCard'));
  const { code } = transformSync(`${component}\nmodule.exports = ApprovalMessageCard;`, {
    babelrc: false, configFile: false, presets: [require('@umijs/deps/compiled/babel/preset-react').default],
  });
  const context = { module: { exports: {} }, React, PureComponent: React.PureComponent, Button: 'button',
    autoApprovalPolicy: policy, styles: new Proxy({}, { get: (_, key) => key }) };
  vm.runInNewContext(code, context);
  return new context.module.exports({ approval, onDecision: decide, isDeciding: false });
}
function buttons(element) {
  if (!element) return [];
  return [ ...(element.type === 'button' ? [element] : []),
    ...React.Children.toArray(element.props && element.props.children).flatMap(buttons) ];
}
test('approval actions are three flat choices and always allow creates only the session rule', () => {
  const decisions = [];
  const instance = card({ risk: 'medium', autoApprovalEligible: true }, (...args) => decisions.push(args));
  const actions = buttons(instance.renderActions());
  assert.deepEqual(actions.map(item => item.props.children), ['始终允许', '本次允许', '拒绝']);
  actions.forEach(item => item.props.onClick());
  assert.equal(decisions[0][0], 'approved');
  assert.equal(decisions[0][1].kind, 'session_all');
  assert.deepEqual(decisions[1], ['approved']);
  assert.deepEqual(decisions[2], ['rejected']);
});
test('medium-risk environment deletion still needs manual approval', () => {
  const instance = card({ risk: 'medium', autoApprovalEligible: false, input: { operation: 'delete' } }, () => {});
  const actions = buttons(instance.renderActions());
  assert.equal(actions.length, 3);
  assert.equal(actions[0].props.disabled, true);
  assert.equal(actions[1].props.disabled, false);
  assert.equal(actions[2].props.disabled, false);
});

test('old option descriptions render as plain answer text without active fallback cards', () => {
  const source = fs.readFileSync(`${__dirname}/index.js`, 'utf8');
  const start = source.indexOf('  renderTurnAnswer =');
  const end = source.indexOf('  renderTurnNotice =', start);
  const { code } = transformSync(source.slice(start, end), { babelrc: false, configFile: false,
    presets: [require('@umijs/deps/compiled/babel/preset-react').default] });
  const context = { React, styles: {}, AssistantMarkdownBody: 'markdown', displayFilters: require('./displayFilters') };
  vm.runInNewContext(code, context);
  const rendered = context.renderTurnAnswer({ id: 'old', content: '历史分析', suggestedActions: [
    { source: 'llm_fallback', optionKey: 'A', label: '降低资源', description: '调整内存配置' },
  ] });
  assert.match(rendered.props.children.props.content, /调整内存配置/);
});
