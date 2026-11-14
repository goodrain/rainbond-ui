const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const babel = require('@umijs/deps/compiled/babel/core');

const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator });
global.requestAnimationFrame = window.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = window.cancelAnimationFrame = clearTimeout;
const oldChannel = global.MessageChannel;
global.MessageChannel = undefined;
const React = require('react');
const ReactDOM = require('react-dom');
const { act, Simulate } = require('react-dom/test-utils');
global.MessageChannel = oldChannel;
const Form = require('antd/lib/form').default;
const Select = require('antd/lib/select').default;
const Input = require('antd/lib/input').default;
const InputNumber = require('antd/lib/input-number').default;
const Radio = require('antd/lib/radio').default;

const Box = ({ children, title }) => React.createElement('div', null, title, children);
const Steps = Box;
Steps.Step = Box;
const Descriptions = Box;
Descriptions.Item = ({ label, children }) => React.createElement('div', { 'data-description': label }, children);
const antd = {
  Form, Select, Input, InputNumber, Radio, Steps, Descriptions,
  Card: Box,
  Button: ({ children, onClick, disabled }) => React.createElement('button', { type: 'button', onClick, disabled }, children),
  Alert: ({ message }) => React.createElement('div', { role: 'alert' }, message)
};
const filename = path.join(__dirname, 'CreateVm.js');
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
  filename, babelrc: false, configFile: false,
  presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
    require('@umijs/deps/compiled/babel/preset-react').default],
  plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
}).code;
const exportsObject = {};
vm.runInNewContext(code, { exports: exportsObject, require: name => {
  if (name === '../../components/VMStorageSnapshotHint') {
    const hintFile = path.resolve(__dirname, '../../components/VMStorageSnapshotHint/index.js');
    const hintCode = babel.transformSync(fs.readFileSync(hintFile, 'utf8'), { filename: hintFile, babelrc: false, configFile: false,
      presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }], require('@umijs/deps/compiled/babel/preset-react').default] }).code;
    const hintExports = {}; vm.runInNewContext(hintCode, { exports: hintExports, require: dependency => dependency === 'react' ? React : dependency === 'antd' ? antd : { formatMessage: ({ id }) => id } });
    return hintExports.default;
  }
  if (name === 'react') return React;
  if (name === 'antd') return antd;
  if (name === './messages') return { t: key => key };
  if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
  if (name === './state') return require('./state');
  if (name === './index.less') return {};
  if (name === './HelpLabel') return ({ label }) => React.createElement('span', null, label);
  throw new Error(`Unexpected dependency ${name}`);
} }, { filename });
const CreateVm = exportsObject.default;
const flush = () => new Promise(resolve => setImmediate(resolve));
const ready = { status: 'ready', options: [{ value: 'ceph-rbd', label: 'Ceph block storage' }, { value: 'local-ssd', label: 'Local SSD' }] };

async function mounted(storage) {
  const root = document.getElementById('root');
  const submissions = [], retries = [], backs = [], abandons = [];
  const source = { name: 'native-name', sourceType: 'url', sourceName: 'installer.iso', os: 'Windows Server 2025', isIso: true };
  let instance;
  const render = (creationStorage, sourceSummary = source) => {
    act(() => { ReactDOM.render(React.createElement(CreateVm, {
      sourceSummary, creationStorage, onRetryStorage: () => retries.push(true),
      onBackToSource: () => backs.push(true), onCancel: () => abandons.push(true),
      onCreate: values => submissions.push(values),
      wrappedComponentRef: value => { instance = value; }
    }), root); });
  };
  render(storage);
  await flush();
  return { root, get instance() { return instance; }, submissions, retries, backs, abandons, source, render };
}
const button = (root, text) => [...root.querySelectorAll('button')].find(node => node.textContent === text);
test.afterEach(() => { act(() => { ReactDOM.unmountComponentAtNode(document.getElementById('root')); }); });
test.after(() => dom.window.close());

for (const status of ['loading', 'empty', 'failed']) {
  test(`storage ${status} blocks Next and final submission; failure states expose a retry`, async () => {
    const fixture = await mounted({ status, options: [] });
    assert.equal(button(fixture.root, 'next').disabled, true);
    act(() => fixture.instance.next());
    act(() => fixture.instance.submit());
    await flush();
    assert.equal(fixture.instance.state.step, 0);
    assert.equal(fixture.submissions.length, 0);
    if (status !== 'loading') {
      const retry = button(fixture.root, 'creationStorageRetry');
      assert.ok(retry);
      act(() => Simulate.click(retry));
      assert.equal(fixture.retries.length, 1);
    }
  });
}

