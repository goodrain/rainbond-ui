const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const { JSDOM } = require('jsdom');

test('the connected security boundary recovers on route changes without remounting healthy routes', () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://127.0.0.1/' });
  const globals = {
    window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    MessageChannel: undefined,
    requestAnimationFrame: callback => setTimeout(callback, 0), cancelAnimationFrame: clearTimeout
  };
  Object.assign(dom.window, {
    requestAnimationFrame: globals.requestAnimationFrame,
    cancelAnimationFrame: globals.cancelAnimationFrame
  });
  const previous = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(global, key)]));
  Object.entries(globals).forEach(([key, value]) => Object.defineProperty(global, key, { configurable: true, writable: true, value }));
  const previousConsoleError = console.error;
  const expectedErrors = [];
  let ReactDOM;
  try {
    const React = require('react');
    ReactDOM = require('react-dom');
    const { act } = require('react-dom/test-utils');
    const dva = require('dva');
    const redux5 = require(require.resolve('react-redux', { paths: [require.resolve('dva')] }));
    const { createStore, applyMiddleware } = require('redux');
    const babel = require('@umijs/deps/compiled/babel/core');
    const actions = [];
    const store = createStore((state = { user: { currentUser: { user_name: 'fixture', enterprise_id: 'fixture' } },
      loading: { models: {} }, global: {} }) => state,
    applyMiddleware(() => next => action => {
      actions.push(action);
      if (action.type === 'global/fetchRainbondInfo') action.callback({});
      if (action.type === 'user/fetchCurrent') action.callback();
      return next(action);
    }));
    const box = ({ children }) => React.createElement('div', null, children);
    const fixtures = {
      react: React, dva,
      antd: { Button: ({ children, onClick }) => React.createElement('button', { onClick }, children) },
      '../components/Result/index': ({ title }) => React.createElement('div', { role: 'alert' }, title),
      '../posthog': { captureErrorViewed() {} }, '../sentry': { captureException() {} },
      umi: { Redirect: box }, '../components/PageLoading': box,
      querystring: require('querystring'),
      '../utils/cookie': { get: () => '$TOKEN' },
      '../utils/global': { removeCookie() {} },
      '../utils/authorizationRedirect': { getSafeRedirect: () => '' }
    };
    const load = filename => {
      const code = babel.transformSync(fs.readFileSync(path.join(__dirname, filename), 'utf8'), {
        filename: path.join(__dirname, filename), babelrc: false, configFile: false,
        presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
          require('@umijs/deps/compiled/babel/preset-react').default],
        plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
          [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
      }).code;
      const module = { exports: {} };
      new Function('module', 'exports', 'require', 'React', code)(module, module.exports, name => {
        if (!(name in fixtures)) throw new Error(`Unexpected dependency: ${name}`);
        return fixtures[name];
      }, React);
      return module.exports.default;
    };
    fixtures['./ErrorBoundary'] = load('ErrorBoundary.js');
    const SecurityLayout = load('SecurityLayout.js');
    const container = dom.window.document.getElementById('root');
    let mounts = 0;
    class Page extends React.Component {
      componentDidMount() { mounts += 1; }
      render() {
        if (this.props.crash) throw new Error('fixture render failed');
        return React.createElement('p', null, 'healthy page');
      }
    }
    const render = (pathname, { crash = false, search = '' } = {}) => act(() => {
      ReactDOM.render(React.createElement(redux5.Provider, { store },
        React.createElement(SecurityLayout, { location: { pathname, search } }, React.createElement(Page, { crash }))), container);
    });
    console.error = (...values) => expectedErrors.push(values.map(String).join(' '));
    render('/enterprise/fixture/index');
    assert.equal(container.textContent, 'healthy page');
    assert.equal(mounts, 1);
    render('/enterprise/fixture/index', { search: '?tab=memory' });
    assert.equal(mounts, 1, 'a healthy route update must preserve the mounted subtree');

    render('/team/fixture/index', { crash: true });
    assert.match(container.textContent, /UI遇到障碍/);
    const reports = () => actions.filter(action => action.type === 'global/saveLog');
    assert.equal(reports().length, 1);
    render('/team/fixture/index');
    assert.match(container.textContent, /UI遇到障碍/, 'ordinary same-route rerenders must retain the failure');
    assert.equal(reports().length, 1);

    render('/enterprise/fixture/index');
    assert.equal(container.textContent, 'healthy page', 'browser back can render the healthy previous route');
    assert.equal(mounts, 2);
    render('/team/fixture/index', { crash: true });
    assert.match(container.textContent, /UI遇到障碍/, 'a new failing route must still be caught');
    assert.equal(reports().length, 2);
    render('/team/fixture/index', { search: '?tab=healthy' });
    assert.equal(container.textContent, 'healthy page', 'a different query route can recover independently');
    assert.equal(mounts, 3);
    assert.ok(expectedErrors.some(value => value.includes('fixture render failed')));
  } finally {
    console.error = previousConsoleError;
    if (ReactDOM) ReactDOM.unmountComponentAtNode(dom.window.document.getElementById('root'));
    dom.window.close();
    Object.keys(globals).forEach(key => {
      if (previous[key]) Object.defineProperty(global, key, previous[key]);
      else delete global[key];
    });
  }
});
