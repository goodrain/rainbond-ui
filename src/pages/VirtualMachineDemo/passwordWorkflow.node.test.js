const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const babel = require('@umijs/deps/compiled/babel/core');
const quickStart = require('../../utils/vmQuickStart');

const sourceRoot = path.resolve(__dirname, '../..');
const compiled = new Map();
const FORBIDDEN_FIELDS = ['login_password', 'vm_login_password', 'login_password_hash', 'vm_login_password_hash'];

// Fixtures exist only in this process. No account credential or complete SSH
// key is generated, written to disk, placed in a test name, or printed.
function credentials() {
  const password = ` ${crypto.randomBytes(24).toString('base64url')}\u{1f680} `;
  const hash = crypto.randomBytes(32).toString('base64url');
  const algorithm = 'ssh-ed25519';
  const prefix = Buffer.alloc(4);
  prefix.writeUInt32BE(algorithm.length);
  // Deliberately incomplete SSH wire data, accepted by the legacy prefix-only
  // validator, lets a mixed-method test distinguish rejection from key syntax.
  const publicKey = `${algorithm} ${Buffer.concat([
    prefix, Buffer.from(algorithm), crypto.randomBytes(19)
  ]).toString('base64')} fixture-only`;
  return { password, hash, publicKey, all: [password, hash, publicKey] };
}

function secureTest(name, run) {
  test(name, async () => {
    try {
      await run();
    } catch (_) {
      // Even a production/provider exception or a failed Red assertion must
      // not attach dynamic input, causes or raw assertion diffs to TAP output.
      throw new Error(name);
    }
  });
}

function serialized(value) {
  const seen = new Set();
  return JSON.stringify(value, (_, item) => {
    if (typeof item === 'function') return '[Function]';
    if (item && typeof item === 'object') {
      if (seen.has(item)) return '[Repeated]';
      seen.add(item);
    }
    return item;
  }) || '';
}

function assertNoCredentials(value, fixture) {
  const output = serialized(value);
  assert.ok(fixture.all.every(item => !output.includes(item)), 'Safe projections must exclude credential fixtures');
  const visit = item => {
    if (!item || typeof item !== 'object') return;
    assert.ok(FORBIDDEN_FIELDS.every(name => !Object.hasOwn(item, name)), 'Safe projections must omit password fields');
    Object.values(item).forEach(child => { if (typeof child !== 'function') visit(child); });
  };
  visit(value);
}

function source(overrides = {}) {
  return {
    team_name: 'team-a', group_id: '868', service_cname: 'password-workflow-vm',
    source_type: 'url', vm_url: quickStart.UBUNTU_NOBLE_QCOW2_URL,
    format: 'qcow2', arch: 'amd64', boot_mode: 'uefi',
    os_name: 'Ubuntu 24.04', os_family: 'linux',
    login_method: 'password', ssh_username: 'ubuntu',
    resources: { cpu: 4, memory: 8, disk: 80 }, disk_volume_type: 'ceph-block',
    ...overrides
  };
}

const success = value => ({ status_code: 200, business_code: 200, ...value });

function loadProduction(relative, dependencies = {}) {
  const filename = path.join(sourceRoot, relative);
  if (!compiled.has(filename)) compiled.set(filename, babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, babelrc: false, configFile: false,
    presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
      require('@umijs/deps/compiled/babel/preset-react').default],
    plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
      [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
  }).code);
  const exported = {};
  vm.runInNewContext(compiled.get(filename), {
    exports: exported, URL,
    require(name) {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      if (name === 'react') return React;
      if (name === 'dva') return { connect: () => Component => Component };
      if (name === 'dva/router') return { routerRedux: { push: value => ({ type: 'navigate', value }) } };
      if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
      if (name === '@/utils/vmQuickStart') return quickStart;
      if (name === './messages') return { t: key => `vmDemo.${key}` };
      if (name.endsWith('.less')) return {};
      if (name.startsWith('@/utils/')) return require(path.join(sourceRoot, 'utils', name.slice('@/utils/'.length)));
      if (name.startsWith('.')) return require(path.resolve(path.dirname(filename), name));
      throw new Error('Unexpected production dependency');
    }
  }, { filename });
  return exported;
}

