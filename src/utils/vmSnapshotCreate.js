const { validSnapshotName, snapshotReadError } = require('./vmSnapshotRead');

function invalid() { throw new Error('Invalid snapshot Prepare request or result'); }
function validRequestId(value) { return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,62}$/.test(value); }
function validateSnapshotPrepare(value) {
  if (!value || typeof value !== 'object' || !validSnapshotName(value.name) || !validRequestId(value.request_id) ||
      !['previous', 'stopped'].includes(value.power_after)) invalid();
  const description = value.description === undefined ? '' : value.description;
  if (typeof description !== 'string' || encodeURIComponent(description).replace(/%[A-F\d]{2}/g, 'x').length > 2048) invalid();
  return { name: value.name, description, request_id: value.request_id, power_after: value.power_after };
}
function snapshotAttemptKey(context, actorId) {
  if (!Number.isInteger(actorId) || actorId < 1 || !context ||
      ['team', 'region', 'application', 'alias', 'serviceId'].some(key => !String(context[key] || ''))) return '';
  return `vm-snapshot-prepare:v1:${JSON.stringify([actorId, context.team, context.region, String(context.application), context.alias, context.serviceId])}`;
}
function loadSnapshotAttempt(storage, key) {
  if (!key || !storage) invalid();
  const raw = storage.getItem(key);
  if (raw === null) return null;
  if (typeof raw !== 'string' || raw.length > 16384) invalid();
  const value = validateSnapshotPrepare(JSON.parse(raw));
  return value;
}
function saveSnapshotAttempt(storage, key, input) {
  const value = validateSnapshotPrepare(input);
  const old = loadSnapshotAttempt(storage, key);
  if (old && JSON.stringify(old) !== JSON.stringify(value)) invalid();
  const record = value;
  storage.setItem(key, JSON.stringify(record));
  if (JSON.stringify(loadSnapshotAttempt(storage, key)) !== JSON.stringify(record)) invalid();
  return record;
}
function newSnapshotRequestId() {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.getRandomValues) invalid();
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  return `snapshot-${Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')}`;
}
function readSnapshotJob(response, submitted, accepted = false) {
  const input = validateSnapshotPrepare(submitted);
  const status = accepted ? 202 : 200;
  const value = response && response.bean;
  if (Number(response?.status_code) !== status || Number(response?.business_code) !== status ||
      !value || typeof value !== 'object' || Array.isArray(value) || value.kind !== 'snapshot' ||
      value.operation_id !== input.request_id || value.request_id !== input.request_id || typeof value.complete !== 'boolean') invalid();
  const phases = ['pending', 'prepared', 'region_committed', 'console_committed', 'runtime_verified',
    'rollback_pending', 'rolled_back', 'failed', 'cancelled'];
  if (!phases.includes(value.phase) || (value.complete && value.phase !== 'runtime_verified') || (accepted && value.complete)) invalid();
  const result = { operation_id: value.operation_id, request_id: value.request_id, kind: 'snapshot', phase: value.phase,
    complete: value.complete };
  for (const key of ['revision', 'retry_count', 'retry_at']) {
    if (!Number.isSafeInteger(value[key]) || value[key] < 0) invalid();
    result[key] = value[key];
  }
  if (typeof value.error_code !== 'string' || (value.error_code && !/^[A-Za-z][A-Za-z0-9_]{0,127}$/.test(value.error_code))) invalid();
  result.error_code = value.error_code;
  for (const key of ['fence_owned', 'fence_cleared']) {
    if (Object.hasOwn(value, key)) {
      if (typeof value[key] !== 'boolean') invalid();
      result[key] = value[key];
    }
  }
  if (result.complete && result.fence_owned === true) invalid();
  if (value.observation !== undefined) {
    const observed = value.observation;
    if (!observed || observed.snapshot_name !== input.name || !validSnapshotName(observed.snapshot_name) ||
        typeof observed.phase !== 'string' || !/^[a-z][a-z0-9_-]{0,63}$/.test(observed.phase) ||
        typeof observed.error_code !== 'string' || observed.error_code.length > 128) invalid();
    result.observation = { snapshot_name: observed.snapshot_name, phase: observed.phase, error_code: observed.error_code };
    for (const key of ['ready_to_use', 'manifest_acked', 'finalized']) {
      if (typeof observed[key] !== 'boolean') invalid();
      result.observation[key] = observed[key];
    }
  }
  return result;
}
function readSnapshotEnqueue(response, submitted) {
  const job = readSnapshotJob(response, submitted, true);
  return { request_id: job.request_id, state: 'accepted', complete: false, job };
}
function snapshotPrepareError(error) {
  const status = snapshotReadError(error).status;
  const body = error?.response?.data || error?.response_data || error || {};
  const code = (body.data?.bean || body.bean || {}).error?.code;
  const workerUnavailable = status === 503 && code === 'vm_snapshot_worker_unavailable';
  return { kind: [400, 401, 403, 404, 422].includes(status) || workerUnavailable ? 'rejected' : 'unknown',
    status, code: workerUnavailable ? code : '', retryable: false };
}
module.exports = { validRequestId, validateSnapshotPrepare, snapshotAttemptKey, loadSnapshotAttempt, saveSnapshotAttempt,
  newSnapshotRequestId, readSnapshotEnqueue, readSnapshotJob, snapshotPrepareError };
