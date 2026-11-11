const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const babel = require('@umijs/deps/compiled/babel/core');
const quickStart = require('../../utils/vmQuickStart');

const dom = new JSDOM('<!doctype html><div id="source-form"></div>', { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator });
global.requestAnimationFrame = window.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = window.cancelAnimationFrame = clearTimeout;
const oldChannel = global.MessageChannel;
global.MessageChannel = undefined;
const React = require('react');
const ReactDOM = require('react-dom');
const { act, Simulate } = require('react-dom/test-utils');
const antd = require('antd');
global.MessageChannel = oldChannel;

const filename = path.join(__dirname, 'index.js');
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
  filename, babelrc: false, configFile: false,
  presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
    require('@umijs/deps/compiled/babel/preset-react').default],
  plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
    [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
}).code;
const exported = {};
vm.runInNewContext(code, {
  exports: exported, URL, setTimeout, clearTimeout,
  require(name) {
    if (name === 'react') return React;
    if (name === 'antd') return antd;
    if (name === 'dva') return { connect: () => Component => Component };
    if (name === 'dva/router') return { routerRedux: { push: value => value } };
    if (name === '@/utils/vmQuickStart') return quickStart;
    if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
    if (name === '@/utils/newRole') return { queryPermissionsInfo: () => ({ isCreate: true }) };
    if (name === 'pinyin-pro') return { pinyin: value => value };
    if (name.endsWith('/global')) return { getAppID: () => '868', getCurrTeamName: () => 'team-a', getCurrRegionName: () => 'region-a' };
    if (name.endsWith('/messages')) return { t: key => key };
    if (['./runtimeFieldMerge', './assetReadiness', './imageNameValidation'].includes(name)) return require(name);
    if (name.endsWith('.png')) return 'ubuntu.png';
    if (name.endsWith('.less')) return { vmForm: 'vmForm' };
    return {};
  }
}, { filename });

const root = document.getElementById('source-form');
const flush = () => new Promise(resolve => setImmediate(resolve));
function mount(extra = {}) {
  let instance;
  const submissions = [], requests = [];
  let props = { archInfo: ['amd64'], currUser: { enterprise_id: 'enterprise-a' },
    virtualMachineImage: [], groupId: 868, handleType: 'Service', showSubmitBtn: false,
    dispatch: action => requests.push(action), onSubmit: value => submissions.push(value),
    wrappedComponentRef: value => { instance = value; }, ...extra };
  const render = update => {
    props = { ...props, ...update };
    act(() => { ReactDOM.render(React.createElement(exported.default, props), root); });
  };
  render({});
  return { get instance() { return instance; }, submissions, requests, render };
}
const setFields = (h, fields) => act(() => h.instance.props.form.setFieldsValue(fields));
const submit = async h => {
  act(() => h.instance.handleSubmit({ preventDefault() {} }));
  await flush();
};
test.afterEach(() => { act(() => { ReactDOM.unmountComponentAtNode(root); }); });
test.after(() => dom.window.close());

test('fresh native recommendation hides duplicate details while retaining registered OS/firmware in submission', async () => {
  const h = mount();
  const form = h.instance.props.form;
  assert.equal(form.getFieldValue('vm_url'), quickStart.UBUNTU_NOBLE_QCOW2_URL);
  assert.equal(form.getFieldValue('image_name'), 'ubuntu-24.04-minimal-cloudimg-amd64');
  assert.equal(form.getFieldValue('os_name'), 'Ubuntu 24.04');
  assert.equal(form.getFieldValue('boot_mode'), 'uefi');
  assert.equal(root.querySelector('[data-testid="vm-source-ubuntu-recommended"]').getAttribute('aria-pressed'), 'true');
  assert.equal(root.querySelector('[data-testid="vm-source-operating-system"]').readOnly, true);
  assert.equal(root.querySelector('[data-testid="vm-source-link-details"]').hidden, true);
  assert.ok(root.querySelector('[data-testid="vm-source-ubuntu-recommended"] img'));
  assert.equal(root.textContent.includes('248 MB'), false);
  assert.equal(h.requests.some(action => /createAppByVirtualMachine|createVirtualMachineWorkflow/.test(action.type)), false);
  h.instance.validateSshFields = () => true; // Transport-only sentinel, never a usable SSH key.
  setFields(h, { service_cname: 'recommended-vm', k8s_component_name: 'recommended-vm',
    ssh_username: 'ubuntu', ssh_public_key: 'opaque-form-only-input' });
  await submit(h);
  assert.equal(h.submissions.length, 1);
  assert.equal(h.submissions[0].os_name, 'Ubuntu 24.04');
  assert.equal(h.submissions[0].boot_mode, 'uefi');
  assert.equal(h.submissions[0].format, 'qcow2');
  assert.equal(h.submissions[0].vm_url, quickStart.UBUNTU_NOBLE_QCOW2_URL);
});

