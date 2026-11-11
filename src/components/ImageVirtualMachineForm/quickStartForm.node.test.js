const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const React = require('react');
const babel = require('@umijs/deps/compiled/babel/core');
const quickStart = require('../../utils/vmQuickStart');

// Exercise the production class and submission projection without mounting a
// browser or invoking a service. rc-form validation itself is tested separately.
const filename = path.join(__dirname, 'index.js');
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
  filename, babelrc: false, configFile: false,
  presets: [
    [require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
    require('@umijs/deps/compiled/babel/preset-react').default
  ],
  plugins: [
    [require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
    [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]
  ]
}).code;
const moduleExports = {};
vm.runInNewContext(code, {
  exports: moduleExports,
  URL,
  require(name) {
    if (name.endsWith('/vmLoginCredentials')) return require('../../utils/vmLoginCredentials');
    if (name === 'react') return React;
    if (name === 'dva') return { connect: () => Component => Component };
    if (name === 'antd') return {
      Form: { create: () => Component => Component, Item: 'FormItem' },
      Select: { Option: 'Option' }, Input: Object.assign(() => null, { TextArea: 'TextArea' }),
      message: { warning: () => {} }
    };
    if (name === '@/utils/vmQuickStart') return quickStart;
    if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
    if (name.endsWith('/messages')) return { t: key => `vmDemo.${key}` };
    if (name.endsWith('/global')) return { getAppID: () => '868' };
    if (name === './runtimeFieldMerge' || name === './assetReadiness' || name === './imageNameValidation')
      return require(path.join(__dirname, name));
    return {};
  }
}, { filename });
const NativeVmForm = moduleExports.default;

function formHarness({ source = 'url', url = quickStart.UBUNTU_NOBLE_QCOW2_URL } = {}) {
  const fields = {
    service_cname: 'vm-quickstart', image_name: 'ubuntu-24.04-minimal-cloudimg-amd64', vm_url: url,
    ssh_username: 'ubuntu', ssh_public_key: 'opaque-public-input',
    os_name: ' Windows Server 2025 ', os_family: 'linux'
  };
  const decorations = {}, resets = [], submissions = [], fieldErrors = {};
  const form = {
    validateFields: (names, callback) => callback(null, Object.fromEntries(names.map(name => [name, fields[name]]))),
    getFieldsValue: () => ({ ...fields }),
    setFields: update => Object.assign(fieldErrors, update),
    getFieldValue: name => fields[name],
    setFieldsValue: update => Object.assign(fields, update),
    getFieldInstance: name => name === 'ssh_public_key' ? {} : undefined,
    resetFields: names => { names.forEach(name => delete fields[name]); resets.push([...names]); },
    getFieldDecorator: (name, options) => {
      decorations[name] = options;
      return element => element;
    }
  };
  const instance = new NativeVmForm({
    form, archInfo: ['amd64'], virtualMachineImage: [{ id: 'asset-1', name: fields.image_name, status: 'ready', image_url: 'internal-image' }], groupId: 868, handleType: 'Service',
    onSubmit: (payload, eventId) => submissions.push({ payload, eventId })
  });
  instance.state = { ...instance.state, radioKey: source, existFileList: ['image.iso'], event_id: 'event-1', fileList: [{ name: 'image.iso', status: 'done' }] };
  // Transport projection tests use an opaque non-key sentinel. Actual helper
  // validation is exercised below without constructing or persisting a key.
  const validateSshFields = instance.validateSshFields;
  instance.validateSshFields = () => true;
  return { instance, fields, decorations, resets, submissions, fieldErrors, validateSshFields };
}

test('native production Noble URL submission carries the confirmed Linux metadata and paired public fields', () => {
  const fixture = formHarness();
  fixture.instance.handleSubmit({ preventDefault() {} });
  assert.equal(fixture.submissions.length, 1);
  const payload = fixture.submissions[0].payload;
  assert.equal(payload.source_type, 'url');
  assert.equal(payload.format, 'qcow2');
  assert.equal(payload.os_name, 'Ubuntu 24.04');
  assert.equal(payload.os_family, 'linux');
  assert.equal(payload.ssh_username, 'ubuntu');
  assert.equal(payload.ssh_public_key, 'opaque-public-input');
  assert.equal(payload.boot_mode, 'uefi');
  assert.equal(Object.hasOwn(payload, 'password'), false);
  assert.equal(Object.hasOwn(payload, 'ssh_private_key'), false);
  assert.equal(fixture.resets.length, 1);
});

test('separate native Noble submissions use distinct valid image asset names', () => {
  const first = formHarness();
  const second = formHarness();
  first.instance.handleSubmit({ preventDefault() {} });
  second.instance.handleSubmit({ preventDefault() {} });
  const firstName = first.submissions[0].payload.image_name;
  const secondName = second.submissions[0].payload.image_name;
  assert.notEqual(firstName, secondName);
  assert.match(firstName, /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/);
  assert.match(secondName, /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/);
});

