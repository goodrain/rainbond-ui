const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function createSession() {
  const timers = new Map();
  const window = {
    setInterval(fn) { timers.set(timers.size + 1, fn); return timers.size; },
    setTimeout(fn) { timers.set(timers.size + 1, fn); return timers.size; }
  };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, 'webtty.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2018 }
  }).outputText;
  vm.runInNewContext(code, {
    exports, window, atob: data => Buffer.from(data, 'base64').toString('binary'),
    clearInterval: id => timers.delete(id), clearTimeout: id => timers.delete(id)
  });
  const connection = {
    sent: [], openState: true, closeCount: 0,
    open() { this.openHandler(); },
    send(data) { this.sent.push(data); },
    close() { this.closeCount += 1; this.openState = false; this.closeHandler(); },
    isOpen() { return this.openState; },
    onOpen(fn) { this.openHandler = fn; },
    onReceive(fn) { this.receiveHandler = fn; },
    onClose(fn) { this.closeHandler = fn; }
  };
  const callbacks = [];
  const term = {
    writes: [], messages: [], deactivations: 0,
    info() { return { columns: 80, rows: 24 }; },
    output(data, callback) { this.writes.push(data); if (callback) callbacks.push(callback); },
    showMessage(message) { this.messages.push(message); },
    onResize(fn) { this.resize = fn; }, onInput(fn) { this.input = fn; },
    setWindowTitle() {}, setPreferences() {},
    deactivate() { this.deactivations += 1; }, reset() {}
  };
  const tty = new exports.WebTTY(term, { create: () => connection }, { C_id: 'fixture' }, '', 'fixture overflow');
  const close = tty.open();
  return {
    tty, term, connection, timers, close, callbacks,
    output(data) { connection.receiveHandler('1' + Buffer.from(data).toString('base64')); },
    negotiate() { connection.receiveHandler('4' + JSON.stringify({ flowControl: true, flowControlWindow: 65536 })); },
    consume() { assert.ok(callbacks.length, 'expected an outstanding renderer callback'); callbacks.shift()(); }
  };
}

test('requests optional flow control in the initial handshake', () => {
  const session = createSession();
  assert.equal(JSON.parse(session.connection.sent[0]).flow_control, true);
  session.close();
});

test('keeps exactly one renderer write outstanding and acknowledges consumed raw bytes', () => {
  const session = createSession();
  session.negotiate();
  session.output('first');
  session.output('second');
  assert.deepEqual(session.term.writes, ['first']);
  assert.equal(session.connection.sent.some(frame => frame.startsWith('4')), false);
  session.consume();
  assert.equal(session.connection.sent.at(-1), '45');
  assert.deepEqual(session.term.writes, ['first', 'second']);
  session.consume();
  assert.equal(session.connection.sent.at(-1), '46');
  session.close();
});

test('does not send new protocol frames to a legacy server', () => {
  const session = createSession();
  session.output('legacy');
  session.consume();
  assert.equal(session.connection.sent.some(frame => frame.startsWith('4')), false);
  session.close();
});

test('acknowledges UTF-8 byte counts rather than decoded character counts', () => {
  const session = createSession();
  session.negotiate();
  session.output('中文🙂');
  session.consume();
  assert.equal(session.connection.sent.at(-1), '410');
  session.close();
});

test('bounds legacy bursts and shows an explicit reconnect message', () => {
  const session = createSession();
  for (let index = 0; index < 300; index += 1) session.output('x'.repeat(1024));
  assert.equal(session.connection.closeCount, 1);
  assert.deepEqual(session.term.messages, ['fixture overflow']);
  assert.equal(session.term.writes.filter(data => data.length === 1024).length, 1);
});

test('drains accepted output after a normal remote close without sending late ACKs', () => {
  const session = createSession();
  session.negotiate();
  session.output('first');
  session.output('last');
  session.connection.close();
  assert.deepEqual(session.term.writes, ['first']);
  session.consume();
  assert.deepEqual(session.term.writes, ['first', 'last']);
  session.consume();
  assert.match(session.term.writes.at(-1), /Connection Closed/);
  assert.equal(session.connection.sent.some(frame => frame.startsWith('4')), false);
});

test('unmount cancels timers and ignores callbacks and frames after disposal', () => {
  const session = createSession();
  session.negotiate();
  session.output('pending');
  const sent = session.connection.sent.length;
  session.close();
  session.close();
  session.consume();
  session.output('late');
  assert.deepEqual(session.term.writes, ['pending']);
  assert.equal(session.connection.sent.length, sent);
  assert.equal(session.connection.closeCount, 1);
  assert.equal(session.timers.size, 0);
});

test('empty output and legacy null preferences never generate invalid ACKs', () => {
  const session = createSession();
  session.negotiate();
  session.output('');
  session.consume();
  assert.equal(session.connection.sent.some(frame => frame.startsWith('4')), false);
  session.connection.receiveHandler('4null');
  session.output('legacy');
  session.consume();
  assert.equal(session.connection.sent.some(frame => frame.startsWith('4')), false);
  session.close();
});
