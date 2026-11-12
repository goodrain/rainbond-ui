const assert = require('node:assert/strict');
const { test } = require('node:test');
const { deriveVmWorkspaceData, buildVmComponentWorkspaceData } = require('./vmComponentWorkspaceData');
+
test('guest observations preserve connected, disconnected and unknown separately', () => {
  for (const [agent, status, reason] of [
    [true, 'responding', 'agent_connected'],
    [false, 'unconfirmed', 'agent_disconnected'],
    [null, 'unconfirmed', 'agent_not_reported']
  ]) {
    const result = deriveVmWorkspaceData(fixture({}, { guest: {
      status, reason, agent_connected: agent, os: { name: 'Observed Ubuntu' }
    } }));
    assert.equal(result.guestStatus, status);
    assert.equal(result.agentConnected, agent);
    assert.equal(result.guestReason, reason);
    assert.equal(result.osName, agent === true ? 'Observed Ubuntu' : 'runtime OS');
  }
});

test('legacy backends and malformed guest data never claim a guest connection', () => {
  assert.equal(deriveVmWorkspaceData(fixture()).guestReason, 'backend_unsupported');
  for (const agent of ['true', 1, {}, undefined]) {
    const result = deriveVmWorkspaceData(fixture({}, { guest: {
      status: 'responding', reason: 'agent_connected', agent_connected: agent
    } }));
    assert.equal(result.agentConnected, null);
    assert.equal(result.guestReason, 'invalid_response');
  }
});

test('current stopped or paused power and failed refresh invalidate an old connected profile', () => {
  const source = fixture({}, { guest: {
    status: 'responding', reason: 'agent_connected', agent_connected: true
  } });
  for (const [status, expected] of [['closed', 'powered_off'], ['paused', 'paused']]) {
    const result = deriveVmWorkspaceData({ ...source, status: { status } });
    assert.equal(result.guestStatus, expected);
    assert.equal(result.agentConnected, null);
  }
  const failed = deriveVmWorkspaceData({ ...source, guestObservationFailed: true });
  assert.equal(failed.agentConnected, null);
  assert.equal(failed.guestReason, 'read_failed');
});


function fixture(service = {}, profile = {}) {
  return {
    appDetail: {
      service: {
        service_alias: 'gr-vm-a', service_id: 'service-a', service_cname: 'VM A',
        arch: 'amd64', min_cpu: 1500, min_memory: 2560, disk_cap: 80,
        ...service
      },
      vm_profile: {
        asset: { name: 'ubuntu-image', display_name: 'Ubuntu image', os_name: 'Ubuntu 24.04',
          source_type: 'upload', format: 'qcow2', boot_mode: 'uefi', reference_count: 2 },
        runtime: { os_name: 'runtime OS', boot_source_format: 'qcow2' },
        runtime_status: { status: 'running' },
        connections: { vnc_url: 'https://console.example.invalid/vnc_lite.html?path=k8s%2Fapis%2Fvm%2Fvnc' },
        ...profile
      }
    }
  };
}

test('projects actual Console profile fields and converts resource units without defaults', () => {
  const source = fixture();
  const projected = deriveVmWorkspaceData(source);
  assert.equal(buildVmComponentWorkspaceData, deriveVmWorkspaceData);
  assert.equal(projected.id, 'gr-vm-a');
  assert.equal(projected.name, 'VM A');
  assert.equal(projected.arch, 'amd64');
  assert.equal(projected.cpuCores, 1.5);
  assert.equal(projected.memoryGiB, 2.5);
  assert.equal(projected.rootDiskGiB, 80);
  assert.equal(projected.powerStatus, 'running');
  assert.equal(projected.osName, 'runtime OS');
  assert.equal(projected.referenceCount, 2);
  assert.equal(projected.vncUrl, source.appDetail.vm_profile.connections.vnc_url);
  assert.deepEqual(projected.asset, {
    name: 'ubuntu-image', displayName: 'Ubuntu image', sourceType: 'upload', format: 'qcow2', bootMode: 'uefi'
  });
});

test('instance OS overrides a shared image label and safely falls back when absent or invalid', () => {
  const asset = { os_name: 'Ubuntu asset metadata' };
  assert.equal(deriveVmWorkspaceData(fixture({}, { asset, runtime: { os_name: 'Windows Server 2025' } })).osName, 'Windows Server 2025');
  for (const osName of [undefined, null, '', ' ', 'bad\nOS', {}])
    assert.equal(deriveVmWorkspaceData(fixture({}, { asset, runtime: { os_name: osName } })).osName, 'Ubuntu asset metadata');
});

