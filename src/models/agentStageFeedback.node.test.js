const test = require('node:test');
const assert = require('node:assert/strict');
const { applyStreamingAssistantEvent } = require('./agentStreamMessages');
const create = (role, kind, content, context, extra) => ({ id: extra.streamMessageId, role, kind, content, ...extra });

test('stage prose and final prose keep separate identities across streaming and replay', () => {
  let messages = [];
  const events = [
    ['chat.message.started', { message_id: 'stage', message_kind: 'progress' }],
    ['chat.message.delta', { message_id: 'stage', delta: '已定位，继续验证。', message_kind: 'progress' }],
    ['chat.message.completed', { message_id: 'stage', content: '已定位，继续验证。', message_kind: 'progress' }],
    ['chat.message.started', { message_id: 'final', message_kind: 'progress' }],
    ['chat.message.delta', { message_id: 'final', delta: '验证完成。', message_kind: 'progress' }],
    ['chat.message.completed', { message_id: 'final', content: '验证完成。', message_kind: 'progress' }],
    ['chat.message', { message_id: 'final', content: '验证完成。', message_kind: 'final' }],
  ];
  events.forEach(([type, data]) => { messages = applyStreamingAssistantEvent(messages, { type, runId: 'r', data }, create, {}); });
  assert.equal(messages.length, 2);
  assert.equal(messages[0].messageKind, 'progress');
  assert.equal(messages[0].isFinalAnswer, undefined);
  assert.equal(messages[1].messageKind, 'final');
  assert.equal(messages[1].isFinalAnswer, true);
  messages = applyStreamingAssistantEvent(messages, { type: 'chat.message.completed', runId: 'r',
    data: { message_id: 'final', content: '过期阶段内容', message_kind: 'progress' } }, create, {});
  assert.equal(messages[1].content, '验证完成。');
});
