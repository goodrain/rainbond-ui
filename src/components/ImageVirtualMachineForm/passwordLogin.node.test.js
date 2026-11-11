const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const util = require('node:util');
const { JSDOM } = require('jsdom');
const babel = require('@umijs/deps/compiled/babel/core');
const quickStart = require('../../utils/vmQuickStart');

// Production class, production validators and actual Antd3/rc-form. Only DVA
// reads and unrelated host dependencies are fixtures; no password behavior is
// implemented here. Diagnostic values stay in memory, including expected reds.
const diagnostics = [];
const originalConsole = { error: console.error, warn: console.warn };
console.error = (...args) => { diagnostics.push(util.inspect(args)); };
console.warn = (...args) => { diagnostics.push(util.inspect(args)); };
const dom = new JSDOM('<!doctype html><div id="password-native-form"></div>', { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator });
global.requestAnimationFrame = window.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = window.cancelAnimationFrame = clearTimeout;
const previousChannel = global.MessageChannel;
global.MessageChannel = undefined;
const React = require('react');
const ReactDOM = require('react-dom');
const { act, Simulate } = require('react-dom/test-utils');
const antd = require('antd');
global.MessageChannel = previousChannel;

let currentScope = { team: 'team-a', region: 'region-a', application: '868' };
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
    if (name === 'antd') return { ...antd, message: { ...antd.message, warning() {} } };
    if (name === 'dva') return { connect: () => Component => Component };
    if (name === 'dva/router') return { routerRedux: { push: value => value } };
    if (name === '@/utils/vmQuickStart') return quickStart;
    if (name.endsWith('/vmLoginCredentials')) return require('../../utils/vmLoginCredentials');
    if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
    if (name === '@/utils/newRole') return { queryPermissionsInfo: () => ({ isCreate: true }) };
    if (name === 'pinyin-pro') return { pinyin: value => value };
    if (name.endsWith('/global')) return {
      getAppID: () => currentScope.application,
      getCurrTeamName: () => currentScope.team,
      getCurrRegionName: () => currentScope.region
    };
    if (name.endsWith('/messages')) return { t: key => key };
    if (name.endsWith('/error')) return () => {};
    if (['./runtimeFieldMerge', './assetReadiness', './imageNameValidation'].includes(name)) return require(name);
    if (name.endsWith('.png')) return 'ubuntu.png';
    if (name.endsWith('.less')) return { vmForm: 'vmForm' };
    return {};
  }
}, { filename });

const root = document.getElementById('password-native-form');
const flush = () => new Promise(resolve => setImmediate(resolve));

function secureTest(name, callback) {
  return test(name, async context => {
    try {
      await callback(context);
    } catch (_) {
      throw new Error(`Native password login regression failed: ${name}`);
    }
  });
}
// Synthetic runtime-only values, never accounts, defaults or printable test output.
const credential = count => Array.from({ length: count }, (_, index) => String.fromCodePoint(0x410 + index % 31)).join('');
const publicInput = () => {
  const algorithm = 'ssh-ed25519';
  const prefix = Buffer.alloc(4);
  prefix.writeUInt32BE(algorithm.length);
  return `${algorithm} ${Buffer.concat([prefix, Buffer.from(algorithm), Buffer.alloc(32, 3)]).toString('base64')}`;
};

function mount(extra = {}) {
  let instance;
  const requests = [], submissions = [], capabilityReads = [];
  const props = {
    archInfo: ['amd64'], currUser: { enterprise_id: 'enterprise-a' }, virtualMachineImage: [],
    groupId: 868, handleType: 'Service', showSubmitBtn: false,
    dispatch: action => {
      requests.push(action);
      if (action.type === 'createApp/getVMCapabilities') capabilityReads.push(action);
    },
    onSubmit: (value, eventId, options) => submissions.push({ value, eventId, options }),
    wrappedComponentRef: value => { instance = value; },
    ...extra
  };
  act(() => { ReactDOM.render(React.createElement(exported.default, props), root); });
  return {
    get instance() { return instance; },
    get form() { return instance.props.form; }, requests, submissions,
    capabilityReads,
    rerender(update = {}) {
      Object.assign(props, update);
      act(() => { ReactDOM.render(React.createElement(exported.default, { ...props }), root); });
    },
    capability(value) {
      const action = capabilityReads[capabilityReads.length - 1];
      assert.ok(!!action && typeof action.callback === 'function', 'native capability read must use its real DVA callback');
      act(() => action.callback({ bean: value }));
    },
    unavailableCapability() {
      const action = capabilityReads[capabilityReads.length - 1];
      assert.ok(!!action && typeof action.handleError === 'function', 'native capability read must expose a safe failure callback');
      act(() => action.handleError({ status: 503 }));
    }
  };
}