function workflowHarness(fixture, extra = {}) {
  const actions = [], collectors = [], warnings = [];
  const scope = { team: 'team-a', region: 'region-a', application: '868' };
  let cleared = 0;
  const exports = loadProduction('pages/VirtualMachineDemo/Workflow.js', {
    antd: { message: { warning: value => warnings.push(value) } },
    '@/utils/global': {
      getCurrTeamName: () => scope.team, getCurrRegionName: () => scope.region,
      getAppID: () => scope.application
    },
    '@/components/PageHeader': () => null,
    '@/utils/pageHeaderSvg': {}, './CreateVm': () => null
  });
  const instance = new exports.VmCreateWorkflow({
    teamName: scope.team, regionName: scope.region, groupId: scope.application,
    sourceSummary: { name: 'password-workflow-vm', sourceType: 'url', os: 'Ubuntu 24.04',
      sshRequired: true, loginMethod: 'password', sshUsername: 'ubuntu' },
    dispatch: action => { actions.push(action); },
    collectSourcePayload: callback => collectors.push(callback),
    clearSourceCredentials: () => { cleared += 1; },
    isSourceScopeCurrent: () => true,
    ...extra
  });
  instance.setState = update => {
    instance.state = { ...instance.state, ...(typeof update === 'function' ? update(instance.state) : update) };
  };
  instance.componentDidMount();
  instance.state.creationStorage = { status: 'ready', options: [{ value: 'ceph-block', label: 'Persistent block' }] };
  return {
    instance, collectors, scope, warnings, actions,
    creates: () => actions.filter(action => action.type === 'createApp/createVirtualMachineWorkflow'),
    cleared: () => cleared,
    options(reader) { return { boundGroupId: '868', readCredentials: reader, passwordBootstrapSupported: true }; },
    assertSafe() { assertNoCredentials({ actions, state: instance.state, warnings }, fixture); }
  };
}

function modelHarness(fixture, failures = {}) {
  const http = [], serviceEntries = [], order = [], telemetry = [], callbacks = [], progress = [], errors = [], yields = [];
  const scope = { getCurrTeamName: () => 'team-a', getCurrRegionName: () => 'region-a', getAppID: () => '868' };
  const service = loadProduction('services/createApp.js', {
    '../../config/api.config': { baseUrl: '/fixture' },
    '../utils/global': scope,
    '../utils/request': (url, options) => {
      http.push({ url, options });
      order.push('create');
      return Promise.resolve(success({ bean: { service_alias: 'gr-password-vm' } }));
    },
    'rc-upload/lib/request': () => { throw new Error('Upload transport must not run'); }
  }).createAppByVirtualMachine;
  const api = {
    getPortDetail: async () => {
      order.push('ssh');
      return success({ bean: { port: { container_port: 22, protocol: 'tcp', is_inner_service: true, is_outer_service: false } } });
    },
    getVolumeOpts: async () => { order.push('storage'); return success({ list: [{ volume_type: 'ceph-block', name_show: 'Persistent block' }] }); },
    editAppCreateInfo: async () => { order.push('configure'); return failures.configure ? undefined : success({}); }
  };
  const model = loadProduction('models/createApp.js', {
    '../services/createApp': {
      createAppByVirtualMachine: (body, handleError, options) => {
        serviceEntries.push({ body, options });
        return service(body, handleError, options);
      },
      buildApp: async () => { order.push('build'); return failures.build ? undefined : success({}); }
    },
    '../services/app': api,
    '../services/plugin': {},
    '../posthog': { captureAppOperation: (...values) => telemetry.push(values), captureMarketInstall() {} }
  }).default;
  const effects = { call: (fn, ...args) => ({ fn, args }) };
  const action = (payload, reader, extra = {}) => ({
    payload, isActive: () => true, readCredentials: reader, passwordBootstrapSupported: true,
    onProgress: value => progress.push(value), callback: value => callbacks.push(value),
    handleError: value => errors.push(value), ...extra
  });
  async function complete(iterator, onYield) {
    let state = iterator.next();
    while (!state.done) {
      const operation = state.value;
      assert.ok(operation && typeof operation.fn === 'function', 'The real effect must yield a callable operation');
      yields.push(operation);
      if (onYield) onYield(operation);
      let outcome, caught;
      try { outcome = await operation.fn(...operation.args); } catch (error) { caught = error; }
      state = caught ? iterator.throw(caught) : iterator.next(outcome);
    }
  }
  return {
    model, effects, action, complete, http, serviceEntries, order, telemetry, callbacks, progress, errors, yields,
    assertSafe() {
      assertNoCredentials({ telemetry, callbacks, progress, errors, yields,
        serviceBodies: serviceEntries.map(entry => entry.body), options: serviceEntries.map(entry => entry.options) }, fixture);
    }
  };
}

