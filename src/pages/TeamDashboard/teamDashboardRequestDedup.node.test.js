const assert = require('assert');
const fs = require('fs');
const path = require('path');

const uiRoot = path.resolve(__dirname, '..', '..');
const globalHeaderSource = fs.readFileSync(
  path.join(uiRoot, 'components', 'GlobalHeader', 'index.js'),
  'utf8'
);
const teamLayoutSource = fs.readFileSync(
  path.join(uiRoot, 'layouts', 'TeamLayout.js'),
  'utf8'
);
const dashboardSource = fs.readFileSync(
  path.join(__dirname, 'Index.js'),
  'utf8'
);
const teamBasicInfoSource = fs.readFileSync(
  path.join(__dirname, 'TeamBasicInfo', 'index.js'),
  'utf8'
);
const createComponentModalSource = fs.readFileSync(
  path.join(uiRoot, 'components', 'CreateComponentModal', 'index.js'),
  'utf8'
);
const teamServiceSource = fs.readFileSync(
  path.join(uiRoot, 'services', 'team.js'),
  'utf8'
);
const apiServiceSource = fs.readFileSync(
  path.join(uiRoot, 'services', 'api.js'),
  'utf8'
);
const agentServiceSource = fs.readFileSync(
  path.join(uiRoot, 'services', 'agent.js'),
  'utf8'
);
const userServiceSource = fs.readFileSync(
  path.join(uiRoot, 'services', 'user.js'),
  'utf8'
);
const globalRouterSource = fs.readFileSync(
  path.join(uiRoot, 'components', 'GlobalRouter', 'index.js'),
  'utf8'
);
const regionServicePath = path.join(uiRoot, 'services', 'region.js');

function loadRegionService(request) {
  const source = fs
    .readFileSync(regionServicePath, 'utf8')
    .replace(
      "import apiconfig from '../../config/api.config';",
      "const apiconfig = { baseUrl: '/api' };"
    )
    .replace(
      "import request from '../utils/request';",
      'const request = global.__request;'
    )
    .replace(/export async function/g, 'async function')
    .concat('\nmodule.exports = { fetchEnterpriseClusters };\n');
  const serviceModule = { exports: {} };
  const load = new Function('global', 'module', 'exports', source);
  load({ __request: request }, serviceModule, serviceModule.exports);
  return serviceModule.exports;
}

function loadTeamService(request) {
  const source = teamServiceSource
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
    .concat('\nmodule.exports = { getTeamRegionOverview };\n');
  const serviceModule = { exports: {} };
  const load = new Function('global', 'module', 'exports', source);
  load({ __request: request }, serviceModule, serviceModule.exports);
  return serviceModule.exports;
}

