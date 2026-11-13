const test = require('node:test');
const assert = require('node:assert/strict');
const { groupConversationMessages } = require('./turnPresentation');
const user = { id: 'u', role: 'user', kind: 'normal', content: '修复并验证' };
const model = (id, content = '', extra = {}) => ({ id, streamMessageId: id, role: 'assistant', kind: 'normal', content, ...extra });
const tool = id => ({ id, kind: 'trace', trace: { toolCallId: id, title: id } });

test('checkpoint prose keeps the issuing message reasoning, tools and approvals in one timeline group', () => {
  const checkpoint = model('m2', '已查明原因，接下来修复。', { reasoning: 'evidence analysis', messageKind: 'progress' });
  const final = model('m3', '修复并验证完成。', { isFinalAnswer: true, messageKind: 'final' });
  const turn = groupConversationMessages([user, model('m1', '', { reasoning: 'checking' }), tool('query'), checkpoint, tool('repair'), final])[1];
  assert.deepEqual(turn.timeline.map(entry => entry.kind), ['execution', 'answer', 'execution', 'answer']);
  const stages = turn.timeline.filter(entry => entry.kind === 'execution');
  assert.deepEqual(stages.map(entry => entry.turn.process.filter(item => item.kind === 'trace').map(item => item.id)), [['query'], ['repair']]);
  assert.equal(stages[0].turn.reasoningCount, 1);
  assert.equal(stages[1].turn.reasoningCount, 1);
  assert.equal(stages.flatMap(stage => stage.nodes).filter(node => node.sourceKey === 'node:m2').length, 1);
  assert.equal(turn.timeline[1].item, checkpoint);
  assert.equal(turn.timeline[3].item, final);
  assert.equal(turn.answer, final);
});

test('a checkpoint remains nonfinal when a run is interrupted or has no final answer', () => {
  const checkpoint = model('stage', '配置已更新，仍在验证。', { messageKind: 'progress' });
  const turn = groupConversationMessages([user, checkpoint])[1];
  assert.equal(turn.answer, null);
  assert.equal(turn.timeline[0].item, checkpoint);
});

test('late approvals stay with the issuing call after a checkpoint boundary', () => {
  const checkpoint = model('stage', '已确认原因，接下来更新。', { reasoning: 'analysis' });
  const approval = { id: 'approval', kind: 'approval', approval: { approvalId: 'a', toolCallId: 'repair', status: 'approved' } };
  const turn = groupConversationMessages([user, model('m1', '', { reasoning: 'checking' }), checkpoint, tool('repair'),
    model('next', '', { reasoning: 'verification' }), tool('verify'), approval])[1];
  const stage = turn.timeline.filter(entry => entry.kind === 'execution')[1];
  const owner = stage.turn.nodes.find(node => node.events.includes(approval));
  assert.ok(owner.events.some(item => item.id === 'repair'));
  assert.equal(turn.timeline.flatMap(entry => entry.nodes || []).flatMap(node => node.events).filter(item => item.id === 'approval').length, 1);
});

test('streaming checkpoints keep their body and execution keys as the final marker arrives', () => {
  const before = groupConversationMessages([user, model('m1', '', { reasoning: 'checking' }), model('stage', '已定位', { messageKind: 'progress', streaming: true })], { sending: true })[1];
  const after = groupConversationMessages([user, model('m1', '', { reasoning: 'checking' }), model('stage', '已定位并完成。', { messageKind: 'final', isFinalAnswer: true })])[1];
  assert.deepEqual(before.timeline.map(entry => entry.key), after.timeline.map(entry => entry.key));
});

test('the previous message format also restores multiple prose checkpoints without a new protocol', () => {
  const { chatMessagesToBubbles } = require('../../models/agentHistory');
  let id = 0;
  const create = (role, kind, content, context, extra) => ({ id: `old:${++id}`, role, kind, content, ...extra });
  const bubbles = chatMessagesToBubbles([{ role: 'user', content: '处理' },
    { role: 'assistant', content: '已查明原因，继续修复。', tool_calls: [{ id: 'call', function: { name: 'repair', arguments: '{}' } }] },
    { role: 'tool', tool_call_id: 'call', content: '{"ok":true}' },
    { role: 'assistant', content: '修复完成。' }], create);
  const turn = groupConversationMessages(bubbles)[1];
  assert.deepEqual(turn.timeline.filter(entry => entry.kind === 'answer').map(entry => entry.item.content), ['已查明原因，继续修复。', '修复完成。']);
});
