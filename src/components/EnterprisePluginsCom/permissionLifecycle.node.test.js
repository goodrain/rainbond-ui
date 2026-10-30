const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const parser = require('@babel/parser');
const babel = require('@babel/core');

const dom = new JSDOM('<!doctype html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
window.requestAnimationFrame = callback => setTimeout(callback, 0);
window.cancelAnimationFrame = clearTimeout;
// React 16's browser scheduler would keep Node's MessageChannel ports alive.
const messageChannel = global.MessageChannel;
global.MessageChannel = undefined;
const React = require('react');
const ReactDOM = require('react-dom');
global.MessageChannel = messageChannel;
test.after(() => dom.window.close());

// Render the production host with React's real reconciliation and mount lifecycle.
const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const ast = parser.parse(source, { sourceType: 'module', plugins: ['decorators-legacy', 'jsx'] });
const declaration = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
const { code } = babel.transformSync(
  `class PluginHost extends Component ${source.slice(declaration.body.start, declaration.body.end)}`,
  { babelrc: false, configFile: false, presets: [require('@umijs/deps/compiled/babel/preset-react')] }
);
const PluginHost = new Function('React', 'Component', 'Spin', 'Card', 'Button', 'Result', 'PluginsUtiles', 'Global', 'baseInfo',
  `${code}; return PluginHost;`)(
  React, React.Component,
  ({ tip }) => React.createElement('p', { 'data-loading': true }, tip),
  ({ children }) => React.createElement('div', null, children),
  ({ children }) => React.createElement('button', null, children),
  ({ title }) => React.createElement('p', null, title),
  { determineRenderKey: key => key === 'Permission' ? 'PermissionPage' : key },
  { getCurrTeamName: () => 'team-a', getCurrRegionName: () => 'region-a' },
  {}
);

function harness(t, initialProps = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let mounts = 0;
  let unmounts = 0;
  const requests = [];
  class PermissionPage extends React.Component {
    componentDidMount() {
      mounts += 1;
      this.props.dispatch({ type: 'global/fetchGroups' });
    }
    componentWillUnmount() { unmounts += 1; }
    render() {
      const names = (this.props.reduxInfo.global.groups || []).map(group => group.group_name);
      return React.createElement('div', { 'data-role-page': true }, `角色列表 ${names.join(',')}`);
    }
  }
  let props = {
    app: { PermissionPage },
    appKey: 'Permission',
    plugins: { plugin_type: 'JSInject' },
    pluginLoading: false,
    groupsLoading: false,
    global: { groups: [] },
    teamControl: { currentTeam: { namespace: 'team-a' } },
    dispatch: action => requests.push(action),
    ...initialProps
  };
  const update = changes => {
    props = { ...props, ...changes };
    ReactDOM.render(React.createElement(PluginHost, props), container);
  };
  t.after(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });
  update({});
  return {
    container, requests, update,
    get mounts() { return mounts; },
    get unmounts() { return unmounts; }
  };
}

test('role plugin stays mounted while its mount request is pending and settled', t => {
  const h = harness(t);
  assert.equal(h.requests.length, 1);
  h.update({ groupsLoading: true });
  assert.ok(h.container.querySelector('[data-role-page]'), 'a plugin request must not replace the role page with a spinner');
  assert.equal(h.unmounts, 0);
  h.update({ groupsLoading: false, global: { groups: [] } });
  assert.equal(h.mounts, 1);
  assert.equal(h.requests.length, 1, 'settling a request must not mount the plugin and start another request');
});

test('application hydration and renaming refresh roles once; identical reads and loading changes do not', t => {
  const h = harness(t);
  const groups = [{ group_id: 1, group_name: '应用一' }];
  h.update({ groupsLoading: true });
  h.update({ groupsLoading: false, global: { groups } });
  assert.match(h.container.textContent, /应用一/);
  assert.equal(h.mounts, 2);
  for (let index = 0; index < 3; index += 1) {
    h.update({ groupsLoading: true });
    h.update({ groupsLoading: false, global: { groups: groups.map(group => ({ ...group })) } });
  }
  assert.equal(h.mounts, 2, 'unchanged application names must not restart plugin initialization');
  assert.equal(h.requests.length, 2);
  h.update({ global: { groups: [{ group_id: 1, group_name: '重命名应用' }] } });
  assert.match(h.container.textContent, /重命名应用/);
  assert.equal(h.mounts, 3);
  h.update({ groupsLoading: true });
  h.update({ groupsLoading: false });
  assert.equal(h.mounts, 3);
});

test('plugin code loading and plugin failure still show their existing states', t => {
  const h = harness(t, { pluginLoading: true });
  assert.equal(h.mounts, 0);
  assert.ok(h.container.querySelector('[data-loading]'));
  h.update({ pluginLoading: false });
  assert.equal(h.mounts, 1);
  h.update({ error: true, errInfo: 'fixture failure' });
  assert.match(h.container.textContent, /插件加载失败/);
});
