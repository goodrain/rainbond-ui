const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function helpers() {
  const file = path.join(__dirname, 'vmLoginCredentials.js');
  assert.ok(fs.existsSync(file), 'VM login credential helpers must be implemented');
  return require(file);
}

function capture(callback) {
  try { return { returned: true, value: callback() }; }
  catch (error) { return { returned: false, error }; }
}

function opaqueFixture() {
  return ['opaque', process.pid, Math.random().toString(36).slice(2), 'test-only'].join(':');
}

function passwordError(h, value) {
  const result = capture(() => h.getVmLoginPasswordError(value));
  assert.ok(result.returned, 'Password validation must return a safe result without throwing input');
  return result.value;
}

function fixedError(result, marker) {
  assert.ok(!result.returned && Boolean(result.error), 'The invalid operation must be rejected');
  assert.ok(result.error.name === 'VmLoginCredentialsUnavailable', 'Credential errors must use a fixed name');
  assert.ok(result.error.message === 'VM login credentials are unavailable', 'Credential errors must use a fixed message');
  assert.ok(!Object.hasOwn(result.error, 'cause'), 'Credential errors must not retain the original cause');
  if (marker) assert.ok(!String(result.error.stack || '').includes(marker), 'Credential errors must exclude input from stacks');
}

test('password capability requires a strict Go boolean and explicit Console login methods', () => {
  const h = helpers();
  for (const input of [undefined, null, {}, { login_methods: ['ssh_key', 'password'] },
    { password_bootstrap_supported: false, login_methods: ['ssh_key', 'password'] },
    { password_bootstrap_supported: 'true', login_methods: ['ssh_key', 'password'] },
    { password_bootstrap_supported: 1, login_methods: ['ssh_key', 'password'] }]) {
    assert.ok(h.supportsVmPasswordBootstrap(input) === false, 'Missing or malformed support must keep the key path');
  }
  assert.ok(h.supportsVmPasswordBootstrap({ password_bootstrap_supported: true, login_methods: ['ssh_key', 'password'] }) === true,
    'Both backend layers must explicitly support the password path');
});

test('a Go-only boolean forwarded by an old Console cannot enable password bootstrap', () => {
  const h = helpers();
  assert.ok(h.supportsVmPasswordBootstrap({ password_bootstrap_supported: true }) === false,
    'An old Console passthrough must not advertise password support');
});

test('malformed or non-password Console methods cannot enable password bootstrap', () => {
  const h = helpers();
  for (const methods of [undefined, null, 'password', {}, [], ['ssh_key'], ['Password'], [true]]) {
    assert.ok(h.supportsVmPasswordBootstrap({ password_bootstrap_supported: true, login_methods: methods }) === false,
      'The Console must declare password in an actual methods array');
  }
});

test('login method preserves the legacy key default and rejects unknown methods', () => {
  const h = helpers();
  assert.ok(h.getVmLoginMethod(undefined) === 'ssh_key', 'Legacy callers must default to the key method');
  assert.ok(h.getVmLoginMethod('ssh_key') === 'ssh_key', 'The explicit key method must be recognized');
  assert.ok(h.getVmLoginMethod('password') === 'password', 'The explicit password method must be recognized');
  for (const value of [null, '', false, 'unknown']) {
    assert.ok(h.getVmLoginMethod(value) === null, 'Unknown login methods must be rejected');
  }
});

test('password validation counts Unicode code points at both length boundaries', () => {
  const h = helpers();
  const codePoint = String.fromCodePoint(0x1f642);
  for (const length of [12, 128]) {
    assert.ok(passwordError(h, codePoint.repeat(length)) === '', 'Valid code-point boundaries must be accepted');
  }
  for (const length of [11, 129]) {
    assert.ok(Boolean(passwordError(h, codePoint.repeat(length))), 'Values outside the code-point boundaries must be rejected');
  }
});

test('password validation preserves meaningful surrounding spaces and never normalizes input', () => {
  const h = helpers();
  const value = `  ${opaqueFixture()}  `;
  const original = value;
  assert.ok(passwordError(h, value) === '', 'A valid value with surrounding spaces must be accepted');
  assert.ok(value === original, 'Validation must preserve the supplied value');
});

test('missing, all-whitespace and control-character passwords are rejected', () => {
  const h = helpers();
  for (const value of [undefined, null, '', 12, ' '.repeat(12), '\u00a0'.repeat(12), '\u3000'.repeat(12)]) {
    assert.ok(Boolean(passwordError(h, value)), 'Missing or all-whitespace input must be rejected');
  }
  const marker = opaqueFixture();
  for (const code of [0, 9, 10, 13, 31, 127, 133, 159, 0x2028, 0x2029]) {
    assert.ok(Boolean(passwordError(h, marker + String.fromCodePoint(code))),
      'Control characters and line separators must be rejected');
  }
});

test('password whitespace handling matches the fixed Python contract', () => {
  const h = helpers();
  for (const code of [0x20, 0xa0, 0x1680, 0x2000, 0x200a, 0x202f, 0x205f, 0x3000]) {
    assert.ok(Boolean(passwordError(h, String.fromCodePoint(code).repeat(12))),
      'Python whitespace-only input must be rejected');
  }
  assert.ok(passwordError(h, String.fromCodePoint(0xfeff).repeat(12)) === '',
    'Non-whitespace format characters must not be silently trimmed by the UI');
});

