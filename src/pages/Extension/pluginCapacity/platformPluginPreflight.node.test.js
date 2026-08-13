const assert = require('assert');
const fs = require('fs');
const path = require('path');

const helperPath = path.join(__dirname, 'platformPluginPreflight.js');

assert.ok(
  fs.existsSync(helperPath),
  'platformPluginPreflight helper module should exist'
);

const {
  PLATFORM_PLUGIN_ALIAS,
  PLATFORM_PLUGIN_MARKET,
  PLATFORM_PLUGIN_NAMESPACE,
  buildCreateTeamPayload,
  buildMarketPreflightPayload,
  buildOpenRegionPayload,
  ensurePlatformPluginTeam,
  findPlatformPluginTeam,
  hasRegion,
  shouldNotifyPreflightError
} = require('./platformPluginPreflight');

const successPage = (list, totalCount = list.length) => ({
  status_code: 200,
  bean: {
    list,
    total_count: totalCount
  }
});

const waitForEnsure = options => ensurePlatformPluginTeam(options);

async function testPureHelpers() {
  assert.strictEqual(PLATFORM_PLUGIN_NAMESPACE, 'rbd-plugins');
  assert.strictEqual(PLATFORM_PLUGIN_ALIAS, '平台插件');
  assert.strictEqual(PLATFORM_PLUGIN_MARKET, '__platform_plugin__');

  const platformTeam = {
    team_name: 'platform-team-id',
    namespace: 'rbd-plugins',
    region_list: [{ region_name: 'cn-hangzhou' }]
  };
  assert.strictEqual(
    findPlatformPluginTeam([
      { tenant_name: 'RBD-PLUGINS' },
      { namespace: 'rbd-plugins-extra' },
      platformTeam
    ]),
    platformTeam,
    'team lookup should match only the exact rbd-plugins namespace'
  );
  assert.strictEqual(
    findPlatformPluginTeam([{ tenant_name: 'rbd-plugins' }]),
    undefined,
    'team lookup must not treat tenant_name as the platform plugin namespace'
  );
  assert.strictEqual(
    findPlatformPluginTeam([
      { namespace: 'other', tenant_name: 'rbd-plugins' }
    ]),
    undefined,
    'team lookup must require the namespace field itself to match exactly'
  );
  assert.strictEqual(findPlatformPluginTeam(null), undefined);
  assert.strictEqual(hasRegion(platformTeam, 'cn-hangzhou'), true);
  assert.strictEqual(hasRegion(platformTeam, 'CN-HANGZHOU'), false);
  assert.strictEqual(hasRegion({}, 'cn-hangzhou'), false);
  assert.strictEqual(
    shouldNotifyPreflightError({ response: { data: { code: 10412 } } }),
    false,
    '10412 should not duplicate the request-layer resource error modal'
  );
  assert.strictEqual(
    shouldNotifyPreflightError({ response: { data: { code: 50000 } } }),
    true,
    'ordinary business errors should show the generic plugin preflight error'
  );
  assert.strictEqual(
    shouldNotifyPreflightError(new Error('network unavailable')),
    true,
    'transport errors should show the generic plugin preflight error'
  );

  assert.deepStrictEqual(buildCreateTeamPayload('cn-hangzhou'), {
    team_name: '平台插件',
    namespace: 'rbd-plugins',
    useable_regions: ['cn-hangzhou']
  });
  assert.deepStrictEqual(buildOpenRegionPayload('platform-team-id', 'cn-hangzhou'), {
    team_name: 'platform-team-id',
    region_names: 'cn-hangzhou'
  });
  assert.strictEqual(
    Array.isArray(buildOpenRegionPayload('team', 'region').region_names),
    false,
    'open-region payload must keep region_names as the API comma-string contract'
  );

  const plugin = {
    plugin_id: 'must-not-be-used',
    app_key: 'platform-plugin-app',
    latest_version: '2.1.0'
  };
  assert.deepStrictEqual(
    buildMarketPreflightPayload(plugin, 'platform-team-id', 'cn-hangzhou'),
    {
      team_name: 'platform-team-id',
      region_name: 'cn-hangzhou',
      group_id: 0,
      app_id: 'platform-plugin-app',
      group_key: 'platform-plugin-app',
      app_version: '2.1.0',
      is_deploy: true,
      install_from_cloud: true,
      marketName: '__platform_plugin__'
    },
    'market preflight must use app_key exactly for both app identifiers'
  );
  assert.throws(
    () => buildMarketPreflightPayload(
      { plugin_id: 'legacy-id', latest_version: '2.1.0' },
      'platform-team-id',
      'cn-hangzhou'
    ),
    /app_key/,
    'plugin_id must not be accepted as an app_key fallback'
  );
  assert.throws(
    () => buildMarketPreflightPayload(
      { app_key: 'platform-plugin-app' },
      'platform-team-id',
      'cn-hangzhou'
    ),
    /latest_version/
  );
}

