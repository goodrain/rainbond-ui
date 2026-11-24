const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const babel = require('@umijs/deps/compiled/babel/core');
const quickStart = require('../../utils/vmQuickStart');
const metadata = require('./sourceMetadata');

const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator });
global.requestAnimationFrame = window.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = window.cancelAnimationFrame = clearTimeout;
const oldChannel = global.MessageChannel;
global.MessageChannel = undefined;
const React = require('react');
const ReactDOM = require('react-dom');
const { act } = require('react-dom/test-utils');
global.MessageChannel = oldChannel;

let native;
let workflow;
let currentScope = { team: 'team-a', region: 'region-a', application: '868' };
const Box = ({ children }) => React.createElement('div', null, children);
const Button = ({ children, onClick, disabled, ...props }) => React.createElement('button', {
  onClick, disabled, 'data-testid': props['data-testid']
}, children);
function Modal({ visible, children, footer, title }) {
  // Native Antd Modal retains its form subtree while hidden between source and
  // hardware steps. Keep this lifetime behavior in the lifecycle fixture.
  return React.createElement('div', { 'data-modal': title === 'createTitle' ? 'hardware' : 'chooser', hidden: !visible }, children, footer);
}
Modal.warning = Modal.confirm = Modal.error = () => {};
const Radio = Box;
Radio.Group = Radio.Button = Box;
const Input = Box;
Input.TextArea = Input.Search = Box;
const Form = Box;
Form.create = () => Component => Component;

class NativeSourceFixture extends React.Component {
  constructor(props) {
    super(props);
    this.fields = { ssh_username: 'ubuntu', ssh_public_key: 'opaque-native-form-only' };
    this.state = { existFileList: [] };
  }
  setNativeRef(value) {
    const ref = this.props.wrappedComponentRef;
    if (typeof ref === 'function') ref(value);
    else ref.current = value;
  }
  componentDidMount() { native = this; this.setNativeRef(this); }
  componentDidUpdate() { this.setNativeRef(this); }
  componentWillUnmount() { this.setNativeRef(null); }
  clearSshFields = () => { delete this.fields.ssh_username; delete this.fields.ssh_public_key; };
  source = () => ({
    service_cname: 'native-name', source_type: 'url', vm_url: quickStart.UBUNTU_NOBLE_QCOW2_URL,
    arch: 'amd64', format: 'qcow2', boot_mode: 'uefi'
  });
  handleSubmit = (event, options = {}) => {
    event.preventDefault();
    if (options.final) {
      const value = { ...this.source(), ...this.fields };
      const callback = () => options.onSubmit(value, '');
      if (this.delayFinal) this.pendingFinal = callback;
      else callback();
    } else {
      const callback = () => this.props.onSubmit(this.source(), '');
      if (this.delayNext) this.pendingNext = callback;
      else callback();
    }
  };
  render() { return React.createElement('div', { 'data-native-source': true }); }
}

class WorkflowFixture extends React.Component {
  componentDidMount() { workflow = this; }
  componentDidUpdate() { workflow = this; }
  render() {
    return React.createElement('div', null, this.props.sourceSummary.name);
  }
}

