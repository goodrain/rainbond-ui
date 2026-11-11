const { normalizeVmCreationStorageOptions } = require('./vmCreationStorage');
const { assertNoVmPasswordPayload, getVmLoginMethod, getVmPasswordUsernameError } = require('./vmLoginCredentials');

const UBUNTU_NOBLE_QCOW2_URL =
  'https://cloud-images.ubuntu.com/minimal/releases/noble/release/ubuntu-24.04-minimal-cloudimg-amd64.img';
const PUBLIC_KEY_TYPES = /^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp(?:256|384|521))$/;
const ADDITIONAL_PUBLIC_KEY = /(?:^| )(?:ssh-(?:rsa|ed25519|dss)|ecdsa-sha2-nistp(?:256|384|521)|sk-(?:ssh-ed25519|ecdsa-sha2-nistp256)@openssh\.com) +[A-Za-z0-9+/]+={0,2}(?: |$)/;
const ALIAS_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;
const SUPPORTED_VM_SOURCE_FORMATS = Object.freeze(['img', 'iso', 'qcow2', 'raw', 'tar.gz', 'tar.xz', 'gz', 'xz', 'tar']);
let imageNameSequence = 0;

function uniqueImageName(prefix) {
  imageNameSequence += 1;
  // Import names identify distinct assets. Keep the trusted image prefix, but
  // never reuse the catalog name or an untrusted caller's fixed asset name.
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `${prefix}-${timestamp}-${imageNameSequence.toString(36)}-${random}`;
}

function createQuickStartImageName() {
  return uniqueImageName('ubuntu-noble');
}

function createVmImageName() {
  return uniqueImageName('vm-image');
}