function loadUserService(request) {
  const source = userServiceSource
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
    .concat('\nmodule.exports = { getDetail };\n');
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

const agentPluginFetchStart = globalHeaderSource.indexOf(
  'fetchAgentPluginStatus ='
);
const agentAccessStart = globalHeaderSource.indexOf(
  'loadAgentAccessState =',
  agentPluginFetchStart
);
const agentPluginFetchSource = globalHeaderSource.slice(
  agentPluginFetchStart,
  agentAccessStart
);

assert.ok(
  /type:\s*'region\/fetchEnterpriseClusters'[\s\S]*?payload:\s*\{[\s\S]*?check_status:\s*'no'/.test(
    agentPluginFetchSource
  ),
  'agent plugin discovery should fetch region names without cluster health checks'
);

const globalHeaderStart = teamLayoutSource.indexOf('<GlobalHeader');
const globalHeaderEnd = teamLayoutSource.indexOf('/>', globalHeaderStart);
const globalHeaderRenderSource = teamLayoutSource.slice(
  globalHeaderStart,
  globalHeaderEnd
);

assert.ok(globalHeaderStart >= 0, 'team layout should render GlobalHeader');
assert.ok(
  !/\bkey=/.test(globalHeaderRenderSource),
  'GlobalHeader should keep a stable component instance while team context loads'
);

const enterpriseListStart = teamLayoutSource.indexOf(
  'getEnterpriseList = () =>'
);
const updateStart = teamLayoutSource.indexOf('upData = () =>', enterpriseListStart);
const enterpriseListSource = teamLayoutSource.slice(
  enterpriseListStart,
  updateStart
);

assert.ok(
  !/this\.getTeamOverview\(|this\.fetchUserInfo\(/.test(enterpriseListSource),
  'enterprise list loading should not start a second team overview initialization chain'
);

assert.ok(
  !/type:\s*'index\/fetchOverview'/.test(dashboardSource),
  'team dashboard parent should not duplicate the overview request owned by TeamLayout'
);

assert.ok(
  /teamOverview:\s*global\.teamOverview/.test(dashboardSource) &&
    /currentTeam\.team_id[\s\S]*?teamOverview\.team_id[\s\S]*?String\(currentTeam\.team_id\)\s*===\s*String\(teamOverview\.team_id\)/.test(dashboardSource) &&
    /imageUrlTeam=\{logoInfo\}/.test(dashboardSource),
  'team dashboard should use only the current team matching global overview logo for the edit modal'
);

assert.ok(
  !/global\/fetchMyTeams|loadUserTeams/.test(dashboardSource),
  'team dashboard should not load an unused 100-item team list'
);

const createComponentRenderStart = teamBasicInfoSource.indexOf(
  '<CreateComponentModal'
);
const createComponentRenderSource = teamBasicInfoSource.slice(
  createComponentRenderStart - 100,
  createComponentRenderStart + 500
);

assert.ok(
  /createComponentVisible\s*&&\s*\(\s*<CreateComponentModal/.test(
    createComponentRenderSource
  ),
  'the expensive create-component modal should only mount when it is visible'
);

assert.ok(
  /useEffect\(\(\) => \{\s*if \(visible\) \{\s*fetchArchInfo\(\);\s*\}\s*\}, \[visible\]\);/.test(
    createComponentModalSource
  ),
  'component architecture information should be loaded once when the modal opens'
);

const availablePluginsEffectStart = createComponentModalSource.indexOf(
  '// 当弹窗打开时，获取可用插件'
);
const availablePluginsEffectEnd = createComponentModalSource.indexOf(
  'useEffect(() =>',
  availablePluginsEffectStart + 1
);
const availablePluginsEffectSource = createComponentModalSource.slice(
  availablePluginsEffectStart,
  availablePluginsEffectEnd
);

assert.ok(
  !/fetchArchInfo/.test(availablePluginsEffectSource),
  'plugin-list changes should not trigger another architecture request'
);

assert.ok(
  !/case 'form':\s*fetchArchInfo\(\)/.test(createComponentModalSource),
  'opening the modal directly on the form should not duplicate architecture loading'
);

assert.ok(
  /teamRegionOverviewRequests/.test(teamServiceSource) &&
    /return existingRequest\.promise/.test(teamServiceSource),
  'simultaneous team overview consumers should share one request'
);

assert.ok(
  /getTeamRegionOverview as getSharedTeamRegionOverview/.test(apiServiceSource) &&
    /return getSharedTeamRegionOverview\(body, handleError\)/.test(apiServiceSource),
  'legacy and dashboard overview services should use the same request coalescer'
);

assert.ok(
  /export function cacheCopilotPluginNameFromList/.test(agentServiceSource) &&
    /cacheCopilotPluginNameFromList\(pluginList\)/.test(agentPluginFetchSource),
  'agent access checks should reuse the plugin list already loaded by the header'
);

assert.ok(
  /if \(this\.checkIsTeamView\(\) && !force\) \{[\s\S]*?return;[\s\S]*?\}/.test(
    agentPluginFetchSource
  ),
  'team pages should reuse TeamLayout plugin discovery instead of starting another request'
);

const loadByRegionsStart = agentPluginFetchSource.indexOf(
  'const loadByRegions ='
);
const pendingRequestsStart = agentPluginFetchSource.indexOf(
  'let pending =',
  loadByRegionsStart
);
const beforePluginRequestsSource = agentPluginFetchSource.slice(
  loadByRegionsStart,
  pendingRequestsStart
);

assert.ok(
  !/agent\/fetchAgentUpdate/.test(beforePluginRequestsSource) &&
    /this\.scheduleAgentUpdate\(enterpriseId, uniqueRegionNames\)/.test(
      agentPluginFetchSource
    ),
  'agent update checks should start after primary plugin discovery finishes'
);

const globalRouterDidMountStart = globalRouterSource.indexOf(
  'componentDidMount()'
);
const globalRouterDidUpdateStart = globalRouterSource.indexOf(
  'componentDidUpdate(',
  globalRouterDidMountStart
);
const globalRouterDidMountSource = globalRouterSource.slice(
  globalRouterDidMountStart,
  globalRouterDidUpdateStart
);

assert.ok(
  /this\.schedulePlatformUpdateStatus\(\)/.test(globalRouterDidMountSource) &&
    !/this\.fetchPlatformUpdateStatus\(\)/.test(globalRouterDidMountSource),
  'platform version checks should not compete with critical initial requests'
);

async function testEnterpriseClusterRequestDedup() {
  const requests = [];
  const { fetchEnterpriseClusters } = loadRegionService((url, options) => {
    const pending = deferred();
    requests.push({ url, options, pending });
    return pending.promise;
  });

  const first = fetchEnterpriseClusters({ enterprise_id: 'e-1' });
  const duplicate = fetchEnterpriseClusters({
    enterprise_id: 'e-1',
    check_status: 'yes'
  });
  fetchEnterpriseClusters({ enterprise_id: 'e-2' });
  fetchEnterpriseClusters({ enterprise_id: 'e-1', check_status: 'no' });
  const withHandler = fetchEnterpriseClusters(
    { enterprise_id: 'e-1', check_status: 'yes' },
    () => {}
  );
  const withHandlerDuplicate = fetchEnterpriseClusters(
    { enterprise_id: 'e-1' },
    () => {}
  );

  assert.strictEqual(
    requests.length,
    4,
    'matching requests should merge only when they share the same error handling contract'
  );
  assert.strictEqual(requests[0].options.params.check_status, 'yes');
  assert.strictEqual(
    requests[0].options.handleError,
    undefined,
    'requests without custom handlers should preserve the global error handling path'
  );
  assert.strictEqual(typeof requests[3].options.handleError, 'function');

  requests.forEach(({ pending }, index) => pending.resolve({ index }));
  await Promise.all([
    first,
    duplicate,
    withHandler,
    withHandlerDuplicate
  ]);

  const afterSuccess = fetchEnterpriseClusters({ enterprise_id: 'e-1' });
  assert.strictEqual(
    requests.length,
    5,
    'a completed request should not be reused as a response cache'
  );
  requests[4].pending.resolve({ fresh: true });
  await afterSuccess;

  const callbackErrors = [];
  let retryAfterError;
  const failed = fetchEnterpriseClusters(
    { enterprise_id: 'e-fail' },
    error => {
      callbackErrors.push(['first', error]);
      retryAfterError = fetchEnterpriseClusters(
        { enterprise_id: 'e-fail' },
        () => {}
      );
    }
  );
  const failedDuplicate = fetchEnterpriseClusters(
    { enterprise_id: 'e-fail', check_status: 'yes' },
    error => callbackErrors.push(['second', error])
  );
  assert.strictEqual(requests.length, 6);

  const requestError = new Error('region request failed');
  requests[5].options.handleError(requestError);
  assert.strictEqual(
    requests.length,
    7,
    'a synchronous region retry from handleError should start a fresh request'
  );
  requests[5].pending.reject(requestError);
  requests[6].pending.resolve({ recovered: true });
  await Promise.allSettled([failed, failedDuplicate, retryAfterError]);
  assert.deepStrictEqual(
    callbackErrors,
    [
      ['first', requestError],
      ['second', requestError]
    ],
    'all merged callers should be notified by their own handleError callback'
  );

  const afterFailure = fetchEnterpriseClusters({ enterprise_id: 'e-fail' });
  assert.strictEqual(
    requests.length,
    8,
    'a failed request should be removed from the in-flight registry'
  );
  requests[7].pending.resolve({ recovered: true });
  await afterFailure;
}

async function testTeamOverviewRequestDedup() {
  const requests = [];
  const { getTeamRegionOverview } = loadTeamService((url, options) => {
    const pending = deferred();
    requests.push({ url, options, pending });
    return pending.promise;
  });

  const first = getTeamRegionOverview({
    team_name: 'team-1',
    region_name: 'region-1'
  });
  const duplicate = getTeamRegionOverview({
    team_name: 'team-1',
    region_name: 'region-1'
  });
  const withHandler = getTeamRegionOverview(
    { team_name: 'team-1', region_name: 'region-1' },
    () => {}
  );
  const withHandlerDuplicate = getTeamRegionOverview(
    { team_name: 'team-1', region_name: 'region-1' },
    () => {}
  );
  getTeamRegionOverview({
    team_name: 'team-2',
    region_name: 'region-1'
  });
  getTeamRegionOverview({
    team_name: 'team-1',
    region_name: 'region-2'
  });

  assert.strictEqual(
    requests.length,
    4,
    'team overview requests should merge only when team, region, and error handling contract match'
  );
  assert.strictEqual(
    requests[0].options.handleError,
    undefined,
    'team overview requests without handlers should preserve global error handling'
  );
  assert.strictEqual(
    requests[0].url,
    '/api/console/teams/team-1/overview'
  );
  assert.deepStrictEqual(requests[0].options.params, {
    region_name: 'region-1'
  });
  assert.strictEqual(requests[0].options.showLoading, false);
  assert.strictEqual(typeof requests[1].options.handleError, 'function');

  requests.forEach(({ pending }, index) => pending.resolve({ index }));
  await Promise.all([
    first,
    duplicate,
    withHandler,
    withHandlerDuplicate
  ]);

  const afterSuccess = getTeamRegionOverview({
    team_name: 'team-1',
    region_name: 'region-1'
  });
  assert.strictEqual(
    requests.length,
    5,
    'a completed team overview request should not be reused as a cache'
  );
  requests[4].pending.resolve({ fresh: true });
  await afterSuccess;

  const callbackErrors = [];
  let retryAfterError;
  const failed = getTeamRegionOverview(
    { team_name: 'team-fail', region_name: 'region-fail' },
    error => {
      callbackErrors.push(['first', error]);
      retryAfterError = getTeamRegionOverview(
        { team_name: 'team-fail', region_name: 'region-fail' },
        () => {}
      );
    }
  );
  const failedDuplicate = getTeamRegionOverview(
    { team_name: 'team-fail', region_name: 'region-fail' },
    error => callbackErrors.push(['second', error])
  );
  assert.strictEqual(requests.length, 6);

  const requestError = new Error('team overview request failed');
  requests[5].options.handleError(requestError);
  assert.strictEqual(
    requests.length,
    7,
    'a synchronous team overview retry from handleError should start a fresh request'
  );
  requests[5].pending.reject(requestError);
  requests[6].pending.resolve({ recovered: true });
  await Promise.allSettled([failed, failedDuplicate, retryAfterError]);
  assert.deepStrictEqual(
    callbackErrors,
    [
      ['first', requestError],
      ['second', requestError]
    ],
    'all merged team overview callers should receive the request error'
  );

  const afterFailure = getTeamRegionOverview(
    {
      team_name: 'team-fail',
      region_name: 'region-fail'
    },
    () => {}
  );
  assert.strictEqual(
    requests.length,
    8,
    'a failed team overview request should leave no in-flight cache entry'
  );
  requests[7].pending.resolve({ recovered: true });
  await afterFailure;
}

async function testUserDetailRequestDedup() {
  const requests = [];
  const { getDetail } = loadUserService((url, options) => {
    const pending = deferred();
    requests.push({ url, options, pending });
    return pending.promise;
  });

  const first = getDetail({ team_name: 'team-1' });
  const duplicate = getDetail({ team_name: 'team-1' });
  const withHandler = getDetail({ team_name: 'team-1' }, () => {});
  const withHandlerDuplicate = getDetail(
    { team_name: 'team-1' },
    () => {}
  );
  getDetail({ team_name: 'team-2' });

  assert.strictEqual(
    requests.length,
    3,
    'user detail requests should merge only when team and error handling contract match'
  );
  assert.strictEqual(
    requests[0].options.handleError,
    undefined,
    'user detail requests without handlers should preserve global error handling'
  );
  assert.strictEqual(
    requests[0].url,
    '/api/console/users/details'
  );
  assert.deepStrictEqual(requests[0].options.params, {
    team_name: 'team-1'
  });
  assert.strictEqual(typeof requests[1].options.handleError, 'function');

  requests.forEach(({ pending }, index) => pending.resolve({ index }));
  await Promise.all([
    first,
    duplicate,
    withHandler,
    withHandlerDuplicate
  ]);

  const afterSuccess = getDetail({ team_name: 'team-1' });
  assert.strictEqual(
    requests.length,
    4,
    'a completed user detail request should not be reused as a cache'
  );
  requests[3].pending.resolve({ fresh: true });
  await afterSuccess;

  const callbackErrors = [];
  let retryAfterError;
  const failed = getDetail(
    { team_name: 'team-fail' },
    error => {
      callbackErrors.push(['first', error]);
      retryAfterError = getDetail(
        { team_name: 'team-fail' },
        () => {}
      );
    }
  );
  const failedDuplicate = getDetail(
    { team_name: 'team-fail' },
    error => callbackErrors.push(['second', error])
  );
  assert.strictEqual(requests.length, 5);

  const requestError = new Error('user detail request failed');
  requests[4].options.handleError(requestError);
  assert.strictEqual(
    requests.length,
    6,
    'a synchronous user detail retry from handleError should start a fresh request'
  );
  requests[4].pending.reject(requestError);
  requests[5].pending.resolve({ recovered: true });
  await Promise.allSettled([failed, failedDuplicate, retryAfterError]);
  assert.deepStrictEqual(
    callbackErrors,
    [
      ['first', requestError],
      ['second', requestError]
    ],
    'all merged user detail callers should receive the request error'
  );

  const afterFailure = getDetail(
    { team_name: 'team-fail' },
    () => {}
  );
  assert.strictEqual(
    requests.length,
    7,
    'a failed user detail request should leave no in-flight cache entry'
  );
  requests[6].pending.resolve({ recovered: true });
  await afterFailure;
}

async function testTeamOverviewAsyncContract() {
  const requestError = new Error('synchronous request setup failure');
  const { getTeamRegionOverview } = loadTeamService(() => {
    throw requestError;
  });
  let result;

  assert.doesNotThrow(() => {
    result = getTeamRegionOverview({
      team_name: 'team-sync-error',
      region_name: 'region-sync-error'
    });
  }, 'getTeamRegionOverview should preserve its asynchronous error contract');
  assert.ok(
    result && typeof result.then === 'function',
    'getTeamRegionOverview should return a thenable when request setup fails'
  );
  await assert.rejects(result, error => error === requestError);
}

Promise.all([
  testEnterpriseClusterRequestDedup(),
  testTeamOverviewRequestDedup(),
  testUserDetailRequestDedup(),
  testTeamOverviewAsyncContract()
])
  .then(() => console.log('team dashboard request dedup tests passed'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
