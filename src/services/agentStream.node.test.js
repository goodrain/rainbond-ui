const assert = require('assert');
const { TextEncoder } = require('util');

const {
  readSseEvents,
  subscribeToRunEvents,
  TERMINAL_STATUSES,
} = require('./agentStream');

function createReader(chunks) {
  let index = 0;

  return {
    async read() {
      if (index >= chunks.length) {
        return { done: true, value: undefined };
      }

      const value = chunks[index];
      index += 1;
      return { done: false, value };
    },
    async cancel() {},
  };
}

async function main() {
  const encoder = new TextEncoder();
  const eventsSeen = [];
  const response = {
    ok: true,
    body: {
      getReader() {
        return createReader([
          encoder.encode(
            'event: run.status\ndata: {"type":"run.status","tenantId":"t_1","sessionId":"cs_1","runId":"run_1","sequence":1,"timestamp":"2026-04-25T10:00:00Z","data":{"status":"thinking"}}\n\n'
          ),
          encoder.encode(
            'event: chat.message\ndata: {"type":"chat.message","tenantId":"t_1","sessionId":"cs_1","runId":"run_1","sequence":2,"timestamp":"2026-04-25T10:00:01Z","data":{"role":"assistant","content":"done"}}\n\n'
          ),
          encoder.encode(
            'event: run.status\ndata: {"type":"run.status","tenantId":"t_1","sessionId":"cs_1","runId":"run_1","sequence":3,"timestamp":"2026-04-25T10:00:02Z","data":{"status":"done"}}\n\n'
          ),
        ]);
      }
    }
  };

  const events = await readSseEvents(response, {
    onEvent(event) {
      eventsSeen.push(event.type);
    }
  });

  assert.deepStrictEqual(
    TERMINAL_STATUSES,
    ['done', 'error', 'waiting_approval', 'cancelled'],
    'agent stream helper should expose the terminal statuses used to stop consumption'
  );
  assert.deepStrictEqual(
    eventsSeen,
    ['run.status', 'chat.message', 'run.status'],
    'agent stream helper should emit callbacks for each parsed event in order'
  );
  assert.strictEqual(events.length, 3, 'agent stream helper should aggregate parsed events');
  assert.strictEqual(events[2].data.status, 'done', 'agent stream helper should stop on terminal run status');

  await testDefaultClosesOnFirstWaitingApproval(encoder);
  await testSkipFirstWaitingApprovalDeliversSubsequent(encoder);
  await testSkipFirstStillClosesOnDone(encoder);
  await testSkipFirstStillClosesOnError(encoder);
  await testSkipFirstStillClosesOnCancelled(encoder);
  await testSkipFirstDoesNotIgnoreNewWaitingApprovalAfterResolution(encoder);
  await testDefaultClosesOnCancelled(encoder);

  await testSubscribeToRunEventsUsesInjectedFetch(encoder);
  await testSubscribeToRunEventsAppendsAfterSequenceQuery(encoder);
  await testSubscribeToRunEventsForwardsHeadersAndSignal(encoder);
  await testSubscribeToRunEventsResolvesOnTerminal(encoder);
  await testSubscribeToRunEventsRequiresUrl();
  await testReadSseEventsBatchesStreamingDeltas(encoder);
  await testReadSseEventsSkipsMalformedChunk(encoder);

  console.log('agent stream helper tests passed');
}