async function testPaginationStopsOnPageTwo() {
  const actions = [];
  const platformTeam = {
    team_name: 'platform-team-id',
    namespace: 'rbd-plugins',
    region_list: [{ region_name: 'cn-hangzhou' }]
  };
  let successCount = 0;
  let errorCount = 0;
  const dispatch = action => {
    actions.push(action);
    assert.strictEqual(action.type, 'global/fetchEnterpriseTeams');
    if (action.payload.page === 1) {
      action.callback(successPage([{ namespace: 'ordinary-team' }], 3));
    } else if (action.payload.page === 2) {
      action.callback(successPage([platformTeam], 3));
    } else {
      throw new Error('pagination should stop immediately after finding page two');
    }
    return Promise.resolve();
  };

  const result = await waitForEnsure({
    dispatch,
    enterpriseId: 'enterprise-1',
    regionName: 'cn-hangzhou',
    pageSize: 1,
    onSuccess: team => {
      successCount += 1;
      assert.strictEqual(team, platformTeam);
    },
    onError: () => {
      errorCount += 1;
    }
  });

  assert.strictEqual(result, platformTeam);
  assert.deepStrictEqual(actions.map(action => action.payload.page), [1, 2]);
  assert.strictEqual(
    actions.some(action => action.type === 'teamControl/createTeam'),
    false,
    'create must wait until every required page is exhausted'
  );
  assert.strictEqual(successCount, 1);
  assert.strictEqual(errorCount, 0);
}

async function testExhaustiveAbsenceCreatesThenRequeries() {
  const actions = [];
  const platformTeam = {
    team_name: 'created-platform-team',
    namespace: 'rbd-plugins',
    region_list: [{ region_name: 'cn-hangzhou' }]
  };
  let fetchCount = 0;
  let createCount = 0;
  const dispatch = action => {
    actions.push(action);
    if (action.type === 'global/fetchEnterpriseTeams') {
      fetchCount += 1;
      action.callback(
        fetchCount === 1
          ? successPage([{ namespace: 'ordinary-team' }])
          : successPage([platformTeam])
      );
    } else if (action.type === 'teamControl/createTeam') {
      createCount += 1;
      assert.deepStrictEqual(action.payload, buildCreateTeamPayload('cn-hangzhou'));
      action.callback({ status_code: 200 });
    } else {
      throw new Error(`unexpected action ${action.type}`);
    }
    return Promise.resolve();
  };

  const result = await waitForEnsure({
    dispatch,
    enterpriseId: 'enterprise-1',
    regionName: 'cn-hangzhou'
  });

  assert.strictEqual(result, platformTeam);
  assert.strictEqual(createCount, 1);
  assert.deepStrictEqual(
    actions
      .filter(action => action.type === 'global/fetchEnterpriseTeams')
      .map(action => action.payload.page),
    [1, 1],
    'successful create should trust a fresh page-one query as source of truth'
  );
}

