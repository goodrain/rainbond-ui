const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const babel = require('@umijs/deps/compiled/babel/core');
const quickStart = require('../utils/vmQuickStart');

const filename = path.join(__dirname, 'createApp.js');

function opaqueFixture() {
  return ['opaque', process.pid, Math.random().toString(36).slice(2), 'test-only'].join(':');
}

function harness(request) {
  const exported = {};
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, babelrc: false, configFile: false,
    presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }]]
  }).code;
  vm.runInNewContext(code, { exports: exported, URL,
    require(name) {
      if (name.endsWith('/api.config')) return { baseUrl: '/backend' };
      if (name.endsWith('/request')) return request;
      if (name.endsWith('/sourceBuildPayload')) return { sanitizePackageToolPayload: value => value };
      if (name.endsWith('/global')) return { getCurrTeamName: () => 'team-a', getCurrRegionName: () => 'region-a' };
      if (name.endsWith('/vmCreationStorage')) return require('../utils/vmCreationStorage');
      if (name.endsWith('/vmQuickStart')) return quickStart;
      if (name.endsWith('/vmLoginCredentials')) {
        const file = path.resolve(__dirname, '../utils/vmLoginCredentials.js');
        return fs.existsSync(file) ? require(file) : {};
      }
      throw new Error('The service introduced an unsupported test dependency');
    }
  }, { filename });
  return exported.createAppByVirtualMachine;
}

function payload(overrides = {}) {
  return { team_name: 'team-a', group_id: 868, service_cname: 'test-vm', k8s_component_name: 'test-vm',
    image_name: 'ubuntu-test', source_type: 'url', vm_url: quickStart.UBUNTU_NOBLE_QCOW2_URL,
    format: 'qcow2', arch: 'amd64', boot_mode: 'uefi', os_name: 'Ubuntu 24.04', os_family: 'linux',
    login_method: 'password', ssh_username: 'ubuntu', ...overrides };
}

function options(overrides = {}) {
  return { passwordBootstrapSupported: true, boundGroupId: '868', isActive: () => true, ...overrides };
}

async function capture(callback) {
  try { return { returned: true, value: await callback() }; }
  catch (error) { return { returned: false, error }; }
}

function fixedError(result, marker) {
  assert.ok(!result.returned && Boolean(result.error), 'The invalid credential request must reject');
  assert.ok(result.error.name === 'VmLoginCredentialsUnavailable', 'Credential error names must be fixed');
  assert.ok(result.error.message === 'VM login credentials are unavailable', 'Credential error messages must be fixed');
  assert.ok(!Object.hasOwn(result.error, 'cause'), 'Credential errors must not retain the provider cause');
  assert.ok(!Object.hasOwn(result.error, 'config') && !Object.hasOwn(result.error, 'response'),
    'Credential errors must exclude request and response objects');
  if (marker) assert.ok(!String(result.error.stack || '').includes(marker), 'Credential error stacks must exclude the input');
}

test('the HTTP service reads a password once at the boundary and sends the original value exclusively', async () => {
  const secret = `  ${opaqueFixture()}  `;
  const events = [];
  let recorded;
  let requested;
  const create = harness((url, config) => { events.push('http'); recorded = { url, config }; return { bean: { service_alias: 'vm-a' } }; });
  const safe = payload();
  const result = await capture(() => create(safe, () => {}, options({ readCredentials: request => {
    events.push('read'); requested = request; return { login_password: secret };
  } })));
  assert.ok(result.returned, 'A supported valid credential request must succeed');
  assert.ok(events.join(',') === 'read,http', 'The provider must be read exactly once immediately before the HTTP call');
  assert.ok(String(requested?.group_id) === '868' && requested?.ssh_username === 'ubuntu', 'The reader must receive the actual target metadata');
  assert.ok(recorded?.config.data.login_password === secret, 'The HTTP request must preserve the supplied value');
  assert.ok(recorded?.config.data.login_method === 'password', 'The HTTP request must retain its login method');
  assert.ok(!Object.hasOwn(recorded.config.data, 'ssh_public_key'), 'Password requests must exclude public-key data');
  assert.ok(!Object.hasOwn(recorded.config.data, 'readCredentials') && !Object.hasOwn(recorded.config.data, 'passwordBootstrapSupported'),
    'Transport controls must not become HTTP fields');
  assert.ok(recorded.config.sensitiveError === true, 'Password HTTP calls must use protected error handling');
  assert.ok(!JSON.stringify(safe).includes(secret) && !Object.hasOwn(safe, 'login_password'), 'The caller payload must remain password-free');
});

test('only explicit support permits a password POST and missing support never reads the form', async () => {
  for (const supported of [undefined, false, 'true']) {
    let posts = 0;
    let reads = 0;
    const create = harness(() => { posts += 1; });
    const result = await capture(() => create(payload(), undefined, options({ passwordBootstrapSupported: supported,
      readCredentials: () => { reads += 1; return {}; }
    })));
    fixedError(result);
    assert.ok(posts === 0 && reads === 0, 'Unsupported environments must reject before reading or posting');
  }
});

test('inactive or missing activity predicates prevent reading and posting', async () => {
  for (const isActive of [undefined, () => false]) {
    let posts = 0;
    let reads = 0;
    const create = harness(() => { posts += 1; });
    fixedError(await capture(() => create(payload(), undefined, options({ isActive,
      readCredentials: () => { reads += 1; return {}; }
    }))));
    assert.ok(posts === 0 && reads === 0, 'An inactive scope must not read or post');
  }
});

