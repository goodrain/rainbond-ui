const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const React = require('react');
const babel = require('@umijs/deps/compiled/babel/core');
const expansion = require('../../utils/volumeExpansion');

function load(relative, dependencies) {
  const filename = path.resolve(__dirname, relative), exports = {};
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, babelrc: false, configFile: false,
    presets: [require('@umijs/deps/compiled/babel/preset-env').default, require('@umijs/deps/compiled/babel/preset-react').default],
    plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
      [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
  }).code;
  const field = name => Object.assign(props => React.createElement(name, props, props.children), { Item: `${name}Item` });
  const Form = Object.assign(field('Form'), { create: () => Component => Component });
  const antd = { Form, Select: Object.assign(field('Select'), { Option: 'Option' }), Descriptions: field('Descriptions'),
    Input: 'Input', Alert: 'Alert', Button: 'Button', Drawer: 'Drawer' };
  vm.runInNewContext(code, { exports, ...(dependencies && dependencies.__globals || {}),
    require(name) {
      if (dependencies && dependencies[name]) return dependencies[name];
      if (name === 'react') return React;
      if (name === 'antd') return antd;
      if (name === 'dva') return { connect: () => Component => Component };
      if (name === 'umi') return { FormattedMessage: 'FormattedMessage' };
      if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
      if (name.endsWith('/volumeExpansion')) return expansion;
      if (name.endsWith('/componentUpgradeFeedback')) return require('../../utils/componentUpgradeFeedback');
      if (name.endsWith('/vmVolumeOptions')) return { findVolumeOptionByType: () => undefined, resolveVMStorageAccessMode: () => 'RWX' };
      if (name.endsWith('/cookie')) return { get: () => 'zh-CN' };
      if (name.endsWith('/plugin')) return { isMountPath: () => false };
      return {};
    }
  });
  return exports.default;
}
const Editor = load('index.js');
function nodes(element) { return React.isValidElement(element) ? [element, ...React.Children.toArray(element.props.children).flatMap(nodes)] : []; }
function form(data) {
  const fields = {};
  const editor = new Editor({ data, editor: data, volumeOpts: [], form: { getFieldDecorator: (name, options) => element => {
    fields[name] = { options, element }; return element;
  } } });
  const tree = nodes(editor.render());
  return { editor, fields, tree };
}

test('VM editor shows real capacities and keeps expansion usable when creation options are empty', () => {
  const h = form({ volume_name: 'data', volume_type: 'vm-csi', volume_capacity: 1, device_path: '/disk',
    allow_expansion: true, requested_capacity: 2, actual_capacity: 1, pvc_count: 1, expansion_status: 'resizing' });
  assert.equal(h.fields.volume_capacity.options.initialValue, 2);
  assert.equal(h.fields.volume_capacity.element.props.disabled, false);
  assert.equal(h.tree.filter(node => node.type === 'Button').at(-1).props.disabled, false);
  assert.ok(h.tree.some(node => node.props.children === 'componentOverview.body.mnt.vmExpansionStatus.resizing'));
  assert.ok(h.tree.some(node => node.props.children === '2GB'));
  assert.ok(h.tree.some(node => node.props.children === '1GB'));
});

test('unsupported storage keeps an inspectable editor with the backend reason and no false readiness', () => {
  const h = form({ volume_name: 'data', volume_type: 'nfs', allow_expansion: false, expansion_status: 'unsupported',
    expansion_message: 'StorageClass expansion is disabled', pvc_count: 0 });
  assert.equal(h.fields.volume_capacity.element.props.disabled, true);
  assert.ok(h.tree.some(node => node.type === 'Alert' && node.props.description === 'StorageClass expansion is disabled'));
  assert.ok(h.tree.some(node => node.props.children === 0));
  assert.equal(h.tree.some(node => node.props.children === 'componentOverview.body.mnt.vmExpansionStatus.ready'), false);
});