function requestReader(fixture, onRead = () => {}) {
  return request => {
    onRead();
    assert.ok(request?.login_method === 'password', 'Only the password service boundary may invoke the provider');
    assert.ok(request?.ssh_username === 'ubuntu', 'The reader must receive the requested username');
    assert.ok(String(request?.group_id) === '868', 'The reader must receive the bound application');
    assert.ok(request?.team_name === 'team-a', 'The reader must receive the requested team');
    assert.ok(request?.vm_url === quickStart.UBUNTU_NOBLE_QCOW2_URL, 'The reader must receive the canonical source');
    return { login_password: fixture.password };
  };
}

secureTest('password Workflow forwards a sibling reader only after safe final collection without reading it', () => {
  const fixture = credentials();
  let reads = 0;
  const reader = requestReader(fixture, () => { reads += 1; });
  const h = workflowHarness(fixture);
  h.instance.create({ cpu: 4, memory: 8, disk: 80, disk_volume_type: 'ceph-block' });
  assert.ok(h.creates().length === 0, 'Creation must wait for final source collection');
  h.collectors[0](source(), h.options(reader));
  const action = h.creates()[0];
  assert.ok(Boolean(action), 'Final collection must dispatch the real VM workflow');
  assert.ok(action.readCredentials === reader, 'The reader must remain a sibling action function');
  assert.ok(action.passwordBootstrapSupported === true, 'Capability support must be forwarded explicitly');
  assert.ok(action.payload.login_method === 'password', 'The safe payload must retain the login method');
  assert.ok(!Object.hasOwn(action.payload, 'readCredentials'), 'The reader must not enter the source payload');
  assert.ok(reads === 0, 'Workflow and action construction must not read credentials');
  h.assertSafe();
});

secureTest('password Workflow rejects a credential-bearing source before dispatching an action', () => {
  const fixture = credentials();
  const h = workflowHarness(fixture);
  h.instance.create({ cpu: 4, memory: 8, disk: 80, disk_volume_type: 'ceph-block' });
  let caught;
  try {
    h.collectors[0](source({ login_password: fixture.password, login_password_hash: fixture.hash }), h.options(() => ({})));
  } catch (error) { caught = error; }
  assert.ok(h.creates().length === 0, 'Credential-bearing source data must never enter an action');
  if (caught) {
    assert.ok(!serialized({ name: caught.name, message: caught.message, stack: caught.stack }).includes(fixture.password), 'Source rejection must not echo a credential');
  }
  h.assertSafe();
});

secureTest('password Workflow rejects the reserved VM password alias before dispatching an action', () => {
  const fixture = credentials();
  const h = workflowHarness(fixture);
  h.instance.create({ cpu: 4, memory: 8, disk: 80, disk_volume_type: 'ceph-block' });
  try {
    h.collectors[0](source({ vm_login_password: fixture.password }), h.options(() => ({})));
  } catch (_) { /* Source rejection must remain safe without printing input. */ }
  assert.ok(h.creates().length === 0, 'The reserved password alias must never enter a DVA action');
  h.assertSafe();
});

secureTest('password Workflow projects progress and retries an alias without retaining credentials or a reader', () => {
  const fixture = credentials();
  let reads = 0;
  const h = workflowHarness(fixture);
  h.instance.create({ cpu: 4, memory: 8, disk: 80, disk_volume_type: 'ceph-block' });
  h.collectors[0](source(), h.options(requestReader(fixture, () => { reads += 1; })));
  const first = h.creates()[0];
  first.onProgress({ stage: 'configure', serviceAlias: 'gr-password-vm', groupId: '868', sshRequired: true,
    resources: { cpu: 4, memory: 8, disk: 80 }, storageOptions: [],
    login_password: fixture.password, vm_login_password_hash: fixture.hash, ssh_public_key: fixture.publicKey });
  first.callback({ status: 'failed', stage: 'configure', error: 'quickStartConfigureFailed',
    serviceAlias: 'gr-password-vm', groupId: '868', sshRequired: true, resourceConfigured: false,
    resources: { cpu: 4, memory: 8, disk: 80 }, storageOptions: [] });
  assert.ok(h.cleared() === 1, 'Alias arrival must clear the original source credentials');
  h.instance.retryQuickStart();
  const retry = h.creates()[1];
  assert.ok(Boolean(retry), 'The existing alias must remain retryable');
  assert.ok(retry.resume.serviceAlias === 'gr-password-vm', 'Retry must retain the real alias');
  assert.ok(retry.readCredentials === undefined && retry.passwordBootstrapSupported !== true, 'Alias retry must not forward the credential reader');
  assert.ok(!Object.hasOwn(retry.payload, 'ssh_username') && !Object.hasOwn(retry.payload, 'ssh_public_key'), 'Alias retry must require no login fields');
  assert.ok(reads === 0, 'Progress and alias retry must not read credentials');
  h.assertSafe();
});

