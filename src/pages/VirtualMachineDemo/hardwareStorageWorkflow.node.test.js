const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const React = require('react');
const babel = require('@umijs/deps/compiled/babel/core');
const Box = ({ children }) => React.createElement('div', null, children);
Box.Step = Box.Item = Box.Option = Box;
const Button = ({ children, disabled, onClick }) => React.createElement('button', { disabled, onClick }, children);

const scope = { team: 'team-a', region: 'region-a', application: '868' };
const filename = path.join(__dirname, 'Workflow.js');
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
  filename, babelrc: false, configFile: false,
  presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
    require('@umijs/deps/compiled/babel/preset-react').default],
  plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
    [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
}).code;
const exportsObject = {};
vm.runInNewContext(code, { exports: exportsObject, require: name => {
  if (name.endsWith('/vmCreationStorage')) return require('../../utils/vmCreationStorage');
    if (name.endsWith('/vmLoginCredentials')) return require('../../utils/vmLoginCredentials');
  if (name === 'react') return React;
  if (name === 'dva') return { connect: () => Component => Component };
  if (name === 'antd') return { message: { warning() {} }, Button, Alert: Box, Descriptions: Box, Empty: Box, Select: Box, Spin: Box, Steps: Box };
  if (name === '@/utils/global') return {
    getCurrTeamName: () => scope.team, getCurrRegionName: () => scope.region, getAppID: () => scope.application
  };
  if (name === '@/utils/vmQuickStart') return require('../../utils/vmQuickStart');
  if (name === './messages') return { t: key => key };
  return {};
} }, { filename });

function harness() {
  Object.assign(scope, { team: 'team-a', region: 'region-a', application: '868' });
  const reads = [], writes = [];
  const instance = new exportsObject.VmCreateWorkflow({
    teamName: 'team-a', regionName: 'region-a', groupId: '868',
    sourceSummary: { name: 'vm-native-source' },
    collectSourcePayload: callback => callback({ group_id: '868', service_cname: 'vm-native-source', source_type: 'url', vm_url: 'https://example.invalid/installer.iso' }),
    dispatch: action => { (action.type === 'createApp/fetchVMCreationStorage' ? reads : writes).push(action); }
  });
  instance.setState = update => {
    instance.state = { ...instance.state, ...(typeof update === 'function' ? update(instance.state) : update) };
  };
  instance.componentDidMount();
  return { instance, reads, writes };
}
const storage = [{ value: 'ceph-rbd', label: 'Ceph block storage' }, { value: 'local-ssd', label: 'Local SSD' }];

test('the storage read is scoped, refresh generations ignore stale responses and only legacy permission defers', () => {
  const h = harness();
  assert.equal(h.reads.length, 1);
  assert.equal(h.writes.length, 0);
  assert.equal(h.reads[0].payload.team_name, 'team-a');
  assert.equal(h.reads[0].payload.region_name, 'region-a');
  h.instance.loadCreationStorage();
  assert.equal(h.reads[0].isActive(), false);
  h.reads[0].callback({ status: 'ready', options: storage });
  assert.equal(h.instance.state.creationStorage.status, 'loading');
  h.reads[1].callback({ status: 'deferred', reason: 'not-a-legacy-permission', options: [] });
  assert.equal(h.instance.state.creationStorage.status, 'failed');
  h.instance.loadCreationStorage();
  h.reads[2].callback({ status: 'deferred', reason: 'legacy-permission', options: [] });
  assert.equal(h.instance.state.creationStorage.status, 'deferred');
  h.instance.loadCreationStorage();
  scope.region = 'region-b';
  assert.equal(h.reads[3].isActive(), false);
  h.reads[3].callback({ status: 'ready', options: storage });
  assert.equal(h.instance.state.creationStorage.status, 'loading');
});

