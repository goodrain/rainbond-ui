const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const parser = require('@babel/parser');
const { trackSlowRequestLifecycle } = require('../utils/requestSlowTelemetry');

const sourceRoot = path.resolve(__dirname, '..');
const inputMarker = 'PUBLIC_INPUT_SENTINEL';

function parse(source) {
  return parser.parse(source, { sourceType: 'module' });
}

function loadService(file, name, request) {
  const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const declaration = parse(source).program.body.find(node =>
    node.type === 'ExportNamedDeclaration' && node.declaration?.id?.name === name
  ).declaration;
  return new Function('request', 'apiconfig',
    `${source.slice(declaration.start, declaration.end)}\nreturn ${name};`
  )(request, { baseUrl: '/backend' });
}

function requestHarness(outcome) {
  const calls = { axios: [], notifications: [], modals: [], actions: [], telemetry: [] };
  const axios = options => {
    calls.axios.push(options);
    return outcome(options);
  };
  axios.defaults = {};
  axios.isCancel = () => false;
  const recordTelemetry = name => (...args) => calls.telemetry.push({ name, args });
  const dependencies = {
    notification: {
      warning: value => calls.notifications.push(value),
      error: value => calls.notifications.push(value)
    },
    Modal: { error: value => calls.modals.push(value) },
    axios,
    globalUtil: { getCurrRegionName: () => 'region-a', getCurrTeamName: () => 'team-a' },
    cookie: { get: () => undefined },
    handleAPIError: value => calls.notifications.push(value),
    updateRenewedTokenFromResponse: () => {},
    formatMessage: ({ id }) => id,
    history: {},
    getDvaApp: () => ({ _store: { dispatch: value => calls.actions.push(value) } }),
    captureRequestError: recordTelemetry('request-error'),
    startSlowRequestTracking: recordTelemetry('slow-start'),
    finishSlowRequestTracking: recordTelemetry('slow-finish'),
    captureErrorViewed: recordTelemetry('error-viewed'),
    trackSlowRequestLifecycle,
    renderPreflightContent: value => value
  };
  const source = fs.readFileSync(path.join(sourceRoot, 'utils/request.js'), 'utf8');
  const imports = parse(source).program.body.filter(node => node.type === 'ImportDeclaration');
  const executable = imports.reverse().reduce(
    (value, node) => value.slice(0, node.start) + value.slice(node.end), source
  ).replace('export default function', 'function');
  const request = new Function(...Object.keys(dependencies), `${executable}\nreturn request;`)(
    ...Object.values(dependencies)
  );
  return { request, calls };
}

function echoedFailure(options, code = 400) {
  const error = new Error(inputMarker);
  error.name = inputMarker;
  error.code = inputMarker;
  error.config = options;
  error.response = {
    status: 400,
    config: options,
    data: { code, msg_show: inputMarker, data: { bean: { summary: inputMarker } } }
  };
  return error;
}

test('VM create forwards the explicit Linux/public-key contract and its failure handler', async () => {
  let captured;
  const handleError = () => {};
  const createVM = loadService('createApp.js', 'createAppByVirtualMachine', (url, options) => {
    captured = { url, options };
    return Promise.resolve({ bean: { service_alias: 'vm-a' } });
  });
  await createVM({
    team_name: 'team-a', group_id: 7, service_cname: 'vm-a',
    source_type: 'url', format: 'qcow2', arch: 'amd64',
    vm_url: 'https://images.invalid/disk.qcow2',
    os_name: 'Ubuntu 24.04', os_family: 'linux',
    ssh_username: 'ubuntu', ssh_public_key: inputMarker,
    unexpected_field: 'must-not-be-forwarded', sensitiveError: true
  }, handleError);
  assert.equal(captured.url, '/backend/console/teams/team-a/apps/vm_run');
  assert.equal(captured.options.method, 'post');
  assert.equal(captured.options.handleError, handleError);
  assert.equal(captured.options.sensitiveError, true);
  assert.deepEqual(JSON.parse(JSON.stringify(captured.options.data)), {
    group_id: 7, service_cname: 'vm-a', source_type: 'url', arch: 'amd64',
    vm_url: 'https://images.invalid/disk.qcow2', format: 'qcow2',
    os_name: 'Ubuntu 24.04', os_family: 'linux',
    ssh_username: 'ubuntu', ssh_public_key: inputMarker
  });
});