secureTest('password real workflow effect preserves Noble metadata and verifies internal SSH before build', async () => {
  const fixture = credentials();
  let reads = 0;
  const h = modelHarness(fixture);
  const reader = requestReader(fixture, () => { reads += 1; });
  const action = h.action(source(), reader);
  assertNoCredentials(action, fixture);
  await h.complete(h.model.effects.createVirtualMachineWorkflow(action, h.effects), () => {
    assert.ok(reads === 0, 'The effect and saga CALL arguments must not materialize credentials');
  });
  assert.ok(h.callbacks[0]?.status === 'submitted', 'Password creation must complete the real serial pipeline');
  assert.ok(h.callbacks[0]?.sshRequired === true && h.callbacks[0]?.portConfigured === true, 'Password login must retain the internal SSH verification requirement');
  assert.ok(h.order.join(',') === 'create,ssh,storage,configure,build', 'Password creation must retain the approved request order');
  assert.ok(reads === 1 && h.http.length === 1, 'Only the final create service may read credentials once');
  const body = h.http[0].options.data;
  assert.ok(body.login_password === fixture.password, 'The HTTP body must preserve the original credential without trimming');
  assert.ok(body.login_method === 'password' && !Object.hasOwn(body, 'ssh_public_key'), 'The HTTP body must contain only the selected credential method');
  assert.ok(body.boot_mode === 'uefi' && body.os_name === 'Ubuntu 24.04' && body.os_family === 'linux' && body.format === 'qcow2' && body.arch === 'amd64', 'Password login must preserve trusted Noble metadata');
  assert.ok(h.http[0].options.sensitiveError === true, 'Password creation must use the sensitive error channel');
  h.assertSafe();
});

secureTest('password direct effect forwards service options without reading the provider in saga CALL arguments', async () => {
  const fixture = credentials();
  let reads = 0;
  const h = modelHarness(fixture);
  const reader = requestReader(fixture, () => { reads += 1; });
  await h.complete(h.model.effects.createAppByVirtualMachine(h.action(source(), reader), h.effects), operation => {
    assert.ok(reads === 0, 'The direct effect must not read the provider before the service call');
    assert.ok(operation.args[2]?.readCredentials === reader, 'The direct effect must pass the provider in separate service options');
    assertNoCredentials(operation.args, fixture);
  });
  assert.ok(reads === 1 && h.http.length === 1, 'The direct service boundary must read the provider once');
  assert.ok(h.http[0].options.data.login_password === fixture.password, 'The direct HTTP body must preserve the credential');
  h.assertSafe();
});

secureTest('password provider failures become fixed direct-effect errors without a POST or echoed input', async () => {
  const fixture = credentials();
  const h = modelHarness(fixture);
  const reader = () => { throw new Error(fixture.password); };
  await h.complete(h.model.effects.createAppByVirtualMachine(h.action(source(), reader), h.effects));
  const caught = h.errors[0];
  assert.ok(Boolean(caught), 'The direct effect must report an unavailable provider');
  assert.ok(caught?.name === 'VmLoginCredentialsUnavailable', 'The provider error name must be fixed');
  assert.ok(caught?.message === 'VM login credentials are unavailable', 'The provider error message must be fixed');
  assert.ok(!caught?.response && !caught?.config && !caught?.cause, 'The provider error must not retain request or response objects');
  assert.ok(!String(caught?.stack || '').includes(fixture.password), 'The provider error stack must exclude the credential');
  assert.ok(h.http.length === 0, 'An unavailable provider must prevent the first POST');
  h.assertSafe();
});

for (const phase of ['configure', 'build']) {
  secureTest(`password alias retry after ${phase} failure never recreates or reads login credentials`, async () => {
    const fixture = credentials();
    let reads = 0;
    const h = modelHarness(fixture, { [phase]: true });
    const reader = requestReader(fixture, () => { reads += 1; });
    await h.complete(h.model.effects.createVirtualMachineWorkflow(h.action(source(), reader), h.effects));
    const failed = h.callbacks[0];
    assert.ok(failed?.status === 'failed' && failed?.stage === phase && failed?.serviceAlias === 'gr-password-vm', 'A partial failure must preserve its real alias and failed phase');
    assert.ok(reads === 1, 'The first create service must read the credential once');
    assertNoCredentials(failed, fixture);
    const retry = modelHarness(fixture);
    await retry.complete(retry.model.effects.createVirtualMachineWorkflow(retry.action({ team_name: 'team-a', disk_volume_type: 'ceph-block' },
      () => { reads += 1; throw new Error(fixture.password); }, { resume: failed }), retry.effects));
    assert.ok(retry.callbacks[0]?.status === 'submitted', 'Alias-only retry must succeed without username or key');
    assert.ok(retry.http.length === 0 && retry.serviceEntries.length === 0 && reads === 1, 'Alias-only retry must neither recreate nor read the provider');
    assert.ok(retry.order.join(',') === (phase === 'build' ? 'ssh,build' : 'ssh,storage,configure,build'), 'Alias-only retry must preserve the correct serial continuation');
    h.assertSafe();
    retry.assertSafe();
  });
}

