const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { test } = require('node:test');
const React = require('react');
const babel = require('@umijs/deps/compiled/babel/core');

const root = path.resolve(__dirname, '../../..');

function load(file, mocks = {}) {
  const filename = path.resolve(root, file);
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [
      [require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
      require('@umijs/deps/compiled/babel/preset-react').default
    ],
    plugins: [
      [require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
      [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]
    ]
  }).code;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: name => {
      if (mocks[name]) return mocks[name];
      if (name === 'react') return React;
      if (name === 'dva') return { connect: () => Component => Component };
      if (name === 'antd') return {
        Form: { create: () => Component => Component },
        Select: { Option: () => null }
      };
      if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
      if (name === '@/utils/cookie') return { get: () => 'zh-CN' };
      if (name.endsWith('/global')) return { getCurrTeamName: () => 'team' };
      return {};
    }
  }, { filename });
  return exports.default || exports;
}

async function runEffect(model, action) {
  const iterator = model.effects.handleApiGateway(action, { call: (fn, ...args) => fn(...args) });
  let step = iterator.next();
  while (!step.done) {
    try {
      step = iterator.next(await step.value);
    } catch (error) {
      step = iterator.throw(error);
    }
  }
  return step.value;
}

const flush = () => new Promise(resolve => setImmediate(resolve));

function harness(outcomes, options = {}) {
  const notices = [];
  const requests = [];
  const antd = {
    Form: { create: () => Component => Component },
    Select: { Option: () => null },
    notification: {
      error: notice => notices.push({ type: 'error', ...notice }),
      success: notice => notices.push({ type: 'success', ...notice }),
      warning: notice => notices.push({ type: 'warning', ...notice })
    }
  };
  const service = load('src/services/gateWay.js', {
    '../../config/api.config': { baseUrl: '' },
    '../utils/request': async (url, request) => {
      requests.push({ url, data: JSON.parse(JSON.stringify(request.data)) });
      const outcome = outcomes.shift();
      if (outcome && outcome.reject) throw outcome.reject;
      if (outcome && outcome.error) {
        // request.js passes Axios errors to handleError and resolves without a response.
        request.handleError(outcome.error);
        return undefined;
      }
      return outcome && outcome.pending ? outcome.pending : outcome;
    }
  });
  const model = load('src/models/gateWay.js', { '../services/gateWay': service });
  const Gateway = load('src/components/GatewayRouteHttp/index.js', { antd });
  const Drawer = load('src/components/RouteDrawerHttp/index.js', { antd });
  const values = {
    hosts: ['example.com'], paths: ['/*'], remoteAddrs: ['not-an-ip'],
    type: 'k8s', comListInfo: [{ name: 'demo', port: 80, weight: 100 }]
  };
  let drawer;
  let unmounted = false;
  const gateway = new Gateway({
    appID: 1,
    type: 'http',
    dispatch: action => {
      if (options.dispatchError) throw options.dispatchError;
      return runEffect(model, action);
    }
  });
  gateway.state.routeDrawer = true;
  gateway.setState = (update, callback) => {
    Object.assign(gateway.state, update);
    if (update.routeDrawer === false && options.unmountOnSuccess) {
      unmounted = true;
      drawer.componentWillUnmount();
    }
    if (callback) callback();
  };
  let refreshes = 0;
  gateway.getTableData = () => { refreshes += 1; };
  drawer = new Drawer({
    editInfo: { name: '1|example-route', match: { remoteAddrs: ['203.0.113.10'] } },
    form: { validateFieldsAndScroll: callback => callback(null, values) },
    onOk: gateway.addOrEditApiGateway
  });
  let lateUpdates = 0;
  drawer.setState = update => {
    if (unmounted) lateUpdates += 1;
    Object.assign(drawer.state, update);
  };
  drawer.state.serviceComponentList = [{ k8s_service_name: 'demo', service_alias: 'demo' }];
  drawer.state.formRefs = (options.plugins || []).map(values => ({
    props: { form: { validateFields: callback => callback(null, values) } }
  }));
  return {
    drawer, gateway, requests, notices, values,
    submit: () => drawer.handleSubmit({ preventDefault() {} }),
    unmount: () => { unmounted = true; drawer.componentWillUnmount(); },
    lateUpdates: () => lateUpdates,
    refreshes: () => refreshes
  };
}

for (const target of [
  { uri: '/competition', regex_uri: [undefined] },
  { uri: '', regex_uri: ['^/$', '/competition'] }
]) {
  test(`redirect saves ${target.uri ? 'a fixed URI' : 'a regex URI'} without the disabled HTTPS mode`, async () => {
    const h = harness([{ bean: {} }], {
      plugins: [{
        name: 'redirect', http_to_https: false, ...target,
        ret_code: 302, encode_uri: false, append_query_string: false
      }]
    });
    h.submit();
    await flush();
    assert.strictEqual(h.requests.length, 1);
    const config = h.requests[0].data.plugins[0].config;
    assert.strictEqual(Object.hasOwn(config, 'http_to_https'), false);
    assert.deepStrictEqual(config, {
      ...(target.uri ? { uri: target.uri } : { regex_uri: target.regex_uri }),
      ret_code: 302, encode_uri: false, append_query_string: false
    });
  });
}

