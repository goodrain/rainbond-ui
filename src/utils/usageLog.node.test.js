const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const axios = require('axios');

const endpoint = 'https://log.rainbond.com/log';
const helperSource = fs.readFileSync(path.join(__dirname, 'usageLog.js'), 'utf8');
const globalSource = fs.readFileSync(path.join(__dirname, 'global.js'), 'utf8');

function loadHelper(send) {
  const source = helperSource
    .replace("import axios from 'axios';", '')
    .replace('export default function sendUsageLog', 'function sendUsageLog');
  const context = { axios: send, Promise };
  vm.runInNewContext(`${source};globalThis.sendUsageLog=sendUsageLog;`, context);
  return context.sendUsageLog;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertOptions(options, payload) {
  assert.deepEqual(Object.keys(options).sort(), ['credentials', 'data', 'method', 'timeout', 'url']);
  assert.equal(options.url, endpoint);
  assert.equal(options.method, 'post');
  assert.equal(options.credentials, 'same-origin');
  assert.equal(options.timeout, 5000);
  assert.equal(options.data, payload);
}

function loadCallers(send) {
  assert.match(globalSource, /import sendUsageLog from '\.\/usageLog';/);
  const start = globalSource.indexOf('  putInstallClusterLog(');
  const end = globalSource.indexOf('  getCurrEnterpriseId(', start);
  assert.ok(start > 0 && end > start, 'load the actual five global.js methods');
  const methods = globalSource.slice(start, end);
  assert.equal((methods.match(/sendUsageLog\(/g) || []).length, 5);
  const context = {
    sendUsageLog: loadHelper(send),
    window: { location: { href: 'https://fixture.invalid/#/enterprise/fixture/index' } },
    moment: () => ({ locale: () => ({ format: () => '20261027' }) })
  };
  vm.runInNewContext(`globalThis.callers=({${methods}});`, context);
  return context.callers;
}

const settleMicrotasks = () => new Promise(resolve => setImmediate(resolve));

test('usage log preserves the fixed destination, original credentials and payload identity', async () => {
  const payload = { eid: 'fixture', nested: { unchanged: true } };
  const calls = [];
  const sendUsageLog = loadHelper(options => {
    calls.push(options);
    return Promise.resolve({ status: 200 });
  });
  assert.equal(sendUsageLog(payload), undefined);
  await settleMicrotasks();
  assert.equal(calls.length, 1);
  assertOptions(calls[0], payload);
});

test('an asynchronous rejection is consumed without retries or a business promise', async () => {
  let count = 0;
  const sendUsageLog = loadHelper(() => {
    count += 1;
    return Promise.reject(new Error('controlled rejection'));
  });
  assert.equal(sendUsageLog({ eid: 'fixture' }), undefined);
  await settleMicrotasks();
  await settleMicrotasks();
  assert.equal(count, 1);
});

test('a synchronous axios failure cannot interrupt the business caller', () => {
  const sendUsageLog = loadHelper(() => { throw new Error('controlled synchronous failure'); });
  assert.equal(sendUsageLog({ eid: 'fixture' }), undefined);
});

test('a pending request is fire-and-forget and does not delay subsequent work', async () => {
  let reject;
  let calls = 0;
  const sendUsageLog = loadHelper(() => {
    calls += 1;
    return new Promise((resolve, fail) => { reject = fail; });
  });
  assert.equal(sendUsageLog({ eid: 'fixture' }), undefined);
  assert.equal(calls, 1);
  reject(new Error('controlled late rejection'));
  await settleMicrotasks();
  assert.equal(calls, 1);
});

test('throwing thenable assimilation is isolated like an axios rejection', async () => {
  const sendUsageLog = loadHelper(() => ({ get then() { throw new Error('controlled thenable failure'); } }));
  assert.equal(sendUsageLog({ eid: 'fixture' }), undefined);
  await settleMicrotasks();
});

test('all five actual call sites retain the original cleaned payloads', async () => {
  const calls = [];
  const callers = loadCallers(options => {
    calls.push(options);
    return Promise.resolve({ status: 200 });
  });
  const installed = { status: 'initial', provider: 'fixture-provider', absent: undefined };
  assert.equal(callers.putInstallClusterLog({}, {
    enterprise_alias: 'fixture-enterprise', version: { value: 'fixture-version' }
  }, installed), undefined);
  assert.equal(installed.status, 'start');
  assert.equal(callers.putClusterInfoLog('fixture-eid', [
    { provider: 'provider-a' }, { provider: 'provider-b' }
  ]), undefined);
  assert.equal(callers.putRegistLog({
    enterprise_id: 'fixture-eid', enterprise_alias: 'fixture-enterprise', real_name: 'fixture-name',
    phone: 'fixture-phone', version: 'fixture-version', email: 'fixture-email'
  }), undefined);
  assert.equal(callers.putLog({
    enterprise_id: 'fixture-eid', enterprise_alias: 'fixture-enterprise',
    version: { value: 'fixture-version' }, title: { value: 'fixture-title' }
  }), undefined);
  assert.equal(callers.putClusterSizeLog('fixture-eid'), undefined);
  await settleMicrotasks();
  assert.deepEqual(calls.map(options => plain(options.data)), [
    { e_name: 'fixture-enterprise', version: 'fixture-version', status: 'start', provider: 'fixture-provider' },
    { eid: 'fixture-eid', cluster_sizes: 2, cluster_types: ['provider-a', 'provider-b'], day: '20261027' },
    { eid: 'fixture-eid', e_name: 'fixture-enterprise', real_name: 'fixture-name', phone: 'fixture-phone',
      version: 'fixture-version', email: 'fixture-email', day: '20261027' },
    { url: 'https://fixture.invalid/#/enterprise/fixture/index', eid: 'fixture-eid', e_name: 'fixture-enterprise',
      version: 'fixture-version', title: 'fixture-title', day: '20261027' },
    { cluster_sizes: 1, cluster_types: ['dind'], eid: 'fixture-eid', day: '20261027' }
  ]);
  calls.forEach(options => assertOptions(options, options.data));
});

test('actual call sites retain opt-out and missing-identity guards', () => {
  const calls = [];
  const callers = loadCallers(options => { calls.push(options); });
  assert.equal(callers.putInstallClusterLog(null, {}, {}), null);
  assert.equal(callers.putInstallClusterLog({ disable_install_cluster_log: true }, {}, {}), null);
  assert.equal(callers.putLog(null), null);
  assert.equal(callers.putLog({}), null);
  assert.equal(callers.putClusterSizeLog(''), null);
  assert.equal(callers.putClusterSizeLog(null), null);
  assert.equal(calls.length, 0, 'guarded callers must not send');
});

test('actual install status mappings and JSON cleaning remain unchanged', () => {
  const statuses = [];
  const callers = loadCallers(options => {
    statuses.push(options.data.status);
    return Promise.resolve();
  });
  ['initial', 'success', 'running', 'offline', 'custom'].forEach(status => {
    callers.putInstallClusterLog({}, {}, { status });
  });
  assert.deepEqual(statuses, ['start', 'complete', 'complete', 'failure', 'custom']);
});

test('existing malformed-payload catches still suppress sending', () => {
  const calls = [];
  const callers = loadCallers(options => { calls.push(options); });
  assert.equal(callers.putClusterInfoLog('fixture-eid', null), undefined);
  assert.equal(callers.putRegistLog(null), undefined);
  assert.equal(callers.putLog({ enterprise_id: 'fixture-eid' }), undefined);
  const circular = {};
  circular.self = circular;
  assert.equal(callers.putInstallClusterLog({}, {}, circular), undefined);
  assert.equal(callers.putRegistLog({ enterprise_alias: circular }), undefined);
  assert.equal(calls.length, 0, 'malformed payload must not send');
});

test('all actual entry points isolate asynchronous network rejection', async () => {
  let count = 0;
  const callers = loadCallers(() => {
    count += 1;
    return Promise.reject(new Error('controlled rejected transport'));
  });
  assert.equal(callers.putInstallClusterLog({}, {}, {}), undefined);
  assert.equal(callers.putClusterInfoLog('fixture-eid', []), undefined);
  assert.equal(callers.putRegistLog({}), undefined);
  assert.equal(callers.putLog({ enterprise_id: 'fixture-eid', title: {}, version: {} }), undefined);
  assert.equal(callers.putClusterSizeLog('fixture-eid'), undefined);
  await settleMicrotasks();
  assert.equal(count, 5);
});

test('real axios uses the helper timeout and isolates loopback transport failures', { timeout: 12000 }, async t => {
  const sockets = new Set();
  const received = [];
  const server = http.createServer((request, response) => {
    received.push({ method: request.method, path: request.url });
    request.resume();
    if (request.url === '/hang') return;
    if (request.url === '/reset') {
      request.socket.destroy();
      return;
    }
    response.writeHead(request.url === '/http-error' ? 503 : 204);
    response.end();
  });
  server.on('connection', socket => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    for (const scenario of [
      { path: '/success', status: 204 },
      { path: '/http-error', status: 503 },
      { path: '/reset', code: 'ECONNRESET' },
      { path: '/hang', code: 'ECONNABORTED' }
    ]) {
      await t.test(scenario.path, async () => {
        const payload = { eid: 'fixture-eid' };
        let outcome;
        let count = 0;
        let done;
        const completed = new Promise(resolve => { done = resolve; });
        const sendUsageLog = loadHelper(options => {
          assertOptions(options, payload);
          count += 1;
          // Rewrite only in this test: production destination/options are asserted above.
          return axios({ ...options, url: `http://127.0.0.1:${server.address().port}${scenario.path}`, proxy: false })
            .then(response => {
              outcome = { status: response.status };
              done();
              return response;
            }, error => {
              outcome = { status: error.response && error.response.status, code: error.code };
              done();
              // Only the product helper consumes this rejection.
              return Promise.reject(error);
            });
        });
        const started = Date.now();
        assert.equal(sendUsageLog(payload), undefined);
        assert.ok(Date.now() - started < 1000, 'business flow does not await the HTTP request');
        await completed;
        await settleMicrotasks();
        if (scenario.code) assert.equal(outcome.code, scenario.code);
        else assert.equal(outcome.status, scenario.status);
        if (scenario.path === '/hang') {
          assert.ok(Date.now() - started >= 4500, 'real axios 5000 ms timeout must elapse');
          assert.ok(Date.now() - started < 9000, 'hanging telemetry must terminate');
        }
        assert.equal(count, 1, 'no retry');
      });
    }
    assert.deepEqual(received, ['/success', '/http-error', '/reset', '/hang'].map(route => ({ method: 'POST', path: route })));
  } finally {
    sockets.forEach(socket => socket.destroy());
    await new Promise(resolve => server.close(resolve));
  }
});
