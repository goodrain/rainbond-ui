const assert = require('node:assert/strict');
const test = require('node:test');
const data = require('./overviewData');

const healthyRuntime = () => ({ status: 'ok', global: {
  clusters: { total: 2, healthy: 2, warning: 0, unavailable: 0 },
  nodes: { status: 'ok', total: 4, ready: 4 },
  applications: { status: 'ok', total: 8 }, components: { status: 'ok', total: 20 },
  application_alarms: { status: 'ok', total: 0, items: [] }
}, regions: [{ region_name: 'a', status: 'healthy' }, { region_name: 'b', status: 'healthy' }] });

test('confirmed cluster faults and unknown cluster states remain distinct', () => {
  const runtime = healthyRuntime();
  runtime.global.clusters = { total: 3, healthy: 1, warning: 1, unavailable: 1 };
  assert.deepEqual(data.platformClusterSummary(runtime), {
    level: 'warning', labelId: 'header.clusterMixed', values: { warning: 1, unknown: 1 }
  });
  runtime.global.clusters.warning = 0;
  assert.deepEqual(data.platformClusterSummary(runtime), {
    level: 'unknown', labelId: 'header.clusterUnknown', values: { count: 1 }
  });
  assert.equal(data.platformClusterSummary(healthyRuntime(), 'request failed').level, 'unknown',
    'a failed refresh cannot leave a fresh healthy summary on the header');
});

test('missing runtime sections are named while healthy sections are not blamed', () => {
  const runtime = healthyRuntime();
  runtime.status = 'partial';
  runtime.global.nodes.status = 'partial';
  runtime.global.applications.status = 'partial';
  assert.deepEqual(data.runtimeAvailability(runtime), {
    kind: 'partial', missing: ['nodes', 'workloads'], regions: []
  });
  assert.equal(data.runtimeAvailability(healthyRuntime()).kind, 'ok');
});

test('affected clusters use reported unknown states without treating warnings or disabled clusters as data gaps', () => {
  const runtime = healthyRuntime();
  runtime.global.clusters.unavailable = 1;
  runtime.regions = [
    { region_name: 'a', region_alias: '北京', status: 'unavailable' },
    { region_name: 'a', region_alias: '北京', status: 'unavailable' },
    { region_name: 'b', status: 'warning' }, { region_name: 'c', status: 'disabled' }
  ];
  const before = JSON.stringify(runtime);
  assert.deepEqual(data.runtimeAvailability(runtime), { kind: 'partial', missing: ['clusters'], regions: ['北京 (a)'] });
  assert.equal(JSON.stringify(runtime), before);
});

test('same cluster aliases retain distinct identifiers in data availability details', () => {
  const runtime = healthyRuntime();
  runtime.regions = [
    { region_name: 'a', region_alias: '默认集群', status: 'unavailable' },
    { region_name: 'b', region_alias: '默认集群', status: 'unavailable' }
  ];
  assert.deepEqual(data.runtimeAvailability(runtime).regions, ['默认集群 (a)', '默认集群 (b)']);
});

test('failed refreshes and absent responses never imply zero faults or healthy status', () => {
  assert.equal(data.runtimeAvailability(null).kind, 'loading');
  assert.equal(data.runtimeAvailability(null, 'failed').kind, 'unavailable');
  assert.equal(data.runtimeAvailability(healthyRuntime(), 'failed').kind, 'stale');
  assert.deepEqual(data.runtimeAvailability({ status: 'unavailable' }).missing,
    ['clusters', 'nodes', 'workloads', 'appAlarms']);
  const runtime = healthyRuntime();
  runtime.status = 'partial';
  assert.deepEqual(data.runtimeAvailability(runtime), { kind: 'partial', missing: [], regions: [] },
    'legacy partial responses without section details must not invent a cause');
});

test('unknown component status is neutral and observed replica failures remain abnormal', () => {
  assert.equal(data.componentVisualState({ status: 'UNKNOWN' }).level, 'unknown');
  assert.equal(data.componentVisualState({ status: 'Running', run_pods: 0, all_pods: 0 }).level, 'unknown');
  assert.equal(data.componentVisualState({ status: 'Running', run_pods: 1, all_pods: 2 }).level, 'warning');
  assert.equal(data.componentVisualState({ status: 'Running', run_pods: 2, all_pods: 2 }).level, 'healthy');
  assert.equal(data.componentVisualState({ status: 'STARTING' }).level, 'starting');
  assert.equal(data.componentVisualState({ status: 'CLOSED' }).level, 'warning');
  assert.equal(data.componentVisualState(null).level, 'unknown');
});

test('known component failures precede unknowns and healthy representatives without mutating input', () => {
  const components = [
    { name: 'rbd-api', status: 'Running', run_pods: 1, all_pods: 1 },
    { name: 'rbd-monitor', status: 'UNKNOWN' },
    { name: 'minio', status: 'Running', run_pods: 0, all_pods: 1 }
  ];
  assert.deepEqual(data.representativeComponents(components).map(item => item.name), ['minio', 'rbd-monitor', 'rbd-api']);
  assert.equal(components[0].name, 'rbd-api');
});