function passwordForm(extra = {}) {
  const h = mount(extra);
  h.capability({ password_bootstrap_supported: true, login_methods: ['ssh_key', 'password'] });
  assert.ok(root.querySelectorAll('input[id="login_password"]').length === 1,
    'explicit support must render exactly one production password input');
  return h;
}

function setFields(h, fields) { act(() => h.form.setFieldsValue(fields)); }
function chooseMethod(method) {
  const input = root.querySelector(`input[type="radio"][value="${method}"]`);
  assert.ok(!!input, 'login method must be selected through the real radio control');
  act(() => Simulate.change(input, { target: { value: method, checked: true } }));
}
function ready(h, value, username = 'ubuntu') {
  setFields(h, { service_cname: 'login-vm', k8s_component_name: 'login-vm',
    ssh_username: username, login_password: value });
}
async function submit(h, options) {
  act(() => h.instance.handleSubmit({ preventDefault() {} }, options));
  await flush();
}
function binder(h, selectedGroup = '868') {
  assert.ok(typeof h.instance.createPasswordReaderBinder === 'function', 'native scoped binder must be implemented');
  return h.instance.createPasswordReaderBinder(selectedGroup);
}
function request(groupId = '868') {
  return { login_method: 'password', ssh_username: 'ubuntu', team_name: 'team-a',
    group_id: groupId, vm_url: quickStart.UBUNTU_NOBLE_QCOW2_URL };
}
function rejectedWithoutOutput(action) {
  let rejected = false;
  try { action(); } catch (_) { rejected = true; }
  assert.ok(rejected, 'invalid credential intent must fail without exposing the thrown value');
}
function observePasswordReads(h) {
  const original = h.form.getFieldValue.bind(h.form);
  let count = 0;
  h.form.getFieldValue = name => {
    if (name === 'login_password') count += 1;
    return original(name);
  };
  return () => count;
}

test.beforeEach(() => {
  currentScope = { team: 'team-a', region: 'region-a', application: '868' };
  diagnostics.length = 0;
});
test.afterEach(() => { act(() => { ReactDOM.unmountComponentAtNode(root); }); });
test.after(() => {
  dom.window.close();
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  diagnostics.length = 0;
});

for (const [name, capabilities] of [
  ['absent', {}], ['methods-without-Go-support', { login_methods: ['ssh_key', 'password'] }],
  ['false', { password_bootstrap_supported: false, login_methods: ['ssh_key', 'password'] }],
  ['string-true', { password_bootstrap_supported: 'true', login_methods: ['ssh_key', 'password'] }],
  ['numeric', { password_bootstrap_supported: 1, login_methods: ['ssh_key', 'password'] }],
  ['Go-only-passthrough', { password_bootstrap_supported: true }],
  ['string-methods', { password_bootstrap_supported: true, login_methods: 'password' }],
  ['object-methods', { password_bootstrap_supported: true, login_methods: {} }],
  ['empty-methods', { password_bootstrap_supported: true, login_methods: [] }],
  ['key-only-methods', { password_bootstrap_supported: true, login_methods: ['ssh_key'] }],
  ['wrong-method-case', { password_bootstrap_supported: true, login_methods: ['Password'] }]
]) {
  secureTest(`legacy ${name} capability keeps only the existing key input`, () => {
    const h = mount();
    h.capability(capabilities);
    assert.ok(!root.querySelector('input[id="login_password"]'), 'legacy capability must not expose password mode');
    assert.ok(!!root.querySelector('textarea[id="ssh_public_key"]'), 'legacy capability must retain the original key input');
    assert.ok(h.submissions.length === 0, 'capability reads must not create a VM');
  });
}

