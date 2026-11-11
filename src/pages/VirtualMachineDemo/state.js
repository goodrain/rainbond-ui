const { validImageUrl } = require('./sourceMetadata');

const clone = (value) => JSON.parse(JSON.stringify(value));
function sourceType(values) {
  return (
    values.sourceType ||
    (typeof values.source === 'string' ? values.source : undefined)
  );
}
function sourceMetadata(source) {
  if (!source || typeof source !== 'object') return null;
  const metadata = {};
  // Keep only display fields. API records and File objects must not enter storage.
  ['id', 'name', 'format', 'os', 'architecture', 'firmware'].forEach((key) => {
    const value = source[key];
    if (typeof value === 'string' || typeof value === 'number')
      metadata[key] = String(value).slice(0, 512);
  });
  if (['iso', 'image'].includes(source.mediaKind))
    metadata.mediaKind = source.mediaKind;
  if (typeof source.requiresLoginSetup === 'boolean')
    metadata.requiresLoginSetup = source.requiresLoginSetup;
  return metadata;
}
function installationMedia(values) {
  const metadata = sourceMetadata(values.source);
  if (metadata && metadata.mediaKind) return metadata.mediaKind === 'iso';
  return sourceType(values) === 'iso';
}
function displayUrl(value) {
  if (!validImageUrl(value)) return undefined;
  const url = new URL(value);
  // The local result needs the source location, not query or fragment credentials.
  url.search = '';
  url.hash = '';
  return url.toString();
}
const snapshotConfig = (vm) => ({
  cpu: vm.cpu,
  memory: vm.memory,
  disk: vm.disk,
  network: vm.network,
  storage: vm.storage,
  os: vm.os,
  iso: vm.iso,
  agent: vm.agent,
  disks: clone(vm.disks.filter((disk) => disk.attached))
});
function createVmTemplate() {
  return {
    kind: 'vm',
    status: 'running',
    cpu: 2,
    memory: 2,
    disk: 30,
    storage: 'standard',
    network: 'default',
    os: 'Virtual machine',
    iso: false,
    agent: false,
    pending: null,
    disks: [],
    snapshots: [],
    logs: [],
    integration: null,
    initScript: '',
    external: false,
    retiredVolumes: [],
    scenario: 'current',
    diagnostic: null
  };
}
function createValues() {
  return {
    name: '',
    sourceType: 'url',
    source: 'url',
    os: 'Virtual machine',
    cpu: 4,
    memory: 8,
    disk: 80,
    storage: 'standard',
    network: 'default',
    dataDisk: false
  };
}
function requireValue(condition, key) {
  if (!condition) throw new Error(key);
}
function integer(value, min, max) {
  return (
    Number.isInteger(Number(value)) &&
    Number(value) >= min &&
    Number(value) <= max
  );
}
function validateCreate(data, values) {
  requireValue(values.name && values.name.trim().length <= 48, 'nameRequired');
  requireValue(
    !data.components.some((c) => c.name === values.name.trim()),
    'duplicateName'
  );
  requireValue(
    ['iso', 'image', 'url', 'upload', 'existing'].includes(sourceType(values)) &&
      values.os,
    'imageRequired'
  );
  if (sourceType(values) === 'url')
    requireValue(validImageUrl(values.url), 'importRequired');
  if (['upload', 'existing'].includes(sourceType(values))) {
    const metadata = sourceMetadata(values.source);
    requireValue(metadata && metadata.name, 'imageRequired');
  }
  requireValue(
    integer(values.cpu, 1, 64) &&
      integer(values.memory, 1, 256) &&
      integer(values.disk, 20, 2048),
    'invalidSize'
  );
  requireValue(
    ['default', 'business'].includes(values.network),
    'networkUnavailable'
  );
  requireValue(
    ['standard', 'shared'].includes(values.storage),
    'storageRequired'
  );
}
function applyPending(vm) {
  if (vm.pending) Object.assign(vm, vm.pending);
  vm.pending = null;
}
function clearPending(vm, keys) {
  if (!vm.pending) return;
  keys.forEach((key) => delete vm.pending[key]);
  if (!Object.keys(vm.pending).length) vm.pending = null;
}
function connectionAddress(data, vm, internal = false) {
  if (vm.iso) return null;
  if (vm.network === 'business')
    return `10.20.0.${
      41 +
      data.components
        .filter((c) => c.kind === 'vm')
        .findIndex((c) => c.id === vm.id)
    }`;
  return internal ? '192.168.122.2' : `192.0.2.20:${vm.port}`;
}
function instanceAddress(data, vm) {
  return `10.42.${data.components
    .filter((c) => c.kind === 'vm')
    .findIndex((c) => c.id === vm.id)}.${
    10 + ((vm.bootGeneration || 0) % 230)
  }`;
}
function applyDemoAction(previous, action) {
  const data = clone(previous);
  const values = action.values || {};
  if (action.type === 'create') {
    validateCreate(data, values);
    const id = data.nextId++;
    const template = createVmTemplate();
    const media = sourceMetadata(values.source);
    const iso = installationMedia(values);
    const vm = {
      ...template,
      sourceType: sourceType(values),
      source: media || sourceType(values),
      ...(sourceType(values) === 'url' ? { url: displayUrl(values.url) } : {}),
      os: String(values.os).slice(0, 512),
      storage: values.storage,
      network: values.network,
      dataDisk: !!values.dataDisk,
      id: `vm-${id}`,
      name: values.name.trim(),
      cpu: Number(values.cpu),
      memory: Number(values.memory),
      disk: Number(values.disk),
      iso,
      status: iso ? 'install' : 'running',
      port: 30400 + id,
      agent: false,
      pending: null,
      snapshots: [],
      logs: [],
      integration: null,
      disks: values.dataDisk
        ? [
            {
              id: `disk-${id}`,
              name: '业务数据盘',
              size: 20,
              attached: true
            }
          ]
        : []
    };
    data.components.push(vm);
    return data;
  }
  const vm = data.components.find((c) => c.id === action.id);
  requireValue(vm && vm.kind === 'vm', 'notFound');
  switch (action.type) {
    case 'scenario': {
      const cases = {
        healthy: null,
        booting: {
          severity: 'warning',
          elapsed: '13 min',
          detail: 'Guest starting · QEMU TCG · /dev/kvm unavailable'
        },
        bootError: {
          severity: 'error',
          elapsed: '01:12',
          detail: 'No bootable device · source: qcow2 · target: raw'
        },
        capacity: {
          severity: 'warning',
          elapsed: '2 h',
          detail:
            '0/1 nodes are available: 1 Insufficient cpu · CDI importer Pending · 79 events'
        },
        importError: {
          severity: 'error',
          elapsed: '00:45',
          detail:
            'url address cannot be accessed · HTTP: unknown · redirects: unknown'
        },
        networkPartial: {
          severity: 'warning',
          elapsed: '00:10',
          detail:
            'VMI IP: ping 0/3, TCP timeout · Service TCP 22: open · reverse direction: unverified',
          networkOnly: true
        },
        snapshotError: {
          severity: 'error',
          elapsed: '00:30',
          detail: 'VolumeSnapshot task failed · disk state unchanged',
          networkOnly: true
        }
      };
      requireValue(
        Object.prototype.hasOwnProperty.call(cases, values.scenario),
        'invalidOperation'
      );
      vm.scenario = values.scenario;
      vm.diagnostic = cases[values.scenario];
      vm.status =
        values.scenario === 'capacity'
          ? 'waiting'
          : values.scenario === 'importError'
          ? 'stopped'
          : 'running';
      vm.agent = ['healthy', 'networkPartial', 'snapshotError'].includes(
        values.scenario
      );
      if (
        [
          'healthy',
          'booting',
          'bootError',
          'networkPartial',
          'snapshotError'
        ].includes(values.scenario)
      )
        vm.iso = false;
      break;
    }
    case 'power':
      requireValue(
        ['start', 'stop', 'restart', 'pause', 'resume'].includes(
          values.operation
        ),
        'invalidOperation'
      );
      if (
        ['start', 'restart'].includes(values.operation) &&
        vm.scenario === 'capacity'
      )
        requireValue(
          (vm.pending?.cpu || vm.cpu) <= 2 &&
            (vm.pending?.memory || vm.memory) <= 4,
          'capacityUnavailable'
        );
      if (values.operation === 'stop') vm.status = 'stopped';
      else if (values.operation === 'pause') {
        requireValue(vm.status === 'running', 'invalidOperation');
        vm.status = 'paused';
      } else if (values.operation === 'resume') {
        requireValue(vm.status === 'paused', 'invalidOperation');
        vm.status = 'running';
      } else {
        applyPending(vm);
        if (vm.scenario === 'capacity') {
          vm.scenario = 'booting';
          vm.agent = false;
          vm.diagnostic = {
            severity: 'warning',
            elapsed: '00:00',
            detail: 'Scheduling completed; guest starting'
          };
        }
        vm.bootGeneration = (vm.bootGeneration || 0) + 1;
        vm.status = vm.iso ? 'install' : 'running';
      }
      break;
    case 'hardware': {
      requireValue(
        integer(values.cpu, 1, 64) && integer(values.memory, 1, 256),
        'invalidSize'
      );
      const resources = {
        cpu: Number(values.cpu),
        memory: Number(values.memory)
      };
      if (vm.status === 'stopped') {
        Object.assign(vm, resources);
        clearPending(vm, ['cpu', 'memory']);
      } else
        vm.pending = {
          ...vm.pending,
          ...resources
        };
      break;
    }
    case 'network':
      requireValue(
        ['default', 'business'].includes(values.network),
        'networkUnavailable'
      );
      if (vm.status === 'stopped') {
        vm.network = values.network;
        clearPending(vm, ['network']);
      } else
        vm.pending = {
          ...vm.pending,
          network: values.network
        };
      break;
    case 'finish':
      requireValue(
        vm.scenario !== 'capacity' && vm.scenario !== 'importError',
        'capacityUnavailable'
      );
      requireValue(values.confirm, 'confirmRequired');
      applyPending(vm);
      vm.iso = false;
      vm.status = 'running';
      vm.agent = false;
      break;
    case 'addDisk':
      requireValue(values.name && integer(values.size, 1, 2048), 'invalidDisk');
      vm.disks.push({
        id: `disk-${data.nextId++}`,
        name: values.name.trim(),
        size: Number(values.size),
        attached: true
      });
      break;
    case 'detach':
    case 'attach':
    case 'deleteDisk': {
      const disk = vm.disks.find((d) => d.id === values.diskId);
      requireValue(disk, 'notFound');
      if (action.type !== 'attach')
        requireValue(values.confirm, 'confirmRequired');
      if (action.type === 'deleteDisk') {
        requireValue(!disk.attached, 'detachFirst');
        vm.disks = vm.disks.filter((d) => d.id !== disk.id);
        vm.retiredVolumes = [
          ...(vm.retiredVolumes || []),
          {
            ...disk,
            reclaimStatus: 'pending'
          }
        ];
      } else disk.attached = action.type === 'attach';
      break;
    }
    case 'snapshot':
      requireValue(vm.scenario !== 'snapshotError', 'snapshotTaskFailed');
      requireValue(vm.storage === 'standard', 'snapshotUnavailable');
      requireValue(values.name && values.name.trim(), 'nameRequired');
      requireValue(
        ['online', 'offline'].includes(values.mode),
        'invalidOperation'
      );
      if (values.mode === 'online')
        requireValue(vm.agent && vm.status === 'running', 'agentRequired');
      else if (vm.status !== 'stopped') {
        requireValue(values.confirm, 'confirmRequired');
        vm.status = 'stopped';
      }
      vm.snapshots.unshift({
        id: `snapshot-${data.nextId++}`,
        name: values.name.trim(),
        mode: values.mode,
        time: new Date().toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai'
        }),
        config: snapshotConfig(vm)
      });
      break;
    case 'restore': {
      requireValue(vm.scenario !== 'snapshotError', 'snapshotTaskFailed');
      const snapshot = vm.snapshots.find((s) => s.id === values.snapshotId);
      requireValue(snapshot && values.confirm, 'confirmRequired');
      const additional = vm.disks
        .filter((d) => !snapshot.config.disks.some((s) => s.id === d.id))
        .map((d) => ({
          ...d,
          attached: false
        }));
      Object.assign(vm, clone(snapshot.config), {
        status: 'stopped',
        pending: null
      });
      vm.disks = [...vm.disks, ...additional];
      break;
    }
    case 'integration':
      data.edges = data.edges.filter((e) => !(e.to === vm.id && e.integration));
      if (values.enabled) {
        requireValue(
          data.components.some(
            (c) => c.id === values.client && c.kind === 'container'
          ) && integer(values.port, 1, 65535),
          'invalidIntegration'
        );
        vm.integration = {
          client: values.client,
          port: Number(values.port)
        };
        data.edges.push({
          from: values.client,
          to: vm.id,
          port: Number(values.port),
          integration: true
        });
      } else vm.integration = null;
      break;
    case 'initialization':
      vm.initScript = values.script || '';
      break;
    case 'external':
      requireValue(values.confirm, 'confirmRequired');
      vm.external = !!values.enabled;
      break;
    default:
      throw new Error('invalidOperation');
  }
  vm.logs = [
    {
      operation: action.type,
      time: new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai'
      })
    },
    ...vm.logs
  ].slice(0, 30);
  return data;
}
module.exports = {
  createVmTemplate,
  createValues,
  validateCreate,
  applyDemoAction,
  connectionAddress,
  instanceAddress
};
