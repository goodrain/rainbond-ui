const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {
  chatMessagesToBubbles,
  restoreExecutionHistory
} = require('./agentHistory');
const traceHelpers = require('./agentTraceHelpers.node');
let id = 0;
const create = (role, kind, content, context = {}, extra = {}) => ({
  id: `m${++id}`,
  role,
  kind,
  content,
  contextSnapshot: context,
  ...extra
});
function eventReducer() {
  const source = fs.readFileSync(`${__dirname}/agent.js`, 'utf8');
  const context = {
    Date,
    Math,
    ...traceHelpers,
    ...require('./agentStreamMessages'),
    adaptAgentEvent: require('../services/agentEventAdapter').adaptAgentEvent,
    isSupportedAgentMutationTool: () => false,
    extractWorkflowState: () => ({})
  };
  vm.createContext(context);
  for (const [start, end] of [
    ['function createMessage(', 'function formatReplayArguments('],
    ['function normalizePendingApproval(', 'function buildHydratedState('],
    ['function findApprovalMessageIndex(', 'function applyAgentStreamEvent(']
  ]) {
    vm.runInContext(
      source.slice(source.indexOf(start), source.indexOf(end)),
      context
    );
  }
  return context.applyAgentEvents;
}
const event = (type, data, runId = 'r1', sequence = 1) => ({
  type,
  data,
  runId,
  sequence,
  timestamp: '2026-11-12T08:00:00.000Z'
});

test('new agent snapshot uses real run identities, merges traces, and preserves timeout decisions', () => {
  const events = [
    event('chat.message.started', { message_id: 'shared', turn: 1, step: 1 }),
    event('chat.message.reasoning.delta', {
      message_id: 'shared',
      delta: 'analysis'
    }),
    event('chat.message.completed', { message_id: 'shared' }),
    event('chat.trace', {
      phase: 'start',
      tool_name: 'rainbond_operate_app',
      tool_call_id: 'call',
      input: '{"operation":"start","service_alias":"web"}'
    }),
    event('approval.requested', {
      approval_id: 'approval',
      tool_call_id: 'call',
      description: '启动应用'
    }),
    event('approval.resolved', {
      approval_id: 'approval',
      status: 'cancelled',
      reason: 'timeout'
    }),
    event('chat.trace', {
      phase: 'end',
      tool_name: 'rainbond_operate_app',
      tool_call_id: 'call',
      is_error: true,
      output: { isError: true }
    }),
    event('chat.message', {
      role: 'assistant',
      message_id: 'shared',
      content: '未执行'
    }),
    event('run.status', { status: 'done' })
  ];
  const history = {
    version: 1,
    complete: true,
    runs: [
      {
        run_id: 'r1',
        message: 'start',
        status: 'completed',
        started_at: '2026-11-12T08:00:00Z',
        events
      }
    ]
  };
  const result = restoreExecutionHistory(history, null, eventReducer(), create);
  assert.equal(result.messages.filter((m) => m.kind === 'trace').length, 1);
  assert.equal(
    result.messages.find((m) => m.kind === 'trace').trace.hasOutput,
    true
  );
  assert.equal(
    result.messages.find((m) => m.kind === 'approval').approval.toolCallId,
    'call'
  );
  assert.equal(
    result.messages.find((m) => m.kind === 'approval').approval
      .resolutionReason,
    'timeout'
  );
  assert.equal(
    result.messages.find((m) => m.role === 'user').streamRunId,
    'r1'
  );
});

test('active run hydrates only its prompt before original SSE replay from zero', () => {
  const history = {
    version: 1,
    complete: true,
    runs: [
      {
        run_id: 'active',
        message: 'query',
        status: 'running',
        events: [
          event('chat.message.started', { message_id: 'm' }, 'active'),
          event(
            'chat.message.delta',
            { message_id: 'm', delta: 'partial' },
            'active'
          )
        ]
      }
    ]
  };
  const result = restoreExecutionHistory(
    history,
    { run_id: 'active' },
    eventReducer(),
    create
  );
  assert.equal(result.messages.length, 1);
  assert.equal(result.messages[0].role, 'user');
  assert.equal(result.messages[0].streamRunId, 'active');
});

