const VM_LOGIN_METHODS = Object.freeze(['ssh_key', 'password']);
const VM_SENSITIVE_LOGIN_FIELDS = Object.freeze(['ssh_username', 'ssh_public_key', 'login_password']);
const FORBIDDEN_ACTION_FIELDS = Object.freeze(['login_password', 'vm_login_password', 'login_password_hash', 'vm_login_password_hash']);
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
// Match Python str.isspace/strip rather than treating U+FEFF as whitespace via JS trim.
const WHITESPACE_ONLY = /^[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+$/;

function supportsVmPasswordBootstrap(capabilities) {
  return !!capabilities && capabilities.password_bootstrap_supported === true &&
    Array.isArray(capabilities.login_methods) && capabilities.login_methods.includes('password');
}

function getVmLoginMethod(value) {
  return value === undefined ? 'ssh_key' : VM_LOGIN_METHODS.includes(value) ? value : null;
}

function getVmLoginPasswordError(value) {
  if (typeof value !== 'string' || value.length === 0) return 'loginPasswordRequired';
  const length = Array.from(value).length;
  if (length < 12 || length > 128 || CONTROL_CHARACTERS.test(value) || WHITESPACE_ONLY.test(value)) {
    return 'loginPasswordInvalid';
  }
  return '';
}

function getVmPasswordUsernameError(value) {
  if (typeof value !== 'string' || !/^[a-z_][a-z0-9_-]{0,31}$/.test(value.trim())) {
    return 'sshUsernameInvalid';
  }
  return value.trim() === 'root' ? 'loginPasswordRootUnsupported' : '';
}

function safeVmCredentialError() {
  const error = new Error('VM login credentials are unavailable');
  error.name = 'VmLoginCredentialsUnavailable';
  return error;
}

function assertNoVmPasswordPayload(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
      FORBIDDEN_ACTION_FIELDS.some(name => Object.prototype.hasOwnProperty.call(payload, name))) {
    throw safeVmCredentialError();
  }
  return payload;
}

function clearRegisteredVmLoginFields(form, names = VM_SENSITIVE_LOGIN_FIELDS) {
  if (!form) return;
  const registered = Object.keys(form.getFieldsValue());
  const fields = names.filter(name => registered.includes(name));
  if (fields.length) form.resetFields(fields);
}

function normalizeVmLoginGroupId(value) {
  if (typeof value === 'number' && (!Number.isSafeInteger(value) || value <= 0)) return '';
  const result = value === undefined || value === null ? '' : String(value);
  return /^[1-9]\d*$/.test(result) ? result : '';
}

function resolveVmPasswordReaderOptions(options = {}, groupId) {
  if (!options.readCredentials && !options.bindReadCredentials && options.passwordBootstrapSupported !== true) return {};
  try {
    const resolved = normalizeVmLoginGroupId(groupId);
    if (!resolved || options.passwordBootstrapSupported !== true) throw safeVmCredentialError();
    const reader = typeof options.bindReadCredentials === 'function'
      ? options.bindReadCredentials(resolved)
      : normalizeVmLoginGroupId(options.boundGroupId) === resolved ? options.readCredentials : null;
    if (typeof reader !== 'function') throw safeVmCredentialError();
    return { passwordBootstrapSupported: true, boundGroupId: resolved, readCredentials: reader };
  } catch (_) { throw safeVmCredentialError(); }
}

module.exports = {
  VM_LOGIN_METHODS, VM_SENSITIVE_LOGIN_FIELDS,
  supportsVmPasswordBootstrap, getVmLoginMethod,
  getVmLoginPasswordError, getVmPasswordUsernameError,
  safeVmCredentialError, assertNoVmPasswordPayload,
  clearRegisteredVmLoginFields, normalizeVmLoginGroupId, resolveVmPasswordReaderOptions
};