// 单条 SSE 数据损坏 / 被代理截断时，整条流不能崩；坏事件跳过、好事件照常处理，
// 终止状态依然能停止消费。回归保护 readSseEvents 里 JSON.parse 的 try/catch。
async function testReadSseEventsSkipsMalformedChunk(encoder) {
  const seen = [];
  const response = {
    ok: true,
    body: {
      getReader() {
        return createReader([
          encoder.encode(
            'data: {"type":"chat.message","data":{"role":"assistant","content":"ok"}}\n\n'
          ),
          // 截断 / 损坏的 JSON —— 历史上这一条会让 JSON.parse 抛错、冲垮整条流。
          encoder.encode('data: {"type":"chat.message","data":{"role":\n\n'),
          encoder.encode(
            'data: {"type":"run.status","data":{"status":"done"}}\n\n'
          ),
        ]);
      },
    },
  };

  const originalWarn = console.warn;
  let warned = false;
  console.warn = () => {
    warned = true;
  };
  let events;
  try {
    events = await readSseEvents(response, {
      onEvent: e => seen.push(e.type),
    });
  } finally {
    console.warn = originalWarn;
  }

  assert.strictEqual(
    events.length,
    2,
    'malformed SSE chunk should be skipped while valid events are still aggregated'
  );
  assert.deepStrictEqual(
    seen,
    ['chat.message', 'run.status'],
    'a malformed chunk must not stop delivery of subsequent valid events'
  );
  assert.strictEqual(events[1].data.status, 'done', 'terminal status after a bad chunk still stops the stream');
  assert.strictEqual(warned, true, 'a malformed SSE chunk should be logged via console.warn');
}

function buildResponse(encoder, payloads) {
  return {
    ok: true,
    body: {
      getReader() {
        return createReader(
          payloads.map(p => encoder.encode(`data: ${JSON.stringify(p)}\n\n`))
        );
      }
    }
  };
}

async function testDefaultClosesOnFirstWaitingApproval(encoder) {
  const seen = [];
  const response = buildResponse(encoder, [
    { type: 'run.status', data: { status: 'waiting_approval' } },
    { type: 'approval.resolved', data: {} },
    { type: 'chat.trace', data: {} },
  ]);
  const events = await readSseEvents(response, {
    onEvent: e => seen.push(e),
  });
  assert.strictEqual(events.length, 1, 'default mode stops on first waiting_approval');
  assert.strictEqual(seen.length, 1, 'default mode does not deliver post-terminal events');
  assert.strictEqual(events[0].data.status, 'waiting_approval');
}

async function testSkipFirstWaitingApprovalDeliversSubsequent(encoder) {
  const seen = [];
  const response = buildResponse(encoder, [
    { type: 'run.status', data: { status: 'waiting_approval' } },
    { type: 'approval.resolved', data: {} },
    { type: 'chat.trace', data: {} },
    { type: 'run.status', data: { status: 'waiting_approval' } },
    { type: 'chat.trace', data: { ignored: true } },
  ]);
  const events = await readSseEvents(response, {
    onEvent: e => seen.push(e),
    skipFirstWaitingApproval: true,
  });
  assert.strictEqual(events.length, 4, 'skipFirstWaitingApproval delivers through second waiting_approval');
  assert.strictEqual(events[1].type, 'approval.resolved');
  assert.strictEqual(events[2].type, 'chat.trace');
  assert.strictEqual(events[3].data.status, 'waiting_approval');
}

async function testSkipFirstStillClosesOnDone(encoder) {
  const seen = [];
  const response = buildResponse(encoder, [
    { type: 'chat.trace', data: {} },
    { type: 'run.status', data: { status: 'done' } },
    { type: 'chat.trace', data: { ignored: true } },
  ]);
  const events = await readSseEvents(response, {
    onEvent: e => seen.push(e),
    skipFirstWaitingApproval: true,
  });
  assert.strictEqual(events.length, 2, 'skipFirstWaitingApproval still closes on done');
  assert.strictEqual(events[1].data.status, 'done');
}

async function testSkipFirstStillClosesOnError(encoder) {
  const response = buildResponse(encoder, [
    { type: 'run.status', data: { status: 'error' } },
    { type: 'chat.trace', data: { ignored: true } },
  ]);
  const events = await readSseEvents(response, {
    skipFirstWaitingApproval: true,
  });
  assert.strictEqual(events.length, 1, 'skipFirstWaitingApproval still closes on error');
}

