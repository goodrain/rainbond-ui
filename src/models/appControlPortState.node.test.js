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
    portsRequestGeneration: 1,
    gatewayTrafficTabVisible: true
  };

  const next = prepareComponentPortsState(state, 'component-a', 2);

  assert.deepStrictEqual(next.ports, state.ports);
  assert.equal(next.portsOwner, 'component-a');
  assert.equal(next.portsRequestGeneration, 2);
  assert.equal(next.gatewayTrafficTabVisible, true);
});

test('prepareComponentPortsState clears ports when switching components', function () {
  const state = {
    ports: [{ protocol: 'http', container_port: 8080 }],
    portsOwner: 'component-a',
    portsRequestGeneration: 1,
    gatewayTrafficTabVisible: true
  };

  const next = prepareComponentPortsState(state, 'component-b', 2);

  assert.deepStrictEqual(next.ports, []);
  assert.equal(next.portsOwner, 'component-b');
  assert.equal(
    next.gatewayTrafficTabVisible,
    true,
    'the gateway tab should remain stable while the next component ports are loading'
  );
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
  assert.equal(next.gatewayTrafficTabVisible, true);
});

test('saveComponentPortsState hides gateway traffic after current non-http ports load', function () {
  const state = {
    ports: [],
    portsOwner: 'component-b',
    portsRequestGeneration: 3,
    gatewayTrafficTabVisible: true
  };

  const next = saveComponentPortsState(state, {
    appAlias: 'component-b',
    requestGeneration: 3,
    ports: [{ protocol: 'tcp', container_port: 6379 }]
  });

  assert.equal(next.gatewayTrafficTabVisible, false);
});

test('clearComponentPortsState invalidates in-flight responses without hiding gateway traffic', function () {
  const state = {
    ports: [{ protocol: 'http', container_port: 8080 }],
    portsOwner: 'component-a',
    portsRequestGeneration: 4,
    gatewayTrafficTabVisible: true
  };

  const next = clearComponentPortsState(state);

  assert.deepStrictEqual(next.ports, []);
  assert.equal(next.portsOwner, '');
  assert.equal(next.portsRequestGeneration, 4);
  assert.equal(next.gatewayTrafficTabVisible, true);
});