test('ready storage requires a real offered value, confirms its label and submits its actual type', async () => {
  const fixture = await mounted(ready);
  act(() => fixture.instance.next());
  await flush();
  assert.equal(fixture.instance.state.step, 0);
  act(() => fixture.instance.props.form.setFieldsValue({ disk_volume_type: 'invented-type' }));
  act(() => fixture.instance.next());
  await flush();
  assert.equal(fixture.instance.state.step, 0);
  act(() => fixture.instance.props.form.setFieldsValue({ disk_volume_type: 'ceph-rbd' }));
  act(() => fixture.instance.next());
  await flush();
  assert.equal(fixture.instance.state.step, 1);
  assert.ok(fixture.root.querySelector('[data-description=systemDisk]').textContent.includes('Ceph block storage'));
  assert.equal(fixture.root.textContent.includes('quickStartPlatformStorage'), false);
  act(() => fixture.instance.submit());
  await flush();
  assert.equal(fixture.submissions.length, 1);
  assert.equal(fixture.submissions[0].disk_volume_type, 'ceph-rbd');
});

test('new storage options and a changed native source discard the old selection', async () => {
  const fixture = await mounted(ready);
  act(() => fixture.instance.props.form.setFieldsValue({ disk_volume_type: 'ceph-rbd' }));
  fixture.render({ status: 'ready', options: [{ value: 'local-ssd', label: 'Local SSD' }] });
  await flush();
  assert.equal(fixture.instance.props.form.getFieldValue('disk_volume_type'), undefined);
  act(() => fixture.instance.props.form.setFieldsValue({ disk_volume_type: 'local-ssd' }));
  fixture.render(ready, { ...fixture.source, sourceName: 'other.iso' });
  await flush();
  assert.equal(fixture.instance.props.form.getFieldValue('disk_volume_type'), undefined);
  assert.equal(fixture.instance.state.step, 0);
});

test('legacy deferred storage stays visibly unconfirmed, allows Next and submits no invented type', async () => {
  const fixture = await mounted({ status: 'deferred', options: [] });
  assert.equal(fixture.root.querySelector('input[readonly]').value, 'creationStorageDeferred');
  assert.ok(fixture.root.textContent.includes('creationStorageDeferredHelp'));
  assert.equal(fixture.root.textContent.includes('quickStartStorageHelp'), false);
  assert.equal(button(fixture.root, 'next').disabled, false);
  assert.equal(fixture.root.querySelectorAll('input[type=checkbox]').length, 0);
  assert.ok(fixture.root.textContent.includes('dataDiskAfterCreation'));
  act(() => fixture.instance.next());
  await flush();
  assert.equal(fixture.instance.state.step, 1);
  assert.ok(fixture.root.querySelector('[data-description=systemDisk]').textContent.includes('creationStorageDeferred'));
  act(() => fixture.instance.submit());
  await flush();
  assert.equal(fixture.submissions.length, 1);
  assert.equal(Object.hasOwn(fixture.submissions[0], 'disk_volume_type'), false);
});

test('a sole actual storage defaults safely and the same unsupported hint survives confirmation', async () => {
  const fixture = await mounted({ status: 'ready', options: [{ value: 'pool-a', label: 'Real storage',
    snapshotCapability: { state: 'supported', reasonCode: 'native_ready' },
    managedSnapshotCapability: { state: 'unsupported', reasonCode: 'managed_driver_unsupported' } }] });
  assert.equal(fixture.instance.props.form.getFieldValue('disk_volume_type'), 'pool-a');
  assert.ok(fixture.root.textContent.includes('vmStorageSnapshot.creation.unsupported'));
  act(() => fixture.instance.next());
  await flush();
  assert.equal(fixture.instance.state.step, 1);
  assert.ok(fixture.root.textContent.includes('vmStorageSnapshot.creation.unsupported'));
  assert.equal(button(fixture.root, 'createAndStart').disabled, false);
  act(() => fixture.instance.submit());
  await flush();
  assert.equal(fixture.submissions[0].disk_volume_type, 'pool-a');
});

