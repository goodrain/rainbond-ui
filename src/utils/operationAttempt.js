const ATTEMPT_PREFIX = 'rainbond_operation_attempt';

function getStorage() {
  try {
    return typeof window !== 'undefined' && window.sessionStorage ? window.sessionStorage : null;
  } catch (error) {
    return null;
  }
}

function getIdentifier(payload = {}) {
  return payload.service_alias || payload.app_alias || payload.k8s_component_name || payload.service_cname || '';
}

function getKey(type, values) {
  return `${ATTEMPT_PREFIX}:${type}:${values.join(':')}`;
}

function readAttempt(key) {
  const storage = getStorage();
  if (!storage || !key) return null;
  try {
    return storage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeAttempt(key, attemptId) {
  const storage = getStorage();
  if (!storage || !key || !attemptId) return;
  try {
    storage.setItem(key, attemptId);
  } catch (error) {}
}

function removeAttempt(key) {
  const storage = getStorage();
  if (!storage || !key) return;
  try {
    storage.removeItem(key);
  } catch (error) {}
}

export function createAttemptId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') return '';
  const values = new Uint8Array(16);
  crypto.getRandomValues(values);
  values[6] = (values[6] & 0x0f) | 0x40;
  values[8] = (values[8] & 0x3f) | 0x80;
  const hex = Array.from(values, value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createRequestTelemetryOptions(attemptId) {
  return attemptId ? { returnErrorMetadata: true, attemptId } : { returnErrorMetadata: true };
}

export function buildAttemptHeaders(attemptId) {
  return attemptId ? { 'X-Rainbond-Attempt-Id': attemptId } : undefined;
}

export function getServiceAttempt(payload = {}) {
  const identifier = getIdentifier(payload);
  return identifier ? readAttempt(getKey('service', [payload.team_name || '', identifier])) : null;
}

export function startServiceAttempt(payload = {}) {
  const identifier = getIdentifier(payload);
  if (!identifier) return createAttemptId();
  const attemptId = createAttemptId();
  writeAttempt(getKey('service', [payload.team_name || '', identifier]), attemptId);
  return attemptId;
}

export function bindServiceAttempt(payload = {}, attemptId, previousPayload = {}) {
  const identifier = getIdentifier(payload);
  const previousIdentifier = getIdentifier(previousPayload);
  const teamName = payload.team_name || previousPayload.team_name || '';
  if (previousIdentifier && previousIdentifier !== identifier) {
    removeAttempt(getKey('service', [teamName, previousIdentifier]));
  }
  if (identifier) writeAttempt(getKey('service', [teamName, identifier]), attemptId);
}

export function clearServiceAttempt(payload = {}) {
  const identifier = getIdentifier(payload);
  if (identifier) removeAttempt(getKey('service', [payload.team_name || '', identifier]));
}

export function getComposeAttempt(payload = {}) {
  if (!payload.group_id || !payload.compose_id) return null;
  return readAttempt(getKey('compose', [payload.team_name || '', payload.group_id, payload.compose_id]));
}

export function startComposeAttempt(payload = {}) {
  const attemptId = createAttemptId();
  if (payload.group_id && payload.compose_id) {
    writeAttempt(getKey('compose', [payload.team_name || '', payload.group_id, payload.compose_id]), attemptId);
  }
  return attemptId;
}

export function bindComposeAttempt(payload = {}, attemptId) {
  if (payload.group_id && payload.compose_id) {
    writeAttempt(getKey('compose', [payload.team_name || '', payload.group_id, payload.compose_id]), attemptId);
  }
}

export function clearComposeAttempt(payload = {}) {
  if (payload.group_id && payload.compose_id) {
    removeAttempt(getKey('compose', [payload.team_name || '', payload.group_id, payload.compose_id]));
  }
}

export function getDeployType(payload = {}) {
  const value = String(payload.deploy_type || payload.service_source || payload.source_type || payload.image_type || payload.install_type || '').toLowerCase();
  const aliases = {
    source: 'source_code',
    source_code: 'source_code',
    code: 'source_code',
    market: 'app_market',
    app_market: 'app_market',
    docker_image: 'image',
    docker_run: 'image',
    image: 'image',
    database: 'database',
    kubeblocks: 'database',
    kubeblocks_component: 'database',
    vm: 'virtual_machine',
    vm_run: 'virtual_machine',
    virtual_machine: 'virtual_machine',
    package_build: 'source_code',
    third_party: 'image',
    k8s: 'k8s_resource',
    k8s_resource: 'k8s_resource',
    yaml: 'yaml',
    helm: 'helm',
    docker_compose: 'docker_compose',
    compose: 'docker_compose'
  };
  return aliases[value] || 'image';
}
