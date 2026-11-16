const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const babel = require('@umijs/deps/compiled/babel/core');

function load(relative, dependencies) {
  const filename = path.resolve(__dirname, relative);
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, babelrc: false, configFile: false, presets: [
      [require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
      require('@umijs/deps/compiled/babel/preset-react').default
    ]
  }).code;
  const exports = {};
  vm.runInNewContext(code, { exports, require: dependency => {
    if (dependency in dependencies) return dependencies[dependency];
    throw new Error(`Unexpected dependency: ${dependency}`);
  } }, { filename });
  return exports;
}

function page() {
  const actions = [], modals = [], notices = [];
  const Component = load('index.js', {
    react: require('react'), antd: { Modal: { confirm: options => modals.push(options) },
      notification: { success: value => notices.push(value) } },
    dva: { connect: () => component => component }, '@/utils/intl': { formatMessage: ({ id }) => id },
    '../../layouts/PageHeaderLayout': () => null
  }).ComponentRecycle;
  const props = team => ({ match: { params: { teamName: team, regionName: 'region' } },
    dispatch: action => { actions.push(action); return Promise.resolve(); } });
  const component = new Component(props('a'));
  component.setState = (value, callback) => { component.state = { ...component.state, ...value }; if (callback) callback(); };
  const change = team => { const previous = component.props; component.props = props(team); component.componentDidUpdate(previous); };
  component.componentDidMount();
  return { component, actions, modals, notices, change };
}

test('list responses from an earlier team visit cannot appear after A to B to A navigation', () => {
  const h = page(), first = h.actions[0];
  h.change('b'); h.change('a');
  first.callback({ items: [{ service_id: 'stale' }], total: 1 });
  assert.equal(h.component.state.items.length, 0);
  const current = h.actions.at(-1);
  current.callback({ items: [{ service_id: 'current' }], total: 1 });
  assert.equal(h.component.state.items[0].service_id, 'current');
  h.component.componentWillUnmount();
  current.handleError({ msg_show: 'late failure' });
  assert.equal(h.component.state.error, '');
});

test('a confirmation opened before changing team cannot mutate or notify the new visit', async () => {
  const h = page();
  h.component.confirm('purge', { service_id: 'original', service_cname: 'Original' });
  const confirmation = h.modals[0];
  h.change('b'); h.change('a');
  await confirmation.onOk();
  assert.equal(h.actions.filter(action => action.type.endsWith('/purge')).length, 0);
  assert.equal(h.notices.length, 0);
});

test('a failed restore retains the displayed record and does not report success', async () => {
  const h = page(), row = { service_id: 'original', service_cname: 'Original' };
  h.actions[0].callback({ items: [row], total: 1 });
  h.component.confirm('restore', row);
  await h.modals[0].onOk();
  const action = h.actions.at(-1);
  assert.equal(action.type, 'componentRecycle/restore');
  action.handleError({ msg_show: 'Original disk unavailable' });
  assert.equal(h.component.state.items[0], row);
  assert.equal(h.component.state.busy, '');
  assert.equal(h.component.state.error, 'Original disk unavailable');
  assert.equal(h.notices.length, 0);
});

async function effect(response, operation = 'list', shouldApply = () => true) {
  const callbacks = [], errors = [];
  const model = load('../../models/componentRecycle.js', {
    '../services/componentRecycle': { recycleRequest: async () => response }
  }).default;
  const action = { payload: { service_id: 'original' }, shouldApply,
    callback: value => callbacks.push(value), handleError: value => errors.push(value) };
  const iterator = model.effects[operation](action, { call: (fn, ...args) => fn(...args) });
  let next = iterator.next();
  while (!next.done) next = iterator.next(await next.value);
  return { callbacks, errors };
}

test('invalid list responses and mismatched restore identities are failures, never empty success', async () => {
  for (const response of [undefined, { status_code: 200, business_code: 200, list: {}, total: 1 },
    { status_code: 200, business_code: 200, list: [], total: -1 }, { status_code: 200, business_code: 409 }]) {
    const result = await effect(response);
    assert.equal(result.errors.length, 1); assert.equal(result.callbacks.length, 0);
  }
  const result = await effect({ status_code: 200, business_code: 200, bean: { service_id: 'other' } }, 'restore');
  assert.equal(result.errors.length, 1); assert.equal(result.callbacks.length, 0);
  const valid = await effect({ status_code: 200, business_code: 200, list: [], total: 0 });
  assert.equal(valid.callbacks.length, 1); assert.equal(valid.errors.length, 0);
});

test('requests preserve explicit team and region and never send mutations for invalid identities', () => {
  const requests = [];
  const request = load('../../services/componentRecycle.js', {
    '../../config/api.config': { baseUrl: '/backend' }, '../utils/request': (url, options) => requests.push({ url, options })
  }).recycleRequest;
  const scope = { team_name: 'team-a', region_name: 'region-a', service_id: 'original' };
  request(scope, 'restore', () => {}, () => true);
  assert.equal(requests[0].url, '/backend/console/teams/team-a/recycle-bin/original/restore');
  assert.equal(requests[0].options.params.region_name, 'region-a');
  assert.equal(requests[0].options.method, 'post');
  assert.throws(() => request({ ...scope, service_id: '../other' }, 'purge'));
  assert.throws(() => request({ ...scope, team_name: '' }, 'restore'));
  request(scope, 'purge', () => {}, () => false);
  assert.equal(requests.length, 1);
});
