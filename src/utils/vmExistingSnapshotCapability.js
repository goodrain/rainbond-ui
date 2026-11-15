function invalid() { throw new Error('Invalid current VM capability response'); }
function object(value) { if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(); return value; }
function text(value, max = 1024) {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u001f\u007f-\u009f]/.test(value)) invalid();
  return value;
}
function decision(input) {
  const value = object(input);
  if (typeof value.supported !== 'boolean' || !['supported', 'unsupported', 'unknown'].includes(value.status) ||
      value.supported !== (value.status === 'supported')) invalid();
  const reason_code = text(value.reason_code, 128);
  if (!/^[a-z][a-z0-9_]{0,127}$/.test(reason_code)) invalid();
  return { supported: value.supported, status: value.status, reason_code, message: text(value.message) };
}
function readExistingSnapshotCapability(response) {
  if (Number(response?.status_code) !== 200 || Number(response?.business_code) !== 200) invalid();
  const value = object(response.bean);
  const result = decision(value);
  if (value.operation !== 'create_snapshot' || typeof value.complete !== 'boolean' ||
      !Array.isArray(value.volumes) || !Array.isArray(value.excluded_volumes) ||
      value.volumes.length > 256 || value.excluded_volumes.length > 256) invalid();
  result.operation = 'create_snapshot'; result.complete = value.complete;
  result.volumes = value.volumes.map(input => {
    const row = decision(input);
    row.key = text(input.key, 253);
    if (!row.key || typeof input.read_only !== 'boolean') invalid();
    row.read_only = input.read_only;
    for (const key of ['disk_key', 'role', 'storage_class']) if (Object.hasOwn(input, key)) row[key] = text(input[key], 253);
    return row;
  });
  result.excluded_volumes = value.excluded_volumes.map(input => {
    const row = object(input);
    return { key: text(row.key, 253), role: text(row.role, 253), reason_code: text(row.reason_code, 253) };
  });
  if (result.supported && (!result.complete || !result.volumes.length || result.volumes.some(row => !row.supported))) invalid();
  return result;
}
module.exports = { readExistingSnapshotCapability };
