const assert = require('assert');
const fs = require('fs');
const path = require('path');

const applicationServicePath = path.join(__dirname, 'application.js');

function loadApplicationService(request) {
  const source = fs
    .readFileSync(applicationServicePath, 'utf8')
    .replace(
      "import apiconfig from '../../config/api.config';",
      "const apiconfig = { baseUrl: '/api' };"
    )
    .replace(
      "import request from '../utils/request';",
      'const request = global.__request;'
    )
    .replace(/export async function/g, 'async function')
    .replace(/export function/g, 'function')
    .concat('\nmodule.exports = { getGroupDetail };\n');
  const serviceModule = { exports: {} };
  const load = new Function('global', 'module', 'exports', source);
  load({ __request: request }, serviceModule, serviceModule.exports);
  return serviceModule.exports;
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function testGroupDetailRequestDedup() {
  const requests = [];
  const { getGroupDetail } = loadApplicationService((url, options) => {
    const pending = deferred();
    requests.push({ url, options, pending });
    return pending.promise;
  });

  const baseParams = {
    team_name: 'team-1',
    region_name: 'region-1',
    group_id: 5
  };
  const first = getGroupDetail(baseParams);
  const duplicate = getGroupDetail({ ...baseParams, group_id: '5' });
  const withHandler = getGroupDetail(baseParams, () => {});
  const withHandlerDuplicate = getGroupDetail(baseParams, () => {});
  const otherTeam = getGroupDetail({ ...baseParams, team_name: 'team-2' });
  const otherRegion = getGroupDetail({ ...baseParams, region_name: 'region-2' });
  const otherGroup = getGroupDetail({ ...baseParams, group_id: 6 });

  assert.strictEqual(
    requests.length,
    5,
    'group detail requests should merge only when team, region, group, and error handling contract match'
  );
  assert.strictEqual(
    requests[0].url,
    '/api/console/teams/team-1/groups/5'
  );
  assert.deepStrictEqual(requests[0].options.params, {
    region_name: 'region-1'
  });
  assert.strictEqual(
    requests[0].options.handleError,
    undefined,
    'requests without custom handlers should preserve the global error handling path'
  );
  assert.strictEqual(typeof requests[1].options.handleError, 'function');

  requests.forEach(({ pending }, index) => pending.resolve({ index }));
  await Promise.all([
    first,
    duplicate,
    withHandler,
    withHandlerDuplicate,
    otherTeam,
    otherRegion,
    otherGroup
  ]);

  const afterSuccess = getGroupDetail(baseParams);
  assert.strictEqual(
    requests.length,
    6,
    'a completed group detail request should not become a response cache'
  );
  requests[5].pending.resolve({ fresh: true });
  await afterSuccess;

  const callbackErrors = [];
  let retryAfterError;
  const failed = getGroupDetail(
    { team_name: 'team-fail', region_name: 'region-fail', group_id: 9 },
    error => {
      callbackErrors.push(['first', error]);
      retryAfterError = getGroupDetail(
        { team_name: 'team-fail', region_name: 'region-fail', group_id: 9 },
        () => {}
      );
    }
  );
  const failedDuplicate = getGroupDetail(
    { team_name: 'team-fail', region_name: 'region-fail', group_id: 9 },
    error => callbackErrors.push(['second', error])
  );
  assert.strictEqual(requests.length, 7);

  const requestError = new Error('group detail request failed');
  requests[6].options.handleError(requestError);
  assert.strictEqual(
    requests.length,
    8,
    'a synchronous retry from handleError should start a fresh request'
  );
  requests[6].pending.reject(requestError);
  requests[7].pending.resolve({ recovered: true });
  await Promise.allSettled([failed, failedDuplicate, retryAfterError]);
  assert.deepStrictEqual(
    callbackErrors,
    [
      ['first', requestError],
      ['second', requestError]
    ],
    'all merged callers should receive the request error through their own callback'
  );

  const afterFailure = getGroupDetail(
    { team_name: 'team-fail', region_name: 'region-fail', group_id: 9 },
    () => {}
  );
  assert.strictEqual(
    requests.length,
    9,
    'a failed group detail request should leave no in-flight entry'
  );
  requests[8].pending.resolve({ recovered: true });
  await afterFailure;
}

async function testGroupDetailAsyncContract() {
  const requestError = new Error('synchronous request setup failure');
  const { getGroupDetail } = loadApplicationService(() => {
    throw requestError;
  });
  let result;

  assert.doesNotThrow(() => {
    result = getGroupDetail({
      team_name: 'team-sync-error',
      region_name: 'region-sync-error',
      group_id: 10
    });
  }, 'getGroupDetail should preserve its asynchronous error contract');
  assert.ok(
    result && typeof result.then === 'function',
    'getGroupDetail should return a thenable when request setup fails'
  );
  await assert.rejects(result, error => error === requestError);
}

Promise.all([
  testGroupDetailRequestDedup(),
  testGroupDetailAsyncContract()
])
  .then(() => console.log('application request dedup tests passed'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