test('ordinary VM payloads do not gain SSH or guest metadata fields', async () => {
  let options;
  const createVM = loadService('createApp.js', 'createAppByVirtualMachine', (_, value) => {
    options = value;
  });
  await createVM({ team_name: 'team-a', source_type: 'upload', format: 'iso' });
  assert.deepEqual(JSON.parse(JSON.stringify(options.data)), { source_type: 'upload', format: 'iso' });
  assert.equal(options.sensitiveError, false);
});

test('build sensitivity is a request option and never becomes build data', async () => {
  const calls = [];
  const build = loadService('createApp.js', 'buildApp', (url, options) => calls.push({ url, options }));
  const handleError = () => {};
  await build({ team_name: 'team-a', app_alias: 'vm-a', is_deploy: true, sensitiveError: true }, handleError);
  assert.equal(calls[0].url, '/backend/console/teams/team-a/apps/vm-a/build');
  assert.equal(calls[0].options.sensitiveError, true);
  assert.equal(calls[0].options.handleError, handleError);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0].options.data)), { is_deploy: true });
  await build({ team_name: 'team-a', app_alias: 'other', is_deploy: false });
  assert.equal(calls[1].options.sensitiveError, false);
});

test('single-port verification only issues GET and keeps the failure callback', async () => {
  const calls = [];
  const response = { bean: { port: { container_port: 22, protocol: 'tcp', is_inner_service: true, is_outer_service: false } } };
  const getPortDetail = loadService('app.js', 'getPortDetail', (url, options) => {
    calls.push({ url, options });
    return response;
  });
  const handleError = () => {};
  assert.equal(await getPortDetail({ team_name: 'team-a', app_alias: 'vm-a', port: 22, showLoading: false }, handleError), response);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/backend/console/teams/team-a/apps/vm-a/ports/22');
  assert.equal(calls[0].options.method, 'get');
  assert.equal(calls[0].options.handleError, handleError);
  assert.equal(calls[0].options.showLoading, false);
  assert.equal(calls[0].options.data, undefined);
});

test('volume options support safe failure handling while preserving ordinary GET options', async () => {
  const calls = [];
  const response = { list: [{ volume_type: 'vm' }] };
  const getVolumeOpts = loadService('app.js', 'getVolumeOpts', (url, options) => {
    calls.push({ url, options });
    return response;
  });
  const body = { team_name: 'team-a', app_alias: 'vm-a' };
  assert.equal(await getVolumeOpts(body), response);
  assert.deepEqual(calls[0], {
    url: '/backend/console/teams/team-a/apps/vm-a/volume-opts', options: { method: 'get' }
  });
  const handleError = () => {};
  assert.equal(await getVolumeOpts({ ...body, sensitiveError: true }, handleError), response);
  assert.deepEqual(calls[1].options, { method: 'get', sensitiveError: true, handleError });
  assert.equal(calls[1].options.data, undefined);
});

test('sensitive check_update failures use safe callbacks without sending the control flag', async () => {
  const received = [];
  const { request, calls } = requestHarness(options => Promise.reject(echoedFailure(options, 10412)));
  const editAppCreateInfo = loadService('app.js', 'editAppCreateInfo', request);
  const payload = { team_name: 'team-a', app_alias: 'vm-a', min_memory: 2048, min_cpu: 1 };
  assert.equal(await editAppCreateInfo({ ...payload, sensitiveError: true }, error => received.push(error)), undefined);
  assert.equal(calls.axios.length, 1);
  assert.equal(calls.axios[0].url, '/backend/console/teams/team-a/apps/vm-a/check_update');
  assert.equal(calls.axios[0].method, 'put');
  assert.equal(calls.axios[0].sensitiveError, true);
  assert.deepEqual(calls.axios[0].data, payload);
  assert.equal(received.length, 1);
  assert.equal(received[0].name, 'SensitiveRequestError');
  assert.equal(received[0].message, 'utils.request.server_error');
  assert.equal(received[0].response, undefined);
  assert.equal(received[0].config, undefined);
  assert.equal(received[0].cause, undefined);
  assert.equal(`${received[0].stack}${JSON.stringify(received[0])}`.includes(inputMarker), false);
  assert.deepEqual(calls.telemetry, []);
  assert.deepEqual(calls.notifications, []);
  assert.deepEqual(calls.modals, []);
});