test('custom link clears sample metadata and keys; explicit OS is required and preserved without Linux defaults', async () => {
  const h = mount();
  setFields(h, { ssh_username: 'ubuntu', ssh_public_key: 'opaque-form-only-input' });
  act(() => h.instance.selectCustomLink());
  const form = h.instance.props.form;
  assert.equal(root.querySelector('[data-testid="vm-source-link-details"]').hidden, false);
  assert.equal(root.querySelector('input[id="vm_url"]').readOnly, false);
  assert.equal(form.getFieldValue('os_name'), undefined);
  assert.equal(form.getFieldValue('boot_mode'), undefined);
  assert.equal(form.getFieldValue('ssh_public_key'), undefined);
  setFields(h, { service_cname: 'custom-vm', k8s_component_name: 'custom-vm', image_name: 'ubuntu-filename',
    vm_url: 'https://images.example.invalid/ubuntu.iso' });
  const originalError = console.error;
  console.error = () => {}; // rc-form reports the deliberate required-field rejection in development.
  try {
    await submit(h);
    for (const osName of ['Ubuntu\n24.04', 'bad\u0000OS', 'x'.repeat(129)]) {
      setFields(h, { os_name: osName });
      await submit(h);
    }
  } finally { console.error = originalError; }
  assert.equal(h.submissions.length, 0);
  assert.ok(form.getFieldError('os_name'));
  setFields(h, { os_name: ' Windows Server 2025 ' });
  await submit(h);
  assert.equal(h.submissions.length, 1);
  assert.equal(h.submissions[0].os_name, 'Windows Server 2025');
  assert.equal(h.submissions[0].format, 'iso');
  for (const field of ['ssh_username', 'ssh_public_key', 'os_family']) assert.equal(Object.hasOwn(h.submissions[0], field), false);
  assert.notEqual(h.submissions[0].boot_mode, 'uefi');
});

test('pasting the exact canonical URL in custom mode supplies trusted OS and then clears it on another URL', () => {
  const h = mount();
  act(() => h.instance.selectCustomLink());
  const input = root.querySelector('input[id="vm_url"]');
  act(() => Simulate.change(input, { target: { value: quickStart.UBUNTU_NOBLE_QCOW2_URL } }));
  assert.equal(h.instance.props.form.getFieldValue('os_name'), 'Ubuntu 24.04');
  assert.equal(h.instance.props.form.getFieldValue('boot_mode'), 'uefi');
  assert.equal(root.querySelector('[data-testid="vm-source-operating-system"]').readOnly, true);
  setFields(h, { ssh_username: 'ubuntu', ssh_public_key: 'opaque-new-input' });
  act(() => Simulate.change(input, { target: { value: 'https://images.example.invalid/custom.qcow2' } }));
  assert.equal(h.instance.props.form.getFieldValue('os_name'), undefined);
  assert.equal(h.instance.props.form.getFieldValue('boot_mode'), undefined);
  assert.equal(h.instance.props.form.getFieldValue('ssh_public_key'), undefined);
  assert.equal(root.querySelector('[data-testid="vm-source-operating-system"]').readOnly, false);
});

