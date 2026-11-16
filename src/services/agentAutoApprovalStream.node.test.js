const test = require('node:test');
const assert = require('node:assert/strict');
const { readSseEvents, streamRunWithResume } = require('./agentStream');
const event = (type, data) => ({ type, data });
const automatic = event('approval.requested', { approval_id: 'auto', auto_approved: true });
const waiting = event('run.status', { status: 'waiting_approval' });
const resolved = event('approval.resolved', { approval_id: 'auto', status: 'approved', auto_approved: true });
const running = event('run.status', { status: 'running' });
const answer = event('chat.message', { content: 'completed' });
const done = event('run.status', { status: 'done' });
function response(chunks) {
  const encoder = new TextEncoder();
  return { ok: true, body: new ReadableStream({ start(controller) {
    chunks.forEach(events => controller.enqueue(encoder.encode(events.map(e => `data: ${JSON.stringify(e)}\n\n`).join(''))));
    controller.close();
  } }) };
}
for (const batching of ['separate chunks', 'approval events share a chunk']) {
  test(`new send follows automatic approval through the final answer with ${batching}`, async () => {
    const chunks = batching === 'separate chunks' ? [[automatic], [waiting], [resolved], [running], [answer], [done]]
      : [[automatic, waiting, resolved, running], [answer, done]];
    const events = await readSseEvents(response(chunks));
    assert.equal(events.some(e => e.type === 'chat.message'), true);
    assert.equal(events.at(-1).data.status, 'done');
  });
}
test('manual confirmation continuation can pass later automatic approvals and stop at the next real manual approval', async () => {
  const manual = event('approval.requested', { approval_id: 'manual' });
  const events = await readSseEvents(response([[waiting], [event('approval.resolved', { approval_id: 'previous', status: 'approved' })],
    [automatic], [waiting], [resolved], [running], [answer], [manual], [waiting], [done]]), { skipFirstWaitingApproval: true });
  assert.equal(events.some(e => e.type === 'chat.message'), true);
  assert.equal(events.at(-1).data.status, 'waiting_approval');
  assert.equal(events.some(e => e.data.status === 'done'), false);
});
test('an automatic approval does not hide a following cancellation', async () => {
  const events = await readSseEvents(response([[automatic], [waiting], [resolved], [event('run.status', { status: 'cancelled' })], [answer]]));
  assert.equal(events.at(-1).data.status, 'cancelled');
  assert.equal(events.some(e => e.type === 'chat.message'), false);
});
test('a disconnect after an approval resumes instead of treating the old pause as a finished stream', async () => {
  let attempts = 0;
  const seen = [];
  const events = await streamRunWithResume({ sessionId: 's', runId: 'r', onEvent: e => seen.push(e),
    streamRunImpl: async options => {
      attempts++;
      if (attempts === 1) {
        [automatic, waiting, resolved, running].forEach((e, index) => options.onEvent({ ...e, sequence: index + 1 }));
        throw new Error('connection interrupted');
      }
      assert.equal(options.afterSequence, 4);
      options.onEvent({ ...answer, sequence: 5 });
      options.onEvent({ ...done, sequence: 6 });
      return [answer, done];
    },
  });
  assert.equal(attempts, 2);
  assert.equal(events.at(-1).data.status, 'done');
  assert.equal(seen.some(e => e.type === 'chat.message'), true);
});

test('a disconnect between an automatic pause and its resolution still resumes', async () => {
  let attempts = 0;
  await streamRunWithResume({ sessionId: 's', runId: 'r', streamRunImpl: async options => {
    attempts++;
    if (attempts === 1) {
      options.onEvent({ ...automatic, sequence: 1 });
      options.onEvent({ ...waiting, sequence: 2 });
      throw new Error('connection interrupted before resolution');
    }
    assert.equal(options.afterSequence, 2);
    [resolved, running, answer, done].forEach((e, index) => options.onEvent({ ...e, sequence: index + 3 }));
    return [resolved, running, answer, done];
  } });
  assert.equal(attempts, 2);
});

test('a reconnect carries an automatic request received before its waiting status', async () => {
  let attempts = 0;
  const events = await streamRunWithResume({ sessionId: 's', runId: 'r', streamRunImpl: async options => {
    attempts++;
    if (attempts === 1) {
      options.onEvent({ ...automatic, sequence: 1 });
      throw new Error('connection interrupted after request');
    }
    assert.equal(options.afterSequence, 1);
    return readSseEvents(response([[waiting], [resolved], [running], [answer], [done]]), options);
  } });
  assert.equal(events.some(e => e.type === 'chat.message'), true);
  assert.equal(events.at(-1).data.status, 'done');
});

test('the page interaction lock is released after automatically approved work completes', async () => {
  const { getNextInteractionLocked } = require('../models/agentInteractionLock');
  let locked = true;
  await readSseEvents(response([[automatic], [waiting], [resolved], [running], [answer], [done]]), {
    onEvent: incoming => { locked = getNextInteractionLocked(locked, incoming); },
  });
  assert.equal(locked, false);
});
