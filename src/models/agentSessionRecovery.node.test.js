const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(`${__dirname}/agent.js`, 'utf8');

function harness({ snapshot = null, data = {}, onLoad } = {}) {
  let state = { runEpoch: 0, hydrated: false };
  const subscriptions = [];
  const context = {
    Date, Math,
    agentHistory: require('./agentHistory'),
    applyAgentEvents: () => { throw new Error('unexpected snapshot replay in legacy fixture'); },
    autoApprovalPolicy: { discardLegacyPolicies: () => 0 },
    hydrateAgentSession: () => snapshot,
    listAgentSessions: async () => ({ data: [{ session_id: 's' }] }),
    loadAgentSessionMessages: async () => { if (onLoad) onLoad(() => { state.runEpoch++; }); return { data }; },
    startReattachSubscription: value => subscriptions.push(value),
    formatToolLabel: value => value,
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('function createMessage('), source.indexOf('function normalizePendingApproval(')), context);
  vm.runInContext(`effects = ({${source.slice(source.indexOf('*hydrateSession('), source.indexOf('*loadApprovalPolicies('))}})`, context);
  async function run() {
    const iterator = context.effects.hydrateSession({ payload: { userId: 'u' } }, {
      call: (fn, ...args) => ({ call: () => fn(...args) }),
      put: action => ({ action }),
      select: fn => ({ select: fn }),
    });
    let value;
    for (;;) {
      const next = iterator.next(value);
      if (next.done) return;
      const effect = next.value;
      if (effect.call) value = await effect.call();
      else if (effect.select) value = effect.select({ agent: state, user: { currentUser: { user_id: 'u' } } });
      else {
        const action = effect.action;
        if (action.type === 'hydrateState') state = { ...state, ...(action.payload || {}), hydrated: true };
        if (action.type === 'saveState') state = { ...state, ...action.payload };
        value = undefined;
      }
    }
  }
  return { run, getState: () => state, subscriptions };
}

test('recovers the server conversation when the browser cache is missing', async () => {
  const h = harness({ data: { messages: [{ role: 'user', content: 'original' }, { role: 'assistant', content: 'answer' }] } });
  await h.run();
  assert.equal(h.getState().conversationId, 's');
  assert.deepEqual(Array.from(h.getState().messages, m => m.content), ['original', 'answer']);
});

test('replays an active turn without duplicating its partial assistant output', async () => {
  const h = harness({ data: { active_run: { run_id: 'r', message: 'new prompt' }, messages: [
    { role: 'user', content: 'old' }, { role: 'assistant', content: 'old answer' },
    { role: 'user', content: 'new prompt' }, { role: 'assistant', content: 'partial' },
  ] } });
  await h.run();
  assert.deepEqual(Array.from(h.getState().messages, m => m.content), ['old', 'old answer', 'new prompt']);
  assert.equal(h.subscriptions[0].afterSequence, 0);
});

test('does not restore cleared content when recovery finishes after clear', async () => {
  const h = harness({ data: { messages: [{ role: 'user', content: 'old' }] }, onLoad: changeEpoch => changeEpoch() });
  await h.run();
  assert.equal(h.getState().messages, undefined);
});

test('resolved approval cards cannot become pending again on old replay', () => {
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
  const requested = { type: 'approval.requested', sequence: 1, runId: 'r', sessionId: 's', data: { approval_id: 'a' } };
  let result = context.applyAgentEvents({ messages: [], events: [requested] });
  result = context.applyAgentEvents({ messages: result.messages, currentPendingApproval: result.pendingApproval,
    events: [{ type: 'approval.resolved', sequence: 2, data: { approval_id: 'a', status: 'approved' } }] });
  result = context.applyAgentEvents({ messages: result.messages, currentPendingApproval: result.pendingApproval, events: [requested] });
  assert.equal(result.pendingApproval, null);
  assert.equal(result.messages[0].approval.status, 'approved');
});

test('preserves the previous answer when a new identical prompt has not entered the kernel log yet', async () => {
  const h = harness({ data: { active_run: { run_id: 'r', message: 'same', started_at: '2026-11-03T09:00:00Z' }, messages: [
    { role: 'user', content: 'same', created_at: Date.parse('2026-11-03T08:00:00Z') },
    { role: 'assistant', content: 'previous answer' },
  ] } });
  await h.run();
  assert.deepEqual(Array.from(h.getState().messages, m => m.content), ['same', 'previous answer', 'same']);
});