test('four native preset choices update the canonical numeric fields and survive review/back with disk and storage', async () => {
  const fixture = await mounted(ready);
  assert.equal(fixture.instance.props.form.getFieldValue('cpu'), 4);
  assert.equal(fixture.instance.props.form.getFieldValue('memory'), 8);
  assert.equal(fixture.instance.props.form.getFieldValue('disk'), 80);
  assert.equal(fixture.instance.state.resourcePreset, '4c8g');
  act(() => fixture.instance.props.form.setFieldsValue({ disk: 120, disk_volume_type: 'ceph-rbd' }));
  for (const [key, cpu, memory] of [['2c2g', 2, 2], ['2c4g', 2, 4], ['4c8g', 4, 8], ['4c16g', 4, 16]]) {
    act(() => fixture.instance.selectResourcePreset({ target: { value: key } }));
    await flush();
    assert.equal(fixture.instance.props.form.getFieldValue('cpu'), cpu);
    assert.equal(fixture.instance.props.form.getFieldValue('memory'), memory);
    act(() => fixture.instance.next());
    await flush();
    assert.equal(fixture.instance.state.step, 1);
    assert.ok(fixture.root.querySelector('[data-description=resources]').textContent.includes(`${cpu} vcpuUnit / ${memory} GiB`));
    assert.equal(fixture.root.querySelector('[data-description=operatingSystem]').textContent, 'Windows Server 2025');
    act(() => Simulate.click(button(fixture.root, 'previous')));
    await flush();
    assert.equal(fixture.instance.state.step, 0);
    assert.equal(fixture.instance.state.resourcePreset, key);
    assert.equal(fixture.instance.props.form.getFieldValue('disk'), 120);
    assert.equal(fixture.instance.props.form.getFieldValue('disk_volume_type'), 'ceph-rbd');
  }
  assert.equal(fixture.submissions.length, 0);
});

test('custom core/GiB values remain in the original fields and review/back preserves the full resource selection', async () => {
  const fixture = await mounted(ready);
  act(() => fixture.instance.selectResourcePreset({ target: { value: 'custom' } }));
  act(() => fixture.instance.props.form.setFieldsValue({ cpu: 6, memory: 12, disk: 100, disk_volume_type: 'local-ssd' }));
  act(() => fixture.instance.next());
  await flush();
  assert.equal(fixture.instance.state.step, 1);
  assert.equal(fixture.instance.state.resourcePreset, 'custom');
  act(() => Simulate.click(button(fixture.root, 'previous')));
  await flush();
  for (const [field, value] of Object.entries({ cpu: 6, memory: 12, disk: 100, disk_volume_type: 'local-ssd' }))
    assert.equal(fixture.instance.props.form.getFieldValue(field), value);
  act(() => fixture.instance.next());
  await flush();
  act(() => fixture.instance.submit());
  await flush();
  assert.deepEqual(JSON.parse(JSON.stringify(fixture.submissions[0])), { cpu: 6, memory: 12, disk: 100, disk_volume_type: 'local-ssd' });
});

test('noninteger and out-of-range canonical resource values cannot proceed', async () => {
  const fixture = await mounted(ready);
  act(() => fixture.instance.props.form.setFieldsValue({ disk_volume_type: 'ceph-rbd' }));
  for (const invalid of [{ cpu: 1.5 }, { cpu: 0 }, { cpu: 65 }, { memory: 0.5 }, { memory: 257 }, { disk: 19 }, { disk: 2049 }, { disk: 20.5 }]) {
    act(() => fixture.instance.props.form.setFieldsValue({ cpu: 4, memory: 8, disk: 80, ...invalid }));
    act(() => fixture.instance.next());
    await flush();
    assert.equal(fixture.instance.state.step, 0);
    assert.equal(fixture.submissions.length, 0);
  }
});

test('preset changes are ignored while creation is submitting', async () => {
  const fixture = await mounted(ready);
  fixture.instance.props = { ...fixture.instance.props, submitting: true };
  act(() => fixture.instance.selectResourcePreset({ target: { value: '2c2g' } }));
  assert.equal(fixture.instance.state.resourcePreset, '4c8g');
  assert.equal(fixture.instance.props.form.getFieldValue('cpu'), 4);
  assert.equal(fixture.instance.props.form.getFieldValue('memory'), 8);
});

test('the native footer abandons or returns to source without submitting a VM', async () => {
  const fixture = await mounted(ready);
  act(() => Simulate.click(button(fixture.root, 'previous')));
  act(() => Simulate.click(button(fixture.root, 'abandonCreation')));
  assert.equal(fixture.backs.length, 1);
  assert.equal(fixture.abandons.length, 1);
  assert.equal(fixture.submissions.length, 0);
});
