const assert = require('assert');
const {
  applyTraceEvent,
  buildTraceContent,
  extractWebSources,
  findTraceMessageIndex,
} = require('./agentTraceHelpers.node');

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
assert.strictEqual(
  trace.displayTitle,
  '查看当前用户（rainbond_get_current_user）',
  'trace helper should format friendly tool labels with the raw tool name'
);

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
assert.strictEqual(
  messages[0].trace.displayTitle,
  '查看当前用户（rainbond_get_current_user）',
  'merged trace should keep the compact display label'
);
assert.strictEqual(messages[0].trace.detail, '', 'trace helper should no longer expose structured input/output detail');

console.log('agent trace helper tests passed');

const webTrace = buildTraceContent({
  tool_name: 'web_search',
  output: [{ type: 'text', text: JSON.stringify({ sources: [{ url: 'https://example.com', title: 'Example' }] }) }],
});
assert.strictEqual(webTrace.sources.length, 1, 'web search should expose source cards');
assert.strictEqual(webTrace.sources[0].url, 'https://example.com');

const fetchSources = extractWebSources({
  tool_name: 'web_fetch',
  structured_content: { result: { sources: [{ url: 'https://a.example' }, { url: 'https://a.example' }] } },
});
assert.strictEqual(fetchSources.length, 1, 'web sources should be de-duplicated');

console.log('agent web source tests passed');