test('PVC-ready label retains guest confirmation and blocks shrink and fractional requests', () => {
  const h = form({ volume_name: 'data', allow_expansion: true, expansion_status: 'ready', actual_capacity: 3, requested_capacity: 3 });
  assert.ok(h.tree.some(node => node.props.children === 'componentOverview.body.mnt.vmExpansionStatus.ready'));
  assert.ok(h.tree.some(node => node.type === 'Alert' && node.props.message === 'componentOverview.body.mnt.vmExpansionGuestCheck'));
  for (const target of [2, 3.5, 0]) {
    let failure;
    h.editor.checkVolumeCapacity({}, target, message => { failure = message; });
    assert.ok(failure);
  }
});


test('VM storage page refreshes expansion state without discarding draft layout and ignores stale responses', () => {
  const context = { team: 'team-a' }, requests = [], timers = new Map();
  let serial = 0;
  const Page = load('../../pages/Component/mnt.js', {
    './mntNoticeHelpers': require('../../pages/Component/mntNoticeHelpers'),
    './vmDiskDraftHelpers': require('../../pages/Component/vmDiskDraftHelpers'),
    '../../utils/global': { getCurrTeamName: () => context.team, getCurrRegionName: () => 'region-a' },
    '@/utils/cookie': { get: () => 'zh-CN' },
    __globals: { setTimeout: callback => { const id = ++serial; timers.set(id, callback); return id; }, clearTimeout: id => timers.delete(id) }
  });
  const page = new Page({ method: 'vm', appAlias: 'vm-a', dispatch: action => requests.push(action) });
  page.setState = update => { page.state = { ...page.state, ...(typeof update === 'function' ? update(page.state) : update) }; };
  const disk = { disk_key: 'data', source_kind: 'volume', disk_role: 'data', volume_id: 42, volume_capacity: 1 };
  page.state.vmDiskDraft = [disk, { disk_key: 'new-media', source_kind: 'container_disk' }];
  page.state.vmDiskChanged = true;
  page.fetchVMDiskLayout();
  requests[0].callback({ list: [{ ...disk, requested_capacity: 2, actual_capacity: 1, expansion_status: 'resizing' }] });
  assert.equal(page.state.vmDiskDraft.length, 2);
  assert.equal(page.state.vmDiskChanged, true);
  assert.equal(page.state.vmDiskDraft[0].requested_capacity, 2);
  assert.equal(timers.size, 1);
  const staleTimer = [...timers.values()][0];
  context.team = 'team-b';
  timers.clear(); // A fired browser timeout is no longer pending.
  staleTimer();
  assert.equal(requests.length, 1);
  page.fetchVMDiskLayout();
  page.componentWillUnmount();
  requests[1].callback({ list: [{ ...disk, actual_capacity: 2, expansion_status: 'ready' }] });
  assert.equal(page.state.vmDiskDraft[0].actual_capacity, 1);
  assert.equal(timers.size, 0);
  const actions = page.getVmColumns().find(column => column.dataIndex === 'action').render(null, disk, 0);
  assert.ok(nodes(actions).some(node => node.props.children === 'componentOverview.body.mnt.edit'));
  const rootActions = page.getVmColumns().find(column => column.dataIndex === 'action').render(null, { ...disk, disk_role: 'root' }, 0);
  assert.equal(nodes(rootActions).some(node => node.props.children === 'componentOverview.body.mnt.edit'), false);
});

test('expansion submission preserves the existing indexed disk path', () => {
  let submitted;
  const editor = new Editor({ editor: true, data: { volume_name: 'data', volume_path: '/disk/1', device_path: '/disk' }, volumeOpts: [],
    onSubmit: values => { submitted = values; }, form: { validateFields: callback => callback(null, {
      volume_name: 'data', volume_path: '/disk', volume_capacity: 3, volume_type: 'vm-csi'
    }) } });
  editor.handleSubmit({ preventDefault() {} });
  assert.equal(submitted.volume_path, '/disk/1');
  assert.equal(submitted.volume_capacity, 3);
});
