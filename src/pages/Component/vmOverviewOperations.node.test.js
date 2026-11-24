const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const React = require('react');
const babel = require('@umijs/deps/compiled/babel/core');
const polling = require('./componentPolling');

const filename = path.join(__dirname, 'overview.js');
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

function harness(section = 'operations') {
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    clearTimeout,
    require(name) {
      if (name === 'react') return React;
      if (name === 'prop-types') return require('prop-types');
      if (name === 'dva') return { connect: () => Component => Component };
      if (name === 'antd') return { Button: Object.assign(() => null, { Group: 'ButtonGroup' }), Card: 'Card' };
      if (name === 'umi') return { FormattedMessage: 'FormattedMessage' };
      if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
      if (name.endsWith('/utils/global')) return { getCurrTeamName: () => 'team-a', getCurrRegionName: () => 'region-a' };
      if (name === './componentPolling') return polling;
      if (name.endsWith('/componentViewPerformance')) return { shouldLoadStorageUsage: () => false };
      if (name === './component/Basic/operationRecord') return 'OperationRecord';
      if (name === './component/Basic/index') return 'Basic';
      if (name === './component/Basic/VMProfilePanel') return 'VMProfilePanel';
      if (name === './component/Instance/index') return 'Instance';
      return {};
    }
  }, { filename });
  const records = [{ event_id: 'event-read-1', opt_type: 'start', status: 'complete' }];
  const requests = [], schedules = [];
  const instance = new exports.default({
    section, timers: true, appAlias: 'vm-one', method: 'vm',
    status: { status: 'running' }, appDetail: { service: { extend_method: 'vm' }, vm_profile: {} }, pluginsList: [],
    dispatch: action => {
      requests.push(action);
      if (action.type === 'appControl/fetchOperationLog') action.callback({ status_code: 200, list: records, has_next: false });
    }
  });
  instance.setState = (change, callback) => {
    instance.state = { ...instance.state, ...(typeof change === 'function' ? change(instance.state) : change) };
    if (callback) callback();
  };
  instance.handleTimers = (name, callback, delay) => schedules.push({ name, callback, delay });
  return { instance, records, requests, schedules };
}

test('operations-only overview loads the original service events without resource, pod or VNC reads', () => {
  const h = harness();
  h.instance.componentDidMount();
  assert.deepEqual(h.requests.map(request => request.type), ['appControl/fetchOperationLog']);
  assert.deepEqual(JSON.parse(JSON.stringify(h.requests[0].payload)), {
    team_name: 'team-a', app_alias: 'vm-one', target: 'service', page: 1, page_size: 6
  });
  const view = h.instance.render();
  assert.equal(view.type, 'OperationRecord');
  assert.equal(view.props.logList, h.records);
  assert.equal(view.props.recordLoading, false);
  assert.equal(view.props.onLogPush, h.instance.onLogPush);
  assert.equal(view.props.handleNextPage, h.instance.handleNextPage);
  assert.equal(h.schedules.length, 1);
  assert.equal(h.schedules[0].name, 'fetchOperationLogTimer');
  h.instance.componentWillUnmount();
});

test('operations-only status and plugin updates do not add overview/VNC/storage requests', () => {
  const h = harness();
  h.instance.componentDidMount();
  let profileReads = 0, storageReads = 0;
  h.instance.refreshVMProfileForVNC = () => { profileReads += 1; };
  h.instance.loadStorageUsageIfNeeded = () => { storageReads += 1; };
  const previous = h.instance.props;
  h.instance.props = { ...previous, status: { status: 'starting' }, pluginsList: [{}] };
  h.instance.componentDidUpdate(previous);
  assert.equal(profileReads, 0);
  assert.equal(storageReads, 0);
  assert.equal(h.requests.length, 1);
  let versionReads = 0;
  h.instance.getVersionList = () => { versionReads += 1; };
  h.instance.onAction('restart');
  assert.equal(versionReads, 0);
  assert.deepEqual(h.requests.map(request => request.type), ['appControl/fetchOperationLog', 'appControl/fetchOperationLog']);
  h.instance.componentWillUnmount();
});

test('the default overview retains its original reads and all normal overview sections', () => {
  const h = harness(undefined);
  h.instance.props = { ...h.instance.props, section: undefined };
  const reads = [];
  h.instance.fetchPods = () => reads.push('pods');
  h.instance.fetchOperationLog = () => reads.push('events');
  h.instance.loadStorageUsageIfNeeded = () => reads.push('storage');
  h.instance.load();
  assert.deepEqual(reads, ['pods', 'events', 'storage']);
  h.instance.state.logList = h.records;
  const view = h.instance.render();
  assert.equal(view.type, React.Fragment);
  const children = React.Children.toArray(view.props.children);
  assert.ok(children.some(child => child.type === 'Basic'));
  assert.ok(children.some(child => child.type === 'VMProfilePanel'));
  assert.ok(children.some(child => child.type === 'OperationRecord' && child.props.logList === h.records));
});
