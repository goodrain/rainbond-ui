const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const babel = require('@umijs/deps/compiled/babel/core');
const parser = require('@babel/parser');
const { isVirtualMachineComponent } = require('../../utils/virtualMachineComponent');

const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator });
global.requestAnimationFrame = window.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = window.cancelAnimationFrame = clearTimeout;
const channel = global.MessageChannel;
global.MessageChannel = undefined;
const React = require('react');
const ReactDOM = require('react-dom');
const { act } = require('react-dom/test-utils');
global.MessageChannel = channel;

const filename = path.join(__dirname, 'withVMCreationRedirect.js');
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
  filename, babelrc: false, configFile: false,
  presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
    require('@umijs/deps/compiled/babel/preset-react').default],
  plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
}).code;

function harness(alias = 'vm-draft') {
  const actions = [], legacy = [];
  const current = { team: 'team-a', region: 'region-a' };
  const exported = {};
  vm.runInNewContext(code, {
    exports: exported,
    require(name) {
      if (name === 'react') return React;
      if (name === 'dva') return { connect: () => Component => Component };
      if (name === 'dva/router') return { routerRedux: { replace: destination => ({ type: 'navigate', destination }) } };
      if (name === 'antd') return { Spin: () => React.createElement('div', { 'data-loading': true }),
        Alert: () => React.createElement('div', { 'data-error': true }),
        Button: ({ onClick, children }) => React.createElement('button', { onClick }, children) };
      if (name === '@/utils/intl') return { formatMessage: value => value.id };
      if (name.endsWith('/global')) return { getCurrTeamName: () => current.team, getCurrRegionName: () => current.region };
      if (name.endsWith('/virtualMachineComponent')) return { isVirtualMachineComponent };
      throw new Error(`Unexpected dependency ${name}`);
    }
  }, { filename });
  class LegacyWizard extends React.Component {
    componentDidMount() { legacy.push(['mount', this.props.match.params.appAlias]); }
    componentDidUpdate() { legacy.push(['update', this.props.match.params.appAlias]); }
    componentWillUnmount() { legacy.push(['unmount']); }
    render() { return React.createElement('div', { 'data-legacy': true }); }
  }
  const Guard = exported.default(LegacyWizard);
  let props = { match: { params: { teamName: current.team, regionName: current.region, appAlias: alias } },
    location: { query: { group_id: '999', vm_url: 'https://invalid.example/do-not-forward' } },
    dispatch: action => { actions.push(action); } };
  const root = document.getElementById('root');
  const render = () => act(() => { ReactDOM.render(React.createElement(Guard, props), root); });
  render();
  return { actions, current, legacy, root,
    read: () => actions.filter(action => action.type === 'appControl/fetchDetail').at(-1),
    routes: () => actions.filter(action => action.type === 'navigate'),
    respond: detail => act(() => actions.filter(action => action.type === 'appControl/fetchDetail').at(-1).callback(detail)),
    update: value => { props = { ...props, ...value }; render(); },
    unmount: () => act(() => { ReactDOM.unmountComponentAtNode(root); }) };
}

const detail = (alias, method = 'vm', group = 68) => ({ service: {
  service_alias: alias, extend_method: method, service_source: method === 'vm' ? 'vm_run' : 'docker_run', group_id: group
} });

test('all four old route modules guard before their connected wizard mounts', () => {
  for (const file of ['create-check.js', 'create-configFile.js', 'create-configPort.js', 'create-setting.js']) {
    const tree = parser.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'), {
      sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties']
    });
    const component = tree.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
    assert.equal(component.decorators[0].expression.name, 'withVMCreationRedirect', file);
    assert.equal(component.decorators[1].expression.callee.name, 'connect', file);
  }
});

test('opening an old VM creation URL reads once and opens the existing backend application without mounting the wizard', () => {
  const h = harness();
  try {
    assert.equal(h.legacy.length, 0);
    assert.equal(h.actions.length, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(h.read().payload)), { team_name: 'team-a', region_name: 'region-a', app_alias: 'vm-draft' });
    h.respond(detail('vm-draft'));
    assert.equal(h.legacy.length, 0);
    assert.deepEqual(JSON.parse(JSON.stringify(h.routes()[0].destination)), {
      pathname: '/team/team-a/region/region-a/apps/68/overview',
      query: { type: 'components', componentID: 'vm-draft', tab: 'overview' }
    });
    assert.ok(h.actions.every(action => ['appControl/fetchDetail', 'navigate'].includes(action.type)));
    assert.equal(JSON.stringify(h.routes()).includes('999'), false);
    assert.equal(JSON.stringify(h.routes()).includes('do-not-forward'), false);
  } finally { h.unmount(); }
});