secureTest('strict Go support and explicit Console methods select one masked password control', () => {
  const h = passwordForm();
  assert.ok(h.instance.state.loginMethod === 'password', 'explicit support must default the untouched form to password');
  assert.ok(root.querySelectorAll('.ant-input-password').length === 1, 'exactly one Antd password control is allowed');
  assert.ok(root.querySelector('input[id="login_password"]').type === 'password', 'password starts masked');
  assert.ok(!root.querySelector('textarea[id="ssh_public_key"]'), 'the inactive key input must be absent');
});

secureTest('a failed capability read keeps the legacy key-only form', () => {
  const h = mount();
  h.unavailableCapability();
  assert.ok(!root.querySelector('input[id="login_password"]'), 'capability failure must not enable password mode');
  assert.ok(!!root.querySelector('textarea[id="ssh_public_key"]'), 'capability failure must retain the key path');
});

secureTest('late positive capability does not replace an entered or explicitly selected key method', () => {
  const h = mount();
  const key = publicInput();
  setFields(h, { ssh_public_key: key });
  h.capability({ password_bootstrap_supported: true, login_methods: ['ssh_key', 'password'] });
  assert.ok(!root.querySelector('input[id="login_password"]'), 'late capability must not replace entered key credentials');
  assert.ok(h.form.getFieldValue('ssh_public_key') === key, 'late capability must preserve the existing key input');
  chooseMethod('ssh_key');
  h.capability({ password_bootstrap_supported: true, login_methods: ['ssh_key', 'password'] });
  assert.ok(h.instance.state.loginMethod === 'ssh_key', 'explicit key selection must stay selected');
});

secureTest('method changes clear only inactive credentials while repeated active selection preserves input', () => {
  const h = passwordForm();
  const value = credential(20), key = publicInput();
  ready(h, value, 'vmuser');
  chooseMethod('password');
  assert.ok(h.form.getFieldValue('login_password') === value, 'reselecting password must preserve the current input');
  chooseMethod('ssh_key');
  assert.ok(!h.form.getFieldValue('login_password'), 'switching to key must clear the inactive password');
  assert.ok(h.form.getFieldValue('ssh_username') === 'vmuser', 'the shared username must be retained');
  setFields(h, { ssh_public_key: key });
  chooseMethod('ssh_key');
  assert.ok(h.form.getFieldValue('ssh_public_key') === key, 'reselecting key must preserve the current input');
  chooseMethod('password');
  assert.ok(!h.form.getFieldValue('ssh_public_key'), 'switching to password must clear the inactive key');
  assert.ok(!h.form.getFieldValue('login_password'), 'switching back must not restore a cleared password');
});

for (const [name, value] of [
  ['too-short', () => credential(11)], ['too-long', () => credential(129)],
  ['all-whitespace', () => String.fromCharCode(0xa0).repeat(12)],
  ['control', () => `${credential(12)}${String.fromCharCode(0x85)}`],
  ['line-separator', () => `${credential(12)}${String.fromCharCode(0x2028)}`]
]) {
  secureTest(`manual password validation rejects ${name} with a fixed safe error`, async () => {
    const h = passwordForm();
    const input = value();
    ready(h, input);
    await submit(h);
    assert.ok(h.submissions.length === 0, 'invalid password input must not submit');
    const errors = h.form.getFieldError('login_password') || [];
    assert.ok(errors.length > 0 && errors.every(error => error === 'loginPasswordInvalid'), 'password errors must contain fixed message identifiers only');
    assert.ok(!diagnostics.some(entry => entry.includes(input)), 'validation diagnostics must not contain the credential input');
  });
}

