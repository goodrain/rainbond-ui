const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const generate = require('@babel/generator').default;

const requestPath = path.join(__dirname, 'request.js');
const source = fs.readFileSync(requestPath, 'utf8');
const program = parser.parse(source, { sourceType: 'module', plugins: ['optionalChaining'] }).program;

function nodeFor(name) {
  const statement = program.body.find(item =>
    (item.type === 'FunctionDeclaration' && item.id.name === name) ||
    (item.type === 'ExportNamedDeclaration' && item.declaration && item.declaration.id && item.declaration.id.name === name) ||
    (item.type === 'ExportDefaultDeclaration' && item.declaration && item.declaration.id && item.declaration.id.name === name)
  );
  return statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
    ? statement.declaration
    : statement;
}

function requestFactory(run) {
  const declarations = ['checkStatus', 'getRequestFailureMetadata', 'attachRequestTelemetry', 'getRequestFailureResult', 'handleStoreDispatch', 'handleSpecialErrorCode', 'handleData', 'request']
    .map(name => generate(nodeFor(name)).code)
    .join('\n');
  const codeMessage = generate(program.body.find(node => node.type === 'VariableDeclaration' && node.declarations[0].id.name === 'codeMessage')).code;
  const state = { notifications: [], apiErrors: [], viewed: [], requestErrors: [], dispatches: [], handlers: 0 };
  const axios = options => run(options);
  axios.defaults = {};
  axios.isCancel = () => false;
  const request = new Function(
    'axios', 'notification', 'Modal', 'globalUtil', 'cookie', 'handleAPIError', 'updateRenewedTokenFromResponse', 'formatMessage', 'history', 'getDvaApp', 'captureRequestError', 'finishSlowRequestTracking', 'startSlowRequestTracking', 'captureErrorViewed', 'trackSlowRequestLifecycle', 'renderPreflightContent', 'location',
    `${codeMessage}\n${declarations}\nreturn request;`
  )(
    axios,
    { error: payload => state.notifications.push(payload), warning: payload => state.notifications.push(payload) },
    { error() {} },
    { getCurrRegionName: () => '', getCurrTeamName: () => '', getAppID: () => '', replaceUrlTeam: value => value, replaceUrlRegion: value => value },
    { get: () => '', setGuide() {} },
    error => state.apiErrors.push(error),
    () => {},
    message => message.id,
    { push() {} },
    () => ({ _store: { dispatch: value => state.dispatches.push(value) } }),
    error => state.requestErrors.push(error),
    () => {},
    () => ({}),
    (category, properties) => state.viewed.push({ category, properties }),
    (promise, options) => promise.then(response => options.checkStatus(response)),
    () => null,
    { href: '' }
  );
  return { request, state };
}

const failures = [
  ['business', { response: { status: 422, data: { code: 10499 } } }, { error_code: 'business_10499', error_category: 'business_failure', http_status: 422 }],
  ['http_4xx', { response: { status: 404, data: {} } }, { error_code: 'http_404', error_category: 'http_4xx', http_status: 404 }],
  ['http_5xx', { response: { status: 503, data: {} } }, { error_code: 'http_503', error_category: 'http_5xx', http_status: 503 }],
  ['timeout', { code: 'ECONNABORTED' }, { error_code: 'timeout', error_category: 'timeout', http_status: 0 }],
  ['network', { code: 'ERR_NETWORK' }, { error_code: 'network_error', error_category: 'network_error', http_status: 0 }]
];

for (const [name, error, metadata] of failures) {
  for (const handler of [false, true]) {
    for (const optIn of [false, true]) {
      for (const noModels of [false, true]) {
        test(`request ${name}: handler=${handler}, optIn=${optIn}, noModels=${noModels}`, async () => {
          const { request, state } = requestFactory(() => Promise.reject(error));
          const options = { method: 'post', headers: {}, showLoading: false, noModels, returnErrorMetadata: optIn };
          if (handler) options.handleError = () => { state.handlers += 1; return 'handled'; };
          const httpFailure = Boolean(error.response);
          const mustReject = noModels && !handler && !httpFailure ? true : noModels && !handler && httpFailure;
          if (mustReject) {
            await assert.rejects(request('/request-test', options), value => value === error);
          } else {
            const result = await request('/request-test', options);
            if (optIn) {
              assert.deepEqual(result, { __rainbondRequestFailure: true, ...metadata });
            } else if (!httpFailure && handler) {
              assert.equal(result, 'handled');
            } else {
              assert.equal(result, undefined);
            }
          }
          assert.equal(state.handlers, handler ? 1 : 0);
          assert.equal(state.viewed.length, 1);
          assert.deepEqual(state.viewed[0], { category: metadata.error_category, properties: { error_code: metadata.error_code, http_status: metadata.http_status, stage: 'request' } });
          if (httpFailure && !handler) assert.equal(state.apiErrors.length, 1);
          if (!httpFailure && !handler && !noModels) assert.equal(state.notifications.length, 1);
        });
      }
    }
  }
}

test('request returns normalized data for successful responses', async () => {
  const { request, state } = requestFactory(() => Promise.resolve({ status: 200, data: { code: 200, data: { id: 'created' } } }));
  const result = await request('/request-test', { method: 'post', headers: {}, showLoading: false });
  assert.equal(result.id, 'created');
  assert.equal(result.status_code, 200);
  assert.equal(result.business_code, 200);
  assert.equal(result.response_data.data, result);
  assert.equal(state.viewed.length, 0);
});

test('request keeps special-code handling while returning an opt-in failure envelope', async () => {
  const error = { response: { status: 401, data: { code: 10405 } } };
  const { request, state } = requestFactory(() => Promise.reject(error));
  const result = await request('/request-test', { method: 'post', headers: {}, showLoading: false, returnErrorMetadata: true, handleError: () => { state.handlers += 1; } });
  assert.deepEqual(result, { __rainbondRequestFailure: true, error_code: 'business_10405', error_category: 'business_failure', http_status: 401 });
  assert.equal(state.handlers, 1);
  assert.equal(state.apiErrors.length, 0);
});


test('request preserves failure metadata when a page error handler throws', async () => {
  for (const [name, error, expected] of [
    ['HTTP', { response: { status: 422, data: { code: 10499 } } }, { error_code: 'business_10499', error_category: 'business_failure', http_status: 422 }],
    ['network', { code: 'ERR_NETWORK' }, { error_code: 'network_error', error_category: 'network_error', http_status: 0 }]
  ]) {
    const pageError = new Error(`${name} handler error`);
    const { request } = requestFactory(() => Promise.reject(error));
    await assert.rejects(
      request('/request-test', { method: 'post', headers: {}, showLoading: false, handleError: () => { throw pageError; } }),
      value => value === pageError && assert.deepEqual(value.requestTelemetry, expected) === undefined,
      `${name} handler errors should retain request telemetry`
    );
  }
});