for (const wireStatus of ['running', 'closed', 'paused', 'waiting', 'starting', 'stopping', 'restoring', 'failure']) {
  test(`preserves the explicit ${wireStatus} power status`, () => {
    const result = deriveVmWorkspaceData({ ...fixture(), status: { status: wireStatus } });
    assert.equal(result.powerStatus, wireStatus);
    assert.equal(result.rawPowerStatus, wireStatus);
    assert.equal(result.guestStatus, null);
    assert.equal(result.agentConnected, null);
  });
}

test('unknown and absent state never fall back to running', () => {
  const explicit = deriveVmWorkspaceData({ ...fixture(), status: { status: 'unKnow' } });
  assert.equal(explicit.powerStatus, 'unknown');
  assert.equal(explicit.rawPowerStatus, 'unKnow');
  const absent = deriveVmWorkspaceData({ appDetail: { service: { service_cname: 'Windows production' } } });
  assert.equal(absent.powerStatus, 'unknown');
  assert.equal(absent.rawPowerStatus, null);
  assert.equal(absent.osName, null);
  assert.equal(absent.cpuCores, null);
  assert.equal(absent.memoryGiB, null);
  assert.equal(absent.rootDiskGiB, null);
  assert.equal(absent.arch, null);
  for (const status of [{}, { status: '' }, { status: false }, ' ', true, 1]) {
    const unresolved = deriveVmWorkspaceData({ ...fixture(), status });
    assert.equal(unresolved.powerStatus, 'unknown');
    assert.equal(unresolved.rawPowerStatus, null);
  }
});

test('uses explicit runtime status and OS fallbacks, without inventing guest or agent state', () => {
  const result = deriveVmWorkspaceData(fixture({}, {
    asset: {}, runtime: { os_name: 'Debian 12' }, runtime_status: { status: 'paused', guest_ready: true },
    agent_connected: true, guest_status: 'ready', agent: true, guest: { ready: true }
  }));
  assert.equal(result.powerStatus, 'paused');
  assert.equal(result.osName, 'Debian 12');
  assert.equal(result.guestStatus, null);
  assert.equal(result.agentConnected, null);
  assert.equal(result.snapshotCapability, 'unknown');
  assert.equal(result.referenceCount, null);
});

test('preserves real zero resources and zero references', () => {
  const result = deriveVmWorkspaceData(fixture({ min_cpu: 0, min_memory: '0', disk_cap: 0 }, {
    asset: { reference_count: 0 }
  }));
  assert.equal(result.cpuCores, 0);
  assert.equal(result.memoryGiB, 0);
  assert.equal(result.rootDiskGiB, 0);
  assert.equal(result.referenceCount, 0);
});

test('accepts scoped root volume capacity but never media or data-disk capacity', () => {
  const base = fixture();
  const disks = [
    { disk_key: 'installer', disk_role: 'installer', device_type: 'cdrom', volume_capacity: 3 },
    { disk_key: 'data-a', disk_role: 'data', volume_capacity: 200 },
    { disk_key: 'disk', disk_role: 'root', source_kind: 'volume', volume_capacity: '96' }
  ];
  assert.equal(deriveVmWorkspaceData({ ...base, vmDisks: disks, vmDisksServiceAlias: 'gr-vm-a' }).rootDiskGiB, 96);
  assert.equal(deriveVmWorkspaceData({ ...base, vmDisks: disks.slice(0, 2), vmDisksServiceAlias: 'gr-vm-a' }).rootDiskGiB, 80);
  assert.equal(deriveVmWorkspaceData({ ...base, vmDisks: [{ disk_role: 'root', device_type: 'cdrom', volume_capacity: 5 }], vmDisksServiceAlias: 'gr-vm-a' }).rootDiskGiB, 80);
});

