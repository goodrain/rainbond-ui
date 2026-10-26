const assert = require('assert');
const overviewData = require('../pages/Enterprise/overviewData');
const effectFactory = require('../utils/platformOverviewEffect');
const guard = require('../utils/platformOverviewRequestGuard');
const overviewState = require('../utils/platformOverviewState');

async function run() {
  assert.strictEqual(guard.createRequestId('cluster', 7), 'cluster:7');
  assert.strictEqual(guard.isLatestRequest('cluster:8', 'cluster:7'), false);
  assert.strictEqual(guard.isLatestRequest('cluster:8', 'cluster:8'), true);
  assert.strictEqual(guard.requestContext('cluster', { regionName: 'r1' }), 'r1');
  assert.strictEqual(
    guard.requestContext('metrics', { regionName: 'r1', metric: 'cpu', range: '6h' }),
    'r1|cpu|6h'
  );
  assert.strictEqual(
    guard.getErrorMessage({ response: { data: { msg_show: '集群暂不可用' } } }),
    '集群暂不可用'
  );
  assert.strictEqual(
    guard.getErrorMessage({ response: { data: { data: { msg_show: '后端详细错误' } } } }),
    '后端详细错误'
  );

  assert.strictEqual(overviewData.isVersionNewer('v6.10.0', 'v6.9.11'), true);
  assert.strictEqual(overviewData.isVersionNewer('v6.9.10', 'v6.9.11'), false);
  assert.deepStrictEqual(
    overviewData.metricState({ status: 'unavailable', series: [{ values: [['1', '20.5']] }] }),
    { status: 'unavailable', points: [], data: null }
  );
  assert.strictEqual(
    overviewData.runtimeSection(
      { status: 'partial', global: { application_alarms: { status: 'partial', total: 0 } } },
      'application_alarms'
    ).status,
    'partial'
  );
  assert.strictEqual(
    overviewData.sectionEnvelope(
      { sections: { plugins: { status: 'unavailable', data: null } } },
      'plugins'
    ).status,
    'unavailable'
  );
  assert.deepStrictEqual(
    overviewData.licenseState({ valid: false, reason: 'expired', expire_at: 0 }),
    { present: true, valid: false, reason: 'expired', expireAt: null }
  );
  assert.deepStrictEqual(
    overviewData.classifyLicenseRequestError({
      response: {
        status: 400,
        data: {
          code: 400,
          msg: 'invalid authz code',
          msg_show: '无效授权码',
          data: { bean: { authz_code: '' } }
        }
      }
    }),
    { status: 'empty', reason: '无效授权码' }
  );
  assert.deepStrictEqual(
    overviewData.classifyLicenseRequestError({
      response: {
        status: 400,
        data: { code: 400, msg: 'error', msg_show: 'license expired', error_code: 'invalid_license' }
      }
    }),
    { status: 'invalid', reason: 'license expired' }
  );
  assert.deepStrictEqual(
    overviewData.classifyLicenseRequestError({
      response: {
        status: 503,
        data: { code: 503, msg: 'service unavailable', error_code: 'license_service_unavailable' }
      }
    }),
    { status: 'error', reason: 'service unavailable' }
  );
  assert.deepStrictEqual(
    overviewData.nodeAlertTranslation({ type: 'disk_usage', filesystem: 'container', usage_percent: 82 }),
    { id: 'cluster.diskUsage', values: { filesystem: 'container', percent: 82 } }
  );
  assert.deepStrictEqual(overviewData.pluginRuntimeState('running'), {
    level: 'healthy',
    className: 'pluginHealthy',
    labelId: 'common.normal'
  });
  ['abnormal', 'failed'].forEach(status => {
    assert.strictEqual(overviewData.pluginRuntimeState(status).level, 'warning');
  });
  assert.strictEqual(overviewData.pluginRuntimeState('closed').level, 'stopped');
  assert.strictEqual(overviewData.pluginRuntimeState('starting').level, 'starting');
  assert.strictEqual(overviewData.pluginRuntimeState(null).level, 'unknown');

  let state = overviewState.createInitialState();
  state = overviewState.beginState(state, { section: 'cluster', requestId: 'cluster:1' });
  state = overviewState.resolveState(state, {
    section: 'cluster',
    requestId: 'cluster:1',
    context: 'region-a',
    data: { status: 'ok', region_name: 'region-a' },
    receivedAt: 1000
  });
  assert.strictEqual(state.cluster.region_name, 'region-a');
  assert.strictEqual(
    overviewState.readCacheEntry(state, 'cluster', 'region-a', 10999).data.region_name,
    'region-a'
  );
  assert.strictEqual(overviewState.readCacheEntry(state, 'cluster', 'region-a', 11000), null);

  let metricsState = overviewState.createInitialState();
  metricsState = overviewState.beginState(metricsState, {
    section: 'metrics',
    requestId: 'metrics:1'
  });
  metricsState = overviewState.resolveState(metricsState, {
    section: 'metrics',
    requestId: 'metrics:1',
    context: 'region-a|cpu|6h',
    data: { status: 'ok', metric: 'cpu' },
    receivedAt: 2000
  });
  metricsState = overviewState.beginState(metricsState, {
    section: 'metrics',
    requestId: 'metrics:2'
  });
  metricsState = overviewState.resolveState(metricsState, {
    section: 'metrics',
    requestId: 'metrics:2',
    context: 'region-a|memory|6h',
    data: { status: 'ok', metric: 'memory' },
    receivedAt: 3000
  });
  assert.strictEqual(
    overviewState.readCacheEntry(metricsState, 'metrics', 'region-a|cpu|6h', 4000).data.metric,
    'cpu'
  );
  assert.strictEqual(
    overviewState.readCacheEntry(metricsState, 'metrics', 'region-a|memory|6h', 4000).data.metric,
    'memory'
  );

  const beforeStale = overviewState.beginState(state, {
    section: 'cluster',
    requestId: 'cluster:2'
  });
  assert.strictEqual(
    overviewState.resolveState(beforeStale, {
      section: 'cluster',
      requestId: 'cluster:1',
      context: 'region-b',
      data: { region_name: 'region-b' },
      receivedAt: 2000
    }),
    beforeStale,
    'a stale response must return the exact existing state'
  );
  const rejected = overviewState.rejectState(beforeStale, {
    section: 'cluster',
    requestId: 'cluster:2',
    error: 'refresh failed'
  });
  assert.strictEqual(rejected.cluster.region_name, 'region-a');
  assert.strictEqual(rejected.errors.cluster, 'refresh failed');

  guard.clearInFlightRequests();
  let calls = 0;
  let finish;
  const loader = () => {
    calls += 1;
    return new Promise(resolve => {
      finish = resolve;
    });
  };
  const first = guard.runDeduped('cluster|eid|region-a', loader);
  const second = guard.runDeduped('cluster|eid|region-a', loader);
  assert.strictEqual(first, second);
  await Promise.resolve();
  assert.strictEqual(calls, 1);
  assert.strictEqual(guard.inFlightRequestCount(), 1);
  finish({ bean: { status: 'ok' } });
  await first;
  await Promise.resolve();
  assert.strictEqual(guard.inFlightRequestCount(), 0);

  effectFactory.resetRequestSequence();
  const cachedEffect = effectFactory.createFetchEffect('cluster', () => Promise.resolve());
  const select = selector => ({ kind: 'select', selector });
  const put = action => ({ kind: 'put', action });
  const generator = cachedEffect(
    { payload: { enterpriseId: 'eid', regionName: 'region-a' } },
    { call: () => null, put, select }
  );
  const selectStep = generator.next().value;
  assert.strictEqual(selectStep.kind, 'select');
  const cachedEntry = { data: { region_name: 'region-a' }, receivedAt: 5000 };
  assert.strictEqual(generator.next(cachedEntry).value.action.type, 'begin');
  assert.strictEqual(generator.next().value.action.type, 'resolve');
  assert.strictEqual(generator.next().done, true);

  const forcedGenerator = cachedEffect(
    { payload: { enterpriseId: 'eid', regionName: 'region-a', force: true } },
    { call: (fn, ...args) => ({ kind: 'call', fn, args }), put, select }
  );
  assert.strictEqual(
    forcedGenerator.next().value.action.type,
    'begin',
    'forced timer refreshes must bypass the fresh cache'
  );

  console.log('platform overview state, adapter and request tests passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