secureTest('password and public key conflict is rejected before the first create or provider read', async () => {
  const fixture = credentials();
  let reads = 0;
  const h = modelHarness(fixture);
  await h.complete(h.model.effects.createVirtualMachineWorkflow(h.action(source({ ssh_public_key: fixture.publicKey }),
    () => { reads += 1; return { login_password: fixture.password }; }), h.effects));
  assert.ok(h.callbacks[0]?.status === 'failed', 'Mixed credential methods must fail before creation');
  assert.ok(h.http.length === 0 && h.serviceEntries.length === 0 && reads === 0, 'Mixed methods must not reach the service or provider');
  // The deliberately hostile input is allowed only in this test's originating
  // action; no result, progress or telemetry may echo it.
  assertNoCredentials({ results: h.callbacks, progress: h.progress, telemetry: h.telemetry }, fixture);
});

secureTest('ordinary image sources reject an explicit password method without a create or provider read', async () => {
  const fixture = credentials();
  let reads = 0;
  const h = modelHarness(fixture);
  await h.complete(h.model.effects.createVirtualMachineWorkflow(h.action(source({
    vm_url: 'https://images.example.invalid/installer.iso', format: 'iso', os_name: 'Windows Server 2025'
  }), () => { reads += 1; return { login_password: fixture.password }; }), h.effects));
  assert.ok(h.callbacks[0]?.status === 'failed', 'Ordinary media must not accept password bootstrap');
  assert.ok(h.http.length === 0 && h.serviceEntries.length === 0 && reads === 0, 'Ordinary media must be rejected before the service or provider');
  h.assertSafe();
});

secureTest('password confirmation renders only the selected login method and username without credential material', () => {
  const fixture = credentials();
  const Box = ({ children, title, label, extra }) => React.createElement('div', null, title, label, children, extra);
  const Form = Object.assign(Box, { create: () => Component => Component, Item: Box });
  const Radio = Object.assign(Box, { Group: Box, Button: Box });
  const Select = Object.assign(Box, { Option: Box });
  const View = loadProduction('pages/VirtualMachineDemo/CreateVm.js', {
    antd: { Alert: ({ message, description }) => React.createElement('div', null, message, description),
      Form, Radio, Select, Card: Box, Button: Box, Descriptions: Object.assign(Box, { Item: Box }),
      Steps: Object.assign(Box, { Step: Box }), Input: () => null, InputNumber: () => null },
    './HelpLabel': ({ label }) => React.createElement('span', null, label)
  }).default;
  for (const method of ['password', 'ssh_key']) {
    const values = { cpu: 4, memory: 8, disk: 80, disk_volume_type: 'ceph-block' };
    const view = new View({
      sourceSummary: { name: 'password-workflow-vm', sourceType: 'url', os: 'Ubuntu 24.04',
        sourceName: 'Noble', sshRequired: true, loginMethod: method, sshUsername: 'ubuntu',
        login_password: fixture.password, vm_login_password_hash: fixture.hash, ssh_public_key: fixture.publicKey },
      creationStorage: { status: 'ready', options: [{ value: 'ceph-block', label: 'Persistent block' }] },
      form: {
        getFieldValue: name => values[name],
        getFieldDecorator: (name, options) => element => { if (!Object.hasOwn(values, name)) values[name] = options?.initialValue; return element; }
      }
    });
    view.state.step = 1;
    const markup = ReactDOMServer.renderToStaticMarkup(view.render());
    assert.ok(markup.includes(`vmDemo.${method === 'password' ? 'loginMethodPassword' : 'loginMethodKey'}`), 'Confirmation must identify the selected login method');
    assert.ok(markup.includes('ubuntu') && markup.includes('UEFI'), 'Confirmation must retain username and trusted firmware');
    assert.ok(!markup.includes('vmDemo.publicKeyConfigured'), 'Password confirmation must not claim that a public key was configured');
    assert.ok(fixture.all.every(item => !markup.includes(item)), 'Confirmation must not display a credential or hash');
    assertNoCredentials(view.state, fixture);
  }
});