function inferVmSourceFormat(fileOrUrl) {
  if (typeof fileOrUrl !== 'string') return '';
  let path = fileOrUrl;
  try { path = new URL(fileOrUrl).pathname; } catch (_) { path = path.split(/[?#]/)[0]; }
  try { path = decodeURIComponent(path); } catch (_) { /* Keep an undecodable path unchanged. */ }
  // A filename can identify the inner media before a supported compression
  // suffix. This is only a source hint, never inspection of archive contents.
  const media = path.match(/\.(iso|qcow2|raw|img)(?:\.(?:gz|xz))?$/i);
  if (media) return media[1].toLowerCase();
  const archive = path.match(/\.(tar\.gz|tar\.xz|gz|xz|tar)$/i);
  return archive ? archive[1].toLowerCase() : '';
}

function normalizeVmSourceFormat(value) {
  if (typeof value !== 'string') return '';
  const format = value.trim().toLowerCase();
  return SUPPORTED_VM_SOURCE_FORMATS.includes(format) ? format : '';
}

function normalizeVmOperatingSystem(value) {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(value)) return null;
  const normalized = value.trim();
  return normalized && normalized.length <= 128 ? normalized : null;
}

function safeVmRuntimeFields(value = {}) {
  const fields = {};
  if (['bios', 'uefi'].includes(value.boot_mode)) fields.boot_mode = value.boot_mode;
  ['gpu_enabled', 'usb_enabled'].forEach(key => {
    if (typeof value[key] === 'boolean') fields[key] = value[key];
  });
  ['gpu_resources', 'usb_resources'].forEach(key => {
    if (Array.isArray(value[key])) fields[key] = value[key].filter(resource =>
      typeof resource === 'string' && resource.length <= 128 &&
      /^[A-Za-z0-9][A-Za-z0-9_.:/=-]*$/.test(resource) && !resource.includes('://')).slice(0, 64);
  });
  if (Number.isInteger(value.gpu_count) && value.gpu_count >= 0 && value.gpu_count <= 64)
    fields.gpu_count = value.gpu_count;
  return fields;
}

function isLinuxQcow2QuickStart(sourceType, url) {
  return sourceType === 'url' && typeof url === 'string' && url.trim() === UBUNTU_NOBLE_QCOW2_URL;
}

function getSshUsernameError(value) {
  if (typeof value !== 'string' || !value.trim()) return 'sshUsernameRequired';
  return /^[a-z_][a-z0-9_-]{0,31}$/.test(value.trim()) ? '' : 'sshUsernameInvalid';
}

function getSshPublicKeyError(value) {
  if (typeof value !== 'string' || !value.trim()) return 'sshPublicKeyRequired';
  // A copied .pub file commonly ends in a newline. Match Console's trim-first
  // contract; all controls remaining inside the single key are still invalid.
  const normalized = value.trim();
  if (normalized.length > 8192 || /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(normalized) ||
    /PRIVATE[ _-]+KEY|[-]{4,}\s*(?:BEGIN|END)\b|\b(?:BEGIN|END) +(?:(?:OPENSSH|SSH2|RSA|EC) +)?(?:PUBLIC|PRIVATE) +KEY\b/i.test(normalized))
    return 'sshPublicKeyInvalid';
  // Everything after the key blob is one optional, printable comment. Inspect
  // it explicitly: a second key or an armored header must not hide there.
  const match = normalized.match(/^(\S+) +([A-Za-z0-9+/]+={0,2})(?: +(.*))?$/);
  if (!match || !PUBLIC_KEY_TYPES.test(match[1]) || match[2].length % 4 === 1 ||
    (match[3] && ADDITIONAL_PUBLIC_KEY.test(match[3])))
    return 'sshPublicKeyInvalid';
  try {
    // A public key starts with a length-prefixed SSH algorithm name. Checking
    // that prefix rejects arbitrary base64 without retaining its decoded data.
    const decoded = atob(match[2]);
    if (decoded.length < 5) return 'sshPublicKeyInvalid';
    const length = decoded.charCodeAt(0) * 16777216 + decoded.charCodeAt(1) * 65536 +
      decoded.charCodeAt(2) * 256 + decoded.charCodeAt(3);
    if (decoded.slice(4, 4 + length) !== match[1] || decoded.length <= 4 + length)
      return 'sshPublicKeyInvalid';
  } catch (_) {
    return 'sshPublicKeyInvalid';
  }
  return '';
}

function resourceValues(payload, resume) {
  const source = payload.resources || (resume && resume.resources) || { cpu: 4, memory: 8, disk: 80 };
  return { cpu: Number(source.cpu), memory: Number(source.memory), disk: Number(source.disk) };
}

function validResources(resources) {
  return [['cpu', 1, 64], ['memory', 1, 256], ['disk', 20, 2048]].every(([key, min, max]) =>
    Number.isInteger(resources[key]) && resources[key] >= min && resources[key] <= max);
}

function successful(response) {
  if (!response || typeof response !== 'object') return false;
  const status = Number(response.status_code || response._code);
  const businessCode = response.business_code === undefined ? response._condition : response.business_code;
  return status >= 200 && status < 300 &&
    (businessCode === undefined || Number(businessCode) === 200);
}

function storageChoices(response) {
  return normalizeVmCreationStorageOptions(response.list);
}

function snapshot(state, status) {
  return {
    ...(status ? { status } : {}),
    stage: state.stage,
    serviceAlias: state.serviceAlias,
    groupId: state.groupId,
    portConfigured: state.portConfigured,
    resourceConfigured: state.resourceConfigured,
    sshRequired: state.sshRequired,
    storageOptions: state.storageOptions.map(option => ({ value: option.value, label: option.label })),
    resources: { ...state.resources },
    error: state.error
  };
}

function ordinaryCreationPayload(payload) {
  if (!['url', 'upload', 'existing'].includes(payload.source_type) ||
    typeof payload.arch !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,31}$/.test(payload.arch) ||
    (payload.boot_mode && !['bios', 'uefi'].includes(payload.boot_mode))) return null;
  const creation = {
    team_name: payload.team_name,
    group_id: payload.group_id,
    service_cname: payload.service_cname,
    k8s_component_name: payload.k8s_component_name,
    source_type: payload.source_type,
    arch: payload.arch,
    sensitiveError: true,
    ...safeVmRuntimeFields(payload)
  };
  if (Object.prototype.hasOwnProperty.call(payload, 'os_name')) {
    const osName = normalizeVmOperatingSystem(payload.os_name);
    if (!osName) return null;
    creation.os_name = osName;
  }
  if (payload.source_type === 'url') {
    try {
      const url = new URL(payload.vm_url);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password || payload.event_id)
        return null;
    } catch (_) { return null; }
    creation.vm_url = payload.vm_url.trim();
    creation.image_name = createVmImageName();
  } else if (payload.source_type === 'upload') {
    if (typeof payload.event_id !== 'string' || !/^[\w-]{1,128}$/.test(payload.event_id) || payload.vm_url)
      return null;
    creation.event_id = payload.event_id;
    creation.image_name = createVmImageName();
  } else {
    if (!/^[1-9]\d*$/.test(String(payload.asset_id || '')) ||
      typeof payload.image_name !== 'string' || !/^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/.test(payload.image_name) ||
      payload.vm_url || payload.event_id) return null;
    creation.asset_id = payload.asset_id;
    creation.image_name = payload.image_name;
  }
  const sourceFormat = normalizeVmSourceFormat(payload.format) ||
    (payload.source_type === 'url' ? inferVmSourceFormat(payload.vm_url) : '');
  if (sourceFormat)
    creation.format = sourceFormat;
  // Ordinary media never borrows Linux credentials or firmware metadata from
  // the Noble example. Console resolves any omitted guest/image information.
  return creation;
}

