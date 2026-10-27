/* Real ReactDOM + installed UMI dynamic. Only the chunk transport and i18n
 * messages are fixtures; this does not exercise a deployed network. */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const babel = require('@umijs/deps/compiled/babel/core');

const filename = path.join(__dirname, 'index.js');
const compiled = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
  filename, babelrc: false, configFile: false,
  presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
    require('@umijs/deps/compiled/babel/preset-react').default]
}).code;

function pending() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function withReact(verify, { freshRenderer = false } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://127.0.0.1/', pretendToBeVisual: true
  });
  const globals = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window), MessageChannel: undefined,
    requestAnimationFrame: callback => setTimeout(callback, 0), cancelAnimationFrame: clearTimeout };
  const previous = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(global, key)]));
  Object.entries(globals).forEach(([key, value]) => Object.defineProperty(global, key, { configurable: true, writable: true, value }));
  dom.window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  let ReactDOM;
  try {
    const React = require('react');
    // React DEV's guarded callback retains the document from module evaluation.
    // A fresh real renderer is needed when asserting errors after earlier JSDOM
    // documents have been closed; do not replace the renderer/error machinery.
    if (freshRenderer) {
      delete require.cache[require.resolve('react-dom')];
      delete require.cache[require.resolve('react-dom/cjs/react-dom.development.js')];
    }
    ReactDOM = require('react-dom');
    const umi = require('umi');
    assert.equal(umi.dynamic, require('@umijs/runtime').dynamic, 'use the installed UMI runtime, not a dynamic fixture');
    const module = { exports: {} };
    new Function('module', 'exports', 'require', compiled)(module, module.exports, id => {
      if (id === '@/utils/intl') return { formatMessage: value => value.id };
      return require(id);
    });
    const container = dom.window.document.getElementById('root');
    const flush = () => new Promise(resolve => setTimeout(resolve, 15));
    const render = element => ReactDOM.render(element, container);
    const click = element => {
      assert.ok(element, 'expected a visible control');
      element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    };
    await verify({ React, ReactDOM, deferred: module.exports.default, container, render, flush, click,
      unmount: () => ReactDOM.unmountComponentAtNode(container), dom });
  } finally {
    if (ReactDOM) ReactDOM.unmountComponentAtNode(dom.window.document.getElementById('root'));
    await new Promise(resolve => setTimeout(resolve, 20));
    dom.window.close();
    Object.entries(previous).forEach(([key, descriptor]) => {
      if (descriptor) Object.defineProperty(global, key, descriptor); else delete global[key];
    });
  }
}

test('a deferred declaration and closed condition perform no import; resolved child receives latest props', () => withReact(async h => {
  const chunk = pending(); let imports = 0; const mounted = [];
  const Child = props => { mounted.push(props); return h.React.createElement('div', { 'data-child': true }, props.name); };
  const Deferred = h.deferred(() => { imports += 1; return chunk.promise; });
  h.render(h.React.createElement('div', null, false && h.React.createElement(Deferred)));
  assert.equal(imports, 0);
  h.render(h.React.createElement(Deferred, { name: 'old' }));
  assert.equal(imports, 1);
  assert.match(h.container.textContent, /status.loading/);
  h.render(h.React.createElement(Deferred, { name: 'current' }));
  assert.equal(imports, 1, 'updating props must not construct a new Loadable');
  chunk.resolve({ __esModule: true, default: Child }); await h.flush();
  assert.equal(h.container.querySelector('[data-child]').textContent, 'current');
  assert.equal(mounted.length, 1);
  assert.equal(mounted[0].name, 'current');
}));

for (const callbackName of ['onCancel', 'handleClose']) {
  test(`pending inline loading uses latest ${callbackName}; closed instances never mount the late child`, () => withReact(async h => {
    const chunk = pending(); let imports = 0, oldCancels = 0, currentCancels = 0, mounts = 0;
    const Deferred = h.deferred(() => { imports += 1; return chunk.promise; });
    h.render(h.React.createElement(Deferred, { [callbackName]: () => { oldCancels += 1; } }));
    h.render(h.React.createElement(Deferred, { [callbackName]: () => { currentCancels += 1; h.unmount(); } }));
    h.click(h.container.querySelector('button'));
    assert.equal(oldCancels, 0); assert.equal(currentCancels, 1);
    chunk.resolve({ __esModule: true, default: () => { mounts += 1; return null; } }); await h.flush();
    assert.equal(mounts, 0); assert.equal(imports, 1);
    assert.equal(h.container.childElementCount, 0);
  }));
}

test('loading-only cancel takes current precedence without leaking or replacing child callbacks', () => withReact(async h => {
  const chunk = pending(); const calls = []; let childProps;
  const Deferred = h.deferred(() => chunk.promise);
  const onCancel = () => calls.push('child-cancel'), handleClose = () => calls.push('child-close');
  h.render(h.React.createElement(Deferred, { onLoadingCancel: () => calls.push('old-loading'), onCancel, handleClose }));
  h.render(h.React.createElement(Deferred, { onLoadingCancel: () => calls.push('current-loading'), onCancel, handleClose }));
  h.click(h.container.querySelector('button'));
  assert.deepEqual(calls, ['current-loading']);
  chunk.resolve({ __esModule: true, default: props => { childProps = props; return null; } }); await h.flush();
  assert.equal(Object.prototype.hasOwnProperty.call(childProps, 'onLoadingCancel'), false);
  assert.equal(childProps.onCancel, onCancel); assert.equal(childProps.handleClose, handleClose);
  childProps.onCancel(); childProps.handleClose();
  assert.deepEqual(calls, ['current-loading', 'child-cancel', 'child-close']);
}));

