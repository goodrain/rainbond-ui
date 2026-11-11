const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const parser = require('@babel/parser');
const React = require('react');
const babel = require('@umijs/deps/compiled/babel/core');
const quickStart = require('../../utils/vmQuickStart');
const metadata = require('./sourceMetadata');

const root = path.resolve(__dirname, '../..');
const nativePath = path.join(root, 'components/ImageVirtualMachineForm/index.js');
const chooserPath = path.join(root, 'components/CreateComponentModal/index.js');
const chooserSource = fs.readFileSync(chooserPath, 'utf8');
const chooserAst = parser.parse(chooserSource, { sourceType: 'module', plugins: ['jsx'] });
const nativeCode = babel.transformSync(fs.readFileSync(nativePath, 'utf8'), {
  filename: nativePath, babelrc: false, configFile: false,
  presets: [
    [require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
    require('@umijs/deps/compiled/babel/preset-react').default
  ],
  plugins: [
    [require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
    [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]
  ]
}).code;
const nativeExports = {};
vm.runInNewContext(nativeCode, {
  exports: nativeExports,
  URL,
  require(name) {
    if (name.endsWith('/vmLoginCredentials')) return require('../../utils/vmLoginCredentials');
    if (name === 'react') return React;
    if (name === 'dva') return { connect: () => Component => Component };
    if (name === 'antd') return {
      Form: { create: () => Component => Component }, Select: { Option: 'option' },
      message: { warning() {} }
    };
    if (name === '@/utils/vmQuickStart') return quickStart;
    if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
    if (name.endsWith('/messages')) return { t: key => key };
    if (name.endsWith('/global')) return { getAppID: () => '868' };
    if (['./runtimeFieldMerge', './assetReadiness', './imageNameValidation'].includes(name))
      return require(path.join(path.dirname(nativePath), name));
    return {};
  }
}, { filename: nativePath });
const NativeForm = nativeExports.default;

function workflowHarness(extra = {}) {
  const scope = { team: 'team-a', region: 'region-a', application: '868' };
  const filename = path.join(__dirname, 'Workflow.js');
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
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require(name) {
    if (name.endsWith('/vmLoginCredentials')) return require('../../utils/vmLoginCredentials');
      if (name === 'react') return React;
      if (name === 'dva') return { connect: () => Component => Component };
      if (name === 'antd') return { message: { warning() {} } };
      if (name === '@/utils/vmQuickStart') return quickStart;
      if (name === './messages') return { t: key => key };
      if (name === '@/utils/global') return {
        getCurrTeamName: () => scope.team, getCurrRegionName: () => scope.region,
        getAppID: () => scope.application
      };
      return {};
    }
  }, { filename });
  const actions = [], collectors = [], cleared = [];
  const instance = new exports.VmCreateWorkflow({
    teamName: 'team-a', regionName: 'region-a', groupId: '868',
    dispatch: action => { actions.push(action); },
    collectSourcePayload: callback => collectors.push(callback),
    clearSourceCredentials: () => cleared.push(true),
    ...extra
  });
  instance.setState = update => {
    instance.state = { ...instance.state, ...(typeof update === 'function' ? update(instance.state) : update) };
  };
  instance.componentDidMount();
  return { instance, actions, collectors, cleared, scope };
}