async function runCreationPipeline({ payload = {}, resume, onProgress } = {}, api = {}, sshRequired) {
  const resources = resourceValues(payload, resume);
  const groupId = String(payload.group_id || (resume && resume.groupId) || '');
  const state = {
    stage: 'create', serviceAlias: '', groupId,
    portConfigured: false, resourceConfigured: false,
    storageOptions: [], resources: validResources(resources) ? resources : { cpu: 4, memory: 8, disk: 80 },
    sshRequired, error: ''
  };
  const fail = error => {
    state.error = error;
    return snapshot(state, 'failed');
  };
  const progress = stage => {
    state.stage = stage;
    state.error = '';
    if (typeof onProgress === 'function') {
      try { onProgress(snapshot(state)); } catch (_) { /* Observers cannot alter request order. */ }
    }
  };
  const existingAlias = resume && resume.serviceAlias;
  try { assertNoVmPasswordPayload(payload); } catch (_) { return fail('quickStartInvalidRequest'); }
  if (existingAlias && typeof existingAlias === 'string' && ALIAS_PATTERN.test(existingAlias))
    state.serviceAlias = existingAlias;
  if (!validResources(resources) || !/^[\w-]+$/.test(payload.team_name || '') ||
    !/^[1-9]\d*$/.test(groupId) || (existingAlias && !state.serviceAlias)) return fail('quickStartInvalidRequest');
  const resourceAlreadyConfigured = !!state.serviceAlias && resume.resourceConfigured === true &&
    ['cpu', 'memory', 'disk'].every(key => resume.resources && resources[key] === Number(resume.resources[key]));
  state.resourceConfigured = resourceAlreadyConfigured;

  if (!state.serviceAlias) {
    const loginMethod = getVmLoginMethod(payload.login_method);
    if ((!sshRequired && payload.login_method === 'password') ||
      (sshRequired && (!loginMethod || !isLinuxQcow2QuickStart(payload.source_type, payload.vm_url) ||
      (loginMethod === 'password'
        ? getVmPasswordUsernameError(payload.ssh_username) || Object.prototype.hasOwnProperty.call(payload, 'ssh_public_key')
        : getSshUsernameError(payload.ssh_username) || getSshPublicKeyError(payload.ssh_public_key)) ||
      (payload.boot_mode && !['bios', 'uefi'].includes(payload.boot_mode))))) return fail('quickStartInvalidRequest');
    const creation = sshRequired ? {
      team_name: payload.team_name,
      group_id: payload.group_id,
      service_cname: payload.service_cname,
      k8s_component_name: payload.k8s_component_name,
      image_name: createQuickStartImageName(),
      source_type: 'url',
      arch: 'amd64',
      vm_url: UBUNTU_NOBLE_QCOW2_URL,
      format: 'qcow2',
      boot_mode: 'uefi',
      os_name: 'Ubuntu 24.04',
      os_family: 'linux',
      ssh_username: payload.ssh_username.trim(),
      ...(loginMethod === 'password' ? { login_method: 'password' }
        : { ...(payload.login_method === undefined ? {} : { login_method: 'ssh_key' }), ssh_public_key: payload.ssh_public_key.trim() }),
      sensitiveError: true
    } : ordinaryCreationPayload(payload);
    if (!creation) return fail('quickStartInvalidRequest');
    progress('create');
    try {
      const created = await api.createVm(creation);
      const alias = created && created.bean && created.bean.service_alias;
      if (!successful(created) || typeof alias !== 'string' || !ALIAS_PATTERN.test(alias))
        return fail('quickStartCreateFailed');
      state.serviceAlias = alias;
    } catch (_) {
      return fail('quickStartCreateFailed');
    }
  }

  const component = { team_name: payload.team_name, app_alias: state.serviceAlias };
  if (sshRequired) {
    progress('ssh');
    try {
      const response = await api.getPortDetail({ ...component, port: 22, sensitiveError: true });
      const port = response && response.bean && response.bean.port;
      if (!successful(response) || !port || port.container_port !== 22 || port.protocol !== 'tcp' ||
        port.is_inner_service !== true || port.is_outer_service !== false) return fail('quickStartSshUnconfirmed');
      state.portConfigured = true;
    } catch (_) {
      return fail('quickStartSshUnconfirmed');
    }
  }

  if (!resourceAlreadyConfigured) {
    progress('storage');
    try {
      const response = await api.getVolumeOpts({ ...component, sensitiveError: true });
      if (!successful(response)) return fail('quickStartStorageFailed');
      state.storageOptions = storageChoices(response);
      if (!state.storageOptions.length) return fail('quickStartStorageFailed');
    } catch (_) {
      return fail('quickStartStorageFailed');
    }
    let selectedType = payload.disk_volume_type;
    if (!selectedType && state.storageOptions.length === 1) selectedType = state.storageOptions[0].value;
    if (!state.storageOptions.some(option => option.value === selectedType)) {
      state.error = 'quickStartStorageRequired';
      return snapshot(state, 'storage-required');
    }

    progress('configure');
    try {
      const response = await api.configure({
        ...component,
        min_cpu: resources.cpu * 1000,
        min_memory: resources.memory * 1024,
        disk_cap: resources.disk,
        disk_volume_type: selectedType,
        sensitiveError: true
      });
      if (!successful(response)) return fail('quickStartConfigureFailed');
      state.resourceConfigured = true;
    } catch (_) {
      return fail('quickStartConfigureFailed');
    }
  }

  progress('build');
  try {
    const response = await api.build({ ...component, is_deploy: true, sensitiveError: true });
    if (!successful(response)) return fail('quickStartBuildFailed');
  } catch (_) {
    return fail('quickStartBuildFailed');
  }
  return snapshot(state, 'submitted');
}

function runVmQuickStart(options, api) {
  return runCreationPipeline(options, api, true);
}

function runVmCreation(options = {}, api) {
  const { payload = {}, resume } = options;
  const sshRequired = resume && resume.serviceAlias
    ? resume.sshRequired === true : isLinuxQcow2QuickStart(payload.source_type, payload.vm_url);
  return runCreationPipeline(options, api, sshRequired);
}

module.exports = {
  UBUNTU_NOBLE_QCOW2_URL,
  createQuickStartImageName,
  createVmImageName,
  SUPPORTED_VM_SOURCE_FORMATS,
  inferVmSourceFormat,
  normalizeVmSourceFormat,
  normalizeVmOperatingSystem,
  safeVmRuntimeFields,
  isLinuxQcow2QuickStart,
  getSshUsernameError,
  getSshPublicKeyError,
  runVmQuickStart,
  runVmCreation
};