for (const [label, source, url] of [
  ['ISO', 'url', 'https://example.invalid/ubuntu.iso'],
  ['Windows disk', 'url', 'https://example.invalid/windows.qcow2'],
  ['unknown disk', 'url', 'https://example.invalid/custom.qcow2'],
  ['existing asset', 'existing', quickStart.UBUNTU_NOBLE_QCOW2_URL],
  ['upload', 'upload', quickStart.UBUNTU_NOBLE_QCOW2_URL]
]) {
  test(`native production ${label} preserves explicit OS and excludes stale Linux family and SSH fields`, () => {
    const fixture = formHarness({ source, url });
    assert.equal(fixture.instance.renderSshLoginFields(), null);
    fixture.instance.handleSubmit({ preventDefault() {} });
    assert.equal(fixture.submissions.length, 1);
    const payload = fixture.submissions[0].payload;
    assert.equal(payload.os_name, 'Windows Server 2025');
    for (const field of ['os_family', 'ssh_username', 'ssh_public_key'])
      assert.equal(Object.hasOwn(payload, field), false, `${field} must be excluded`);
    assert.equal(Object.hasOwn(payload, 'boot_mode'), false);
    assert.equal(payload.image_name, fixture.fields.image_name);
  });
}

test('native credential fields default to ubuntu, opt out of capture, and expose only fixed validation messages', () => {
  const fixture = formHarness();
  const fields = fixture.instance.renderSshLoginFields();
  assert.equal(fields.props.className, 'ph-no-capture ph-mask');
  assert.equal(fixture.decorations.ssh_username.initialValue, 'ubuntu');
  const untrustedInput = fixture.fields.ssh_public_key;
  fixture.validateSshFields();
  const error = fixture.fieldErrors.ssh_public_key.errors[0];
  assert.equal(error.message, 'vmDemo.sshPublicKeyInvalid');
  assert.equal(error.message.includes(untrustedInput), false);
});

test('native production submission is ignored while the creation request is loading', () => {
  const fixture = formHarness();
  fixture.instance.props = { ...fixture.instance.props, createAppByVirtualMachineLoading: true };
  fixture.instance.handleSubmit({ preventDefault() {} });
  assert.equal(fixture.submissions.length, 0);
});

test('the canonical sample is blocked when every reported architecture is unsupported', () => {
  const fixture = formHarness();
  fixture.instance.props = { ...fixture.instance.props, archInfo: ['arm64', 'other-arch'] };
  fixture.instance.handleSubmit({ preventDefault() {} });
  assert.equal(fixture.submissions.length, 0);
});

test('native source format preserves explicit formats and compressed ISO media hints', () => {
  const { instance } = formHarness();
  assert.equal(instance.inferSourceFormat('installer.iso.gz'), 'iso');
  assert.equal(instance.inferSourceFormat('https://example.invalid/installer.iso.xz?download=true'), 'iso');
  assert.equal(instance.inferSourceFormat('tar.gz', 'image-name'), 'tar.gz');
  assert.equal(instance.inferSourceFormat('qcow2', 'disk-name'), 'qcow2');
  assert.equal(instance.inferSourceFormat(quickStart.UBUNTU_NOBLE_QCOW2_URL), 'qcow2');
});

function uploadHarness() {
  const fixture = formHarness({ source: 'upload' });
  fixture.instance.setState = update => {
    fixture.instance.state = { ...fixture.instance.state, ...update };
  };
  fixture.instance.handleJarWarUploadStatus = () => {};
  return fixture;
}

test('native upload accepts an HTTP done file without a fixed success message only after exact server confirmation', () => {
  const fixture = uploadHarness();
  const current = { uid: 'current-file', name: 'installer.iso.gz', status: 'done', response: { code: 200, data: {} } };
  fixture.instance.state.existFileList = ['older.qcow2', current.name];
  fixture.instance.onChangeUpload({ file: current, fileList: [current] });
  assert.equal(fixture.instance.state.fileList.length, 1);
  assert.equal(fixture.instance.getConfirmedUpload().name, current.name);
  fixture.instance.handleSubmit({ preventDefault() {} });
  assert.equal(fixture.submissions.length, 1);
  assert.equal(fixture.submissions[0].eventId, 'event-1');
  assert.equal(fixture.submissions[0].payload.format, 'iso');
});

for (const status of ['uploading', 'error']) {
  test(`native upload ${status} cannot fall back to an older confirmed server artifact`, () => {
    const fixture = uploadHarness();
    const current = { uid: 'new-file', name: 'new.iso', status, response: { code: 200 } };
    fixture.instance.state.existFileList = ['older.iso'];
    fixture.instance.onChangeUpload({ file: current, fileList: [current] });
    assert.equal(fixture.instance.getConfirmedUpload(), null);
    fixture.instance.handleSubmit({ preventDefault() {} });
    assert.equal(fixture.submissions.length, 0);
  });
}