secureTest('manual password validation rejects the root username before source submission', async () => {
  const h = passwordForm();
  ready(h, credential(20), 'root');
  await submit(h);
  assert.ok(h.submissions.length === 0, 'root password initialization must not submit');
  assert.ok((h.form.getFieldError('ssh_username') || []).includes('loginPasswordRootUnsupported'), 'root rejection must use the fixed localized identifier');
});

secureTest('manual password validation requires a value without exposing it in an error', async () => {
  const h = passwordForm();
  ready(h, undefined);
  await submit(h);
  assert.ok(h.submissions.length === 0, 'missing password input must not submit');
  assert.ok((h.form.getFieldError('login_password') || []).includes('loginPasswordRequired'), 'required validation must use its fixed message identifier');
});

secureTest('valid boundaries use code points without truncation and preserve the exact late-read value', async () => {
  const h = passwordForm();
  const supplementary = String.fromCodePoint(0x10400).repeat(128);
  const input = root.querySelector('input[id="login_password"]');
  assert.ok(input.maxLength < 0 || input.maxLength >= supplementary.length, 'the DOM must not truncate valid supplementary code points');
  for (const value of [credential(12), supplementary, `${String.fromCharCode(32)}${credential(12)}${String.fromCharCode(32)}`]) {
    ready(h, value);
    const start = h.submissions.length;
    await submit(h);
    assert.ok(h.submissions.length === start + 1, 'a valid boundary must reach the safe source callback');
    const submission = h.submissions[start];
    assert.ok(!Object.prototype.hasOwnProperty.call(submission.value, 'login_password'), 'safe source values must not include the password field');
    assert.ok(!Object.prototype.hasOwnProperty.call(submission.value, 'ssh_public_key'), 'password mode must omit the public-key field');
    assert.ok(!!submission.options && typeof submission.options.bindReadCredentials === 'function', 'final submission must provide an unread scoped binder');
    const read = submission.options.bindReadCredentials('868');
    let received, failed = false;
    try { received = read(request()); } catch (_) { failed = true; }
    assert.ok(!failed && !!received && received.login_password === value, 'late reading must preserve the original validated value unchanged');
    assert.ok(!JSON.stringify(submission.value).includes(value), 'source callbacks must remain free of credential values');
  }
});

secureTest('unrelated rc-form rejection excludes the active password from rejected values and diagnostics', async () => {
  const h = passwordForm();
  const value = credential(20);
  ready(h, value);
  setFields(h, { service_cname: '' });
  diagnostics.length = 0;
  await submit(h);
  assert.ok(h.submissions.length === 0, 'an unrelated required field must block submission');
  assert.ok((h.form.getFieldError('service_cname') || []).length > 0, 'the real rc-form name validator must have run');
  assert.ok(!diagnostics.some(entry => entry.includes(value) || entry.includes('login_password')), 'rc-form rejection must exclude the password field and value');
});

secureTest('password-only cleanup works without a mounted key control and invalidates the alias-success reader', () => {
  const h = passwordForm();
  ready(h, credential(20));
  assert.ok(!h.form.getFieldInstance('ssh_public_key'), 'the fixture must not have a mounted key control');
  const read = binder(h)('868');
  act(() => h.instance.clearSshFields()); // Existing parent hook used when a real alias arrives.
  assert.ok(!h.form.getFieldValue('login_password'), 'the common alias/cancel cleanup hook must clear password mode');
  const reads = observePasswordReads(h);
  rejectedWithoutOutput(() => read(request()));
  assert.ok(reads() === 0, 'an invalidated reader must fail before reading a cleared password');
});