test('reselecting custom link preserves the entered URL, image label and explicit OS', () => {
  const h = mount();
  act(() => Simulate.click(root.querySelector('[data-testid="vm-source-custom-link"]')));
  const fields = { vm_url: 'https://images.example.invalid/server.iso', image_name: 'server-image', os_name: 'Windows Server 2025' };
  setFields(h, fields);
  act(() => Simulate.click(root.querySelector('[data-testid="vm-source-custom-link"]')));
  for (const [name, value] of Object.entries(fields)) assert.equal(h.instance.props.form.getFieldValue(name), value);
  assert.equal(root.querySelector('[data-testid="vm-source-link-details"]').hidden, false);
  assert.equal(h.submissions.length, 0);
});

test('reselecting the Noble card and switching its canonical URL from custom preserve bound login fields', () => {
  const h = mount();
  const login = { ssh_username: 'vmuser', ssh_public_key: 'opaque-current-image-input' };
  setFields(h, login);
  act(() => Simulate.click(root.querySelector('[data-testid="vm-source-ubuntu-recommended"]')));
  for (const [name, value] of Object.entries(login)) assert.equal(h.instance.props.form.getFieldValue(name), value);
  act(() => h.instance.selectCustomLink());
  act(() => Simulate.change(root.querySelector('input[id="vm_url"]'), { target: { value: quickStart.UBUNTU_NOBLE_QCOW2_URL } }));
  setFields(h, { ...login, image_name: 'my-noble-image' });
  act(() => Simulate.click(root.querySelector('[data-testid="vm-source-ubuntu-recommended"]')));
  for (const [name, value] of Object.entries(login)) assert.equal(h.instance.props.form.getFieldValue(name), value);
  assert.equal(h.instance.props.form.getFieldValue('image_name'), 'my-noble-image');
  assert.equal(h.instance.props.form.getFieldValue('os_name'), 'Ubuntu 24.04');
  assert.equal(root.querySelector('[data-testid="vm-source-link-details"]').hidden, true);
  assert.equal(h.submissions.length, 0);
});

test('unsupported architecture never auto-selects Noble, and delayed architecture discovery preserves user edits', () => {
  const h = mount({ archInfo: ['arm64'] });
  assert.equal(h.instance.props.form.getFieldValue('vm_url'), undefined);
  assert.equal(root.querySelector('[data-testid="vm-source-ubuntu-recommended"]').disabled, true);
  h.render({ archInfo: [] });
  setFields(h, { vm_url: 'https://images.example.invalid/custom.raw', image_name: 'custom', os_name: 'Debian 13' });
  h.render({ archInfo: ['amd64'] });
  assert.equal(h.instance.props.form.getFieldValue('vm_url'), 'https://images.example.invalid/custom.raw');
  assert.equal(h.instance.props.form.getFieldValue('os_name'), 'Debian 13');
});

test('a fresh form waits for a reported amd64 architecture before selecting the recommendation', () => {
  const h = mount({ archInfo: [] });
  assert.equal(h.instance.props.form.getFieldValue('vm_url'), undefined);
  h.render({ archInfo: ['amd64'] });
  assert.equal(h.instance.props.form.getFieldValue('vm_url'), quickStart.UBUNTU_NOBLE_QCOW2_URL);
  assert.equal(h.instance.props.form.getFieldValue('os_name'), 'Ubuntu 24.04');
});

test('clicking the active custom choice records intent before delayed architecture discovery', () => {
  const h = mount({ archInfo: [] });
  act(() => Simulate.click(root.querySelector('[data-testid="vm-source-custom-link"]')));
  h.render({ archInfo: ['amd64'] });
  assert.equal(h.instance.props.form.getFieldValue('vm_url'), undefined);
  assert.equal(h.instance.props.form.getFieldValue('os_name'), undefined);
  assert.equal(root.querySelector('[data-testid="vm-source-custom-link"]').getAttribute('aria-pressed'), 'true');
  assert.equal(root.querySelector('[data-testid="vm-source-link-details"]').hidden, false);
});