async function testExistingTeamOpensRegionWithString() {
  const platformTeam = {
    team_name: 'platform-team-id',
    namespace: 'rbd-plugins',
    region_list: [{ region_name: 'cn-beijing' }]
  };
  let successCount = 0;
  let errorCount = 0;
  let openCount = 0;
  const dispatch = action => {
    if (action.type === 'global/fetchEnterpriseTeams') {
      action.callback(successPage([platformTeam]));
    } else if (action.type === 'teamControl/openRegion') {
      openCount += 1;
      assert.deepStrictEqual(
        action.payload,
        buildOpenRegionPayload('platform-team-id', 'cn-hangzhou')
      );
      assert.strictEqual(typeof action.payload.region_names, 'string');
      action.callback({ status_code: 200 });
      action.callback({ status_code: 200 });
      action.handleError(new Error('late duplicate error'));
    }
    return Promise.resolve();
  };

  const result = await waitForEnsure({
    dispatch,
    enterpriseId: 'enterprise-1',
    regionName: 'cn-hangzhou',
    onSuccess: team => {
      successCount += 1;
      assert.strictEqual(team, platformTeam);
    },
    onError: () => {
      errorCount += 1;
    }
  });

  assert.strictEqual(result, platformTeam);
  assert.strictEqual(openCount, 1);
  assert.strictEqual(successCount, 1);
  assert.strictEqual(errorCount, 0);
  assert.deepStrictEqual(
    platformTeam.region_list,
    [{ region_name: 'cn-beijing' }],
    'open success returns the original server team without fabricating region state'
  );
}

async function testCreateConflictRequeryFindsTeam() {
  const conflict = new Error('team already exists');
  const platformTeam = {
    team_name: 'racing-platform-team',
    namespace: 'rbd-plugins',
    region_list: [{ region_name: 'cn-hangzhou' }]
  };
  let fetchCount = 0;
  let createCount = 0;
  let errorCount = 0;
  const dispatch = action => {
    if (action.type === 'global/fetchEnterpriseTeams') {
      fetchCount += 1;
      action.callback(fetchCount === 1 ? successPage([]) : successPage([platformTeam]));
    } else if (action.type === 'teamControl/createTeam') {
      createCount += 1;
      action.handleError(conflict);
      action.handleError(new Error('duplicate conflict callback'));
    }
    return Promise.resolve();
  };

  const result = await waitForEnsure({
    dispatch,
    enterpriseId: 'enterprise-1',
    regionName: 'cn-hangzhou',
    onError: () => {
      errorCount += 1;
    }
  });

  assert.strictEqual(result, platformTeam);
  assert.strictEqual(createCount, 1);
  assert.strictEqual(fetchCount, 2);
  assert.strictEqual(errorCount, 0);
}

async function testMalformedResponseSettlesOnce() {
  const malformed = { status_code: 200, bean: { total_count: 1 } };
  let successCount = 0;
  let errorCount = 0;
  let receivedError;
  const dispatch = action => {
    action.callback(malformed);
    action.callback(malformed);
    action.handleError(new Error('late transport error'));
    return Promise.resolve();
  };

  await assert.rejects(
    waitForEnsure({
      dispatch,
      enterpriseId: 'enterprise-1',
      regionName: 'cn-hangzhou',
      onSuccess: () => {
        successCount += 1;
      },
      onError: error => {
        errorCount += 1;
        receivedError = error;
      }
    }),
    /Malformed enterprise teams response/
  );
  assert.strictEqual(successCount, 0);
  assert.strictEqual(errorCount, 1);
  assert.match(receivedError.message, /Malformed enterprise teams response/);
}