test('applies the approval POST result before waiting for continuation SSE', async () => {
  const serviceSource = fs.readFileSync(`${__dirname}/../services/agent.js`, 'utf8');
  const decisions = [];
  let release;
  let started;
  const streamStarted = new Promise(resolve => { started = resolve; });
  const context = {
    copilotApiBase: async () => '/copilot',
    normalizeContext: value => value,
    buildRequestHeaders: () => ({}),
    requestJson: async () => ({ data: { approval_id: 'a', status: 'approved' } }),
    streamRun: async () => { started(); return new Promise(resolve => { release = () => resolve([]); }); },
  };
  vm.createContext(context);
  const start = serviceSource.indexOf('export async function decideAgentApproval(');
  const end = serviceSource.indexOf('// ==================== 用户级记忆', start);
  vm.runInContext(serviceSource.slice(start, end).replace('export ', ''), context);
  const pending = context.decideAgentApproval({ approvalId: 'a', sessionId: 's', runId: 'r', onDecision: value => decisions.push(value) });
  await streamStarted;
  assert.equal(decisions[0].status, 'approved');
  release();
  await pending;
});

test('a resolution arriving before an old request cannot revive the approval', () => {
  const context = { Date, Math, Set, adaptAgentEvent: require('../services/agentEventAdapter').adaptAgentEvent, extractWorkflowState: () => ({}) };
  vm.createContext(context);
  for (const [start, end] of [
    ['function createMessage(', 'function formatReplayArguments('],
    ['function normalizePendingApproval(', 'function buildHydratedState('],
    ['function findApprovalMessageIndex(', 'function applyAgentStreamEvent('],
  ]) vm.runInContext(source.slice(source.indexOf(start), source.indexOf(end)), context);
  let result = context.applyAgentEvents({ messages: [], events: [{ type: 'approval.resolved', data: { approval_id: 'a', status: 'approved' } }] });
  result = context.applyAgentEvents({ messages: result.messages, currentResolvedApprovalIds: result.resolvedApprovalIds,
    events: [{ type: 'approval.requested', data: { approval_id: 'a' } }] });
  assert.equal(result.pendingApproval, null);
  assert.equal(result.messages.length, 0);
});

test('submits the approval selected on the card when multiple approvals exist', () => {
  const a = { approvalId: 'a', status: 'pending', sessionId: 's', runId: 'r' };
  const b = { approvalId: 'b', status: 'pending', sessionId: 's', runId: 'r' };
  const state = { pendingApproval: b, messages: [{ kind: 'approval', approval: a }, { kind: 'approval', approval: b }] };
  const context = { getDvaApp: () => null, decideAgentApproval: () => {}, Date };
  vm.createContext(context);
  vm.runInContext(`effects = ({${source.slice(source.indexOf('*resolveApproval('), source.indexOf('*applyStreamEvent('))}})`, context);
  const iterator = context.effects.resolveApproval({ payload: { approvalId: 'a', decision: 'approved' } }, {
    select: fn => fn({ agent: state, user: {} }), put: value => value,
    call: (fn, args) => args,
  });
  iterator.next();
  iterator.next({ agent: state, user: {} });
  const request = iterator.next().value;
  assert.equal(request.approvalId, 'a');
});

test('renders existing restored messages through the same grouped execution layout', async () => {
  const h = harness({ data: { messages: [
    { role: 'user', content: 'open port' },
    { role: 'assistant', content: '', reasoning_content: 'check configuration', tool_calls: [{ id: 'call', function: { name: 'read_skill_module', arguments: '{}' } }] },
    { role: 'tool', tool_call_id: 'call', content: 'loaded' },
    { role: 'assistant', content: 'port is open', reasoning_content: 'check access' },
  ] } });
  await h.run();
  const groups = require('../components/AgentHost/turnPresentation').groupConversationMessages(h.getState().messages);
  const turns = groups.filter(group => group.kind === 'turn');
  assert.equal(turns.length, 1);
  assert.equal(turns[0].answer.content, 'port is open');
  assert.deepEqual(Array.from(turns[0].process.filter(item => item.reasoning), item => item.reasoning), ['check configuration', 'check access']);
});