test('a confirmed ordinary container retains its original wizard', () => {
  const h = harness('container-draft');
  try {
    assert.equal(h.legacy.length, 0);
    h.respond(detail('container-draft', 'stateless_multiple'));
    assert.deepEqual(h.legacy, [['mount', 'container-draft']]);
    assert.equal(h.routes().length, 0);
    assert.ok(h.root.querySelector('[data-legacy]'));
  } finally { h.unmount(); }
});

test('failed, incomplete, or mismatched detail never mounts a wizard or trusts the query group', () => {
  for (const data of [null, {}, { service: {} }, detail('other-vm'), detail('vm-draft', 'vm', ''), detail('vm-draft', 'vm', '../68')]) {
    const h = harness();
    try {
      h.respond(data);
      assert.equal(h.legacy.length, 0);
      assert.equal(h.routes().length, 0);
      assert.ok(h.root.querySelector('[data-error]'));
    } finally { h.unmount(); }
  }
});

test('read failure permits explicit retry and does not start source detection or deployment', () => {
  const h = harness();
  try {
    act(() => h.read().handleError());
    assert.ok(h.root.querySelector('[data-error]'));
    act(() => h.root.querySelector('button').click());
    assert.equal(h.actions.length, 2);
    h.respond(detail('vm-draft'));
    assert.equal(h.routes().length, 1);
    assert.equal(h.legacy.length, 0);
  } finally { h.unmount(); }
});

test('a different route cannot render the old confirmed wizard before its own type is checked', () => {
  const h = harness('container-draft');
  try {
    const old = h.read();
    h.respond(detail('container-draft', 'stateless_multiple'));
    h.update({ match: { params: { teamName: 'team-a', regionName: 'region-a', appAlias: 'new-vm' } } });
    assert.equal(h.root.querySelector('[data-legacy]'), null);
    assert.equal(old.shouldApply(), false);
    act(() => old.callback(detail('container-draft')));
    assert.equal(h.routes().length, 0);
    h.respond(detail('new-vm'));
    assert.equal(h.routes()[0].destination.query.componentID, 'new-vm');
    assert.deepEqual(h.legacy, [['mount', 'container-draft'], ['unmount']]);
  } finally { h.unmount(); }
});

test('unmount and team/region changes invalidate pending detail and navigation', () => {
  const h = harness();
  const read = h.read();
  h.current.region = 'region-b';
  assert.equal(read.shouldApply(), false);
  act(() => read.callback(detail('vm-draft')));
  assert.equal(h.routes().length, 0);
  h.unmount();
  assert.equal(read.shouldApply(), false);
  read.callback(detail('vm-draft'));
  assert.equal(h.routes().length, 0);
});

test('production VM classification recognizes both list and detail metadata', () => {
  for (const value of [{ extend_method: 'vm' }, { service_source: 'vm' }, { service_source: 'vm_run' },
    { service: { extend_method: 'vm' } }, { vm_profile: {} }]) assert.equal(isVirtualMachineComponent(value), true);
  assert.equal(isVirtualMachineComponent({ service: { extend_method: 'stateless_multiple', service_source: 'docker_run' } }), false);
});

test('application component navigation keeps an incomplete VM in the real workspace while containers retain detection', () => {
  const overviewPath = path.resolve(__dirname, '../Group/Overview.js');
  const source = fs.readFileSync(overviewPath, 'utf8');
  const tree = parser.parse(source, { sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties'] });
  const component = tree.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const method = component.body.body.find(node => node.key.name === 'handleComponentOverview');
  const globalUtil = { getCurrTeamName: () => 'team-a', getCurrRegionName: () => 'region-a', getAppID: () => '68' };
  const navigation = [];
  const Component = new Function('globalUtil', 'routerRedux', 'isVirtualMachineComponent',
    `return class { ${source.slice(method.start, method.end)} };`)(globalUtil,
    { push: payload => ({ type: 'navigate', payload }) }, isVirtualMachineComponent);
  const instance = new Component();
  instance.props = { dispatch: action => navigation.push(action.payload) };
  instance.state = { apps: [
    { service_alias: 'vm-draft', status: 'creating', extend_method: 'vm' },
    { service_alias: 'container-draft', status: 'creating', extend_method: 'stateless_multiple', service_source: 'docker_run' }
  ] };
  instance.setState = update => Object.assign(instance.state, update);
  instance.handleComponentOverview('vm-draft');
  assert.match(navigation.at(-1), /apps\/68\/overview\?type=components&componentID=vm-draft&tab=overview$/);
  instance.handleComponentOverview('container-draft');
  assert.match(navigation.at(-1), /create\/create-check\/container-draft$/);
});