async function testRequestFailureSettlesOnce() {
  const transportError = new Error('network unavailable');
  let errorCount = 0;
  const dispatch = action => {
    action.handleError(transportError);
    action.handleError(new Error('duplicate error'));
    return Promise.reject(new Error('late dispatch rejection'));
  };

  await assert.rejects(
    waitForEnsure({
      dispatch,
      enterpriseId: 'enterprise-1',
      regionName: 'cn-hangzhou',
      onError: error => {
        errorCount += 1;
        assert.strictEqual(error, transportError);
      }
    }),
    error => error === transportError
  );
  assert.strictEqual(errorCount, 1);
}

async function testDispatchCompletionWithoutCallbacksSettlesOnce() {
  let errorCount = 0;
  const dispatch = () => Promise.resolve();
  const ensureResult = waitForEnsure({
    dispatch,
    enterpriseId: 'enterprise-1',
    regionName: 'cn-hangzhou',
    onError: error => {
      errorCount += 1;
      assert.match(
        error.message,
        /global\/fetchEnterpriseTeams completed without callback/
      );
    }
  });
  const promptlySettledResult = Promise.race([
    ensureResult,
    new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('ensure timed out')), 20);
    })
  ]);

  await assert.rejects(
    promptlySettledResult,
    /global\/fetchEnterpriseTeams completed without callback/
  );
  assert.strictEqual(errorCount, 1);
}

async function testInvalidTotalCountsAreMalformed() {
  const invalidTotals = [NaN, Infinity, -1, 1.5];

  for (const totalCount of invalidTotals) {
    let errorCount = 0;
    const dispatch = action => {
      action.callback(successPage([], totalCount));
      return Promise.resolve();
    };

    await assert.rejects(
      waitForEnsure({
        dispatch,
        enterpriseId: 'enterprise-1',
        regionName: 'cn-hangzhou',
        onError: error => {
          errorCount += 1;
          assert.match(error.message, /Malformed enterprise teams response/);
        }
      }),
      /Malformed enterprise teams response/
    );
    assert.strictEqual(
      errorCount,
      1,
      `invalid total_count ${totalCount} should settle onError once`
    );
  }
}

async function testInvalidPageSizesRejectBeforeDispatch() {
  const invalidPageSizes = [0, Infinity, 1.5];

  for (const pageSize of invalidPageSizes) {
    let dispatchCount = 0;
    let errorCount = 0;
    const dispatch = () => {
      dispatchCount += 1;
      return Promise.resolve();
    };

    await assert.rejects(
      waitForEnsure({
        dispatch,
        enterpriseId: 'enterprise-1',
        regionName: 'cn-hangzhou',
        pageSize,
        onError: error => {
          errorCount += 1;
          assert.match(error.message, /pageSize must be a positive integer/);
        }
      }),
      /pageSize must be a positive integer/
    );
    assert.strictEqual(dispatchCount, 0);
    assert.strictEqual(errorCount, 1);
  }
}

async function testCreateFailureWithoutRaceReportsOriginalOnce() {
  const createError = new Error('create forbidden');
  let fetchCount = 0;
  let createCount = 0;
  let errorCount = 0;
  const dispatch = action => {
    if (action.type === 'global/fetchEnterpriseTeams') {
      fetchCount += 1;
      action.callback(successPage([]));
    } else if (action.type === 'teamControl/createTeam') {
      createCount += 1;
      action.handleError(createError);
    }
    return Promise.resolve();
  };

  await assert.rejects(
    waitForEnsure({
      dispatch,
      enterpriseId: 'enterprise-1',
      regionName: 'cn-hangzhou',
      onError: error => {
        errorCount += 1;
        assert.strictEqual(error, createError);
      }
    }),
    error => error === createError
  );
  assert.strictEqual(fetchCount, 2);
  assert.strictEqual(createCount, 1, 'create/requery flow must not loop into another create');
  assert.strictEqual(errorCount, 1);
}

