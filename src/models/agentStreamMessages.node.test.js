const assert = require('assert');
const { applyStreamingAssistantEvent, finalizeStreamingMessages } = require('./agentStreamMessages');

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

// Hydrated legacy messages may have streamMessageId but no streamRunId.
// A completed legacy bubble must not be reused by a new run.
let legacyHydrated = applyStreamingAssistantEvent(
  [
    {
      id: 'legacy-old',
      role: 'assistant',
      kind: 'normal',
      content: 'old answer',
      streamMessageId: 'msg_legacy',
      streaming: false,
    },
  ],
  {
    type: 'chat.message.started',
    runId: 'run-new',
    data: { message_id: 'msg_legacy', role: 'assistant' },
  },
  createMessage,
  { appId: 'app-new' }
);
assert.strictEqual(
  legacyHydrated.length,
  2,
  'completed legacy bubble without streamRunId must not capture the new run'
);
assert.strictEqual(legacyHydrated[0].content, 'old answer');
assert.strictEqual(legacyHydrated[1].streamRunId, 'run-new');

console.log('agent stream legacy hydration tests passed');

// Terminal run.status finalizes any row still streaming even when
// chat.message.completed was lost, so Markdown rendering takes over.
const streamingRow = {
  id: 'assistant-streaming',
  role: 'assistant',
  kind: 'normal',
  content: '**已执行动作**：部署成功',
  streaming: true,
  reasoningStreaming: true,
};
const finalizedRows = finalizeStreamingMessages([streamingRow]);
assert.strictEqual(finalizedRows[0].streaming, false, 'terminal status must clear streaming');
assert.strictEqual(finalizedRows[0].reasoningStreaming, false, 'terminal status must clear reasoningStreaming');
assert.strictEqual(finalizedRows[0].content, streamingRow.content, 'finalizing must keep accumulated content');

const alreadyDone = [{ ...streamingRow, streaming: false, reasoningStreaming: false }];
assert.strictEqual(
  finalizeStreamingMessages(alreadyDone),
  alreadyDone,
  'already finalized rows should return the same array (no needless rerender)'
);
assert.deepStrictEqual(finalizeStreamingMessages([]), [], 'empty message list stays empty');

const systemRow = { id: 'sys', role: 'system', kind: 'status', content: 'done', streaming: true };
assert.strictEqual(
  finalizeStreamingMessages([systemRow])[0].streaming,
  true,
  'non-assistant rows must not be touched'
);

console.log('agent stream finalize tests passed');
