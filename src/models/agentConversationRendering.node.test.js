const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/agent.js`, 'utf8');

test('a suggested option is echoed as a user message and retains its action identity', () => {
  const hostSource = fs.readFileSync(`${__dirname}/../components/AgentHost/index.js`, 'utf8');
  const context = {
    props: { agent: { context: {} }, dispatch: action => { context.action = action; } },
    resumeAutoScroll() {}, Date, Math,
    captureAgentRetentionEvent() {},
    createClearedComponentMutationTrackingState: () => ({}),
  };
  vm.createContext(context);
  const handlerStart = hostSource.indexOf('handleSelectStructuredSuggestedAction =');
  const handlerEnd = hostSource.indexOf('  renderParsedSuggestedActions', handlerStart);
  vm.runInContext(hostSource.slice(handlerStart, handlerEnd).replace('handleSelectStructuredSuggestedAction =', 'choose ='), context);
  context.choose({ actionId: 'cleanup', optionKey: 'C', label: '清理残留服务' });
  assert.equal(context.action.payload.message, '选择方案 C：清理残留服务');
  assert.equal(context.action.payload.selectedActionId, 'cleanup');
  assert.equal(context.action.payload.selectedActionKey, 'C');
  assert.notEqual(context.action.payload.suppressUserEcho, true);

  vm.runInContext(source.slice(source.indexOf('function createMessage('), source.indexOf('function formatReplayArguments(')), context);
  const start = source.indexOf('    *sendMessage(');
  const end = source.indexOf('\n    *', start + 1);
  vm.runInContext(`effects = ({${source.slice(start, end)}})`, context);
  const iterator = context.effects.sendMessage(context.action, { select: fn => fn, put: action => action });
  iterator.next();
  const update = iterator.next({ agent: { hydrated: true, messages: [], runEpoch: 0, context: {} }, user: {} }).value;
  assert.equal(update.payload.messages[0].role, 'user');
  assert.equal(update.payload.messages[0].content, '选择方案 C：清理残留服务');
  iterator.return();
});

test('a final answer only updates its matching run and model message', () => {
  const context = {
    Date, Math,
    adaptAgentEvent: require('../services/agentEventAdapter').adaptAgentEvent,
    extractWorkflowState: () => ({}),
  };
  vm.createContext(context);
  for (const [start, end] of [
    ['function createMessage(', 'function formatReplayArguments('],
    ['function normalizePendingApproval(', 'function buildHydratedState('],
    ['function findApprovalMessageIndex(', 'function applyAgentStreamEvent('],
  ]) vm.runInContext(source.slice(source.indexOf(start), source.indexOf(end)), context);
  const older = { id: 'old', role: 'assistant', kind: 'normal', content: 'previous conclusion',
    streamMessageId: 'shared', streamRunId: 'r1', isFinalAnswer: true };
  const newer = { id: 'new', role: 'assistant', kind: 'normal', content: 'partial',
    streamMessageId: 'shared', streamRunId: 'r2', streaming: true };
  context.applyStreamingAssistantEvent = require('./agentStreamMessages').applyStreamingAssistantEvent;
  const result = context.applyAgentEvents({ messages: [older, newer], events: [{ type: 'chat.message', runId: 'r2',
    data: { message_id: 'shared', role: 'assistant', content: 'current conclusion' } }] });
  assert.equal(result.messages[0].content, 'previous conclusion');
  assert.equal(result.messages[1].content, 'current conclusion');
  assert.equal(result.messages[1].isFinalAnswer, true);
});
