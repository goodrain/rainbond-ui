const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const React = require('react');
const babel = require('@umijs/deps/compiled/babel/core');
const helpers = require('./expansionHelpers');

const filename = path.join(__dirname, 'expansion.js');
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
  filename, babelrc: false, configFile: false,
  presets: [
    [require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
    require('@umijs/deps/compiled/babel/preset-react').default
  ],
  plugins: [
    [require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
    [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]
  ]
}).code;

function harness(overrides = {}) {
  const exported = {}, requests = [], resets = [], notifications = [];
  const context = { team: 'team-a', region: 'region-a', application: '868', alias: 'vm-a' };
  vm.runInNewContext(code, {
    exports: exported,
    setInterval: () => 1, clearInterval: () => {}, setTimeout: () => 1,
    require(name) {
      if (name === 'react') return React;
      if (name === 'dva') return { connect: () => Component => Component };
      if (name === 'dva/router') return { Link: 'Link', routerRedux: { push: value => value } };
      if (name === 'antd') return {
        Form: Object.assign(() => null, { create: () => Component => Component, Item: 'FormItem' }),
        Input: Object.assign(() => null, { Group: 'InputGroup' }), Select: Object.assign(() => null, { Option: 'Option' }),
        Alert: 'Alert', Button: 'Button', Card: 'Card', Col: 'Col', Icon: 'Icon', Row: 'Row', Spin: 'Spin',
        Switch: 'Switch', Table: 'Table', Slider: 'Slider', notification: { success: value => notifications.push(value), warning: () => {} }
      };
      if (name === 'umi') return { FormattedMessage: 'FormattedMessage' };
      if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
      if (name === './expansionHelpers') return helpers;
      if (name.endsWith('/utils/license')) return { haveFeature: () => false };
      if (name.endsWith('/utils/pulginUtils')) return { isInstallPlugin: () => false };
      if (name.endsWith('/utils/cookie')) return { get: () => 'zh-CN' };
      if (name.endsWith('/utils/error')) return () => {};
      if (name.endsWith('/utils/global')) return {
        getCurrTeamName: () => context.team, getCurrRegionName: () => context.region,
        getAppID: () => context.application, getSlidePanelComponentID: () => context.alias,
        isSingletonComponent: () => false
      };
      if (name.endsWith('/AppInstanceList')) return 'InstanceList';
      if (name.endsWith('/NoPermTip')) return 'NoPermTip';
      if (name.endsWith('.less')) return new Proxy({}, { get: (_, key) => key });
      return {};
    }
  }, { filename });
  const values = { new_memory: 7, new_cpu: 6 };
  const props = {
    method: 'vm', vmWorkspaceEditor: true, appAlias: 'vm-a', instances: { new_pods: [], old_pods: [] },
    status: { status: 'closed' }, componentPermissions: { isTelescopic: true }, features: [], pluginList: [],
    appDetail: { service: { service_alias: 'vm-a', service_id: 'service-a', k8s_component_name: 'vm-a' }, vm_profile: { runtime: {}, network: {} } },
    extendInfo: { current_cpu: 4000, current_memory: 8192, current_gpu: 0, current_node: 1, node_list: [1] },
    dispatch: action => requests.push(action),
    form: {
      getFieldDecorator: () => element => element,
      getFieldValue: name => values[name],
      setFieldsValue: updated => resets.push(updated),
      validateFields: callback => callback(null, { ...values })
    },
    ...overrides
  };
  let closes = 0, saves = 0;
  const callbacks = [];
  props.onCancelVmWorkspaceEditor = () => { closes += 1; callbacks.push('close'); };
  props.onVmWorkspaceResourceSaved = () => { saves += 1; callbacks.push('saved'); };
  const instance = new exported.default(props);
  instance.setState = (change, callback) => {
    instance.state = { ...instance.state, ...(typeof change === 'function' ? change(instance.state) : change) };
    if (callback) callback();
  };
  instance.state = { ...instance.state, ...instance.initializeConfigValues() };
  instance.componentDidMount();
  requests.splice(0); // The existing mount reads are outside these edit submission assertions.
  return { instance, requests, resets, notifications, context, callbacks, closes: () => closes, saves: () => saves };
}

function elements(element) {
  if (!element || typeof element !== 'object') return [];
  if (Array.isArray(element)) return element.flatMap(elements);
  return [element, ...elements(element.props?.children), ...elements(element.props?.extra)];
}

test('the VM workspace editor starts the existing compute form without the instance card', () => {
  const h = harness();
  assert.equal(h.instance.state.editBillInfo, true);
  const tree = elements(h.instance.render());
  assert.equal(tree.some(element => element.type === 'InstanceList'), false);
  const card = tree.find(element => element.type === 'Card');
  assert.equal(card.props.title.props.id, 'componentOverview.vmWorkspace.computeTitle');
  assert.equal(tree.filter(element => element.type === 'Slider').length, 2);
  assert.ok(tree.filter(element => element.type === 'Slider').every(element => element.props.disabled === false));
  const save = tree.find(element => element.props?.['data-testid'] === 'rbd-scale-submit');
  assert.equal(save.props.onClick, h.instance.handleFromData);
  assert.equal(tree.some(element => element.props?.['data-testid'] === 'rbd-scale-instance-input'), false);
  assert.equal(h.requests.length, 0);
});

