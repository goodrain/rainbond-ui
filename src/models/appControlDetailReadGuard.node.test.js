const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const parser = require('@babel/parser');

const filename = path.join(__dirname, 'appControl.js');
const source = fs.readFileSync(filename, 'utf8');
const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx', 'decorators-legacy'] });
const exported = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
const effects = exported.properties.find(node => node.key.name === 'effects').value;
const method = effects.properties.find(node => node.key.name === 'fetchDetail');
const effectSource = source.slice(method.start, method.end);

function harness({ getDetail, onView, onPut } = {}) {
  const calls = [], telemetry = [], saves = [], callbacks = [], errors = [];
  const response = { bean: {
    service: { service_alias: 'vm-a', service_source: 'vm' },
    status: { status: 'running' }
  } };
  const service = (payload, handleError) => {
    calls.push({ payload, handleError });
    return getDetail ? getDetail(payload, handleError, response) : Promise.resolve(response);
  };
  const effect = new Function(
    'getDetail', 'captureMeaningfulActive', 'buildAppControlProperties', 'isRunningStatus', 'markFirstDeploySuccessOnce',
    `return ({ ${effectSource} }).fetchDetail;`
  )(
    service,
    (event, properties) => { telemetry.push({ event, properties }); if (onView) onView(); },
    (payload, extra = {}) => ({ team_name: payload.team_name, app_alias: payload.app_alias, ...extra }),
    status => status === 'running',
    properties => telemetry.push({ event: 'first_deploy', properties })
  );
  const action = {
    payload: { team_name: 'team-a', app_alias: 'vm-a' },
    callback: detail => callbacks.push(detail),
    handleError: error => errors.push(error)
  };
  const run = async overrides => {
    const iterator = effect({ ...action, ...overrides }, {
      call: (fn, ...args) => fn(...args),
      put: value => { saves.push(value); if (onPut) onPut(value); return Promise.resolve(); }
    });
    let next = iterator.next();
    while (!next.done) {
      try { next = iterator.next(await next.value); }
      catch (error) { next = iterator.throw(error); }
    }
  };
  return { action, response, calls, telemetry, saves, callbacks, errors, run };
}

test('a detail response finishing after the caller scope changes cannot write shared state or telemetry', async () => {
  let active = true;
  let resolveRead;
  const h = harness({ getDetail: () => new Promise(resolve => { resolveRead = resolve; }) });
  const request = h.run({ shouldApply: () => active });
  assert.equal(h.calls.length, 1);
  active = false;
  resolveRead(h.response);
  await request;
  assert.deepEqual(h.saves, []);
  assert.deepEqual(h.telemetry, []);
  assert.deepEqual(h.callbacks, []);
});

test('an active scoped detail read writes and reports its response once', async () => {
  const h = harness();
  await h.run({ shouldApply: () => true });
  assert.equal(h.calls.length, 1);
  assert.deepEqual(h.saves, [{ type: 'saveDetail', payload: h.response.bean }]);
  assert.deepEqual(h.callbacks, [h.response.bean]);
  assert.deepEqual(h.telemetry.map(item => item.event), ['view_app', 'first_deploy']);
});

test('the optional guard preserves the legacy action and error-handler contract when omitted', async () => {
  const h = harness();
  await h.run();
  assert.equal(h.calls.length, 1);
  assert.strictEqual(h.calls[0].payload, h.action.payload);
  assert.strictEqual(h.calls[0].handleError, h.action.handleError);
  assert.deepEqual(h.saves, [{ type: 'saveDetail', payload: h.response.bean }]);
  assert.deepEqual(h.callbacks, [h.response.bean]);
  assert.deepEqual(h.telemetry.map(item => item.event), ['view_app', 'first_deploy']);
});

for (const [name, shouldApply] of [
  ['inactive', () => false],
  ['throwing', () => { throw new Error('opaque-predicate-sentinel'); }]
]) {
  test(`an ${name} guard stops before the request and exposes no predicate error`, async () => {
    const h = harness();
    await h.run({ shouldApply });
    assert.deepEqual(h.calls, []);
    assert.deepEqual(h.telemetry, []);
    assert.deepEqual(h.saves, []);
    assert.deepEqual(h.callbacks, []);
    assert.deepEqual(h.errors, []);
  });
}

test('scope is checked again before saveDetail after response instrumentation', async () => {
  let active = true;
  const h = harness({ onView: () => { active = false; } });
  await h.run({ shouldApply: () => active });
  assert.deepEqual(h.telemetry.map(item => item.event), ['view_app']);
  assert.deepEqual(h.saves, []);
  assert.deepEqual(h.callbacks, []);
});

test('the caller callback is skipped if the scope changes while the reducer write completes', async () => {
  let active = true;
  const h = harness({ onPut: () => { active = false; } });
  await h.run({ shouldApply: () => active });
  assert.equal(h.saves.length, 1);
  assert.deepEqual(h.callbacks, []);
});

test('a late service error cannot reach the obsolete scoped caller', async () => {
  let active = true;
  const h = harness({ getDetail: async (payload, handleError) => {
    active = false;
    handleError({ message: 'opaque-response-sentinel' });
    return undefined;
  } });
  await h.run({ shouldApply: () => active });
  assert.deepEqual(h.errors, []);
  assert.deepEqual(h.saves, []);
  assert.deepEqual(h.telemetry, []);
  assert.deepEqual(h.callbacks, []);
});
