const test = require('node:test');
const assert = require('node:assert/strict');
const { groupConversationMessages } = require('./turnPresentation');
const user = { id: 'u', role: 'user', kind: 'normal', content: 'open port' };
const thought = { id: 'm', role: 'assistant', kind: 'normal', content: '', reasoning: 'check port', streamRunId: 'r' };
const request = { id: 'a', kind: 'approval', approval: { approvalId: 'a', status: 'pending', runId: 'r' } };

test('historical prose guesses do not become actionable suggestion cards', () => {
  const filters = require('./displayFilters');
  const falseAction = { actionId: 'fallback:A', source: 'llm_fallback', label: '已执行完成，应用恢复正常。' };
  assert.deepEqual(filters.getVisibleSuggestedActions([falseAction]), []);
  assert.equal(filters.shouldRenderMessageItem({ kind: 'suggested_actions', suggestedActions: [falseAction] }), false);
  assert.equal(filters.getVisibleSuggestedActions([{ source: 'llm_structured', actionId: 'real' }]).length, 1);
  const original = '方案 A 已执行完成，应用恢复正常。';
  assert.equal(filters.getAssistantDisplayContent({ content: original, suggestedActions: [falseAction] }), original);
  assert.match(filters.getAssistantDisplayContent({ content: '旧的分析结论', suggestedActions: [
    { source: 'llm_fallback', optionKey: 'A', label: '降低资源配置', description: '调整到合适的内存规格' },
  ] }), /降低资源配置/);
});

test('historical duplicate approval rows render once and never override a resolved decision', () => {
  const resolved = { ...request, id: 'resolved-copy', approval: { ...request.approval, status: 'approved' } };
  const duplicate = { ...request, id: 'old-pending-copy' };
  const turn = groupConversationMessages([user, thought, request, resolved, duplicate])[1];
  assert.equal(turn.items.filter(item => item.kind === 'approval').length, 1);
  assert.equal(turn.pendingApprovals.length, 0);
  assert.equal(turn.process.find(item => item.kind === 'approval').approval.status, 'approved');
});

test('one user request produces one assistant group despite many reasoning and tool messages', () => {
  const groups = groupConversationMessages([user, thought, { id: 't', kind: 'trace' }, { ...thought, id: 'm2' }, { ...thought, id: 'answer', content: 'done' }]);
  assert.equal(groups.filter(g => g.kind === 'turn').length, 1);
  const turn = groups[1];
  assert.deepEqual(turn.process.map(item => item.id), ['m', 't', 'm2', 'answer']);
  assert.equal(turn.answer.id, 'answer');
});
test('pending and resolved approvals both stay inside the execution records', () => {
  let turn = groupConversationMessages([user, thought, request])[1];
  assert.equal(turn.pendingApprovals.length, 1);
  assert.equal(turn.process.some(item => item.id === 'a'), true);
  assert.equal(turn.nodes[0].events[0], request);
  turn = groupConversationMessages([user, thought, { ...request, approval: { ...request.approval, status: 'approved' } }])[1];
  assert.equal(turn.pendingApprovals.length, 0);
  assert.deepEqual(turn.process.map(item => item.id), ['m', 'a']);
});
test('never merges two identical prompts, hides memory traces and keeps failures visible', () => {
  const groups = groupConversationMessages([user, thought, { id: 'mem', kind: 'trace', trace: { toolName: 'memory_recall' } },
    { ...user, id: 'u2' }, { id: 'err', kind: 'error', content: 'failed' }]);
  const turns = groups.filter(g => g.kind === 'turn');
  assert.equal(turns.length, 2);
  assert.equal(turns[0].process.length, 1);
  assert.equal(turns[1].notices[0].id, 'err');
});

test('starts a single new working group before the new run id is received', () => {
  const groups = groupConversationMessages([{ ...user, streamRunId: 'old' }, { ...thought, streamRunId: 'old' }, { ...user, id: 'new' }], { sending: true, activeRunId: 'old' });
  assert.equal(groups.filter(g => g.kind === 'turn' && g.running).length, 1);
  assert.equal(groups[groups.length - 1].key, 'turn:new');
});

test('preserves stable turn identity and chronological order as a thought streams and an approval resolves', () => {
  const { applyStreamingAssistantEvent } = require('../../models/agentStreamMessages');
  const create = (role, kind, content, context, extra) => ({ id: `message:${extra.streamMessageId || 'm'}`, role, kind, content, ...extra });
  let messages = [user];
  messages = applyStreamingAssistantEvent(messages, { type: 'chat.message.reasoning.delta', runId: 'r', data: { message_id: 'm', delta: 'first ' } }, create, {});
  let turn = groupConversationMessages(messages, { sending: true, activeRunId: 'r' })[1];
  const key = turn.key;
  messages = applyStreamingAssistantEvent(messages, { type: 'chat.message.reasoning.delta', runId: 'r', data: { message_id: 'm', delta: 'second' } }, create, {});
  turn = groupConversationMessages(messages, { sending: true, activeRunId: 'r' })[1];
  assert.equal(turn.key, key);
  assert.equal(turn.process.length, 1);
  assert.equal(turn.process[0].reasoning, 'first second');
  const waiting = groupConversationMessages(messages.concat(request))[1];
  const resolved = groupConversationMessages(messages.concat({ ...request, approval: { ...request.approval, status: 'approved' } }))[1];
  assert.equal(waiting.key, resolved.key);
  assert.equal(waiting.pendingApprovals.length, 1);
  assert.equal(resolved.pendingApprovals.length, 0);
  assert.equal(resolved.process[1].id, 'a');
});