test('the default VM and non-VM expansion views retain their instance card and initial view mode', () => {
  for (const props of [{ vmWorkspaceEditor: false }, { method: 'stateless_multiple' }]) {
    const h = harness(props);
    assert.equal(h.instance.state.editBillInfo, false);
    const tree = elements(h.instance.render());
    assert.ok(tree.some(element => element.type === 'InstanceList'));
    assert.ok(tree.some(element => element.type === 'Card' && element.props.title.props.id === 'componentOverview.body.Expansion.telescopic'));
  }
});

test('workspace presentation preserves GPU/USB restrictions, fixed-IP restart confirmation and permissions', () => {
  for (const runtime of [{ gpu_enabled: true }, { usb_enabled: true }]) {
    const h = harness({ appDetail: { service: {}, vm_profile: { runtime, network: {} } } });
    const tree = elements(h.instance.render());
    assert.equal(tree.find(element => element.props?.['data-testid'] === 'rbd-scale-submit').props.disabled, true);
    assert.ok(tree.filter(element => element.type === 'Slider').every(element => element.props.disabled));
  }
  const fixed = harness({ status: { status: 'running' },
    appDetail: { service: {}, vm_profile: { runtime: {}, network: { fixed_ip_enabled: true } } },
    extendInfo: { current_cpu: 4000, current_memory: 8192, current_gpu: 0, cpu_hot_update_supported: true, memory_hot_update_supported: true } });
  const fixedTree = elements(fixed.instance.render());
  const save = fixedTree.find(element => element.props?.['data-testid'] === 'rbd-scale-submit');
  assert.equal(save.props.children, 'componentOverview.body.tab.overview.vmHotUpdateRestartConfirm');
  assert.ok(fixedTree.some(element => element.type === 'Alert' && element.props.message === 'componentOverview.body.tab.overview.vmFixedIPScalingTip'));
  const forbidden = harness({ componentPermissions: { isTelescopic: false } });
  assert.equal(forbidden.instance.render().type, 'NoPermTip');
});

test('cancel resets existing form values and only closes the opt-in VM editor without dispatch', () => {
  for (const vmWorkspaceEditor of [true, false]) {
    const h = harness({ vmWorkspaceEditor });
    h.instance.state = { ...h.instance.state, editBillInfo: true, cpuValue: 9, customCpuValue: '24' };
    h.instance.handleCancelResourceEdit();
    assert.equal(h.instance.state.editBillInfo, false);
    assert.equal(h.instance.state.cpuValue, 6);
    assert.deepEqual(JSON.parse(JSON.stringify(h.resets)), [{ new_memory: 7, new_cpu: 6 }]);
    assert.equal(h.closes(), vmWorkspaceEditor ? 1 : 0);
    assert.equal(h.saves(), 0);
    assert.equal(h.requests.length, 0);
  }
});

test('the editor keeps the original scaling request and closes only on its successful callback', () => {
  const h = harness();
  h.instance.handleFromData();
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0].type, 'appControl/newVertical');
  assert.deepEqual(JSON.parse(JSON.stringify(h.requests[0].payload)), {
    team_name: 'team-a', app_alias: 'vm-a', new_memory: 8192, new_gpu: 0, new_cpu: 4000
  });
  assert.equal(h.closes(), 0);
  assert.equal(h.saves(), 0);
  h.requests[0].callback();
  assert.equal(h.closes(), 1);
  assert.equal(h.saves(), 1);
  assert.deepEqual(h.callbacks, ['saved', 'close']);
  assert.equal(h.instance.state.editBillInfo, false);
  h.requests[0].callback();
  assert.equal(h.saves(), 1);

  const failed = harness();
  failed.instance.handleFromData();
  failed.requests[0].handleError({ status: 500 });
  assert.equal(failed.closes(), 0);
  assert.equal(failed.saves(), 0);

  const original = harness({ vmWorkspaceEditor: false });
  original.instance.handleFromData();
  original.requests[0].callback();
  assert.equal(original.closes(), 0);
  assert.equal(original.saves(), 0);
});

test('late form validation cannot write after cancel, scope changes, external close or unmount', () => {
  const invalidators = [
    h => h.instance.handleCancelResourceEdit(),
    h => { h.context.team = 'team-b'; },
    h => { h.context.region = 'region-b'; },
    h => { h.context.application = '869'; },
    h => { h.context.alias = 'vm-b'; },
    h => {
      const nextProps = { ...h.instance.props, appAlias: 'vm-b' };
      h.instance.componentWillReceiveProps(nextProps);
      h.instance.props = nextProps;
    },
    h => {
      const nextProps = { ...h.instance.props, vmWorkspaceEditorActive: false };
      h.instance.componentWillReceiveProps(nextProps);
      h.instance.props = nextProps;
    },
    h => h.instance.componentWillUnmount()
  ];
  for (const invalidate of invalidators) {
    const h = harness();
    let resume;
    h.instance.props.form.validateFields = callback => { resume = callback; };
    h.instance.handleFromData();
    invalidate(h);
    resume(null, { new_memory: 7, new_cpu: 6 });
    assert.equal(h.requests.some(action => action.type === 'appControl/newVertical'), false);
    assert.equal(h.saves(), 0);
    assert.equal(h.notifications.length, 0);
  }
});

test('a stale success response cannot refresh or close a different VM workspace', () => {
  const h = harness();
  h.instance.handleFromData();
  h.context.alias = 'vm-b';
  h.requests[0].callback();
  assert.equal(h.saves(), 0);
  assert.equal(h.closes(), 0);
  assert.equal(h.notifications.length, 0);
});