function chooserFunction(name, dependencies) {
  const scopeRef = dependencies.vmSourceScopeRef || {
    current: { team: 'team-a', region: 'region-a', application: '868' }
  };
  const scopedDependencies = {
    ...require('../../utils/vmLoginCredentials'),
    normalizeVmOperatingSystem: quickStart.normalizeVmOperatingSystem,
    vmMountedRef: { current: true }, vmScopeMatches: () => true,
    vmSourceScopeRef: scopeRef, vmScopeForRender: scopeRef.current,
    vmWorkflowActive: true,
    clearVmWorkflow: () => {
      dependencies.vmFormRef?.current?.clearSshFields();
      if (dependencies.setVmHardwareOpen) dependencies.setVmHardwareOpen(false);
      if (dependencies.setVmSourceSummary) dependencies.setVmSourceSummary(null);
    },
    ...dependencies
  };
  let value;
  const visit = node => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'VariableDeclarator' && node.id?.name === name) value = node.init;
    for (const child of Object.values(node)) {
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child === 'object') visit(child);
    }
  };
  visit(chooserAst);
  assert.ok(value, `${name} must exist in the real chooser`);
  return new Function(...Object.keys(scopedDependencies), `return (${chooserSource.slice(value.start, value.end)});`)(
    ...Object.values(scopedDependencies)
  );
}

function nativeHarness(options = {}) {
  // This opaque input is intentionally not a usable key. Submission tests only
  // exercise the handoff boundary; key syntax validation has its own tests.
  const fields = {
    service_cname: 'retained-vm', k8s_component_name: 'retained-vm',
    image_name: 'ubuntu-noble', vm_url: quickStart.UBUNTU_NOBLE_QCOW2_URL, os_name: 'Explicit guest OS',
    ssh_username: 'ubuntu', ssh_public_key: 'opaque-form-only-input'
  };
  const resets = [], submissions = [];
  const form = {
    getFieldsValue: () => ({ ...fields }), getFieldValue: name => fields[name],
    setFields: () => {},
    validateFields: (names, callback) => callback(null, Object.fromEntries(names.map(name => [name, fields[name]]))),
    getFieldInstance: name => name === 'ssh_public_key' ? {} : undefined,
    resetFields: names => { names.forEach(name => delete fields[name]); resets.push([...names]); }
  };
  const native = new NativeForm({
    form, archInfo: ['amd64'], virtualMachineImage: [], groupId: 868, handleType: 'Service', deferCreation: true,
    onSubmit: (value, eventId) => submissions.push({ value, eventId }), ...options
  });
  native.validateSshFields = () => true;
  return { native, form, fields, resets, submissions };
}

test('Enter in the native deferred form sends only source preview and retains its original form values', () => {
  const h = nativeHarness();
  let prevented = 0;
  h.native.handleSubmit({ preventDefault() { prevented += 1; } });
  assert.equal(prevented, 1);
  assert.equal(h.submissions.length, 1);
  const payload = h.submissions[0].value;
  assert.equal(Object.hasOwn(payload, 'ssh_public_key'), false);
  assert.equal(Object.hasOwn(payload, 'ssh_username'), false);
  assert.equal(payload.image_name, 'ubuntu-noble', 'preview must not allocate a real import image name');
  assert.equal(h.fields.ssh_public_key, 'opaque-form-only-input');
  assert.equal(h.resets.length, 0);
});

test('the original modal footer follows the same deferred source Next path as Enter', () => {
  const h = nativeHarness();
  const submit = chooserFunction('handleFooterSubmit', {
    currentView: 'form', currentFormType: 'vm', vmFormRef: { current: h.native }
  });
  submit();
  assert.equal(h.submissions.length, 1);
  assert.equal(Object.hasOwn(h.submissions[0].value, 'ssh_public_key'), false);
  assert.equal(h.fields.ssh_public_key, 'opaque-form-only-input');
  assert.equal(h.resets.length, 0);
});

