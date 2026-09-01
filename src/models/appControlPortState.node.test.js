const assert = require('assert');
const {
  clearComponentPortsState,
  prepareComponentPortsState,
  saveComponentPortsState
} = require('./appControlPortState');

function test(name, fn) {
  fn();
  console.log(`ok - ${name}`);
}

test('prepareComponentPortsState retains ports while refreshing the same component', function () {
  const state = {
    ports: [{ protocol: 'http', container_port: 8080 }],
    portsOwner: 'component-a',
    portsRequestGeneration: 1
  };

  const next = prepareComponentPortsState(state, 'component-a', 2);

  assert.deepStrictEqual(next.ports, state.ports);
  assert.equal(next.portsOwner, 'component-a');
  assert.equal(next.portsRequestGeneration, 2);
});

test('prepareComponentPortsState clears ports when switching components', function () {
  const state = {
    ports: [{ protocol: 'http', container_port: 8080 }],
    portsOwner: 'component-a',
    portsRequestGeneration: 1
  };

  const next = prepareComponentPortsState(state, 'component-b', 2);

  assert.deepStrictEqual(next.ports, []);
  assert.equal(next.portsOwner, 'component-b');
});

test('saveComponentPortsState rejects stale component responses', function () {
  const state = {
    ports: [{ protocol: 'tcp', container_port: 6379 }],
    portsOwner: 'component-b',
    portsRequestGeneration: 3
  };

  const next = saveComponentPortsState(state, {
    appAlias: 'component-a',
    requestGeneration: 2,
    ports: [{ protocol: 'http', container_port: 8080 }]
  });

  assert.strictEqual(next, state);
});

test('saveComponentPortsState accepts the current component response', function () {
  const state = {
    ports: [],
    portsOwner: 'component-b',
    portsRequestGeneration: 3
  };
  const ports = [{ protocol: 'https', container_port: 8443 }];

  const next = saveComponentPortsState(state, {
    appAlias: 'component-b',
    requestGeneration: 3,
    ports
  });

  assert.deepStrictEqual(next.ports, ports);
});

test('clearComponentPortsState invalidates in-flight responses', function () {
  const state = {
    ports: [{ protocol: 'http', container_port: 8080 }],
    portsOwner: 'component-a',
    portsRequestGeneration: 4
  };

  const next = clearComponentPortsState(state);

  assert.deepStrictEqual(next.ports, []);
  assert.equal(next.portsOwner, '');
  assert.equal(next.portsRequestGeneration, 4);
});
