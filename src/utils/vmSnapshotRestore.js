const { validSnapshotName, snapshotReadError } = require('./vmSnapshotRead');
const { validRequestId } = require('./vmSnapshotCreate');

function invalid() { throw new Error('Invalid VM snapshot restore request or result'); }

function validateVMRestore(value) {
  if (!value || typeof value !== 'object' || !validSnapshotName(value.snapshot_name) ||
      !validRequestId(value.request_id)) invalid();
  return { snapshot_name: value.snapshot_name, request_id: value.request_id };
}

function newVMRestoreRequestId() {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.getRandomValues) invalid();
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  return `restore-${Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')}`;
}

function vmRestoreAttemptKey(context, actorId) {
  if (!Number.isInteger(actorId) || actorId < 1 || !context ||
      ['team', 'region', 'application', 'alias', 'serviceId'].some(key => !String(context[key] || ''))) return '';
  return `vm-snapshot-restore:v1:${JSON.stringify([actorId, context.team, context.region,
    String(context.application), context.alias, context.serviceId])}`;
}

function loadVMRestoreAttempt(storage, key) {
  if (!storage || !key) invalid();
  const raw = storage.getItem(key);
  if (raw === null) return null;
  if (typeof raw !== 'string' || raw.length > 2048) invalid();
  return validateVMRestore(JSON.parse(raw));
}

function saveVMRestoreAttempt(storage, key, input) {
  const value = validateVMRestore(input);
  const previous = loadVMRestoreAttempt(storage, key);
  if (previous && JSON.stringify(previous) !== JSON.stringify(value)) invalid();
  storage.setItem(key, JSON.stringify(value));
  if (JSON.stringify(loadVMRestoreAttempt(storage, key)) !== JSON.stringify(value)) invalid();
  return value;
}

function clearVMRestoreAttempt(storage, key) {
  if (!storage || !key) invalid();
  storage.removeItem(key);
}

function readVMRestore(response, submitted, accepted) {
  const input = validateVMRestore(submitted);
  const status = accepted ? 202 : 200;
  const value = response && response.bean;
  if (Number(response?.status_code) !== status || Number(response?.business_code) !== status ||
      !value || typeof value !== 'object' || Array.isArray(value) ||
      value.snapshot_name !== input.snapshot_name || value.request_id !== input.request_id ||
      typeof value.restore_name !== 'string' || !/^vmr-[a-f0-9]{24}$/.test(value.restore_name) ||
      !['pending', 'succeeded', 'failed'].includes(value.phase) || typeof value.complete !== 'boolean' ||
      value.complete !== (value.phase === 'succeeded') || !Array.isArray(value.volumes)) invalid();
  if (value.error_code !== undefined && value.error_code !== 'vm_restore_native_failed') invalid();
  const hasAdvance = Object.hasOwn(value, 'requires_advance');
  if (hasAdvance && (typeof value.requires_advance !== 'boolean' ||
      (value.requires_advance && (value.phase !== 'pending' || value.complete)))) invalid();
  return { restore_name: value.restore_name, snapshot_name: value.snapshot_name, request_id: value.request_id,
    phase: value.phase, complete: value.complete, ...(value.error_code ? { error_code: value.error_code } : {}),
    ...(hasAdvance ? { requires_advance: value.requires_advance } : {}),
    volumes: value.volumes.map(volume => {
      if (!volume || typeof volume !== 'object' || ['volume_name', 'pvc_name', 'volume_snapshot_name']
        .some(key => typeof volume[key] !== 'string' || !volume[key])) invalid();
      return { volume_name: volume.volume_name, pvc_name: volume.pvc_name,
        volume_snapshot_name: volume.volume_snapshot_name };
    }) };
}

function vmRestoreError(error) {
  const safe = snapshotReadError(error);
  return { kind: safe.kind, status: safe.status, code: safe.code || '', retryable: safe.retryable === true };
}

module.exports = { validateVMRestore, newVMRestoreRequestId, vmRestoreAttemptKey, loadVMRestoreAttempt,
  saveVMRestoreAttempt, clearVMRestoreAttempt, readVMRestore, vmRestoreError };