test('native source Next projects summary only and does not dispatch creation or leave the current application', () => {
  const h = nativeHarness();
  const values = {};
  const continuation = chooserFunction('handleVmSourceContinue', {
    document: { getElementById: () => ({}) },
    vmFormRef: { current: h.native }, virtualMachineImages: [], archInfo: ['amd64'],
    describeUrl: metadata.describeUrl, describeSource: metadata.describeSource,
    isLinuxQcow2QuickStart: quickStart.isLinuxQcow2QuickStart,
    setVmSourceSummary: value => { values.summary = value; },
    setVmHardwareOpen: value => { values.open = value; },
    message: { warning() {} }, vmText: key => key
  });
  h.native.props = { ...h.native.props, onSubmit: continuation };
  h.native.handleSubmit({ preventDefault() {} });
  assert.equal(values.open, true);
  assert.equal(values.summary.name, 'retained-vm');
  assert.equal(values.summary.sshRequired, true);
  assert.equal(values.summary.sshUsername, 'ubuntu');
  assert.equal(JSON.stringify(values).includes('opaque-form-only-input'), false);
  assert.equal(h.fields.ssh_public_key, 'opaque-form-only-input');
});

test('source summary gives explicit OS priority and never infers OS from a URL or filename', () => {
  for (const [value, asset, expected] of [
    [{ source_type: 'url', vm_url: 'https://images.example.invalid/ubuntu-24.04.iso', os_name: ' Windows Server 2025 ' }, null, 'Windows Server 2025'],
    [{ source_type: 'existing', asset_id: 42 }, { id: 42, name: 'ubuntu-label', os_name: 'Debian 13' }, 'Debian 13'],
    [{ source_type: 'upload', image_name: 'ubuntu-24.04' }, null, '']
  ]) {
    let summary;
    const continuation = chooserFunction('handleVmSourceContinue', {
      document: { getElementById: () => ({}) }, vmFormRef: { current: { state: { existFileList: ['ubuntu-24.04.iso'] } } },
      virtualMachineImages: asset ? [asset] : [], archInfo: ['amd64'],
      describeUrl: metadata.describeUrl, describeSource: metadata.describeSource,
      isLinuxQcow2QuickStart: quickStart.isLinuxQcow2QuickStart,
      setVmSourceSummary: result => { summary = result; }, setVmHardwareOpen() {},
      message: { warning() {} }, vmText: key => key
    });
    continuation({ service_cname: 'explicit-vm', arch: 'amd64', format: 'iso', ...value });
    assert.equal(summary.os, expected);
    assert.equal(summary.format, 'iso');
    assert.equal(summary.sshRequired, false);
  }
});

test('final source collection revalidates the same mounted form and releases credentials only to its callback', () => {
  const h = nativeHarness();
  let previewCalls = 0;
  h.native.props = { ...h.native.props, onSubmit: () => { previewCalls += 1; } };
  const collect = chooserFunction('collectVmSourcePayload', { vmFormRef: { current: h.native } });
  let collected;
  collect(value => { collected = value; });
  assert.equal(previewCalls, 0);
  assert.equal(collected.ssh_public_key, 'opaque-form-only-input');
  assert.equal(collected.ssh_username, 'ubuntu');
  assert.equal(collected.service_cname, 'retained-vm');
  assert.equal(h.fields.ssh_public_key, 'opaque-form-only-input', 'callback owner clears the original field after a real alias or cancellation');
});

test('failed final source revalidation reopens the original modal and never releases a payload', () => {
  const h = nativeHarness();
  h.native.validateSshFields = () => false;
  const hardware = [], collected = [];
  const collect = chooserFunction('collectVmSourcePayload', {
    vmFormRef: { current: h.native }, setVmHardwareOpen: value => hardware.push(value)
  });
  collect(value => collected.push(value));
  assert.deepEqual(hardware, [false]);
  assert.deepEqual(collected, [null]);
  assert.equal(h.fields.ssh_public_key, 'opaque-form-only-input');
});

test('source Next rejects missing and unavailable existing assets', () => {
  for (const assets of [[], [{ name: 'stored-disk', status: 'importing', image_url: 'image-location' }],
    [{ name: 'stored-disk', status: 'ready', image_url: '' }]]) {
    const h = nativeHarness({ virtualMachineImage: assets });
    h.fields.image_name = 'stored-disk';
    h.native.state.radioKey = 'existing';
    let invalid = 0;
    h.native.handleSubmit({ preventDefault() {} }, { onInvalid: () => { invalid += 1; } });
    assert.equal(h.submissions.length, 0);
    assert.equal(invalid, 1);
  }
});