function testHandleErrorPlumbingSource() {
  const globalSource = fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'models', 'global.js'),
    'utf8'
  );
  const teamControlSource = fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'models', 'teamControl.js'),
    'utf8'
  );
  const apiSource = fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'services', 'api.js'),
    'utf8'
  );
  const teamSource = fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'services', 'team.js'),
    'utf8'
  );
  const createTeamSource = teamSource.slice(
    teamSource.indexOf('export async function createTeam('),
    teamSource.indexOf('export async function getMembers(')
  );
  const openRegionSource = teamSource.slice(
    teamSource.indexOf('export function openRegion('),
    teamSource.indexOf('export function closeTeamRegion(')
  );

  assert.ok(
    /\*fetchEnterpriseTeams\(\{ payload, callback, handleError \}, \{ call \}\)\s*\{[\s\S]*?yield call\(fetchEnterpriseTeams, payload, handleError\)/.test(globalSource),
    'fetchEnterpriseTeams effect should forward handleError to its service'
  );
  assert.ok(
    /\*createTeam\(\{ payload, callback, handleError \}, \{ call \}\)\s*\{[\s\S]*?yield call\(createTeam, payload, handleError\)/.test(teamControlSource),
    'createTeam effect should forward handleError to its service'
  );
  assert.ok(
    /\*openRegion\(\{ payload, callback, handleError \}, \{ call \}\)\s*\{[\s\S]*?yield call\(openRegion, payload, handleError\)/.test(teamControlSource),
    'openRegion effect should forward handleError to its service'
  );
  assert.ok(
    /function fetchEnterpriseTeams\(param, handleError\)[\s\S]*?params:[\s\S]*?handleError/.test(apiSource),
    'fetchEnterpriseTeams service should pass handleError to request options'
  );
  assert.ok(
    /handleError/.test(createTeamSource) && /\},\s*handleError\s*\)/.test(createTeamSource),
    'createTeam service should pass handleError to request options'
  );
  assert.ok(
    /handleError/.test(openRegionSource) && /\},\s*handleError\s*\)/.test(openRegionSource),
    'openRegion service should pass handleError to request options'
  );
}

function testPreflightErrorPresentationSource() {
  const requestSource = fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'utils', 'request.js'),
    'utf8'
  );
  const pluginTableSource = fs.readFileSync(
    path.join(__dirname, 'pluginTable.js'),
    'utf8'
  );

  assert.ok(
    /import\s*\{\s*renderPreflightContent\s*\}\s*from\s*['"]\.\/marketInstallPreflight['"]/.test(requestSource),
    'request should reuse the shared preflight content renderer'
  );
  assert.ok(
    /case 10412:[\s\S]*?content:\s*renderPreflightContent\(safePreflightBean,\s*isDeployPreflight \? 'deploy' : 'install'\)/.test(requestSource),
    '10412 modal should render the complete preflight bean using deploy/install copy'
  );
  assert.ok(
    /onError:\s*error\s*=>\s*\{[\s\S]*?clearPreflight\(\)[\s\S]*?shouldNotifyPreflightError\(error\)[\s\S]*?notification\.error\(\{ message: '安装前检测失败，请稍后重试' \}\)/.test(pluginTableSource),
    'plugin preflight onError should notify exactly for non-10412 errors after unlocking'
  );
}

async function run() {
  await testPureHelpers();
  await testPaginationStopsOnPageTwo();
  await testExhaustiveAbsenceCreatesThenRequeries();
  await testExistingTeamOpensRegionWithString();
  await testCreateConflictRequeryFindsTeam();
  await testMalformedResponseSettlesOnce();
  await testRequestFailureSettlesOnce();
  await testDispatchCompletionWithoutCallbacksSettlesOnce();
  await testInvalidTotalCountsAreMalformed();
  await testInvalidPageSizesRejectBeforeDispatch();
  await testCreateFailureWithoutRaceReportsOriginalOnce();
  testHandleErrorPlumbingSource();
  testPreflightErrorPresentationSource();
  console.log('platform plugin preflight helper tests passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
