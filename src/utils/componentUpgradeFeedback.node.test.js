const assert = require('node:assert/strict');
const { test } = require('node:test');
const { observeComponentUpgrade, showComponentUpgradeFeedback, safeOperationMessage } = require('./componentUpgradeFeedback');

const event = (status, final_status = 'complete', id = 'update-1') => ({ event_id: id, status, final_status });
function observe(responses, options = {}) {
  let clock = 0;
  return observeComponentUpgrade({ eventID: 'update-1', isCurrent: () => true,
    readEvents: async () => ({ list: responses.shift() || [] }),
    wait: async milliseconds => { clock += milliseconds; }, now: () => clock, timeout: 6000,
    ...options });
}

test('HTTP acceptance shows pending and starts tracking the returned exact event', () => {
  const messages = [], actions = [];
  const notification = Object.fromEntries(['info', 'success', 'warning', 'error'].map(type => [type, data => messages.push({ type, ...data })]));
  showComponentUpgradeFeedback({ dispatch: action => actions.push(action), payload: { team_name: 'team', app_alias: 'vm' },
    response: { bean: { event_id: 'update-1' } }, isCurrent: () => true, notification, formatMessage: ({ id }) => id });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].type, 'info');
  assert.equal(actions[0].payload.event_id, 'update-1');
  actions[0].callback({ status: 'failure', message: 'configmap update rejected' });
  assert.equal(messages[1].type, 'error');
  assert.equal(messages[1].description, 'configmap update rejected');
});

test('only this task terminal success is success', async () => {
  const result = await observe([[event('success', 'complete', 'other')], [event('running', '')], [event('success')]]);
  assert.deepEqual(result, { status: 'success', message: '' });
});

test('failure reads the concrete error detail from the existing event log', async () => {
  const result = await observe([[{ ...event('failure'), message: 'generic callback' }]], {
    readErrorLogs: async () => ({ list: [{ message: 'upgrade vm failure: update configmap denied' }, { message: 'generic callback' }] })
  });
  assert.equal(result.status, 'failure');
  assert.equal(result.message, 'upgrade vm failure: update configmap denied');
});

test('missing ID, expired observation, and backend task timeout are unconfirmed', async () => {
  assert.deepEqual(await observe([], { eventID: '' }), { status: 'unconfirmed' });
  assert.deepEqual(await observe([[], [], []]), { status: 'unconfirmed' });
  assert.equal((await observe([[event('timeout', 'timeout')]])).status, 'unconfirmed');
});

test('status read failure never becomes success and stops after bounded retries', async () => {
  let reads = 0;
  const result = await observe([], { readEvents: async () => { reads += 1; throw new Error('unavailable'); } });
  assert.equal(result.status, 'unconfirmed');
  assert.equal(reads, 3);
});

test('navigation or unmount discards stale task responses', async () => {
  let current = true;
  const result = await observe([], { isCurrent: () => current, readEvents: async () => { current = false; return { list: [event('success')] }; } });
  assert.equal(result, null);
});

test('backend errors remain text, bounded and redact credential assignments', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const text = safeOperationMessage('update configmap failure: <script>alert(1)</script> token=sample password="sample value" Bearer sample');
  assert.equal(text.includes('sample'), false);
  assert.ok(text.includes('update configmap failure'));
  const html = renderToStaticMarkup(React.createElement('span', null, text));
  assert.equal(html.includes('<script>'), false);
  assert.equal(safeOperationMessage('x'.repeat(2000)).length, 1024);
});
