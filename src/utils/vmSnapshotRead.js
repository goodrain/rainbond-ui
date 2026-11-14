const SNAPSHOT_NAME = /^[a-z0-9](?:[-a-z0-9]*[a-z0-9])?(?:\.[a-z0-9](?:[-a-z0-9]*[a-z0-9])?)*$/;
const ERROR_CODES = new Set(['vm_snapshot_invalid_request', 'vm_snapshot_forbidden', 'vm_snapshot_not_found',
  'vm_restore_busy', 'vm_restore_conflict', 'vm_snapshot_pending', 'vm_snapshot_config_unsupported',
  'vm_snapshot_storage_unsupported', 'vm_snapshot_incomplete', 'vm_snapshot_unsupported',
  'vm_snapshot_dependency_unavailable', 'vm_snapshot_read_failed']);
const ITEM_ERRORS = new Set(['vm_snapshot_native_failed', 'vm_snapshot_cleanup_outcome_pending',
  'vm_snapshot_create_outcome_pending', 'vm_snapshot_delete_outcome_pending',
  'vm_snapshot_halt_outcome_pending', 'vm_snapshot_resume_outcome_pending',
  'vm_snapshot_identity_pending', 'vm_snapshot_identity_outcome_unknown']);

function validSnapshotName(value) {
  return typeof value === 'string' && value.length <= 253 && SNAPSHOT_NAME.test(value);
}
function snapshotContextKey(context = {}) {
  return JSON.stringify(['team', 'region', 'application', 'alias', 'serviceId'].map(key => String(context[key] || '')));
}
function snapshotReadError(value = {}) {
  const body = value?.response?.data || value?.response_data || value || {};
  const bean = body.data?.bean || body.bean || value?.bean || {};
  const status = Number(value?.response?.status || value?.status_code || value?._code || value?.status || 0);
  const business = Number(value?.business_code || body.code || 0);
  const effectiveStatus = status === 200 && business >= 400 ? business : status;
  const code = ERROR_CODES.has(bean.error?.code) ? bean.error.code : '';
  const kind = ({ 401: 'forbidden', 403: 'forbidden', 404: 'notFound', 422: 'unsupported', 409: 'conflict' })[effectiveStatus] || 'failed';
  return { kind, status: effectiveStatus, code,
    retryable: typeof bean.error?.retryable === 'boolean' ? bean.error.retryable
      : (!effectiveStatus || effectiveStatus >= 500) };
}
function invalidSnapshotResponse() {
  throw new Error('Invalid snapshot read response');
}
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalidSnapshotResponse();
  return value;
}
function fields(value, specification) {
  object(value);
  return Object.fromEntries(Object.entries(specification).map(([key, type]) => {
    const item = value[key];
    if (typeof item !== type || (type === 'number' && (!Number.isSafeInteger(item) || item < 0)) ||
        (type === 'string' && item.length > 2048)) invalidSnapshotResponse();
    return [key, item];
  }));
}
function strings(value) {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || item.length > 253)) invalidSnapshotResponse();
  return value.slice();
}
function projectSnapshot(value) {
  const item = fields(value, { snapshot_name: 'string', description: 'string', phase: 'string',
    ready_to_use: 'boolean', consistency: 'string', manifest_acked: 'boolean', finalized: 'boolean',
    cancelled: 'boolean', deleted: 'boolean' });
  if (!validSnapshotName(item.snapshot_name) || !/^[a-z][a-z0-9_-]{0,63}$/.test(item.phase) || item.consistency !== 'offline') invalidSnapshotResponse();
  item.coverage = fields(value.coverage, { complete: 'boolean', expected_writable_disks: 'number', included_disks: 'number' });
  item.coverage.missing_disk_keys = strings(value.coverage.missing_disk_keys);
  item.coverage.excluded_read_only = strings(value.coverage.excluded_read_only);
  if (value.creation_time !== undefined) Object.assign(item, fields(value, { creation_time: 'string' }));
  if (Object.prototype.hasOwnProperty.call(value, 'error_code')) {
    if (typeof value.error_code !== 'string' || (value.error_code && !ITEM_ERRORS.has(value.error_code))) invalidSnapshotResponse();
    if (value.error_code) item.error_code = value.error_code;
    if (['vm_snapshot_identity_pending', 'vm_snapshot_identity_outcome_unknown'].includes(value.error_code) && item.ready_to_use) invalidSnapshotResponse();
  }
  if (!Array.isArray(value.disks)) invalidSnapshotResponse();
  item.disks = value.disks.map(disk => fields(disk, { volume_id: 'number', disk_key: 'string', role: 'string',
    read_only: 'boolean', storage_class: 'string', requested_bytes: 'number' }));
  if (value.config !== undefined) {
    item.config = fields(value.config, { cpu_milli: 'number', memory_mib: 'number', boot_mode: 'string' });
    if (!Array.isArray(value.config.disk_layout)) invalidSnapshotResponse();
    item.config.disk_layout = value.config.disk_layout.map(disk => fields(disk, { volume_id: 'number',
      role: 'string', device: 'string', bus: 'string', boot_order: 'number', read_only: 'boolean' }));
  }
  return item;
}
function readBean(response) {
  if (Number(response?.status_code) !== 200 || Number(response?.business_code) !== 200) invalidSnapshotResponse();
  const bean = object(response.bean);
  if (Object.prototype.hasOwnProperty.call(bean, 'error')) invalidSnapshotResponse();
  return bean;
}
function readSnapshotList(response, expected = {}) {
  const bean = readBean(response);
  const result = fields(bean, { page: 'number', page_size: 'number', total: 'number' });
  if (!result.page || !result.page_size || result.page_size > 100 || !Array.isArray(bean.items) ||
      bean.items.length > result.page_size || bean.items.length > result.total ||
      (expected.page !== undefined && result.page !== expected.page) ||
      (expected.page_size !== undefined && result.page_size !== expected.page_size)) invalidSnapshotResponse();
  result.items = bean.items.map(projectSnapshot);
  if (new Set(result.items.map(item => item.snapshot_name)).size !== result.items.length) invalidSnapshotResponse();
  return result;
}
function readSnapshotDetail(response, expected = {}) {
  const result = projectSnapshot(readBean(response));
  if (expected.snapshot_name && result.snapshot_name !== expected.snapshot_name) invalidSnapshotResponse();
  return result;
}
module.exports = { validSnapshotName, snapshotContextKey, snapshotReadError, readSnapshotList, readSnapshotDetail };