const filename = path.resolve(__dirname, '../../components/CreateComponentModal/index.js');
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
  filename, babelrc: false, configFile: false,
  presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
    require('@umijs/deps/compiled/babel/preset-react').default]
}).code;
const moduleExports = {};
vm.runInNewContext(code, {
  exports: moduleExports, document, window, URL, setTimeout, clearTimeout, console,
  process: { env: { NODE_ENV: 'production' } },
  require(name) {
    if (name.endsWith('/vmCreationStorage')) return require('../../utils/vmCreationStorage');
    if (name.endsWith('/vmLoginCredentials')) return require('../../utils/vmLoginCredentials');
    if (name === 'react') return React;
    if (name === 'react-dom') return ReactDOM;
    if (name === 'dva') return { connect: () => Component => Component };
    if (name === 'dva/router') return { routerRedux: { push: value => value } };
    if (name === 'antd') return { Modal, Icon: Box, Spin: Box, Form, Button, Empty: Box, Radio, Input,
      message: { warning() {}, success() {}, error() {} } };
    if (name === 'pinyin-pro') return { pinyin: value => value };
    if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
    if (name.endsWith('/utils/global')) return {
      getCurrTeamName: () => currentScope.team, getCurrRegionName: () => currentScope.region,
      getAppID: () => currentScope.application
    };
    if (name.endsWith('/utils/pulginUtils')) return { isInstallPlugin: () => true, segregatePluginsByHierarchy: () => [] };
    if (name.endsWith('/utils/vmQuickStart')) return quickStart;
    if (name.endsWith('/VirtualMachineCreation/sourceMetadata')) return metadata;
    if (name.endsWith('/VirtualMachineCreation/messages')) return { t: key => key };
    if (name.endsWith('/VirtualMachineCreation/Workflow')) return { VmCreateWorkflow: WorkflowFixture };
    if (name.endsWith('/Create/vmCreationEntry')) return require('../Create/vmCreationEntry');
    if (name.endsWith('/Create/virtual-machine')) return ({ onCancel }) => React.createElement('button', {
      'data-target-modal': true, onClick: onCancel
    });
    if (name === '../ImageVirtualMachineForm') return NativeSourceFixture;
    if (name === './llmEntryHelpers') return require('../../components/CreateComponentModal/llmEntryHelpers');
    if (name.endsWith('/utils/agentVisibility')) return { isRainbondInfoAgentEnabled: () => false };
    if (name.endsWith('.less')) return {};
    if (name === './icons') return new Proxy({}, { get: () => Box });
    if (name.endsWith('/utils/imageRegistry')) return { getImageRegistryTypeLabel: () => '' };
    return Box;
  }
}, { filename });
const Chooser = moduleExports.default;
const root = document.getElementById('root');
const hardwareModal = () => root.querySelector('[data-modal="hardware"]');
const flush = () => new Promise(resolve => setImmediate(resolve));

async function mountChooser(expectNative = true) {
  const actions = [], cancellations = [];
  let props = {
    visible: true, initialVmForm: true,
    rainbondInfo: {}, currentUser: {}, groups: [], pluginsList: [],
    onCancel: () => cancellations.push(true),
    dispatch: action => {
      actions.push(action);
      if (action.type === 'index/fetchArchOverview') action.callback({ bean: {}, list: ['amd64'] });
      if (action.type === 'createApp/getAppByVirtualMachineImage') action.callback({ list: [] });
    }
  };
  const render = async update => {
    props = { ...props, ...update };
    act(() => { ReactDOM.render(React.createElement(Chooser, props), root); });
    await flush();
  };
  await render({});
  assert.equal(Boolean(native), expectNative);
  return { actions, cancellations, render };
}

test.beforeEach(() => {
  currentScope = { team: 'team-a', region: 'region-a', application: '868' };
  native = null; workflow = null;
});
test.afterEach(() => { act(() => { ReactDOM.unmountComponentAtNode(root); }); });
test.after(() => dom.window.close());

test('external visible=false removes the hardware modal, clears credentials and rejects delayed final collection', async () => {
  const h = await mountChooser();
  const source = native;
  act(() => native.handleSubmit({ preventDefault() {} }));
  assert.equal(hardwareModal().hidden, false);
  assert.equal(root.querySelector('[data-modal]').hidden, true);
  assert.equal(source.fields.ssh_public_key, 'opaque-native-form-only');
  source.delayFinal = true;
  const results = [];
  act(() => workflow.props.collectSourcePayload(value => results.push(value)));
  await h.render({ visible: false });
  assert.equal(hardwareModal(), null);
  assert.equal(source.fields.ssh_public_key, undefined);
  act(() => source.pendingFinal());
  assert.deepEqual(results, [null]);
  assert.equal(h.actions.some(action => /createVirtualMachineWorkflow|addGroup|createAppByVirtualMachine/.test(action.type)), false);
});

