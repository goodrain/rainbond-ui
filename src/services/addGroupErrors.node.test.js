const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const parser = require('@babel/parser');
const axiosModule = require('axios');

const srcRoot = path.resolve(__dirname, '..');
const affectedPages = [
  ['components/HelmCmdForm/index.js'],
  ['components/GitRepostory/index.js'],
  ['components/MarketModal/index.js', 'addAppLoading'],
  ['layouts/MarketPlaceInstallApp.js', 'isShare'],
  ['pages/Create/image-compose.js'],
  ['pages/Create/yaml-yaml.js'],
  ['pages/Create/jwar.js'],
  ['pages/Create/outer-custom.js'],
  ['pages/Create/code-custom.js'],
  ['pages/Create/image-name.js'],
  ['pages/Create/market.js', 'isShare'],
  ['pages/Create/database-config.js'],
  ['pages/Explore/Detail.js', 'submitLoading'],
  ['components/CreateComponentModal/index.js', 'marketSubmitLoading', 0, 4],
  ['components/CreateComponentModal/index.js', 'localSubmitLoading', 1, 4],
  ['components/CreateComponentModal/index.js', undefined, 2, 4],
  ['components/CreateComponentModal/index.js', undefined, 3, 4]
];

function readSource(file) {
  return fs.readFileSync(path.join(srcRoot, file), 'utf8');
}

function parse(source) {
  return parser.parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'decorators-legacy']
  });
}

function withoutImports(source) {
  const imports = parse(source).program.body.filter(node => node.type === 'ImportDeclaration');
  return imports.reverse().reduce(
    (result, node) => result.slice(0, node.start) + result.slice(node.end),
    source
  );
}

function findCreationErrorHandler(file, index = 0, count = 1) {
  const source = readSource(file);
  const ast = parse(source);
  const handlers = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'ObjectExpression' && node.properties.some(
      property => property.key?.name === 'type' && property.value?.value === 'application/addGroup'
    )) {
      const handler = node.properties.find(property => property.key?.name === 'handleError');
      if (handler) handlers.push(source.slice(handler.value.start, handler.value.end));
    }
    Object.values(node).forEach(value => {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    });
  }
  visit(ast);
  assert.strictEqual(handlers.length, count, `${file} must retain its application creation error handlers`);
  assert.ok(ast.program.body.some(node =>
    node.type === 'ImportDeclaration' && node.source.value.endsWith('/utils/applicationCreationError') &&
    node.specifiers.some(specifier => specifier.local.name === 'handleApplicationCreationError')
  ), `${file} must import its error presenter`);
  return handlers[index];
}

const notifications = [];
const modals = [];
const storeActions = [];
const notification = {
  warning: value => notifications.push(value),
  error: value => notifications.push(value)
};
const formatMessage = ({ id }) => id;
const handleAPIError = new Function(
  'notification', 'formatMessage', 'errorMessage',
  `${withoutImports(readSource('utils/error.js')).replace('export default function', 'function')}\nreturn handleAPIError;`
)(notification, formatMessage, require('../utils/errorMessage'));
const handleApplicationCreationError = new Function(
  'notification', 'formatMessage', 'handleAPIError',
  `${withoutImports(readSource('utils/applicationCreationError.js')).replace('export default function', 'function')}\nreturn handleApplicationCreationError;`
)(notification, formatMessage, handleAPIError);

const axios = axiosModule.create({ proxy: false });
axios.isCancel = axiosModule.isCancel;
axios.interceptors.request.use(config => {
  // No login session is needed for the local fixture server.
  Object.keys(config.headers).forEach(name => {
    if (config.headers[name] === undefined) delete config.headers[name];
  });
  return config;
});
const requestDependencies = {
  notification,
  Modal: { error: value => modals.push(value) },
  axios,
  handleAPIError,
  formatMessage,
  globalUtil: { getCurrRegionName: () => 'region', getCurrTeamName: () => 'team' },
  cookie: { get: () => undefined },
  updateRenewedTokenFromResponse: () => {},
  history: {},
  getDvaApp: () => ({ _store: { dispatch: action => storeActions.push(action) } }),
  captureRequestError: () => {},
  finishSlowRequestTracking: () => {},
  startSlowRequestTracking: () => {},
  captureErrorViewed: () => {},
  trackSlowRequestLifecycle: require('../utils/requestSlowTelemetry').trackSlowRequestLifecycle,
  renderPreflightContent: () => {}
};
const request = new Function(
  ...Object.keys(requestDependencies),
  `${withoutImports(readSource('utils/request.js')).replace('export default function', 'function')}\nreturn request;`
)(...Object.values(requestDependencies));