async function testSkipFirstStillClosesOnCancelled(encoder) {
  const response = buildResponse(encoder, [
    { type: 'run.status', data: { status: 'cancelled' } },
    { type: 'chat.trace', data: { ignored: true } },
  ]);
  const events = await readSseEvents(response, {
    skipFirstWaitingApproval: true,
  });
  assert.strictEqual(events.length, 1, 'skipFirstWaitingApproval still closes on cancelled');
}

async function testSkipFirstDoesNotIgnoreNewWaitingApprovalAfterResolution(encoder) {
  const seen = [];
  const response = buildResponse(encoder, [
    { type: 'approval.resolved', data: { approval_id: 'ap_1', status: 'approved' } },
    { type: 'run.status', data: { status: 'waiting_approval' } },
    { type: 'chat.trace', data: { ignored: true } },
  ]);
  const events = await readSseEvents(response, {
    onEvent: e => seen.push(e.type),
    skipFirstWaitingApproval: true,
  });
  assert.deepStrictEqual(
    seen,
    ['approval.resolved', 'run.status'],
    'a new waiting_approval after approval.resolved should still terminate the stream'
  );
  assert.strictEqual(events.length, 2, 'new waiting_approval after approval.resolved should not be skipped');
  assert.strictEqual(events[1].data.status, 'waiting_approval');
}

async function testDefaultClosesOnCancelled(encoder) {
  const response = buildResponse(encoder, [
    { type: 'run.status', data: { status: 'cancelled' } },
    { type: 'chat.trace', data: { ignored: true } },
  ]);
  const events = await readSseEvents(response);
  assert.strictEqual(events.length, 1, 'default mode closes on cancelled');
}

async function testReadSseEventsBatchesStreamingDeltas(encoder) {
  const seen = [];
  const response = buildResponse(encoder, [
    {
      type: 'chat.message.delta',
      sessionId: 'cs_1',
      runId: 'run_1',
      sequence: 1,
      data: { message_id: 'msg_1', delta: 'Hel' },
    },
    {
      type: 'chat.message.delta',
      sessionId: 'cs_1',
      runId: 'run_1',
      sequence: 2,
      data: { message_id: 'msg_1', delta: 'lo' },
    },
    {
      type: 'chat.message.reasoning.delta',
      sessionId: 'cs_1',
      runId: 'run_1',
      sequence: 3,
      data: { message_id: 'msg_1', delta: 'A' },
    },
    {
      type: 'chat.message.reasoning.delta',
      sessionId: 'cs_1',
      runId: 'run_1',
      sequence: 4,
      data: { message_id: 'msg_1', delta: 'B' },
    },
    { type: 'run.status', data: { status: 'done' } },
  ]);

  const events = await readSseEvents(response, {
    onEvent: event => seen.push(event),
    eventBatchWindowMs: 16,
  });

  assert.strictEqual(events.length, 5, 'raw parsed events should still be preserved');
  assert.strictEqual(seen.length, 3, 'streaming deltas should be batched before callback dispatch');
  assert.strictEqual(seen[0].type, 'chat.message.delta');
  assert.strictEqual(seen[0].data.delta, 'Hello', 'message delta batches should concatenate text');
  assert.strictEqual(seen[1].type, 'chat.message.reasoning.delta');
  assert.strictEqual(seen[1].data.delta, 'AB', 'reasoning delta batches should concatenate text');
  assert.strictEqual(seen[2].type, 'run.status', 'terminal run status should still be dispatched immediately');
}