for (const scopeKey of ['team', 'region', 'application']) {
  secureTest(`a changed ${scopeKey} scope rejects a bound reader before accessing its password`, () => {
    const h = passwordForm();
    ready(h, credential(20));
    const read = binder(h)('868');
    const reads = observePasswordReads(h);
    currentScope[scopeKey] = 'different-scope';
    rejectedWithoutOutput(() => read(request()));
    assert.ok(reads() === 0, 'scope mismatch must reject before the password is read');
  });

  secureTest(`a new binder after a ${scopeKey} change cannot adopt old credentials or capabilities`, () => {
    const h = passwordForm();
    ready(h, credential(20));
    const originalScope = { ...currentScope };
    const oldRead = binder(h)('868');
    const oldCapability = h.capabilityReads[0];
    const reads = observePasswordReads(h);
    currentScope[scopeKey] = 'different-scope';
    act(() => rejectedWithoutOutput(() => binder(h)));
    assert.ok(reads() === 0, 'A new binder must reject before reading a password from another scope');
    assert.ok(!h.form.getFieldValue('login_password'), 'Changing scope must clear the old password');
    assert.ok(h.capabilityReads.length === 2, 'The new scope must query its own capabilities');
    act(() => oldCapability.callback({ bean: { password_bootstrap_supported: true, login_methods: ['ssh_key', 'password'] } }));
    assert.ok(h.instance.state.vmCapabilities.password_bootstrap_supported !== true, 'An old capability response must not migrate to another scope');
    rejectedWithoutOutput(() => binder(h));
    h.capability({ password_bootstrap_supported: true, login_methods: ['ssh_key', 'password'] });
    assert.ok(!h.form.getFieldValue('login_password'), 'A new capability response must not restore the old password');
    currentScope = originalScope;
    h.rerender({ archInfo: ['amd64'] });
    h.capability({ password_bootstrap_supported: true, login_methods: ['ssh_key', 'password'] });
    ready(h, credential(24));
    const before = reads();
    rejectedWithoutOutput(() => oldRead(request()));
    assert.ok(reads() === before, 'Returning to the original scope must not revive an old reader');
    const fresh = binder(h)('868');
    assert.ok(fresh(request()).login_password === credential(24), 'Fresh credentials may be used after the current scope is verified');
  });

  secureTest(`submission detects a ${scopeKey} change before React rerenders`, async () => {
    const h = passwordForm();
    ready(h, credential(20));
    const reads = observePasswordReads(h);
    currentScope[scopeKey] = 'different-scope';
    await submit(h, { final: true });
    assert.ok(h.submissions.length === 0 && reads() === 0, 'A scope change must block submission before credential validation or DVA');
    assert.ok(!h.form.getFieldValue('login_password'), 'The submit boundary must clear credentials from the old scope');
    assert.ok(h.capabilityReads.length === 2 && h.instance.state.vmCapabilities.password_bootstrap_supported !== true,
      'The submit boundary must invalidate capabilities and query the new scope');
  });

  secureTest(`a ${scopeKey} context update clears credentials in a reused mounted form`, () => {
    const h = passwordForm();
    ready(h, credential(20));
    const read = binder(h)('868');
    currentScope[scopeKey] = 'different-scope';
    h.rerender({ archInfo: ['amd64'] });
    assert.ok(!h.form.getFieldValue('login_password'), 'A context update must clear the previous scope password');
    assert.ok(h.capabilityReads.length === 2 && h.instance.state.vmCapabilities.password_bootstrap_supported !== true,
      'A context update must fetch capability for its own scope');
    const reads = observePasswordReads(h);
    rejectedWithoutOutput(() => read(request()));
    assert.ok(reads() === 0, 'Context invalidation must reject old readers before credential access');
  });
}

secureTest('a late capability response detects scope changes and cannot revive a reader when the scope returns', () => {
  const h = passwordForm();
  ready(h, credential(20));
  const read = binder(h)('868');
  const oldCapability = h.capabilityReads[0];
  currentScope.region = 'region-b';
  act(() => oldCapability.callback({ bean: { password_bootstrap_supported: true, login_methods: ['ssh_key', 'password'] } }));
  assert.ok(h.capabilityReads.length === 2 && !h.form.getFieldValue('login_password'),
    'An observed scope change must clear credentials and start a fresh query');
  currentScope.region = 'region-a';
  h.rerender({ archInfo: ['amd64'] });
  h.capability({ password_bootstrap_supported: true, login_methods: ['ssh_key', 'password'] });
  ready(h, credential(24));
  const reads = observePasswordReads(h);
  rejectedWithoutOutput(() => read(request()));
  assert.ok(reads() === 0, 'An old reader must stay invalid after a capability callback observes another scope');
});