test('password usernames reject root while preserving ordinary valid Linux usernames', () => {
  const h = helpers();
  assert.ok(Boolean(h.getVmPasswordUsernameError('root')), 'Password initialization must reject root');
  assert.ok(Boolean(h.getVmPasswordUsernameError(' root ')), 'Normalized root must remain rejected');
  for (const value of ['ubuntu', 'operator_1', ' vm-user ']) {
    assert.ok(h.getVmPasswordUsernameError(value) === '', 'Valid non-root usernames must remain accepted');
  }
  for (const value of ['', undefined, 'invalid user', 'UpperCase']) {
    assert.ok(Boolean(h.getVmPasswordUsernameError(value)), 'Malformed usernames must be rejected');
  }
});

test('password and hash properties are rejected before a payload can enter an action', () => {
  const h = helpers();
  const marker = opaqueFixture();
  for (const name of ['login_password', 'vm_login_password', 'login_password_hash', 'vm_login_password_hash']) {
    fixedError(capture(() => h.assertNoVmPasswordPayload({ group_id: 868, [name]: marker })), marker);
    fixedError(capture(() => h.assertNoVmPasswordPayload({ [name]: undefined })));
  }
  const safe = { group_id: 868, login_method: 'password', ssh_username: 'ubuntu' };
  assert.ok(h.assertNoVmPasswordPayload(safe) === safe, 'Safe metadata must remain usable without copying credentials');
});

test('cleanup resets a registered password even when the key control is absent', () => {
  const h = helpers();
  const marker = opaqueFixture();
  const values = { ssh_username: 'ubuntu', login_password: marker, image_name: 'kept-image' };
  let resets = [];
  const cleared = capture(() => h.clearRegisteredVmLoginFields({
    getFieldsValue: () => ({ ...values }),
    getFieldInstance: () => undefined,
    resetFields: fields => { resets = fields; fields.forEach(name => delete values[name]); }
  }));
  assert.ok(cleared.returned, 'Credential cleanup must not throw an input-bearing exception');
  assert.ok(resets.includes('login_password'), 'Cleanup must include a password without requiring a key control');
  assert.ok(!Object.hasOwn(values, 'login_password'), 'Cleanup must remove the password value');
  assert.ok(values.image_name === 'kept-image', 'Credential cleanup must preserve unrelated source fields');
});

test('group normalization permits resolved IDs and rejects unresolved or unsafe values', () => {
  const h = helpers();
  for (const value of [868, '868']) assert.ok(h.normalizeVmLoginGroupId(value) === '868', 'Resolved group IDs must be normalized');
  for (const value of [undefined, null, '', 0, -1, '0', '0868', 'wrong', 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.ok(h.normalizeVmLoginGroupId(value) === '', 'Unresolved or unsafe group IDs must be rejected');
  }
});

test('binding credential options resolves an app without reading credentials', () => {
  const h = helpers();
  let binds = 0;
  let reads = 0;
  const reader = () => { reads += 1; return {}; };
  const result = h.resolveVmPasswordReaderOptions({ passwordBootstrapSupported: true,
    bindReadCredentials: id => { binds += 1; assert.ok(id === '868', 'The binder must receive the resolved group'); return reader; }
  }, 868);
  assert.ok(binds === 1 && reads === 0, 'Resolving safe options must not read a credential');
  assert.ok(result.boundGroupId === '868' && result.readCredentials === reader, 'The resolved provider must retain its application binding');
  assert.ok(!Object.hasOwn(result, 'login_password'), 'Resolved options must not contain a password property');
});

test('a bound provider cannot be reused for another application', () => {
  const h = helpers();
  let reads = 0;
  const options = { passwordBootstrapSupported: true, boundGroupId: '868', readCredentials: () => { reads += 1; } };
  const result = h.resolveVmPasswordReaderOptions(options, '868');
  assert.ok(result.readCredentials === options.readCredentials, 'A matching binding must retain the provider');
  fixedError(capture(() => h.resolveVmPasswordReaderOptions(options, '869')));
  assert.ok(reads === 0, 'A group mismatch must fail without reading a credential');
});

test('binding rejects unknown groups and missing support before invoking a factory', () => {
  const h = helpers();
  let binds = 0;
  const bindReadCredentials = () => { binds += 1; return () => ({}); };
  fixedError(capture(() => h.resolveVmPasswordReaderOptions({ passwordBootstrapSupported: true, bindReadCredentials }, undefined)));
  fixedError(capture(() => h.resolveVmPasswordReaderOptions({ passwordBootstrapSupported: false, bindReadCredentials }, 868)));
  assert.ok(binds === 0, 'Invalid group or support must fail before provider creation');
});

test('a binder exception containing input is replaced with a fixed error', () => {
  const h = helpers();
  const marker = opaqueFixture();
  const result = capture(() => h.resolveVmPasswordReaderOptions({ passwordBootstrapSupported: true,
    bindReadCredentials: () => { throw new Error(marker); }
  }, 868));
  fixedError(result, marker);
});