test('storage selection reaches the final payload and survives configure failure for alias-only retry', () => {
  const h = harness();
  h.reads[0].callback({ status: 'ready', options: storage });
  h.instance.create({ cpu: 6, memory: 12, disk: 100, disk_volume_type: 'ceph-rbd' });
  assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0].payload.disk_volume_type, 'ceph-rbd');
  assert.equal(h.instance.state.selectedStorage, 'ceph-rbd');
  h.writes[0].callback({ status: 'failed', stage: 'configure', error: 'quickStartConfigureFailed',
    serviceAlias: 'gr-native', groupId: '868', portConfigured: false, resourceConfigured: false, storageOptions: storage });
  h.instance.retryQuickStart();
  assert.equal(h.writes.length, 2);
  assert.equal(h.writes[1].payload.disk_volume_type, 'ceph-rbd');
  assert.equal(h.writes[1].resume.serviceAlias, 'gr-native');
  assert.equal(Object.hasOwn(h.writes[1].payload, 'ssh_public_key'), false);
  assert.equal(Object.hasOwn(h.writes[1].payload, 'service_cname'), false);
  h.writes[1].callback({ status: 'storage-required', stage: 'storage', error: 'quickStartStorageRequired',
    serviceAlias: 'gr-native', groupId: '868', storageOptions: [{ value: 'local-ssd', label: 'Local SSD' }] });
  assert.equal(h.instance.state.selectedStorage, '');
});

test('failed pre-creation storage cannot invoke source collection or real creation', () => {
  const h = harness();
  h.reads[0].callback({ status: 'failed', options: [] });
  let collected = false;
  h.instance.props.collectSourcePayload = () => { collected = true; };
  h.instance.create({ cpu: 4, memory: 8, disk: 80, disk_volume_type: 'invented-type' });
  assert.equal(collected, false);
  assert.equal(h.writes.length, 0);
});

test('capability refresh keeps VM creation available, suppresses stale support and preserves scope generations', () => {
  const h = harness();
  h.reads[0].callback({ status: 'ready', options: [{ value: 'pool-a', label: 'A',
    snapshotCapability: { state: 'supported', reasonCode: 'ready', private: 'not-public' } }] });
  assert.equal(h.instance.state.creationStorage.options[0].snapshotCapability.state, 'supported');
  assert.equal(JSON.stringify(h.instance.state).includes('not-public'), false);
  h.instance.refreshSnapshotCapability();
  assert.equal(h.instance.state.creationStorage.status, 'ready');
  assert.equal(h.instance.state.creationStorage.capabilityRefreshing, true);
  h.instance.refreshSnapshotCapability();
  h.reads[1].callback({ status: 'ready', options: storage });
  assert.equal(h.instance.state.creationStorage.capabilityRefreshing, true);
  h.reads[2].callback({ status: 'failed', options: [] });
  assert.equal(h.instance.state.creationStorage.status, 'ready');
  assert.equal(h.instance.state.creationStorage.capabilityFailed, true);
  assert.equal(h.instance.state.creationStorage.options[0].snapshotCapability.state, 'failed');
  h.instance.create({ cpu: 4, memory: 8, disk: 80, disk_volume_type: 'pool-a' });
  assert.equal(h.writes.length, 1, 'failed snapshot evidence cannot block ordinary VM creation');
});

test('a failed creation result without an alias still exposes the original cleanup exit without any API action', () => {
  const h = harness();
  let closed = 0;
  h.instance.props = { ...h.instance.props, onCancel: () => { closed += 1; } };
  h.instance.state.quickStart = { status: 'failed', stage: 'create', error: 'quickStartCreateFailed', groupId: '868', serviceAlias: '', sshRequired: false };
  const elements = node => !React.isValidElement(node) ? []
    : [node, ...React.Children.toArray(node.props.children).flatMap(elements)];
  const exit = elements(h.instance.renderQuickStart()).find(node => node.type === Button && node.props.children === 'backToApplication');
  assert.ok(exit);
  assert.equal(exit.props.disabled, false);
  const readsBefore = h.reads.length;
  exit.props.onClick();
  assert.equal(closed, 1);
  assert.equal(h.writes.length, 0);
  assert.equal(h.reads.length, readsBefore);
  h.instance.state.quickStartSubmitting = true;
  const pendingExit = elements(h.instance.renderQuickStart()).find(node => node.type === Button && node.props.children === 'backToApplication');
  assert.equal(pendingExit.props.disabled, true);
});