test('native HTTP done without a matching server filename remains blocked', () => {
  const fixture = uploadHarness();
  const current = { uid: 'new-file', name: 'new.iso', status: 'done', response: { code: 200 } };
  fixture.instance.state.existFileList = ['other.iso'];
  fixture.instance.onChangeUpload({ file: current, fileList: [current] });
  fixture.instance.handleSubmit({ preventDefault() {} });
  assert.equal(fixture.submissions.length, 0);
  fixture.instance.state.existFileList = ['new.iso'];
  fixture.instance.confirmedUploadEventId = 'previous-event';
  assert.equal(fixture.instance.getConfirmedUpload(), null);
});

test('the old filtered empty list recovers only a single confirmed current-event artifact with no new selection', () => {
  const fixture = uploadHarness();
  fixture.instance.state.fileList = [];
  fixture.instance.state.existFileList = ['confirmed.iso'];
  assert.equal(fixture.instance.getConfirmedUpload().recovered, true);
  fixture.instance.handleSubmit({ preventDefault() {} });
  assert.equal(fixture.submissions.length, 1);
  assert.equal(fixture.submissions[0].payload.format, 'iso');
  fixture.instance.state.existFileList = ['confirmed.iso', 'ambiguous.iso'];
  assert.equal(fixture.instance.getConfirmedUpload(), null);
  fixture.instance.state.existFileList = ['confirmed.iso'];
  fixture.instance.onRemove();
  assert.equal(fixture.instance.getConfirmedUpload(), null);
});

test('native production rc-form rejection excludes registered SSH values from development error logging', async () => {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!doctype html><div id="native-form"></div>');
  const descriptors = Object.fromEntries(['window', 'document', 'navigator', 'requestAnimationFrame', 'cancelAnimationFrame', 'MessageChannel']
    .map(key => [key, Object.getOwnPropertyDescriptor(global, key)]));
  const values = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    requestAnimationFrame: callback => setTimeout(callback, 0), cancelAnimationFrame: clearTimeout, MessageChannel: undefined };
  Object.entries(values).forEach(([key, value]) => Object.defineProperty(global, key, { configurable: true, writable: true, value }));
  dom.window.requestAnimationFrame = values.requestAnimationFrame;
  dom.window.cancelAnimationFrame = clearTimeout;
  const ReactDOM = require('react-dom');
  const { act } = require('react-dom/test-utils');
  const Form = require('antd/lib/form').default;
  let probe;
  class NativeSubmissionProbe extends React.Component {
    render() {
      const { form } = this.props;
      this.native = this.native || new NativeVmForm({ form, archInfo: ['amd64'], onSubmit() {} });
      this.native.props = { form, archInfo: ['amd64'], onSubmit() {} };
      // Only validation acceptance is a fixture; the production handleSubmit
      // and real rc-form rejection/console boundary are both exercised.
      this.native.validateSshFields = () => true;
      return React.createElement(Form, null,
        form.getFieldDecorator('service_cname', { rules: [{ required: true, message: 'name-required' }] })(React.createElement('input')),
        ...['image_name', 'vm_url', 'ssh_username', 'ssh_public_key'].map(name =>
          form.getFieldDecorator(name)(React.createElement('input', { key: name }))));
    }
  }
  const Wrapped = Form.create()(NativeSubmissionProbe);
  const root = document.getElementById('native-form');
  const captured = [];
  const originalError = console.error;
  try {
    act(() => { ReactDOM.render(React.createElement(Wrapped, { wrappedComponentRef: value => { probe = value; } }), root); });
    act(() => probe.props.form.setFieldsValue({
      service_cname: '', vm_url: quickStart.UBUNTU_NOBLE_QCOW2_URL,
      ssh_username: 'ubuntu', ssh_public_key: 'opaque-accepted-public-value'
    }));
    console.error = (...args) => captured.push(require('node:util').inspect(args));
    act(() => probe.native.handleSubmit({ preventDefault() {} }));
    await new Promise(resolve => setImmediate(resolve));
    assert.ok(captured.length > 0);
    assert.equal(captured.join('\n').includes('opaque-accepted-public-value'), false);
    assert.equal(captured.join('\n').includes('ssh_public_key'), false);
  } finally {
    console.error = originalError;
    act(() => { ReactDOM.unmountComponentAtNode(root); });
    dom.window.close();
    Object.entries(descriptors).forEach(([key, descriptor]) => {
      if (descriptor) Object.defineProperty(global, key, descriptor);
      else delete global[key];
    });
  }
});