secureTest('reusing a mounted native form for another target application clears login state and refetches capability', () => {
  const h = passwordForm();
  ready(h, credential(20));
  const oldRead = binder(h)('868');
  h.rerender({ groupId: 869 });
  assert.ok(!h.form.getFieldValue('login_password'), 'A new application prop must clear the old password');
  assert.ok(h.capabilityReads.length === 2 && h.instance.state.vmCapabilities.password_bootstrap_supported !== true,
    'A new application prop must invalidate old capabilities');
  rejectedWithoutOutput(() => binder(h, '869'));
  h.rerender({ groupId: 868 });
  h.capability({ password_bootstrap_supported: true, login_methods: ['ssh_key', 'password'] });
  ready(h, credential(24));
  const reads = observePasswordReads(h);
  rejectedWithoutOutput(() => oldRead(request()));
  assert.ok(reads() === 0, 'An old reader must remain invalid after target props return');
});

for (const [name, invalidate] of [
  ['mode-change', () => { chooseMethod('ssh_key'); chooseMethod('password'); }],
  ['source-change', h => {
    act(() => h.instance.handleChangeImageSource({ target: { value: 'upload' } }));
    act(() => h.instance.fillUbuntuNobleQcow2Example());
    chooseMethod('password');
  }],
  ['capability-loss', h => {
    h.capability({ password_bootstrap_supported: false, login_methods: ['ssh_key'] });
    h.capability({ password_bootstrap_supported: true, login_methods: ['ssh_key', 'password'] });
  }],
  ['Console-method-support-loss', h => {
    h.capability({ password_bootstrap_supported: true, login_methods: ['ssh_key'] });
    h.capability({ password_bootstrap_supported: true, login_methods: ['ssh_key', 'password'] });
  }],
  ['unmount', () => act(() => { ReactDOM.unmountComponentAtNode(root); })]
]) {
  secureTest(`${name} invalidates a bound reader before any credential access`, () => {
    const h = passwordForm();
    ready(h, credential(20));
    const read = binder(h)('868');
    const reads = observePasswordReads(h);
    invalidate(h);
    const before = reads();
    rejectedWithoutOutput(() => read(request()));
    assert.ok(reads() === before, 'an inactive reader must not access the password store');
  });
}

secureTest('resolved application binding rejects another target and cannot rebind before reading password', () => {
  const h = passwordForm();
  ready(h, credential(20));
  const reads = observePasswordReads(h);
  const bind = binder(h);
  const read = bind('868');
  assert.ok(reads() === 0, 'creating and binding an application reader must not capture the password');
  rejectedWithoutOutput(() => read(request('869')));
  assert.ok(reads() === 0, 'another request application must fail before reading the password');
  rejectedWithoutOutput(() => bind('869'));
  assert.ok(reads() === 0, 'an existing binder cannot bind to another application');
  setFields(h, { group_id: 869 });
  rejectedWithoutOutput(() => read(request()));
  assert.ok(reads() === 0, 'changing the selected application must invalidate the old reader');
});

secureTest('new-application binder resolves once after the group exists without reading a password early', () => {
  currentScope.application = '';
  const h = passwordForm({ groupId: undefined, handleType: undefined });
  ready(h, credential(20));
  const reads = observePasswordReads(h);
  const bind = binder(h, null);
  assert.ok(reads() === 0, 'creating an unresolved binder must not capture the password');
  rejectedWithoutOutput(() => bind(undefined));
  assert.ok(reads() === 0, 'an unresolved new group must not read a password');
  const read = bind('901');
  assert.ok(typeof read === 'function' && reads() === 0, 'resolved binding must still defer the secret read');
  rejectedWithoutOutput(() => bind('902'));
  rejectedWithoutOutput(() => read(request('902')));
  assert.ok(reads() === 0, 'new-group rebinding and wrong-target requests must fail before reading');
});