test('absent, unknown and incomplete snapshots fall back without dropping old conversation', () => {
  for (const history of [
    undefined,
    { version: 2, complete: true, runs: [] },
    { version: 1, complete: false, runs: [] }
  ])
    assert.equal(
      restoreExecutionHistory(history, null, eventReducer(), create),
      null
    );
});

test('old agents still restore paired calls, safe details and conservative incomplete metadata', () => {
  const result = chatMessagesToBubbles(
    [
      { role: 'user', content: '查看配置' },
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call',
            function: {
              name: 'rainbond_manage_component_envs',
              arguments: '{"operation":"summary","password":"secret"}'
            }
          }
        ]
      },
      {
        role: 'tool',
        tool_call_id: 'call',
        content: '{"isError":false,"token":"secret"}'
      },
      { role: 'assistant', content: '已查询' }
    ],
    create
  );
  const calls = result.filter((m) => m.kind === 'trace');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].trace.title, '查看环境变量');
  assert.equal(calls[0].trace.status, 'returned');
  assert.equal(calls[0].trace.inputDetail.includes('secret'), false);
  assert.equal(calls[0].trace.outputDetail.includes('secret'), false);
  assert.equal(result[0].historyIncomplete, true);
});

test('same call identifiers in different live runs never merge or revive a result', () => {
  let messages = [];
  for (const runId of ['r1', 'r2'])
    traceHelpers.applyTraceEvent(
      messages,
      event(
        'chat.trace',
        {
          phase: 'start',
          tool_name: 'rainbond_get_app_detail',
          tool_call_id: 'shared'
        },
        runId
      ),
      {},
      1,
      create
    );
  assert.equal(messages.length, 2);
  traceHelpers.applyTraceEvent(
    messages,
    event(
      'chat.trace',
      {
        phase: 'end',
        tool_name: 'rainbond_get_app_detail',
        tool_call_id: 'shared',
        output: { ok: true }
      },
      'r1'
    ),
    {},
    2,
    create
  );
  traceHelpers.applyTraceEvent(
    messages,
    event(
      'chat.trace',
      {
        phase: 'start',
        tool_name: 'rainbond_get_app_detail',
        tool_call_id: 'shared'
      },
      'r1'
    ),
    {},
    1,
    create
  );
  assert.equal(messages[0].trace.status, 'returned');
  assert.equal(messages[1].trace.status, 'running');
});

test('nested MCP JSON text, env secrets and bearer credentials are redacted', () => {
  const safe = traceHelpers.detailText({
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          password: 'private',
          authorization: 'Bearer private'
        })
      }
    ],
    envs: [{ name: 'DATABASE_PASSWORD', value: 'private' }],
    log: 'token=private'
  });
  assert.equal(safe.includes('private'), false);
});

test('an orphan legacy tool result remains visible when its issuing call is missing', () => {
  const result = chatMessagesToBubbles(
    [
      { role: 'user', content: '历史' },
      { role: 'tool', tool_call_id: 'missing', content: 'returned evidence' }
    ],
    create
  );
  assert.equal(result.length, 2);
  assert.equal(result[1].trace.outputDetail, 'returned evidence');
  assert.equal(result[1].trace.status, 'unconfirmed');
  assert.equal(result[1].historyIncomplete, true);
});

test('a repeated orphan result merges with its own row after intervening assistant prose', () => {
  const result=chatMessagesToBubbles([{role:'tool',tool_call_id:'orphan',content:'first'}, {role:'assistant',content:'reply'}, {role:'tool',tool_call_id:'orphan',content:'updated'}],create);
  assert.equal(result.length,2);
  assert.equal(result[0].trace.outputDetail,'updated');
  assert.equal(result[1].content,'reply');
});

test('truncated private-key log fragments are never displayed', () => {
  const safe = traceHelpers.detailText({ log: 'prefix -----BEGIN PRIVATE KEY-----\nprivate-material-without-end' });
  assert.equal(safe.includes('private-material-without-end'), false);
  assert.equal(safe.includes('BEGIN PRIVATE KEY'), false);
});
