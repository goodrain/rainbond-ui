const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const babel = require('@umijs/deps/compiled/babel/core');

function createPage(type) {
  const filename = path.join(__dirname, 'index.js');
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, babelrc: false, configFile: false,
    presets: [
      [require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
      require('@umijs/deps/compiled/babel/preset-react').default
    ],
    plugins: [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default]
  }).code;
  const module = { exports: {} };
  const intervals = new Map();
  const timeouts = new Map();
  const probes = [];
  let nextId = 1;
  class Socket {
    constructor() { this.readyState = 0; this.closed = 0; probes.push(this); }
    close() { this.closed++; }
  }
  Socket.OPEN = 1;
  const importModule = name => {
    if (name === 'react' || name === 'js-md5') return require(name);
    if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
    if (name.endsWith('webtty')) return { WebTTY: class {}, protocols: [] };
    if (name.endsWith('websocket')) return { ConnectionFactory: class {} };
    if (name.endsWith('webconsole/xterm')) return { Xterm: class {} };
    return { default: class {} };
  };
  new Function('module', 'exports', 'require', 'WebSocket', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', code)(
    module, module.exports, importModule, Socket,
    fn => { const id = nextId++; intervals.set(id, fn); return id; }, id => intervals.delete(id),
    fn => { const id = nextId++; timeouts.set(id, fn); return id; }, id => timeouts.delete(id)
  );
  const page = new module.exports.default({ type, WebsocketURL: 'ws://example.invalid/terminal' });
  page.setState = next => { page.state = { ...page.state, ...next }; };
  let connected = 0;
  page.EstablishConnection = () => { connected++; };
  return { page, probes, intervals, timeouts, connected: () => connected };
}

test('normal terminals create no extra probe socket', () => {
  const fixture = createPage(false);
  fixture.page.componentDidMount();
  assert.equal(fixture.probes.length, 0);
  assert.equal(fixture.connected(), 1);
  fixture.page.componentWillUnmount();
});

test('unmount closes a pending probe and cancels its timer', () => {
  const fixture = createPage(true);
  fixture.page.componentDidMount();
  const latePoll = fixture.intervals.values().next().value;
  fixture.page.componentWillUnmount();
  latePoll();
  assert.equal(fixture.probes[0].closed, 1);
  assert.equal(fixture.intervals.size, 0);
  assert.equal(fixture.connected(), 0);
});

test('an open probe closes before connecting and unmount cancels the delayed connection', () => {
  const fixture = createPage(true);
  fixture.page.componentDidMount();
  fixture.probes[0].readyState = 1;
  fixture.intervals.values().next().value();
  const lateConnection = fixture.timeouts.values().next().value;
  assert.equal(fixture.probes[0].closed, 1);
  assert.equal(fixture.intervals.size, 0);
  fixture.page.componentWillUnmount();
  lateConnection();
  assert.equal(fixture.timeouts.size, 0);
  assert.equal(fixture.connected(), 0);
});

test('an open probe establishes one connection when the page remains mounted', () => {
  const fixture = createPage(true);
  fixture.page.componentDidMount();
  fixture.probes[0].readyState = 1;
  fixture.intervals.values().next().value();
  fixture.timeouts.values().next().value();
  assert.equal(fixture.connected(), 1);
  fixture.page.componentWillUnmount();
});

test('temporary terminal size messages clear after their timeout', () => {
  const fixture = createPage(false);
  fixture.page.showMessage('100x15', 2000);
  assert.equal(fixture.page.state.message, '100x15');
  fixture.timeouts.values().next().value();
  assert.equal(fixture.page.state.message, '');
  fixture.page.componentWillUnmount();
});

test('a persistent overflow message cancels an earlier temporary message timer', () => {
  const fixture = createPage(false);
  fixture.page.showMessage('100x15', 2000);
  fixture.page.showMessage('output overflow', 0);
  assert.equal(fixture.timeouts.size, 0);
  assert.equal(fixture.page.state.message, 'output overflow');
  fixture.page.componentWillUnmount();
});

test('unmount cancels message timeouts and ignores a late clear callback', () => {
  const fixture = createPage(false);
  fixture.page.showMessage('100x15', 2000);
  const lateClear = fixture.timeouts.values().next().value;
  fixture.page.componentWillUnmount();
  lateClear();
  fixture.page.showMessage('late output', 0);
  assert.equal(fixture.timeouts.size, 0);
  assert.equal(fixture.page.state.message, '100x15');
});
