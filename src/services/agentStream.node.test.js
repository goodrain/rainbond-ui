const assert = require('assert');
const { TextEncoder } = require('util');

const { readSseEvents, TERMINAL_STATUSES } = require('./agentStream');

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

  console.log('agent stream helper tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