test('redirect preserves the enabled HTTPS mode when saving', async () => {
  const h = harness([{ bean: {} }], {
    plugins: [{ name: 'redirect', http_to_https: true, uri: '', regex_uri: [undefined] }]
  });
  h.submit();
  await flush();
  assert.deepStrictEqual(h.requests[0].data.plugins[0].config, { http_to_https: true });
});

test('saving another plugin preserves its disabled boolean settings', async () => {
  const h = harness([{ bean: {} }], {
    plugins: [{ name: 'real-ip', source: 'http_x_forwarded_for', recursive: false }]
  });
  h.submit();
  await flush();
  assert.deepStrictEqual(h.requests[0].data.plugins[0].config, {
    source: 'http_x_forwarded_for', recursive: false
  });
});

test('invalid IP failure releases the button and allows correction in the same editor', async () => {
  const h = harness([
    { error: { response: { status: 400, data: { msg_show: '来源 IP 格式无效', msg: 'invalid source IP' } } } },
    { bean: { name: 'example-route' } }
  ]);
  h.submit();
  await flush();
  assert.strictEqual(h.drawer.state.editHttpStrategyLoading, false);
  assert.strictEqual(h.gateway.state.routeDrawer, true);
  assert.strictEqual(h.values.remoteAddrs[0], 'not-an-ip');
  assert.strictEqual(h.notices[0].message, '来源 IP 格式无效');
  assert.strictEqual(h.refreshes(), 0);
  h.values.remoteAddrs = ['203.0.113.10'];
  h.submit();
  await flush();
  assert.strictEqual(h.requests.length, 2);
  assert.deepStrictEqual(h.requests[1].data.match.remoteAddrs, ['203.0.113.10']);
  assert.strictEqual(h.gateway.state.routeDrawer, false);
  assert.strictEqual(h.drawer.state.editHttpStrategyLoading, false);
  assert.strictEqual(h.refreshes(), 1);
});

test('a handled network error releases the button and preserves the editor', async () => {
  const h = harness([{ error: { message: 'Network Error' } }]);
  h.submit();
  await flush();
  assert.strictEqual(h.drawer.state.editHttpStrategyLoading, false);
  assert.strictEqual(h.gateway.state.routeDrawer, true);
  assert.strictEqual(h.notices.filter(n => n.type === 'error').length, 1);
});

test('an unexpected rejected request is reported once and remains retryable', async () => {
  const h = harness([{ reject: { response: { data: { msg: '保存失败，请重试' } } } }]);
  h.submit();
  await flush();
  assert.strictEqual(h.drawer.state.editHttpStrategyLoading, false);
  assert.strictEqual(h.gateway.state.routeDrawer, true);
  assert.deepStrictEqual(h.notices.map(n => n.message), ['保存失败，请重试']);
});

test('a synchronous dispatch failure releases the button and reports failure', async () => {
  const h = harness([], { dispatchError: new Error('dispatch unavailable') });
  h.submit();
  await flush();
  assert.strictEqual(h.drawer.state.editHttpStrategyLoading, false);
  assert.strictEqual(h.gateway.state.routeDrawer, true);
  assert.strictEqual(h.notices.filter(n => n.type === 'error').length, 1);
});

test('an in-flight save blocks duplicate submissions and clears loading on completion', async () => {
  let complete;
  const h = harness([{ pending: new Promise(resolve => { complete = resolve; }) }]);
  h.values.remoteAddrs = [''];
  h.submit();
  h.submit();
  await flush();
  assert.strictEqual(h.requests.length, 1);
  assert.deepStrictEqual(h.requests[0].data.match.remoteAddrs, []);
  assert.strictEqual(h.drawer.state.editHttpStrategyLoading, true);
  complete({ bean: {} });
  await flush();
  assert.strictEqual(h.drawer.state.editHttpStrategyLoading, false);
  assert.strictEqual(h.refreshes(), 1);
});

test('closing an editor during a pending request causes no state update after unmount', async () => {
  let complete;
  const h = harness([{ pending: new Promise(resolve => { complete = resolve; }) }]);
  h.submit();
  await flush();
  h.unmount();
  complete(undefined);
  await flush();
  assert.strictEqual(h.lateUpdates(), 0);
});

test('success can unmount the editor before the request settles without a late state update', async () => {
  const h = harness([{ bean: {} }], { unmountOnSuccess: true });
  h.submit();
  await flush();
  assert.strictEqual(h.gateway.state.routeDrawer, false);
  assert.strictEqual(h.refreshes(), 1);
  assert.strictEqual(h.lateUpdates(), 0);
});

test('a rejected onOk promise is consumed after releasing loading', async () => {
  const h = harness([]);
  h.drawer.props.onOk = () => Promise.reject(new Error('save failed'));
  h.submit();
  await flush();
  assert.strictEqual(h.drawer.state.editHttpStrategyLoading, false);
});

test('a synchronous onOk result releases loading as well', async () => {
  const h = harness([]);
  h.drawer.props.onOk = () => undefined;
  h.submit();
  await flush();
  assert.strictEqual(h.drawer.state.editHttpStrategyLoading, false);
});
