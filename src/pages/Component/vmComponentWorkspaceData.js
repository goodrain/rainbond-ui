const POWER_STATUSES = new Set([
  'running', 'closed', 'stopped', 'paused', 'waiting', 'starting', 'stopping',
  'restoring', 'failure', 'failed', 'unusual', 'abnormal', 'deployed',
  'undeploy', 'building', 'build_fail', 'incomplete', 'scheduling', 'pending'
]);

function record(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function text(value, limit = 256) {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(value)) return null;
  const result = value.trim();
  return result ? result.slice(0, limit) : null;
}

function identifier(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value);
  return text(value, 128);
}

function nonnegativeNumber(value) {
  if (typeof value === 'string') {
    const input = value.trim();
    if (!/^\d+(?:\.\d+)?$/.test(input)) return null;
    value = Number(input);
  }
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value === 0 ? 0 : value : null;
}

function statusValue(value) {
  const status = typeof value === 'string' ? value : record(value).status;
  return text(status, 64);
}

function vncURL(value) {
  // Keep the supplied console URL intact, including its encoded subresource
  // path. Do not derive a host, credentials or connection URL from other data.
  if (typeof value !== 'string' || value.length > 8192 || value !== value.trim() ||
    /[\u0000-\u0020\u007f-\u009f]/.test(value) || !/^https?:\/\//i.test(value)) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname && !url.username && !url.password
      ? value : null;
  } catch (_) {
    return null;
  }
}

function rootDiskCapacity(disks, { id, serviceId, diskAlias }) {
  if (!Array.isArray(disks)) return null;
  for (const input of disks) {
    const disk = record(input);
    const itemServiceId = identifier(disk.service_id);
    // appControl.vmDisks can still contain a previous component's result.
    // Trust an explicit batch alias, or an item tied to this service ID.
    const scoped = diskAlias !== null
      ? !!id && diskAlias === id && (!itemServiceId || !serviceId || itemServiceId === serviceId)
      : !!serviceId && itemServiceId === serviceId;
    if (!scoped || disk.source_kind === 'installer_media' || disk.disk_role === 'installer' || disk.device_type === 'cdrom') continue;
    const isRoot = disk.disk_role === 'root' ||
      (!disk.disk_role && (disk.disk_key === 'disk' || disk.volume_name === 'disk'));
    if (!isRoot) continue;
    const capacity = nonnegativeNumber(disk.volume_capacity);
    if (capacity !== null) return capacity;
  }
  return null;
}

function references(value) {
  if (!Array.isArray(value)) return null;
  return value.slice(0, 200).reduce((result, input) => {
    const reference = record(input);
    const id = identifier(reference.service_alias) || identifier(reference.service_id);
    const name = text(reference.display_name) || text(reference.service_cname) || text(reference.service_alias);
    if (!id && !name) return result;
    result.push({
      id,
      name,
      groupId: identifier(reference.group_id),
      region: text(reference.region_name, 128)
    });
    return result;
  }, []);
}

function deriveVmWorkspaceData(input = {}) {
  const options = record(input);
  const detail = record(options.appDetail);
  const service = record(detail.service);
  const profile = record(options.vmProfile === undefined ? detail.vm_profile : options.vmProfile);
  const asset = record(profile.asset);
  const runtime = record(profile.runtime);
  const connections = record(profile.connections);
  const id = identifier(service.service_alias) || identifier(service.k8s_component_name);
  const serviceId = identifier(service.service_id);
  const cpuMillicores = nonnegativeNumber(service.min_cpu);
  const memoryMB = nonnegativeNumber(service.min_memory);
  const volumeCapacity = rootDiskCapacity(options.vmDisks, {
    id, serviceId, diskAlias: identifier(options.vmDisksServiceAlias)
  });
  const statusSource = [options.status, options.appStatus, profile.runtime_status, detail.status, service.status]
    .find(value => value !== undefined && value !== null);
  // An explicitly unknown/malformed current status must not be replaced with
  // an older profile's running state while the current read is unresolved.
  const rawPowerStatus = statusValue(statusSource);
  const normalizedStatus = rawPowerStatus && rawPowerStatus.toLowerCase();
  const count = nonnegativeNumber(asset.reference_count);
  const displayAsset = {
    name: text(asset.name),
    displayName: text(asset.display_name),
    sourceType: text(asset.source_type, 64),
    format: text(asset.format, 32) || text(runtime.boot_source_format, 32),
    bootMode: text(asset.boot_mode, 32)
  };
  return {
    id,
    name: text(service.service_cname),
    arch: text(service.arch, 32) || text(asset.arch, 32),
    cpuCores: cpuMillicores === null ? null : cpuMillicores / 1000,
    memoryGiB: memoryMB === null ? null : memoryMB / 1024,
    rootDiskGiB: volumeCapacity === null ? nonnegativeNumber(service.disk_cap) : volumeCapacity,
    powerStatus: POWER_STATUSES.has(normalizedStatus) ? normalizedStatus : 'unknown',
    rawPowerStatus,
    osName: text(runtime.os_name, 128) || text(asset.os_name, 128),
    // The current Console profile has service runtime status, but no guest OS
    // readiness or Guest Agent connection fields. Running is not guest-ready.
    guestStatus: null,
    agentConnected: null,
    vncUrl: vncURL(connections.vnc_url),
    referenceCount: count !== null && Number.isSafeInteger(count) ? count : null,
    references: references(asset.references),
    asset: Object.values(displayAsset).some(value => value !== null) ? displayAsset : null,
    snapshotCapability: 'unknown'
  };
}

module.exports = {
  deriveVmWorkspaceData,
  buildVmComponentWorkspaceData: deriveVmWorkspaceData
};
