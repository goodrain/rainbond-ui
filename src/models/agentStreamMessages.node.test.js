const assert = require('assert');
const { applyStreamingAssistantEvent } = require('./agentStreamMessages');

function createMessage(role, kind, content, contextSnapshot = {}, extra = {}) {
  return {
    id: `${role}-${Date.now()}`,
    role,
    kind,
    content,
    contextSnapshot,
    ...extra,
  };
}

let messages = applyStreamingAssistantEvent(
  [],
  {
    type: 'chat.message.started',
    data: {
      message_id: 'msg_1',
      role: 'assistant',
    }
  },
  createMessage,
  { appId: 'app-1' }
);

assert.strictEqual(messages.length, 1, 'stream message start should create a placeholder assistant message');
assert.strictEqual(messages[0].streaming, true, 'stream message should be marked streaming after start');

messages = applyStreamingAssistantEvent(
  messages,
  {
    type: 'chat.message.delta',
    data: {
      message_id: 'msg_1',
      delta: '你好'
    }
  },
  createMessage,
  { appId: 'app-1' }
);

messages = applyStreamingAssistantEvent(
  messages,
  {
    type: 'chat.message.delta',
    data: {
      message_id: 'msg_1',
      delta: '，Rainbond'
    }
  },
  createMessage,
  { appId: 'app-1' }
);

assert.strictEqual(messages[0].content, '你好，Rainbond', 'stream deltas should append into the same assistant message');

messages = applyStreamingAssistantEvent(
  messages,
  {
    type: 'chat.message.completed',
    data: {
      message_id: 'msg_1',
      content: '你好，Rainbond'
    }
  },
  createMessage,
  { appId: 'app-1' }
);

messages = applyStreamingAssistantEvent(
  messages,
  {
    type: 'chat.message',
    data: {
      message_id: 'msg_1',
      role: 'assistant',
      content: '你好，Rainbond'
    }
  },
  createMessage,
  { appId: 'app-1' }
);

assert.strictEqual(messages.length, 1, 'legacy chat.message with same message_id should not duplicate a streamed assistant message');
assert.strictEqual(messages[0].streaming, false, 'stream completion should mark the assistant message as complete');

console.log('agent stream message merge tests passed');

// DSH message ids are session-scoped and reused by the next run. The UI must
// key streaming placeholders by runId + messageId, otherwise a new run
// overwrites the previous assistant bubble (and its reasoning state).
let reused = applyStreamingAssistantEvent(
  [],
  {
    type: 'chat.message.started',
    runId: 'run-a',
    data: { message_id: 'msg_shared', role: 'assistant' },
  },
  createMessage,
  { appId: 'app-1' }
);
reused = applyStreamingAssistantEvent(
  reused,
  {
    type: 'chat.message.delta',
    runId: 'run-a',
    data: { message_id: 'msg_shared', delta: 'A' },
  },
  createMessage,
  { appId: 'app-1' }
);
reused = applyStreamingAssistantEvent(
  reused,
  {
    type: 'chat.message.started',
    runId: 'run-b',
    data: { message_id: 'msg_shared', role: 'assistant' },
  },
  createMessage,
  { appId: 'app-b' }
);
reused = applyStreamingAssistantEvent(
  reused,
  {
    type: 'chat.message.delta',
    runId: 'run-b',
    data: { message_id: 'msg_shared', delta: 'B' },
  },
  createMessage,
  { appId: 'app-b' }
);

assert.strictEqual(reused.length, 2, 'reused message_id across runs must create a new bubble');
assert.strictEqual(reused[0].content, 'A', 'previous run bubble must not be overwritten');
assert.strictEqual(reused[0].streamRunId, 'run-a');
assert.strictEqual(reused[1].content, 'B', 'new run bubble must receive the new delta');
assert.strictEqual(reused[1].streamRunId, 'run-b');

console.log('agent stream run isolation tests passed');