test('team, region and application changes clear the native store and hardware modal before stale source callbacks', async t => {
  for (const dimension of ['team', 'region', 'application']) {
    await t.test(dimension, async () => {
      const h = await mountChooser();
      const source = native;
      act(() => source.handleSubmit({ preventDefault() {} }));
      assert.equal(hardwareModal().hidden, false);
      source.delayNext = true;
      act(() => source.handleSubmit({ preventDefault() {} }));
      currentScope = { ...currentScope, [dimension]: `${currentScope[dimension]}-next` };
      await h.render({});
      assert.equal(hardwareModal(), null);
      assert.equal(source.fields.ssh_public_key, undefined);
      act(() => source.pendingNext());
      assert.equal(hardwareModal(), null);
      assert.ok(h.cancellations.length > 0);
      act(() => { ReactDOM.unmountComponentAtNode(root); });
      native = null; workflow = null;
      currentScope = { team: 'team-a', region: 'region-a', application: '868' };
    });
  }
});

test('parent unmount removes the hardware modal and rejects asynchronous callbacks from the old source', async () => {
  await mountChooser();
  const source = native;
  act(() => source.handleSubmit({ preventDefault() {} }));
  source.delayFinal = true;
  const results = [];
  act(() => workflow.props.collectSourcePayload(value => results.push(value)));
  act(() => { ReactDOM.unmountComponentAtNode(root); });
  assert.equal(hardwareModal(), null);
  act(() => source.pendingFinal());
  assert.deepEqual(results, [null]);
  assert.equal(source.fields.ssh_public_key, undefined);
});


test('production app creation previews real Windows hardware before any create request', async () => {
  const h = await mountChooser();
  assert.equal(native.props.deferCreation, true);
  native.fields = {};
  native.source = () => ({ service_cname: 'windows-migration', source_type: 'url',
    vm_url: 'https://images.invalid/windows.qcow2', os_name: 'Windows 10 Education 22H2',
    arch: 'amd64', format: 'qcow2' });
  act(() => native.handleSubmit({ preventDefault() {} }));
  assert.equal(hardwareModal().hidden, false);
  assert.equal(workflow.props.sourceSummary.name, 'windows-migration');
  assert.equal(workflow.props.sourceSummary.os, 'Windows 10 Education 22H2');
  assert.equal(workflow.props.sourceSummary.sshRequired, false);
  assert.equal(h.actions.some(action => /createVirtualMachineWorkflow|addGroup|createAppByVirtualMachine/.test(action.type)), false);
  const collected = [];
  act(() => workflow.props.collectSourcePayload(value => collected.push(value)));
  assert.equal(collected.length, 1);
  assert.equal(collected[0].vm_url, 'https://images.invalid/windows.qcow2');
  assert.equal(collected[0].os_name, 'Windows 10 Education 22H2');
});

test('the team entry opens the target modal and can return to the chooser without navigating', async () => {
  currentScope.application = '';
  const h = await mountChooser(false);
  const target = root.querySelector('[data-target-modal]');
  assert.ok(target);
  assert.equal(root.querySelector('[data-modal]').hidden, true);
  assert.equal(h.actions.some(action => typeof action === 'string'), false);
  assert.equal(hardwareModal(), null);
  act(() => target.click());
  assert.equal(root.querySelector('[data-target-modal]'), null);
  assert.equal(root.querySelector('[data-modal]').hidden, false);
  assert.equal(h.cancellations.length, 0);
});

test('an invalid application scope cannot expose a direct VM creation fallback', async () => {
  currentScope.application = 'invalid';
  const h = await mountChooser(false);
  assert.ok(root.querySelector('[data-target-modal]'));
  assert.equal(document.querySelector('[data-native-source]'), null);
  assert.equal(h.actions.some(action => /addGroup|createAppByVirtualMachine/.test(action.type)), false);
});