test('source Next accepts an existing asset only after catalog readiness', () => {
  const h = nativeHarness({ virtualMachineImage: [{
    id: 'asset-a', name: 'stored-disk', status: 'ready', image_url: 'image-location', format: 'qcow2'
  }] });
  h.fields.image_name = 'stored-disk';
  h.native.state.radioKey = 'existing';
  h.native.handleSubmit({ preventDefault() {} });
  assert.equal(h.submissions.length, 1);
  assert.equal(h.submissions[0].value.source_type, 'existing');
  assert.equal(h.submissions[0].value.asset_id, 'asset-a');
  assert.equal(Object.hasOwn(h.submissions[0].value, 'ssh_public_key'), false);
});

test('source Next requires the completed upload filename to match the server record and an event id', () => {
  for (const state of [
    { event_id: '', fileList: [{ name: 'system.iso', status: 'done' }], existFileList: ['system.iso'] },
    { event_id: 'event-a', fileList: [{ name: 'system.iso', status: 'uploading' }], existFileList: ['system.iso'] },
    { event_id: 'event-a', fileList: [{ name: 'system.iso', status: 'done' }], existFileList: ['other.iso'] }
  ]) {
    const h = nativeHarness();
    Object.assign(h.native.state, state, { radioKey: 'upload' });
    let invalid = 0;
    h.native.handleSubmit({ preventDefault() {} }, { onInvalid: () => { invalid += 1; } });
    assert.equal(h.submissions.length, 0);
    assert.equal(invalid, 1);
  }
  const h = nativeHarness();
  Object.assign(h.native.state, {
    radioKey: 'upload', event_id: 'event-a',
    fileList: [{ name: 'system.iso', status: 'done' }], existFileList: ['system.iso']
  });
  h.native.handleSubmit({ preventDefault() {} });
  assert.equal(h.submissions.length, 1);
  assert.equal(h.submissions[0].value.source_type, 'upload');
  assert.equal(h.submissions[0].eventId, 'event-a');
});

test('whole-workflow cancellation clears the native key and removes the preview', () => {
  const h = nativeHarness();
  const changes = [];
  const close = chooserFunction('handleClose', {
    vmFormRef: { current: h.native },
    setVmHardwareOpen: value => changes.push(['hardware', value]),
    setVmSourceSummary: value => changes.push(['summary', value]),
    resetViewHistory: () => changes.push(['history']),
    setCurrentView: value => changes.push(['view', value]),
    setSelectedPlugin: value => changes.push(['plugin', value]),
    onCancel: () => changes.push(['cancel'])
  });
  close();
  assert.equal(h.fields.ssh_public_key, undefined);
  assert.ok(changes.some(([kind, value]) => kind === 'hardware' && value === false));
  assert.ok(changes.some(([kind, value]) => kind === 'summary' && value === null));
  assert.ok(changes.some(([kind]) => kind === 'cancel'));
});

