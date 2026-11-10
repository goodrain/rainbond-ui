const test = require('node:test');
const assert = require('node:assert/strict');
const { groupConversationMessages } = require('./turnPresentation');
const user = { id: 'u', role: 'user', kind: 'normal', content: 'open port' };
const thought = { id: 'm', role: 'assistant', kind: 'normal', content: '', reasoning: 'check port', streamRunId: 'r' };
const request = { id: 'a', kind: 'approval', approval: { approvalId: 'a', status: 'pending', runId: 'r' } };

test('one user request produces one assistant group despite many reasoning and tool messages', () => {
  const groups = groupConversationMessages([user, thought, { id: 't', kind: 'trace' }, { ...thought, id: 'm2' }, { ...thought, id: 'answer', content: 'done' }]);
  assert.equal(groups.filter(g => g.kind === 'turn').length, 1);
  const turn = groups[1];
  assert.deepEqual(turn.process.map(item => item.id), ['m', 't', 'm2', 'answer']);
  assert.equal(turn.answer.id, 'answer');
});
test('pending cards stay outside the process and the same record moves inside after approval', () => {
  let turn = groupConversationMessages([user, thought, request])[1];
  assert.equal(turn.pendingApprovals.length, 1);
  assert.equal(turn.process.some(item => item.id === 'a'), false);
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
