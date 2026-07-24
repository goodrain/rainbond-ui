const assert = require('assert');

let sendEnvelope;
try {
  ({ sendEnvelope } = require('./sentryTransport'));
} catch (error) {
  sendEnvelope = undefined;
}

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function client() {
  return {
    dsn: 'https://public@example.invalid/42',
    envelopeUrl: '/console/sentry/api/42/envelope/?sentry_key=public',
    directEnvelopeUrl: 'https://example.invalid/api/42/envelope/?sentry_key=public'
  };
}

function parseEnvelope(payload) {
  return payload.split('\n').map(line => JSON.parse(line));
}

test('exports an injectable envelope transport', function() {
  assert.strictEqual(typeof sendEnvelope, 'function');
});

test('defaults error events to event items and the tunnel envelope url', function() {
  const beaconCalls = [];
  const fetchCalls = [];
  const event = { event_id: 'a'.repeat(32), message: 'failure' };

  sendEnvelope(client(), event, {}, {
    sendBeacon: function(url, body) {
      beaconCalls.push({ url, body });
      return true;
    },
    fetch: function() {
      fetchCalls.push(Array.prototype.slice.call(arguments));
      return Promise.resolve();
    }
  });

  assert.strictEqual(beaconCalls.length, 1);
  assert.strictEqual(fetchCalls.length, 0);
  assert.strictEqual(beaconCalls[0].url, client().envelopeUrl);
  const envelope = parseEnvelope(beaconCalls[0].body);
  assert.strictEqual(envelope[0].event_id, event.event_id);
  assert.strictEqual(envelope[0].dsn, client().dsn);
  assert.deepStrictEqual(envelope[1], {
    type: 'event',
    content_type: 'application/json'
  });
  assert.deepStrictEqual(envelope[2], event);
});

test('sends slow transactions as transaction items to the direct envelope url', function() {
  const beaconCalls = [];
  const event = { event_id: 'b'.repeat(32), type: 'transaction' };

  sendEnvelope(client(), event, { itemType: 'transaction', direct: true }, {
    sendBeacon: function(url, body) {
      beaconCalls.push({ url, body });
      return true;
    },
    fetch: function() {
      throw new Error('fetch should not run');
    }
  });

  assert.strictEqual(beaconCalls.length, 1);
  assert.strictEqual(beaconCalls[0].url, client().directEnvelopeUrl);
  assert.strictEqual(parseEnvelope(beaconCalls[0].body)[1].type, 'transaction');
});

test('sendBeacon success performs one attempt and does not call fetch', function() {
  let beaconAttempts = 0;
  let fetchAttempts = 0;

  sendEnvelope(client(), { event_id: 'c'.repeat(32) }, {}, {
    sendBeacon: function() {
      beaconAttempts += 1;
      return true;
    },
    fetch: function() {
      fetchAttempts += 1;
      return Promise.resolve();
    }
  });

  assert.strictEqual(beaconAttempts, 1);
  assert.strictEqual(fetchAttempts, 0);
});

test('sendBeacon false falls back to exactly one keepalive fetch', function() {
  let beaconAttempts = 0;
  const fetchCalls = [];
  const event = { event_id: 'd'.repeat(32) };

  sendEnvelope(client(), event, {}, {
    sendBeacon: function() {
      beaconAttempts += 1;
      return false;
    },
    fetch: function(url, options) {
      fetchCalls.push({ url, options });
      return Promise.resolve();
    }
  });

  assert.strictEqual(beaconAttempts, 1);
  assert.strictEqual(fetchCalls.length, 1);
  assert.strictEqual(fetchCalls[0].url, client().envelopeUrl);
  assert.strictEqual(fetchCalls[0].options.method, 'POST');
  assert.deepStrictEqual(fetchCalls[0].options.headers, {
    'Content-Type': 'text/plain;charset=UTF-8'
  });
  assert.strictEqual(fetchCalls[0].options.keepalive, true);
  assert.strictEqual(typeof fetchCalls[0].options.body, 'string');
  assert.deepStrictEqual(parseEnvelope(fetchCalls[0].options.body)[2], event);
});

test('unavailable sendBeacon falls back to exactly one keepalive fetch', function() {
  const fetchCalls = [];

  sendEnvelope(client(), { event_id: 'e'.repeat(32) }, {}, {
    sendBeacon: undefined,
    fetch: function(url, options) {
      fetchCalls.push({ url, options });
      return Promise.resolve();
    }
  });

  assert.strictEqual(fetchCalls.length, 1);
  assert.strictEqual(fetchCalls[0].options.method, 'POST');
  assert.strictEqual(fetchCalls[0].options.keepalive, true);
});

test('preferFetch bypasses sendBeacon for api error compatibility', function() {
  let beaconAttempts = 0;
  let fetchAttempts = 0;

  sendEnvelope(client(), { event_id: 'f'.repeat(32) }, { preferFetch: true }, {
    sendBeacon: function() {
      beaconAttempts += 1;
      return true;
    },
    fetch: function() {
      fetchAttempts += 1;
      return Promise.resolve();
    }
  });

  assert.strictEqual(beaconAttempts, 0);
  assert.strictEqual(fetchAttempts, 1);
});

test('rejected fetch is swallowed without retry or propagated error', async function() {
  let fetchAttempts = 0;

  const result = sendEnvelope(client(), { event_id: '1'.repeat(32) }, {}, {
    sendBeacon: function() {
      return false;
    },
    fetch: function() {
      fetchAttempts += 1;
      return Promise.reject(new Error('offline'));
    }
  });

  assert.strictEqual(result, undefined);
  await new Promise(resolve => setImmediate(resolve));
  assert.strictEqual(fetchAttempts, 1);
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