test('final confirmation waits for native collection and projects only safe progress into state', () => {
  const h = workflowHarness();
  h.instance.create({ cpu: 4, memory: 8, disk: 80 });
  assert.equal(h.actions.length, 0, 'hardware confirmation cannot dispatch before source revalidation');
  h.instance.create({ cpu: 4, memory: 8, disk: 80 });
  assert.equal(h.collectors.length, 1, 'duplicate confirmation is blocked during source collection');
  h.collectors[0]({
    service_cname: 'retained-vm', source_type: 'url', vm_url: quickStart.UBUNTU_NOBLE_QCOW2_URL,
    ssh_username: 'ubuntu', ssh_public_key: 'opaque-form-only-input'
  });
  assert.equal(h.actions.length, 1);
  assert.equal(h.actions[0].type, 'createApp/createVirtualMachineWorkflow');
  assert.equal(h.actions[0].payload.ssh_public_key, 'opaque-form-only-input');
  assert.equal(h.actions[0].payload.resources.disk, 80);
  assert.equal(JSON.stringify(h.instance.state).includes('opaque-form-only-input'), false);
  h.actions[0].onProgress({ serviceAlias: 'vm-a', stage: 'storage', ssh_public_key: 'opaque-form-only-input' });
  assert.equal(h.instance.state.quickStart.serviceAlias, 'vm-a');
  assert.equal(JSON.stringify(h.instance.state).includes('opaque-form-only-input'), false);
  assert.ok(h.cleared.length > 0, 'the native credential store is cleared by the explicit final request/alias boundary');
  h.actions[0].callback({ status: 'failed', stage: 'storage', error: 'opaque-form-only-input' });
  assert.equal(JSON.stringify(h.instance.state).includes('opaque-form-only-input'), false);
  h.instance.retryQuickStart();
  assert.equal(h.actions.length, 2);
  assert.equal(h.actions[1].resume.serviceAlias, 'vm-a');
  assert.equal(Object.hasOwn(h.actions[1].payload, 'ssh_public_key'), false);
  assert.equal(Object.hasOwn(h.actions[1].payload, 'ssh_username'), false);
  assert.equal(h.collectors.length, 1, 'retry of an existing alias never recollects credentials');
});

test('source validation cancellation unlocks final confirmation without dispatching a VM', () => {
  const h = workflowHarness();
  h.instance.create({ cpu: 2, memory: 4, disk: 40 });
  h.collectors[0](null);
  assert.equal(h.instance.sourceCollectionInFlight, false);
  assert.equal(h.instance.state.quickStartSubmitting, false);
  assert.equal(h.actions.length, 0);
  h.instance.create({ cpu: 2, memory: 4, disk: 40 });
  assert.equal(h.collectors.length, 2);
});

test('late source collection after leaving the workflow cannot dispatch creation', () => {
  const h = workflowHarness();
  h.instance.create({ cpu: 2, memory: 4, disk: 40 });
  h.instance.componentWillUnmount();
  h.collectors[0]({ service_cname: 'retained-vm', source_type: 'url' });
  assert.equal(h.actions.length, 0);
});

test('the dispatched workflow activity predicate rejects unmount and every changed source scope', () => {
  let sourceCurrent = true;
  const h = workflowHarness({ isSourceScopeCurrent: () => sourceCurrent });
  h.instance.runQuickStart({ source_type: 'upload', resources: { cpu: 2, memory: 4, disk: 40 } });
  const action = h.actions[0];
  assert.equal(action.isActive(), true);
  for (const key of ['team', 'region', 'application']) {
    const original = h.scope[key];
    h.scope[key] = `${original}-changed`;
    assert.equal(action.isActive(), false, `${key} must invalidate the original workflow`);
    const state = JSON.stringify(h.instance.state);
    action.onProgress({ serviceAlias: 'stale-alias', stage: 'storage' });
    assert.equal(JSON.stringify(h.instance.state), state, 'inactive callbacks cannot update the new scope');
    h.scope[key] = original;
    assert.equal(action.isActive(), true);
  }
  sourceCurrent = false;
  assert.equal(action.isActive(), false, 'a replaced native source scope must invalidate the request');
  sourceCurrent = true;
  assert.equal(action.isActive(), true);
  h.instance.componentWillUnmount();
  assert.equal(action.isActive(), false);
  const state = JSON.stringify(h.instance.state);
  const clears = h.cleared.length;
  action.callback({ status: 'submitted', serviceAlias: 'stale-alias', stage: 'build' });
  assert.equal(JSON.stringify(h.instance.state), state);
  assert.equal(h.cleared.length, clears, 'late results cannot touch the next native form');
});