test('provider and activity exceptions are captured behind a fixed safe error barrier', async () => {
  const secret = opaqueFixture();
  for (const source of ['provider', 'activity']) {
    let posts = 0;
    const create = harness(() => { posts += 1; });
    const requestOptions = options({
      isActive: source === 'activity' ? () => { throw new Error(secret); } : () => true,
      readCredentials: () => { throw new Error(secret); }
    });
    const result = await capture(() => create(payload(), undefined, requestOptions));
    fixedError(result, secret);
    assert.ok(posts === 0, 'A failing provider or predicate must prevent the HTTP call');
  }
});

test('a password provider is mandatory and malformed credential objects never reach HTTP', async () => {
  const secret = opaqueFixture();
  const invalid = [undefined, {}, { login_password_hash: secret }, { login_password: secret, ssh_public_key: secret },
    { login_password: '' }, { login_password: `${secret}\n` }];
  for (const value of invalid) {
    let posts = 0;
    const create = harness(() => { posts += 1; });
    fixedError(await capture(() => create(payload(), undefined, options({ readCredentials: () => value }))), secret);
    assert.ok(posts === 0, 'Malformed provider data must not be posted');
  }
  let posts = 0;
  const create = harness(() => { posts += 1; });
  fixedError(await capture(() => create(payload(), undefined, options())));
  assert.ok(posts === 0, 'A missing provider must not be posted');
});

test('mixed key/password requests and untrusted source metadata fail before the provider is read', async () => {
  const secret = opaqueFixture();
  const variants = [
    { ssh_public_key: secret }, { source_type: 'upload' }, { vm_url: 'https://images.invalid/other.qcow2' },
    { arch: 'arm64' }, { boot_mode: 'bios' }, { format: 'iso' }, { os_family: 'windows' },
    { os_name: 'another-system' }, { ssh_username: 'root' }, { ssh_username: undefined }, { group_id: undefined }, { group_id: 0 }
  ];
  for (const variant of variants) {
    let posts = 0;
    let reads = 0;
    const create = harness(() => { posts += 1; });
    fixedError(await capture(() => create(payload(variant), undefined, options({ readCredentials: () => {
      reads += 1; return { login_password: secret };
    } }))), secret);
    assert.ok(posts === 0 && reads === 0, 'Invalid safe metadata must be rejected before credential access');
  }
});

test('a password or hash accidentally supplied in the caller body is rejected without an HTTP call', async () => {
  const secret = opaqueFixture();
  for (const field of ['login_password', 'vm_login_password', 'login_password_hash', 'vm_login_password_hash']) {
    let posts = 0;
    const create = harness(() => { posts += 1; });
    fixedError(await capture(() => create(payload({ [field]: secret }), undefined, options({
      readCredentials: () => ({ login_password: secret })
    }))), secret);
    assert.ok(posts === 0, 'Serializable credential fields must be rejected before transport');
  }
});

test('the service forwards target group identity and respects rejection without leaking provider errors', async () => {
  const secret = opaqueFixture();
  let posts = 0;
  let reads = 0;
  const create = harness(() => { posts += 1; });
  const result = await capture(() => create(payload({ group_id: 869 }), undefined, options({ readCredentials: request => {
    assert.ok(String(request.group_id) === '869', 'The reader must receive the HTTP target group');
    reads += 1;
    throw new Error(secret);
  } })));
  fixedError(result, secret);
  assert.ok(reads === 1 && posts === 0, 'A reader binding failure must stop transport');
});

test('an activity change during credential access blocks the HTTP call', async () => {
  const secret = opaqueFixture();
  let active = true;
  let posts = 0;
  const create = harness(() => { posts += 1; });
  const result = await capture(() => create(payload(), undefined, options({ isActive: () => active,
    readCredentials: () => { active = false; return { login_password: secret }; }
  })));
  fixedError(result, secret);
  assert.ok(posts === 0, 'A scope invalidated during access must not be posted');
});

test('the key path stays exclusive and never reads a password provider', async () => {
  const key = opaqueFixture();
  let reads = 0;
  let recorded;
  const create = harness((_, config) => { recorded = config; return { bean: { service_alias: 'vm-a' } }; });
  const result = await capture(() => create(payload({ login_method: 'ssh_key', ssh_public_key: key }), undefined,
    options({ readCredentials: () => { reads += 1; return {}; } })));
  assert.ok(result.returned && reads === 0, 'Key creation must preserve the existing path without reading a password');
  assert.ok(recorded?.data.ssh_public_key === key, 'The key path must preserve its supplied field');
  assert.ok(recorded?.data.login_method === 'ssh_key', 'The explicit key method must be transmitted');
  assert.ok(!Object.hasOwn(recorded.data, 'login_password'), 'The key path must exclude password data');
});

test('unknown login methods fail safely without creating a VM', async () => {
  let posts = 0;
  const create = harness(() => { posts += 1; });
  fixedError(await capture(() => create(payload({ login_method: 'unknown' }), undefined, options())));
  assert.ok(posts === 0, 'Unknown login methods must not create a VM');
});

test('ordinary legacy media remains unchanged without login metadata', async () => {
  let posts = 0;
  let recorded;
  const create = harness((_, config) => { posts += 1; recorded = config; });
  const ordinary = await capture(() => create({ team_name: 'team-a', source_type: 'upload', format: 'iso' }));
  assert.ok(ordinary.returned && posts === 1, 'Ordinary legacy media must keep the existing request path');
  assert.ok(!Object.hasOwn(recorded.data, 'login_method') && !Object.hasOwn(recorded.data, 'login_password'),
    'Ordinary legacy creation must not inherit example credentials');
});