test('rejected chunks expose only generic localized UI and retry solely on user action', () => withReact(async h => {
  const first = pending(), second = pending(); let imports = 0;
  const Deferred = h.deferred(() => (++imports === 1 ? first : second).promise);
  h.render(h.React.createElement(Deferred));
  first.reject(new Error('private-build-url-and-stack-must-not-render')); await h.flush();
  assert.equal(imports, 1, 'failure must not create an automatic retry loop');
  assert.equal(h.container.querySelector('[role="alert"]').getAttribute('role'), 'alert');
  assert.match(h.container.textContent, /asyncChunk.loadFailed/);
  assert.doesNotMatch(h.container.textContent, /private-build|Error:|stack/);
  h.click(h.container.querySelector('button')); await h.flush();
  assert.equal(imports, 2);
  second.resolve({ __esModule: true, default: () => h.React.createElement('div', { 'data-retried': true }, 'loaded') });
  await h.flush(); assert.equal(h.container.querySelector('[data-retried]').textContent, 'loaded');
}));

for (const fail of [false, true]) {
  test(`modal ${fail ? 'failure' : 'loading'} stays cancellable with latest callback and no stale child mount`, () => withReact(async h => {
    const chunk = pending(); let oldCancels = 0, currentCancels = 0, mounts = 0;
    const Deferred = h.deferred(() => chunk.promise, { modal: true });
    h.render(h.React.createElement(Deferred, { visible: true, onCancel: () => { oldCancels += 1; } }));
    if (fail) { chunk.reject(new Error('must-not-expose-this')); await h.flush(); }
    h.render(h.React.createElement(Deferred, { visible: true, onCancel: () => { currentCancels += 1; h.unmount(); } }));
    const dialog = h.dom.window.document.querySelector('[role="dialog"]');
    assert.ok(dialog, 'real Antd Modal is present while the chunk is pending/failed');
    h.click(dialog.querySelector('button[aria-label="Close"]'));
    assert.equal(oldCancels, 0); assert.equal(currentCancels, 1);
    if (!fail) chunk.resolve({ __esModule: true, default: () => { mounts += 1; return null; } });
    await h.flush(); assert.equal(mounts, 0);
    assert.equal(h.dom.window.document.querySelector('[role="dialog"]'), null);
  }));
}

test('loaded children retain real DVA legacy Provider and current store updates', () => withReact(async h => {
  const dva = require('dva');
  const reduxProvider = require(require.resolve('react-redux', { paths: [require.resolve('dva')] }));
  const { createStore } = require('redux');
  assert.equal(dva.connect, reduxProvider.connect);
  const store = createStore((state = { value: 'initial' }, action) => action.type === 'change' ? { value: action.value } : state);
  const Child = dva.connect(state => state)(props => h.React.createElement('div', { 'data-store': true }, `${props.value}:${props.name}`));
  const chunk = pending(); const Deferred = h.deferred(() => chunk.promise);
  const tree = name => h.React.createElement(reduxProvider.Provider, { store }, h.React.createElement(Deferred, { name }));
  h.render(tree('old')); h.render(tree('current'));
  chunk.resolve({ __esModule: true, default: Child }); await h.flush();
  assert.equal(h.container.querySelector('[data-store]').textContent, 'initial:current');
  store.dispatch({ type: 'change', value: 'updated' }); await h.flush();
  assert.equal(h.container.querySelector('[data-store]').textContent, 'updated:current');
}));

test('business child render exceptions are not converted into an import retry screen', () => withReact(async h => {
  const errors = []; let imports = 0;
  class Boundary extends h.React.Component {
    constructor(props) { super(props); this.state = { failed: false }; }
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(error) { errors.push(error); }
    render() { return this.state.failed ? h.React.createElement('div', { 'data-business-failure': true }, 'business failure') : this.props.children; }
  }
  const Deferred = h.deferred(() => { imports += 1; return Promise.resolve({ __esModule: true,
    default: () => { throw new Error('business child failure'); } }); });
  const originalError = console.error; const originalEmit = h.dom.window._virtualConsole.emit;
  console.error = () => {};
  h.dom.window._virtualConsole.emit = function filteredEmit(name, error) {
    if (name === 'jsdomError' && /business child failure/.test(error.message)) return false;
    return originalEmit.apply(this, arguments);
  };
  try {
    h.render(h.React.createElement(Boundary, null, h.React.createElement(Deferred))); await h.flush();
    assert.equal(errors.length, 1); assert.equal(errors[0].message, 'business child failure');
    assert.ok(h.container.querySelector('[data-business-failure]'));
    assert.doesNotMatch(h.container.textContent, /asyncChunk.loadFailed|button.retry/);
    assert.equal(imports, 1);
  } finally {
    console.error = originalError; h.dom.window._virtualConsole.emit = originalEmit;
  }
}, { freshRenderer: true }));

test('both common locale exports provide a generic load failure message', () => {
  for (const locale of ['zh-CN', 'en-US']) {
    const file = path.resolve(__dirname, `../../locales/${locale}/common.js`);
    const module = { exports: {} };
    const code = babel.transformSync(fs.readFileSync(file, 'utf8'), { filename: file, babelrc: false, configFile: false,
      presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }]] }).code;
    new Function('module', 'exports', code)(module, module.exports);
    assert.equal(typeof module.exports.default['asyncChunk.loadFailed'], 'string');
    assert.ok(module.exports.default['asyncChunk.loadFailed'].length > 0);
  }
});