const serviceSource = readSource('services/application.js');
const serviceNode = parse(serviceSource).program.body.find(
  node => node.type === 'ExportNamedDeclaration' && node.declaration?.id?.name === 'addGroup'
).declaration;
const apiconfig = { baseUrl: '' };
const addGroup = new Function(
  'request', 'apiconfig',
  `${serviceSource.slice(serviceNode.start, serviceNode.end)}\nreturn addGroup;`
)(request, apiconfig);
const modelSource = readSource('models/application.js');
const model = parse(modelSource).program.body.find(
  node => node.type === 'ExportDefaultDeclaration'
).declaration;
const effectNode = model.properties.find(node => node.key.name === 'effects')
  .value.properties.find(node => node.key.name === 'addGroup');
const addGroupEffect = new Function(
  'addGroup', `return ({ ${modelSource.slice(effectNode.start, effectNode.end)} }).addGroup;`
)(addGroup);

async function createApplication(handleError) {
  let successCalls = 0;
  const effect = addGroupEffect({
    payload: { team_name: 'team', region_name: 'region', group_name: 'demo', k8s_app: 'demo' },
    handleError,
    callback: () => { successCalls += 1; }
  }, { call: (fn, ...args) => fn(...args) });
  const response = await effect.next().value;
  assert.strictEqual(effect.next(response).done, true);
  assert.strictEqual(successCalls, 0, 'failed application creation must not continue installation');
}

let httpRequests = 0;
let failure = 'http';
const server = http.createServer((req, res) => {
  httpRequests += 1;
  req.resume();
  if (failure === 'network') {
    req.socket.destroy();
    return;
  }
  res.writeHead(400, { 'Content-Type': 'application/json' });
  const code = { http: 21003, preflight: 10412, login: 10405 }[failure];
  res.end(JSON.stringify({ code, msg_show: 'Application English name already exists' }));
});

(async () => {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    apiconfig.baseUrl = `http://127.0.0.1:${server.address().port}`;
    for (const scenario of ['http', 'network', 'preflight', 'login']) {
      failure = scenario;
      const centrallyPresented = failure === 'preflight' || failure === 'login';
      notifications.length = 0;
      await createApplication();
      assert.strictEqual(notifications.length, centrallyPresented ? 0 : 1,
        `default callers must retain the existing ${failure} presentation`);
      for (const [file, loadingField, index, count] of affectedPages) {
        notifications.length = 0;
        modals.length = 0;
        storeActions.length = 0;
        const state = { [loadingField]: true };
        let resets = 0;
        const page = {
          setState(update) {
            Object.assign(state, update);
            resets += 1;
          }
        };
        const setLoading = field => value => {
          state[field] = value;
          resets += 1;
        };
        const callbackDependencies = {
          handleApplicationCreationError,
          setAddAppLoading: setLoading('addAppLoading'),
          setMarketSubmitLoading: setLoading('marketSubmitLoading'),
          setLocalSubmitLoading: setLoading('localSubmitLoading')
        };
        const handleError = new Function(
          ...Object.keys(callbackDependencies), `return (${findCreationErrorHandler(file, index, count)});`
        ).call(page, ...Object.values(callbackDependencies));
        await createApplication(handleError);
        assert.strictEqual(notifications.length, centrallyPresented ? 0 : 1,
          `${file} must display ${failure} failures once without duplicate notifications`);
        if (!centrallyPresented) {
          assert.strictEqual(notifications[0].message,
            failure === 'network' ? 'utils.request.warning' : 'Application English name already exists', file);
          if (failure === 'network') {
            assert.strictEqual(notifications[0].description, 'utils.request.server_error', file);
          }
        }
        assert.strictEqual(modals.length, failure === 'preflight' ? 1 : 0, file);
        assert.strictEqual(storeActions.filter(action => action.type === 'global/showNeedLogin').length,
          failure === 'login' ? 1 : 0, file);
        if (failure === 'preflight') {
          assert.strictEqual(modals[0].title, '暂不能安装', file);
        }
        if (loadingField) {
          assert.strictEqual(state[loadingField], false, `${file} must reset its loading state after ${failure} failure`);
          assert.strictEqual(resets, 1, `${file} must retain its existing loading cleanup`);
        }
      }
    }
    assert.strictEqual(httpRequests, 4 * (affectedPages.length + 1));
    console.log('application creation errors: all 17 callbacks handle HTTP, network, preflight and login failures once and retain loading cleanup');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