test('each model output owns its narration, tool calls and resolved approvals', () => {
  const first = { ...thought, id: 'first', streamMessageId: 'm1', content: 'removing variables' };
  const tool1 = { id: 'call1', kind: 'trace' };
  const approved = { ...request, approval: { ...request.approval, status: 'approved' } };
  const second = { ...thought, id: 'second', streamMessageId: 'm2', content: 'upgrading the component' };
  const tool2 = { id: 'call2', kind: 'trace' };
  let turn = groupConversationMessages([user, first, tool1, approved, second, tool2, request])[1];
  assert.equal(turn.answer, null, 'narration that issues tools belongs inside the execution node');
  assert.deepEqual(turn.nodes.map(node => [node.key, node.events.map(e => e.id)]), [
    ['node:m1', ['call1', 'a']], ['node:m2', ['call2']],
  ]);
  assert.equal(turn.nodes[0].output.content, 'removing variables');
  const final = { id: 'final', role: 'assistant', kind: 'normal', content: 'done' };
  turn = groupConversationMessages([user, first, tool1, approved, second, tool2, final])[1];
  assert.equal(turn.answer, final);
  assert.equal(turn.nodes.length, 2, 'the final answer is not repeated as an empty execution node');
});

test('context switches remain hidden both before and inside a conversation', () => {
  const context = { id: 'ctx', role: 'system', kind: 'context', content: '已切换到 团队 test / 集群 rainbond' };
  const groups = groupConversationMessages([context, user, thought, { ...context, id: 'ctx2' }]);
  assert.equal(groups.length, 2);
  assert.equal(groups[1].items.some(item => item.kind === 'context'), false);
});

test('separates runs even when an older client hid the option-selection message', () => {
  const previous = { id: 'previous', role: 'assistant', kind: 'normal', content: '复核结论', streamRunId: 'r1', isFinalAnswer: true };
  const next = { ...thought, id: 'next', streamRunId: 'r2', reasoning: '执行方案' };
  const groups = groupConversationMessages([{ ...user, streamRunId: 'r1' }, previous, next], { sending: true, activeRunId: 'r2' });
  const turns = groups.filter(group => group.kind === 'turn');
  assert.equal(turns.length, 2);
  assert.equal(turns[0].answer, previous);
  assert.equal(turns[0].process.includes(previous), false);
  assert.equal(turns[1].running, true);
});

test('late events from an earlier run stay with their original conclusion', () => {
  const first = { ...thought, id: 'first', streamRunId: 'r1', content: 'first answer', isFinalAnswer: true };
  const second = { ...thought, id: 'second', streamRunId: 'r2' };
  const late = { id: 'late', kind: 'trace', streamRunId: 'r1' };
  const turns = groupConversationMessages([{ ...user, streamRunId: 'r1' }, first,
    { ...user, id: 'u2', streamRunId: 'r2' }, second, late]).filter(group => group.kind === 'turn');
  assert.equal(turns.length, 2);
  assert.equal(turns[0].answer, first);
  assert.equal(turns[0].items.includes(late), true);
  assert.equal(turns[1].items.includes(late), false);
});

test('late approval decisions stay with the model round that issued the tool call', () => {
  const first = { ...thought, id: 'first', streamMessageId: 'm1' };
  const second = { ...thought, id: 'second', streamMessageId: 'm2' };
  const call1 = { id: 'call1', kind: 'trace', trace: { toolCallId: 'tool1' } };
  const call2 = { id: 'call2', kind: 'trace', trace: { toolCallId: 'tool2' } };
  for (const status of ['pending', 'approved', 'rejected', 'cancelled']) {
    const decision = { ...request, approval: { ...request.approval, toolCallId: 'tool1', status } };
    const turn = groupConversationMessages([user, first, call1, second, call2, decision])[1];
    assert.deepEqual(turn.nodes.map(node => node.events.map(item => item.id)), [['call1', 'a'], ['call2']]);
    assert.equal(turn.waiting, status === 'pending');
  }
});

test('approvals received before their tool trace still appear once in the owning round', () => {
  const decision = { ...request, approval: { ...request.approval, toolCallId: 'tool1', autoApproved: true, status: 'approved' } };
  const call = { id: 'call1', kind: 'trace', trace: { toolCallId: 'tool1' } };
  const turn = groupConversationMessages([user, thought, decision, call])[1];
  assert.deepEqual(turn.nodes[0].events.map(item => item.id), ['a', 'call1']);
  assert.equal(turn.nodes.flatMap(node => node.events).filter(item => item.kind === 'approval').length, 1);
});
