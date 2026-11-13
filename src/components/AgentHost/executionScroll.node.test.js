const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const React = require('react');
const { transformSync } = require('@babel/core');
const scrollBehavior = require('./scrollBehavior');
const source = fs.readFileSync(`${__dirname}/index.js`, 'utf8');
const { code } = transformSync(source.slice(source.indexOf('export default class AgentHost'))
  .replace('export default class', 'class') + '\nmodule.exports = AgentHost;', {
  babelrc: false, configFile: false, presets: [require('@umijs/deps/compiled/babel/preset-react').default],
});
function host() {
  const frames = new Map();
  let nextFrame = 0;
  const context = { module: { exports: {} }, React, PureComponent: React.PureComponent,
    window: { requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
      cancelAnimationFrame: id => frames.delete(id) }, ...scrollBehavior,
    hasRenderableMessages: () => true, turnPresentation: require('./turnPresentation'),
    ConversationTurn: 'conversation-turn', UserMessageRow: 'user-row',
  };
  vm.runInNewContext(code, context);
  const instance = new context.module.exports({ agent: { visible: true, sending: true, messages: [] } });
  instance.setState = update => {
    instance.state = { ...instance.state, ...(typeof update === 'function' ? update(instance.state) : update) };
  };
  instance.messagesRef = { scrollTop: 100, scrollHeight: 1000, clientHeight: 400,
    getBoundingClientRect: () => ({ top: 0, bottom: 400 }) };
  return { instance, frames, flush: () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); } };
}

test('streaming deltas and resize updates share one scheduled scroll per frame', () => {
  const { instance, frames, flush } = host();
  instance.handleExecutionViewChange({ follow: true, executionKey: 'current' });
  instance.scrollToBottom();
  instance.scrollToBottom();
  instance.handleMessagesResize();
  assert.equal(frames.size, 1);
  flush();
  assert.equal(instance.messagesRef.scrollTop, 1000);
});

test('upward user input cancels queued scrolling, including a previously forced scroll', () => {
  const { instance, frames, flush } = host();
  instance.scrollToBottom({ force: true });
  instance.handleMessagesWheel({ deltaY: -5 });
  assert.equal(frames.size, 0);
  flush();
  assert.equal(instance.messagesRef.scrollTop, 100);
  assert.equal(instance.state.followOutput, false);
});

test('folding content to the bottom cannot resume a reader who paused follow', () => {
  const { instance } = host();
  instance.setAutoScrollEnabled(false);
  instance.messagesRef.scrollTop = 600;
  instance.handleMessagesScroll();
  assert.equal(instance.state.followOutput, false);
  instance.handleMessagesWheel({ deltaY: -5 });
  instance.messagesRef.scrollTop = 595;
  instance.lastScrollTop = 600;
  instance.handleMessagesScroll();
  assert.equal(instance.state.followOutput, false, 'a small upward gesture near the bottom still pauses follow');
});

test('manual round switches retain the clicked heading position after layout changes', () => {
  const { instance, flush } = host();
  instance.messagesRef.scrollTop = 500;
  let headingTop = 300;
  const anchor = { getBoundingClientRect: () => ({ top: headingTop }) };
  instance.handleExecutionViewChange({ follow: false, anchor });
  headingTop = 100;
  instance.handleMessagesResize();
  flush();
  assert.equal(instance.messagesRef.scrollTop, 300);
  assert.equal(instance.state.followOutput, false);
});

test('an explicit approval reveal takes priority over generic content growth scrolling', () => {
  const { instance, flush } = host();
  const target = { getBoundingClientRect: () => ({ top: 700, bottom: 900 }) };
  instance.handleExecutionViewChange({ follow: true, getTarget: () => target });
  instance.scrollToBottom();
  flush();
  assert.equal(instance.messagesRef.scrollTop, 600);
});

test('scrolling back to the bottom resumes outer output without expanding execution details', () => {
  const { instance, flush } = host();
  instance.setAutoScrollEnabled(false);
  instance.lastScrollTop = 550;
  instance.messagesRef.scrollTop = 600;
  instance.scrollGestureUntil = Date.now() + 250;
  instance.handleMessagesScroll();
  assert.equal(instance.state.followOutput, true);
  flush();
  assert.equal(instance.messagesRef.scrollTop, 1000);
});

test('message rendering passes changed follow state through its memoized output', () => {
  const { instance } = host();
  instance.props.agent.messages = [{ id: 'u', kind: 'normal', role: 'user', content: 'check' },
    { id: 'm', kind: 'normal', role: 'assistant', reasoning: 'checking' }];
  instance.handleExecutionViewChange({ follow: true, executionKey: 'current' });
  const following = instance.renderMessages();
  instance.setAutoScrollEnabled(false);
  const paused = instance.renderMessages();
  assert.notEqual(following, paused);
  assert.equal(following[1].props.following, true);
  assert.equal(paused[1].props.following, false);
});

test('keyboard scrolling from a round button pauses follow, while Space keeps its button behavior', () => {
  const { instance } = host();
  instance.handleExecutionViewChange({ follow: true, executionKey: 'current' });
  const target = { tagName: 'BUTTON', closest: () => target };
  instance.handleMessagesKeyDown({ key: ' ', target });
  assert.equal(instance.state.followOutput, true);
  instance.handleMessagesKeyDown({ key: 'PageUp', target });
  assert.equal(instance.state.followOutput, false);
});

test('outer follow is enabled by default and does not depend on execution disclosure state', () => {
  const { instance, flush } = host();
  const anchor = { getBoundingClientRect: () => ({ top: 50 }) };
  assert.equal(instance.state.followOutput, true);
  instance.handleExecutionViewChange({ anchor });
  assert.equal(instance.state.followOutput, true);
  instance.setAutoScrollEnabled(false);
  instance.handleExecutionViewChange({ anchor });
  assert.equal(instance.state.followOutput, false);
  instance.handleContinueFollowing();
  flush();
  assert.equal(instance.state.followOutput, true);
  assert.equal(instance.messagesRef.scrollTop, 1000);
});