test('pasting the canonical URL before architecture discovery fills fixed metadata without bypassing architecture checks', async () => {
  const h = mount({ archInfo: [] });
  act(() => h.instance.selectCustomLink());
  const input = root.querySelector('input[id="vm_url"]');
  act(() => Simulate.change(input, { target: { value: quickStart.UBUNTU_NOBLE_QCOW2_URL } }));
  assert.equal(h.instance.props.form.getFieldValue('os_name'), 'Ubuntu 24.04');
  assert.equal(h.instance.props.form.getFieldValue('boot_mode'), 'uefi');
  assert.equal(root.querySelector('[data-testid="vm-source-operating-system"]').readOnly, true);
  setFields(h, { ssh_username: 'ubuntu', ssh_public_key: 'opaque-form-only-input' });
  h.render({ archInfo: ['amd64'] });
  assert.equal(h.instance.props.form.getFieldValue('os_name'), 'Ubuntu 24.04');
  assert.equal(h.instance.props.form.getFieldValue('boot_mode'), 'uefi');
  act(() => Simulate.change(input, { target: { value: 'https://images.example.invalid/other.qcow2' } }));
  assert.equal(h.instance.props.form.getFieldValue('os_name'), undefined);
  assert.equal(h.instance.props.form.getFieldValue('ssh_public_key'), undefined);
  act(() => Simulate.change(input, { target: { value: quickStart.UBUNTU_NOBLE_QCOW2_URL } }));
  assert.equal(h.instance.props.form.getFieldValue('ssh_public_key'), undefined);
  h.render({ archInfo: ['arm64'] });
  h.instance.validateSshFields = () => true; // Exercise the actual architecture guard beyond credential syntax.
  setFields(h, { service_cname: 'unsupported-vm', k8s_component_name: 'unsupported-vm', image_name: 'canonical-image' });
  await submit(h);
  assert.equal(h.submissions.length, 0);
  assert.equal(h.requests.some(action => /createAppByVirtualMachine|createVirtualMachineWorkflow/.test(action.type)), false);
});

test('local source pre-fills only real OS metadata and keeps it editable; upload retains explicit OS', async () => {
  const asset = { id: 42, name: 'ubuntu-label', status: 'ready', image_url: 'internal-image',
    os_name: 'Windows Server 2025', extra: { runtime_snapshot: { os_name: 'Older metadata', boot_mode: 'bios' } } };
  const h = mount({ virtualMachineImage: [asset] });
  act(() => h.instance.handleChangeImageSource({ target: { value: 'existing' } }));
  act(() => h.instance.applyLocalImageSelection(asset));
  assert.equal(h.instance.props.form.getFieldValue('os_name'), 'Windows Server 2025');
  assert.equal(root.querySelector('[data-testid="vm-source-operating-system"]').readOnly, false);
  act(() => h.instance.applyLocalImageSelection({ ...asset, os_name: undefined,
    extra: { runtime_snapshot: { os_name: 'Debian 13' } } }));
  assert.equal(h.instance.props.form.getFieldValue('os_name'), 'Debian 13');
  act(() => h.instance.applyLocalImageSelection({ ...asset, os_name: undefined, extra: {} }));
  assert.equal(h.instance.props.form.getFieldValue('os_name'), undefined, 'a filename is not OS metadata');
  act(() => h.instance.handleChangeImageSource({ target: { value: 'upload' } }));
  setFields(h, { service_cname: 'upload-vm', k8s_component_name: 'upload-vm', image_name: 'ubuntu-label', os_name: 'Windows Server 2025' });
  act(() => h.instance.setState({ event_id: 'event-current', fileList: [{ uid: 'upload-current', name: 'ubuntu.iso', status: 'done' }], existFileList: ['ubuntu.iso'] }));
  await submit(h);
  assert.equal(h.submissions.length, 1);
  assert.equal(h.submissions[0].os_name, 'Windows Server 2025');
  assert.equal(h.submissions[0].format, 'iso');
});
