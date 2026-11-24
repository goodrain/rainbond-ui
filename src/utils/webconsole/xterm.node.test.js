const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function createAdapter() {
  const listeners = new Set();
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, 'xterm.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2018 }
  }).outputText;
  vm.runInNewContext(code, {
    exports, require,
    window: { addEventListener: (event, fn) => listeners.add(fn), removeEventListener: (event, fn) => listeners.delete(fn) }
  });
  const subscriptions = new Set();
  const subscribe = () => {
    const disposable = { dispose: () => subscriptions.delete(disposable) };
    subscriptions.add(disposable);
    return disposable;
  };
  const term = {
    cols: 80, rows: 24, writes: [], callbacks: [],
    scrollToBottom() {}, blur() {}, reset() {}, dispose() {},
    onData: subscribe, onResize: subscribe,
    write(data, callback) { this.writes.push(data); this.callbacks.push(callback); }
  };
  return { adapter: new exports.Xterm(term), term, listeners, subscriptions };
}

test('acknowledgement callback reaches the renderer rather than running when queued', () => {
  const { adapter, term } = createAdapter();
  let consumed = false;
  adapter.output('data', () => { consumed = true; });
  assert.equal(consumed, false);
  assert.equal(term.writes[0], 'data');
  term.callbacks[0]();
  assert.equal(consumed, true);
  adapter.close();
});

test('the actual libapps decoder preserves UTF-8 split across output frames', () => {
  const { adapter, term } = createAdapter();
  const data = Buffer.from('中文🙂');
  for (const byte of data) adapter.output(Buffer.from([byte]).toString('binary'));
  assert.equal(term.writes.join(''), '中文🙂');
  adapter.close();
});

test('deactivation removes window, keyboard and terminal resize listeners', () => {
  const { adapter, listeners, subscriptions } = createAdapter();
  adapter.onInput(() => {});
  adapter.onResize(() => {});
  adapter.onInput(() => {});
  adapter.onResize(() => {});
  assert.equal(listeners.size, 1);
  assert.equal(subscriptions.size, 2);
  adapter.deactivate();
  adapter.deactivate();
  assert.equal(listeners.size, 0);
  assert.equal(subscriptions.size, 0);
});

test('reset starts a fresh decoder and one window listener for the next session', () => {
  const { adapter, term, listeners } = createAdapter();
  adapter.output(Buffer.from([0xe4]).toString('binary'));
  adapter.deactivate();
  adapter.reset();
  adapter.output('next-session');
  assert.equal(term.writes.at(-1), 'next-session');
  assert.equal(listeners.size, 1);
  adapter.close();
  assert.equal(listeners.size, 0);
});