test('ordinary check_update preserves payload, callback and existing preflight error presentation', async () => {
  let original;
  const received = [];
  const { request, calls } = requestHarness(options => {
    original = echoedFailure(options, 10412);
    return Promise.reject(original);
  });
  const editAppCreateInfo = loadService('app.js', 'editAppCreateInfo', request);
  const payload = { team_name: 'team-a', app_alias: 'app-a', min_memory: 512, min_cpu: 0.5 };
  assert.equal(await editAppCreateInfo(payload, error => received.push(error)), undefined);
  assert.deepEqual(calls.axios[0].data, payload);
  assert.equal(calls.axios[0].sensitiveError, undefined);
  assert.equal(received[0], original);
  assert.equal(calls.modals.length, 1);
  assert.equal(calls.modals[0].title, '暂不能安装');
  assert.equal(calls.modals[0].content.summary, inputMarker);
  assert.deepEqual(calls.telemetry.map(call => call.name), ['slow-start', 'slow-finish', 'request-error', 'error-viewed']);
});

test('sensitive HTTP errors bypass telemetry and every special-error presenter', async t => {
  for (const code of [400, 10405, 10408, 10412]) {
    await t.test(`business code ${code}`, async () => {
      const received = [];
      const { request, calls } = requestHarness(options => Promise.reject(echoedFailure(options, code)));
      assert.equal(await request('/sensitive', {
        method: 'post', sensitiveError: true,
        data: { ssh_public_key: inputMarker },
        handleError: error => { received.push(error); return 'ignored'; }
      }), undefined);
      assert.equal(received.length, 1);
      assert.equal(received[0].name, 'SensitiveRequestError');
      assert.equal(received[0].message, 'utils.request.server_error');
      assert.equal(received[0].response, undefined);
      assert.equal(received[0].config, undefined);
      assert.equal(received[0].cause, undefined);
      assert.equal(`${received[0].stack}${JSON.stringify(received[0])}`.includes(inputMarker), false);
      assert.deepEqual(calls.telemetry, []);
      assert.deepEqual(calls.notifications, []);
      assert.deepEqual(calls.modals, []);
      assert.deepEqual(calls.actions.map(action => action.type), ['global/showLoading', 'global/hiddenLoading']);
    });
  }
});

test('sensitive network errors and fulfilled failure statuses cannot reveal input', async t => {
  const failures = {
    network: options => {
      const error = new Error(inputMarker);
      error.config = options;
      return Promise.reject(error);
    },
    status: options => Promise.resolve({ status: 599, statusText: inputMarker, config: options })
  };
  for (const [name, outcome] of Object.entries(failures)) {
    await t.test(name, async () => {
      const { request, calls } = requestHarness(outcome);
      assert.equal(await request('/sensitive', { sensitiveError: true, noModels: true }), undefined);
      assert.deepEqual(calls.notifications, [{
        message: 'utils.request.warning', description: 'utils.request.server_error'
      }]);
      assert.deepEqual(calls.telemetry, []);
      assert.deepEqual(calls.modals, []);
      assert.equal(JSON.stringify(calls.notifications).includes(inputMarker), false);
    });
  }
});

test('HTTP 200 business failures cannot return echoed input as a successful response', async () => {
  const received = [];
  const { request, calls } = requestHarness(options => Promise.resolve({
    status: 200, config: options,
    data: { code: 10412, msg_show: inputMarker, data: { bean: { summary: inputMarker } } }
  }));
  assert.equal(await request('/sensitive', {
    sensitiveError: true, handleError: error => received.push(error)
  }), undefined);
  assert.equal(received.length, 1);
  assert.equal(received[0].name, 'SensitiveRequestError');
  assert.equal(received[0].message, 'utils.request.server_error');
  assert.equal(received[0].response, undefined);
  assert.deepEqual(calls.telemetry, []);
  assert.deepEqual(calls.modals, []);
  assert.deepEqual(calls.notifications, []);
});

test('ordinary request failures keep existing callbacks, loading cleanup and telemetry', async () => {
  let original;
  let received;
  const { request, calls } = requestHarness(options => {
    original = echoedFailure(options);
    return Promise.reject(original);
  });
  await request('/ordinary', { handleError: error => { received = error; } });
  assert.equal(received, original);
  assert.deepEqual(calls.telemetry.map(call => call.name), ['slow-start', 'slow-finish', 'request-error', 'error-viewed']);
  assert.deepEqual(calls.actions.map(action => action.type), ['global/showLoading', 'global/hiddenLoading']);
});

test('sensitive successful calls still return normal flattened Console responses', async () => {
  const { request, calls } = requestHarness(options => Promise.resolve({
    status: 200, config: options, data: { code: 200, data: { bean: { service_alias: 'vm-a' } } }
  }));
  const result = await request('/sensitive', { sensitiveError: true });
  assert.equal(result.status_code, 200);
  assert.equal(result.bean.service_alias, 'vm-a');
  assert.deepEqual(calls.telemetry, []);
  assert.deepEqual(calls.notifications, []);
});
