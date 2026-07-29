const assert = require('assert');

let trackSlowRequestLifecycle;
try {
  ({ trackSlowRequestLifecycle } = require('./requestSlowTelemetry'));
} catch (error) {
  trackSlowRequestLifecycle = undefined;
}

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function lifecycleOptions(overrides) {
  return Object.assign({
    context: { request: 'sampled' },
    finish: function() {},
    checkStatus: function(response) { return response; },
    isCancel: function() { return false; }
  }, overrides);
}

test('preserves a 2xx response identity and completes once', async function() {
  assert.strictEqual(typeof trackSlowRequestLifecycle, 'function');
  const response = { status: 200, data: { value: 'ok' } };
  const completions = [];

  const result = await trackSlowRequestLifecycle(
    Promise.resolve(response),
    lifecycleOptions({
      finish: function(context, outcome) {
        completions.push({ context, outcome });
      }
    })
  );

  assert.strictEqual(result, response);
  assert.deepStrictEqual(completions, [
    {
      context: { request: 'sampled' },
      outcome: { status: 200 }
    }
  ]);
});

test('preserves a directly rejected error and completes once', async function() {
  const requestError = new Error('network failed');
  const completions = [];

  await assert.rejects(
    trackSlowRequestLifecycle(
      Promise.reject(requestError),
      lifecycleOptions({
        finish: function(context, outcome) {
          completions.push({ context, outcome });
        }
      })
    ),
    function(error) { return error === requestError; }
  );

  assert.deepStrictEqual(completions, [
    {
      context: { request: 'sampled' },
      outcome: { status: undefined, cancelled: false }
    }
  ]);
});

test('completes once when checkStatus rejects an accepted response', async function() {
  const response = { status: 503 };
  const statusError = new Error('service unavailable');
  statusError.response = response;
  const completions = [];
  const order = [];

  await assert.rejects(
    trackSlowRequestLifecycle(
      Promise.resolve(response),
      lifecycleOptions({
        finish: function(context, outcome) {
          order.push('finish');
          completions.push({ context, outcome });
        },
        checkStatus: function() {
          order.push('checkStatus');
          throw statusError;
        }
      })
    ),
    function(error) { return error === statusError; }
  );

  assert.deepStrictEqual(completions, [
    {
      context: { request: 'sampled' },
      outcome: { status: 503 }
    }
  ]);
  assert.deepStrictEqual(order, ['finish', 'checkStatus']);
});

test('marks axios cancellation and does not complete twice', async function() {
  const cancelError = new Error('cancelled');
  cancelError.cancelledByAxios = true;
  const completions = [];

  await assert.rejects(
    trackSlowRequestLifecycle(
      Promise.reject(cancelError),
      lifecycleOptions({
        finish: function(context, outcome) {
          completions.push({ context, outcome });
        },
        isCancel: function(error) {
          return error.cancelledByAxios === true;
        }
      })
    ),
    function(error) { return error === cancelError; }
  );

  assert.deepStrictEqual(completions, [
    {
      context: { request: 'sampled' },
      outcome: { status: undefined, cancelled: true }
    }
  ]);
});

test('throwing completion does not change a successful response', async function() {
  const response = { status: 204 };

  const result = await trackSlowRequestLifecycle(
    Promise.resolve(response),
    lifecycleOptions({
      finish: function() {
        throw new Error('telemetry failed');
      }
    })
  );

  assert.strictEqual(result, response);
});

test('throwing completion does not replace a rejected request error', async function() {
  const requestError = new Error('request failed');

  await assert.rejects(
    trackSlowRequestLifecycle(
      Promise.reject(requestError),
      lifecycleOptions({
        finish: function() {
          throw new Error('telemetry failed');
        }
      })
    ),
    function(error) { return error === requestError; }
  );
});

async function run() {
  for (let index = 0; index < tests.length; index += 1) {
    const current = tests[index];
    try {
      await current.fn();
      console.log('ok - ' + current.name);
    } catch (error) {
      console.error('not ok - ' + current.name);
      throw error;
    }
  }
}

run().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