test('unscoped or previous-component disk cache cannot overwrite the current allocation', () => {
  const disk = { disk_key: 'disk', disk_role: 'root', volume_capacity: 999 };
  assert.equal(deriveVmWorkspaceData({ ...fixture(), vmDisks: [disk] }).rootDiskGiB, 80);
  assert.equal(deriveVmWorkspaceData({ ...fixture(), vmDisks: [disk], vmDisksServiceAlias: 'previous-vm' }).rootDiskGiB, 80);
  assert.equal(deriveVmWorkspaceData({ ...fixture({ disk_cap: undefined }), vmDisks: [disk] }).rootDiskGiB, null);
  assert.equal(deriveVmWorkspaceData({ ...fixture(), vmDisks: [{ ...disk, service_id: 'previous-service' }] }).rootDiskGiB, 80);
  assert.equal(deriveVmWorkspaceData({ ...fixture(), vmDisks: [{ ...disk, service_id: 'service-a' }] }).rootDiskGiB, 999);
  assert.equal(deriveVmWorkspaceData({ ...fixture(), vmDisks: [{ ...disk, service_id: 'previous-service' }], vmDisksServiceAlias: 'gr-vm-a' }).rootDiskGiB, 80);
});

test('rejects malformed numeric values and unsupported input shapes', () => {
  for (const invalid of [null, '', ' ', false, [], {}, -1, Infinity, NaN, 'false', '10 Gi', '1e3']) {
    const result = deriveVmWorkspaceData(fixture({ min_cpu: invalid, min_memory: invalid, disk_cap: invalid }));
    assert.equal(result.cpuCores, null);
    assert.equal(result.memoryGiB, null);
    assert.equal(result.rootDiskGiB, null);
  }
  for (const malformed of [null, [], false, 123, 'raw']) {
    const result = deriveVmWorkspaceData(malformed);
    assert.equal(result.id, null);
    assert.equal(result.name, null);
    assert.equal(result.powerStatus, 'unknown');
    assert.equal(result.vncUrl, null);
  }
});

test('console URL is exact and only comes from the validated profile connection field', () => {
  const url = 'HTTP://console.example.invalid:31002/vnc_lite.html?path=k8s%2Fvm%2Fvnc#viewer';
  assert.equal(deriveVmWorkspaceData(fixture({}, { connections: { vnc_url: url } })).vncUrl, url);
  for (const invalid of [
    'https://user:opaque-password@console.example.invalid/vnc',
    'http://user@console.example.invalid/vnc', 'javascript:alert(1)', '//console.example.invalid/vnc',
    '/relative/vnc', 'ftp://console.example.invalid/vnc', 'https://', ' https://console.example.invalid/vnc',
    'https://console.example.invalid/\nvnc', null, {}, 1
  ]) {
    const result = deriveVmWorkspaceData(fixture({}, { connections: { vnc_url: invalid, console_url: url } }));
    assert.equal(result.vncUrl, null);
  }
});

test('projects reference display fields but does not infer count from a list', () => {
  const result = deriveVmWorkspaceData(fixture({}, { asset: { references: [
    { service_alias: 'gr-other', service_cname: 'Other VM', display_name: 'Other VM display',
      group_id: 42, region_name: 'region-a', password: 'opaque-reference-secret' },
    null, { unexpected: 'opaque-reference-secret' }
  ] } }));
  assert.equal(result.referenceCount, null);
  assert.deepEqual(result.references, [{ id: 'gr-other', name: 'Other VM display', groupId: '42', region: 'region-a' }]);
  assert.equal(JSON.stringify(result).includes('opaque-reference-secret'), false);
});

test('does not leak credentials, raw responses, URLs or fabricate IPs/ports/snapshots', () => {
  const source = fixture({
    ssh_public_key: 'opaque-public-input', password: 'opaque-password',
    env: [{ name: 'SECRET', value: 'opaque-env' }], token: 'opaque-token'
  }, {
    asset: { name: 'image', source_uri: 'https://user:opaque-source-secret@example.invalid/image',
      extra: { ssh_public_key: 'opaque-public-input', private_key: 'opaque-private-input' } },
    runtime: { vm_ssh_public_key: 'opaque-public-input', user_data: 'opaque-user-data' },
    current_pod_ip: '10.42.7.8', network: { fixed_ip: '10.42.9.9' },
    snapshots: [{ id: 'made-up', state: 'ready' }], response_data: { secret: 'opaque-response-secret' },
    connections: { vnc_url: '', token: 'opaque-token', password: 'opaque-password' }
  });
  const result = deriveVmWorkspaceData(source);
  const serialized = JSON.stringify(result);
  for (const sentinel of ['opaque-', '10.42.', '10.43.', 'made-up'])
    assert.equal(serialized.includes(sentinel), false);
  for (const field of ['token', 'password', 'ssh_public_key', 'env', 'response_data', 'snapshots', 'ports', 'network'])
    assert.equal(Object.hasOwn(result, field), false);
  assert.equal(result.snapshotCapability, 'unknown');
  assert.equal(result.vncUrl, null);
});