async function testSubscribeToRunEventsUsesInjectedFetch(encoder) {
  const seen = [];
  const captured = {};
  const fetchImpl = async (url, opts) => {
    captured.url = url;
    captured.opts = opts;
    return {
      ok: true,
      body: {
        getReader() {
          return createReader([
            encoder.encode(
              'data: {"type":"chat.message","data":{"role":"assistant","content":"a"}}\n\n'
            ),
            encoder.encode(
              'data: {"type":"run.status","data":{"status":"done"}}\n\n'
            ),
          ]);
        },
      },
    };
  };

  const events = await subscribeToRunEvents({
    url: '/api/v1/copilot/sessions/cs_1/runs/run_1/events',
    fetchImpl,
    onEvent: e => seen.push(e.type),
  });

  assert.strictEqual(
    captured.url,
    '/api/v1/copilot/sessions/cs_1/runs/run_1/events',
    'subscribe should call fetch with the run events URL when no after_sequence given'
  );
  assert.strictEqual(captured.opts.method, 'GET');
  assert.strictEqual(captured.opts.credentials, 'include');
  assert.deepStrictEqual(seen, ['chat.message', 'run.status']);
  assert.strictEqual(events.length, 2);
}

async function testSubscribeToRunEventsAppendsAfterSequenceQuery(encoder) {
  let calledUrl = '';
  const fetchImpl = async url => {
    calledUrl = url;
    return {
      ok: true,
      body: {
        getReader() {
          return createReader([
            encoder.encode('data: {"type":"run.status","data":{"status":"done"}}\n\n'),
          ]);
        },
      },
    };
  };

  await subscribeToRunEvents({
    url: '/api/v1/copilot/sessions/cs_1/runs/run_1/events',
    fetchImpl,
    afterSequence: 7,
  });

  assert.strictEqual(
    calledUrl,
    '/api/v1/copilot/sessions/cs_1/runs/run_1/events?after_sequence=7',
    'subscribe should append after_sequence query param when > 0'
  );
}

async function testSubscribeToRunEventsForwardsHeadersAndSignal(encoder) {
  const captured = {};
  const fetchImpl = async (url, opts) => {
    captured.opts = opts;
    return {
      ok: true,
      body: {
        getReader() {
          return createReader([
            encoder.encode('data: {"type":"run.status","data":{"status":"done"}}\n\n'),
          ]);
        },
      },
    };
  };

  const signal = { aborted: false };
  await subscribeToRunEvents({
    url: '/api/v1/copilot/sessions/cs_1/runs/run_1/events',
    fetchImpl,
    headers: { Authorization: 'GRJWT abc', X_TEAM_NAME: 'team-a' },
    signal,
  });

  assert.strictEqual(captured.opts.signal, signal, 'subscribe should forward abort signal to fetch');
  assert.strictEqual(captured.opts.headers.Authorization, 'GRJWT abc');
  assert.strictEqual(captured.opts.headers.X_TEAM_NAME, 'team-a');
  assert.strictEqual(
    captured.opts.headers.Accept,
    'text/event-stream',
    'subscribe should request SSE Accept regardless of caller headers'
  );
}

async function testSubscribeToRunEventsResolvesOnTerminal(encoder) {
  const seen = [];
  const fetchImpl = async () => ({
    ok: true,
    body: {
      getReader() {
        return createReader([
          encoder.encode('data: {"type":"chat.trace","data":{"k":1}}\n\n'),
          encoder.encode('data: {"type":"run.status","data":{"status":"cancelled"}}\n\n'),
          encoder.encode('data: {"type":"chat.trace","data":{"ignored":true}}\n\n'),
        ]);
      },
    },
  });

  const events = await subscribeToRunEvents({
    url: '/api/v1/copilot/sessions/cs_1/runs/run_1/events',
    fetchImpl,
    onEvent: e => seen.push(e.type),
  });

  assert.deepStrictEqual(
    seen,
    ['chat.trace', 'run.status'],
    'subscribe should stop after terminal status and not emit subsequent events'
  );
  assert.strictEqual(events.length, 2);
}

async function testSubscribeToRunEventsRequiresUrl() {
  await assert.rejects(
    () => subscribeToRunEvents({ fetchImpl: async () => ({ ok: true, body: null }) }),
    /url is required/,
    'subscribe should reject when url missing'
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
