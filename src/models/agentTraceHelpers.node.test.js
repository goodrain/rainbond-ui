const assert = require('assert');
const {
  applyTraceEvent,
  buildTraceContent,
  findTraceMessageIndex,
} = require('./agentTraceHelpers');

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

const trace = buildTraceContent({
  trace_id: 'trace_1',
  tool_call_id: 'call_1',
  tool_name: 'rainbond_get_current_user',
  input: {},
});

assert.strictEqual(trace.traceId, 'trace_1', 'trace helper should preserve trace_id');
assert.strictEqual(trace.toolCallId, 'call_1', 'trace helper should preserve tool_call_id');

let messages = [];
messages = applyTraceEvent(
  messages,
  {
    type: 'chat.trace',
    data: {
      trace_id: 'trace_1',
      tool_call_id: 'call_1',
      tool_name: 'rainbond_get_current_user',
      input: {},
    }
  },
  {},
  2,
  createMessage
);

messages = applyTraceEvent(
  messages,
  {
    type: 'chat.trace',
    data: {
      trace_id: 'trace_1',
      tool_call_id: 'call_1',
      tool_name: 'rainbond_get_current_user',
      input: {},
      output: {
        structuredContent: {
          user_id: 1,
        }
      },
    }
  },
  {},
  3,
  createMessage
);

assert.strictEqual(messages.length, 1, 'trace helper should merge input/output pairs with the same trace_id');
assert.strictEqual(findTraceMessageIndex(messages, trace), 0, 'trace helper should find existing message by trace_id');
assert.strictEqual(messages[0].trace.hasOutput, true, 'trace helper should update merged trace with output');
assert.ok(messages[0].trace.detail.indexOf('"user_id": 1') > -1, 'trace helper should keep structured output detail');

console.log('agent trace helper tests passed');
