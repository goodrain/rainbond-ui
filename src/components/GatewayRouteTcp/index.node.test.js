const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const React = require('react');
const babel = require('@umijs/deps/compiled/babel/core');

const root = path.resolve(__dirname, '../../..');

function load(file, mocks = {}) {
  const filename = path.resolve(root, file);
  const transformed = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
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
  const sandbox = {
    exports,
    require: name => {
      if (mocks[name]) return mocks[name];
      if (name === 'react') return React;
      if (name === 'antd') {
        return { Form: { create: () => Component => Component }, Select: { Option: () => null } };
      }
      if (name === 'dva') return { connect: () => Component => Component };
      if (name.endsWith('/global')) return { getCurrTeamName: () => 'team', getCurrRegionName: () => 'region' };
      return {};
    }
  };
  vm.runInNewContext(transformed, sandbox, { filename });
  return exports;
}

let request;
const service = load('src/services/gateWay.js', {
  '../../config/api.config': { baseUrl: '' },
  '../utils/request': (url, options) => {
    request = { url, options };
  }
});
const Gateway = load('src/components/GatewayRouteTcp/index.js').default;
const Drawer = load('src/components/RouteDrawerTcp/index.js').default;

for (const protocol of ['tcp', 'udp', 'tcp+udp']) {
  request = undefined;
  const gateway = new Gateway({
    dispatch: action => service.fetchEditTcpService(action.payload),
    appID: 1
  });
  const drawer = new Drawer({
    editInfo: {},
    form: {
      validateFieldsAndScroll: callback => callback(null, {
        service_id: 'mixed-svc:53',
        ingressPort: '30053',
        protocol
      })
    },
    onOk: gateway.addOrEditApiGateway
  });
  drawer.state.comList = [{ service_name: 'mixed-svc', port: 53, app_id: 1 }];
  drawer.handleSubmit({ preventDefault() {} });

  assert.ok(request, `request should be sent for ${protocol}`);
  const url = new URL(request.url, 'http://localhost');
  assert.strictEqual(url.searchParams.get('action'), 'create');
  assert.strictEqual(request.options.method, 'post');
  assert.strictEqual(request.options.data.protocol, protocol);
  assert.strictEqual(request.options.data.backend.serviceName, 'mixed-svc');
  assert.strictEqual(request.options.data.backend.servicePort, 53);
  assert.strictEqual(request.options.data.match.ingressPort, 30053);
  console.log(`ok - create gateway route with ${protocol}`);
}
