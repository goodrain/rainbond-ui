const assert = require('assert');
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const data = require('./overviewData');
const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, 'index.less'), 'utf8');
// Exercise the unconnected render methods; DVA wiring stays in the production build.
const unconnected = source.replace(/@connect\([\s\S]*?\n\}\)\)\n/, '');
const code = esbuild.transformSync(unconnected, { loader: 'jsx', format: 'cjs', target: 'es2017' }).code;
const antd = {};
['Alert', 'Badge', 'Button', 'Empty', 'Icon', 'Modal', 'Select', 'Skeleton', 'Tooltip'].forEach(name => { antd[name] = function Stub() {}; });
antd.Select.Option = function Option() {};
antd.Empty.PRESENTED_IMAGE_SIMPLE = 'empty';
const result = { exports: {} };
const translations = [];
new Function('require', 'module', 'exports', code)(name => {
  if (name === 'antd') return antd;
  if (name === 'dva') return { connect: () => Component => Component };
  if (name === 'dva/router') return { routerRedux: { replace: route => ({ route }) } };
  if (name === '@/utils/intl') return { formatMessage: ({ id }, values) => { translations.push({ id, values }); return id; } };
  if (name === '@/utils/user') return {};
  if (name === './overviewData') return data;
  if (name === './index.less') return new Proxy({}, { get: (target, key) => key });
  if (name.startsWith('./components/')) return function ComponentStub() {};
  return require(name);
}, result, result.exports);
const page = new result.exports.default({ overview: { loading: {}, errors: {} } });
const oldMetrics = { status: 'ok', series: [{ values: [[100, 20]] }] };
const switching = new result.exports.default({ overview: { metrics: oldMetrics, contexts: { metrics: 'cluster-a|memory|6h' }, loading: { metrics: true }, errors: {} } });
switching.state = { ...switching.state, selectedRegion: 'cluster-a', metric: 'memory', timeRange: '24h' };
assert.strictEqual(switching.getCurrentMetrics(), oldMetrics, 'range switch keeps existing curve until the replacement is available');
switching.state.metric = 'cpu';
assert.strictEqual(switching.getCurrentMetrics(), null, 'another metric must not borrow the old curve');
switching.state.metric = 'memory'; switching.state.selectedRegion = 'cluster-b';
assert.strictEqual(switching.getCurrentMetrics(), null, 'another cluster must not borrow the old curve');
switching.state.selectedRegion = 'cluster-a';
const replacement = { status: 'ok', series: [{ values: [[200, 40]] }] };
switching.props = { overview: { ...switching.props.overview, metrics: replacement, contexts: { metrics: 'cluster-a|memory|24h' }, loading: { metrics: false } } };
assert.strictEqual(switching.getCurrentMetrics(), replacement);
switching.props = { overview: { ...switching.props.overview, metrics: { status: 'unavailable', series: [] } } };
assert.strictEqual(switching.getCurrentMetrics().status, 'unavailable', 'an unavailable response replaces the old graph honestly');
const chartModule = { exports: {} };
const chartSource = fs.readFileSync(path.join(__dirname, 'components/ResourceTrend.js'), 'utf8');
const chartCode = esbuild.transformSync(chartSource, { loader: 'jsx', format: 'cjs', target: 'es2017' }).code;
new Function('require', 'module', 'exports', chartCode)(name => {
  if (name === '../overviewData') return data;
  if (name === '../index.less') return {};
  if (name === '../../../../config/theme') return require('../../../config/theme');
  return require(name);
}, chartModule, chartModule.exports);
const trend = new chartModule.exports.default({ data: oldMetrics, metric: 'memory' });
const updates = [];
trend.chart = { setOption: (option, notMerge) => updates.push({ option, notMerge }) };
trend.echarts = { graphic: { LinearGradient: function Gradient() {} } };
trend.updateChart();
trend.props = { ...trend.props, data: replacement };
trend.updateChart();
assert.ok(updates.every(update => update.notMerge === false && update.option.animation === false));
assert.strictEqual(updates[0].option.series[0].id, updates[1].option.series[0].id);
assert.deepStrictEqual(updates[1].option.series[0].data, [[200000, 40]]);
assert.equal(updates[1].option.xAxis.axisLabel.color, require('../../../config/theme')['text-color-secondary']);
assert.equal(updates[1].option.yAxis.axisLabel.color, require('../../../config/theme')['text-color-secondary']);
assert.equal(updates[1].option.xAxis.axisLabel.fontSize, 12);
assert.equal(updates[1].option.yAxis.axisLabel.fontSize, 12);
const runtimeStatus = result.exports.clusterRuntimeStatus;
const healthySnapshot = () => ({ sections: {
  // Console _normalize_nodes returns no data.status; availability lives on the envelope.
  nodes: { status: 'ok', data: { ready: 2, total: 2, disk_stats_status: 'ok', alerts: [] } },
  components: { status: 'ok', data: [{ status: 'Running', run_pods: 1, all_pods: 1 }] }
} });
assert.strictEqual(runtimeStatus(healthySnapshot()), 'normal');
assert.strictEqual(runtimeStatus(healthySnapshot(), true), 'unknown');
assert.strictEqual(runtimeStatus(null), 'unknown');
for (const change of [s => { s.sections.nodes.data.ready = 1; }, s => { s.sections.nodes.data.alerts = [{}]; }, s => { s.sections.components.data[0].status = 'Abnormal'; }, s => { s.sections.components.data[0].run_pods = 0; }]) {
  const snapshot = healthySnapshot(); change(snapshot); assert.strictEqual(runtimeStatus(snapshot), 'abnormal');
}
for (const change of [s => { s.sections.nodes.status = 'unavailable'; }, s => { s.sections.nodes.data.disk_stats_status = 'unavailable'; }, s => { s.sections.nodes.data.ready = null; }, s => { s.sections.components.data = []; }, s => { s.sections.components.data[0].status = 'UNKNOWN'; }, s => { s.sections.nodes.data.total = 0; s.sections.nodes.data.ready = 0; }]) {
  const snapshot = healthySnapshot(); change(snapshot); assert.strictEqual(runtimeStatus(snapshot), 'unknown');
}
const nodes = element => !element || typeof element !== 'object' ? [] : Array.isArray(element)
  ? element.flatMap(nodes) : [element].concat(nodes(element.props && element.props.children));
page.getCurrentMetrics = () => ({ status: 'ok', series: [{ values: [[100, 20]] }] });
const monitoring = page.renderMonitoring();
assert.strictEqual(monitoring.props.extra, undefined, 'chart controls belong inside chart area, not module header');
const toolbar = nodes(monitoring).find(item => item.props.className === 'chartToolbar');
assert.ok(toolbar && nodes(toolbar).some(item => item.props.className === 'monitorControls'));
assert.deepStrictEqual(nodes(toolbar).filter(item => item.type === 'button').map(item => item.props.children), ['platformOverview.monitor.memory', 'platformOverview.monitor.cpu', 'platformOverview.monitor.network']);
let changed;
page.handleMetricChange = value => { changed = value; };
nodes(page.renderMonitoring()).find(item => item.type === 'button' && item.props.children === 'platformOverview.monitor.cpu').props.onClick();
assert.strictEqual(changed, 'cpu');
page.getCurrentSnapshot = () => ({ sections: {
  components: { status: 'ok', data: ['rbd-api', 'rbd-gateway', 'minio'].map((name, index) => ({ name, status: index === 2 ? 'Abnormal' : 'Running', run_pods: index === 2 ? 0 : 1, all_pods: 1 })) },
  plugins: { status: 'ok', data: Array.from({ length: 12 }, (_, index) => ({ name: `plugin-${index}`, status: index ? 'RUNNING' : 'CLOSED' })) }
} });
const services = nodes(page.renderServices());
assert.deepStrictEqual(services.filter(item => item.props.className === 'componentIcon').map(item => nodes(item).find(child => child.type === antd.Icon).props.type), ['database', 'api', 'global']);
assert.strictEqual(services.filter(item => item.props.className === 'componentState' && item.props['aria-label'] === 'platformOverview.common.abnormal').length, 1);
const plugins = services.find(item => item.props.className === 'pluginList');
assert.strictEqual(nodes(plugins).filter(item => item.type === 'button').length, 8, 'compact preview has at most eight');
page.state = { ...page.state, selectedRegion: 'beijing', pluginModalRegion: 'beijing' };
page.props = { ...page.props, match: { params: { eid: 'test' } }, enterprise: {}, rainbondInfo: {}, overview: { loading: {}, errors: {}, runtime: null } };
let dialog = nodes(page.renderModals()).find(item => item.type === antd.Modal);
assert.strictEqual(dialog.props.visible, true);
assert.strictEqual(nodes(dialog).filter(item => item.type === 'button').length, 12, 'complete dialog keeps every plugin');
page.state.selectedRegion = 'guangzhou';
assert.strictEqual(nodes(page.renderModals()).find(item => item.type === antd.Modal).props.visible, false, 'old cluster dialog cannot remain visible');
for (const count of [0, 7, 8, 12]) {
  const fixture = Array.from({ length: count }, (_, index) => ({ name: `item-${index}`, status: ['RUNNING', 'CLOSED', 'ERROR', 'UNKNOWN', 'STARTING'][index % 5] }));
  const original = JSON.stringify(fixture);
  const presentation = data.pluginPresentation(fixture);
  assert.strictEqual(presentation.preview.length, Math.min(count, 8));
  assert.strictEqual(presentation.summary.reduce((sum, item) => sum + item.count, 0), count);
  assert.ok(presentation.summary.every(item => item.count > 0));
  assert.strictEqual(JSON.stringify(fixture), original, 'source is not mutated');
  page.getCurrentSnapshot = () => ({ sections: { components: { status: 'ok', data: [] }, plugins: { status: 'ok', data: fixture } } });
  const rendered = nodes(page.renderServices());
  assert.strictEqual(rendered.filter(item => item.type === 'button' && item.props.title).length, Math.min(count, 8));
  assert.strictEqual(rendered.some(item => item.props.className === 'viewAllPlugins'), count > 8);
  const summary = rendered.find(item => item.props.className === 'pluginSummary');
  assert.strictEqual(nodes(summary).filter(item => item.props.className && item.props.className.startsWith('pluginRuntime ')).length, presentation.summary.length);
}
const mixed = data.pluginPresentation(['CLOSED', 'RUNNING', 'STARTING', null, 'ERROR'].map((status, index) => ({ name: String(index), status })));
assert.deepStrictEqual(mixed.ordered.map(item => item.runtime.level), ['warning', 'unknown', 'starting', 'healthy', 'stopped']);
const components = ['rbd-api', 'rbd-gateway', 'rbd-worker', 'rbd-chaos', 'minio', 'rbd-monitor'].map(name => ({ name, status: 'RUNNING' }));
assert.deepStrictEqual(data.representativeComponents(components).map(item => item.name), components.slice(0, 4).map(item => item.name));
components[5].status = 'ERROR';
assert.strictEqual(data.representativeComponents(components)[0].name, 'rbd-monitor', 'non-key abnormal component is promoted');
assert.strictEqual(data.representativeComponents(components).length, 4);
page.getCurrentSnapshot = () => ({ sections: { components: { status: 'ok', data: components }, plugins: { status: 'unavailable', data: null } } });
assert.strictEqual(nodes(page.renderServices()).filter(item => item.props.className === 'componentState').length, 4);
assert.ok(nodes(page.renderServices()).some(item => item.type === antd.Alert && item.props.message === 'platformOverview.services.pluginsUnavailable'));
page.setState = (update, callback) => { page.state = { ...page.state, ...update }; if (callback) callback(); };
page.loadClusterData = () => {};
page.props.dispatch = () => {};
page.handleClusterChange('shanghai');
assert.strictEqual(page.state.pluginModalRegion, null, 'cluster selection actively closes the dialog');
assert.ok(!/\.pluginList\s*\{[^}]*overflow-y: auto;/.test(styles));
assert.ok(/\.fullPluginList\s*\{[^}]*overflow-y: auto;/.test(styles));
assert.ok(/\.monitorModule \.moduleBody\s*\{[^}]*min-height: 360px;/.test(styles), 'the desktop monitor keeps its compact body height');
assert.ok(/\.trendChart\s*\{[^}]*height: 260px;[^}]*min-height: 260px;[^}]*flex: 1 0 260px;/.test(styles), 'the chart height, minimum and flex basis must agree at the approved compact size');
assert.ok(/\.componentGrid button\s*\{[^}]*min-height: 46px;[^}]*padding: 5px 8px;/.test(styles), 'component preview rows must not stretch the monitoring row');
assert.ok(/\.pluginList button\s*\{[^}]*min-height: 38px;[^}]*padding: 4px 8px;/.test(styles), 'eight preview plugins fit without a scrolling panel');
assert.ok(/\.pluginList\s*\{[^}]*gap: 6px;/.test(styles), 'preview rows retain compact spacing');
assert.ok(/\.fullPluginList button\s*\{[^}]*min-height: 46px;/.test(styles), 'the full-list modal can use more generous rows');
assert.ok(/\.pluginCopy\s*\{[^}]*gap: 4px 10px;/.test(styles), 'plugin labels and runtime states retain readable separation');
assert.ok(/\.componentIcon\s*\{[^}]*width: 24px;[^}]*height: 24px;/.test(styles));
assert.ok(/\.pluginIcon\s*\{[^}]*width: 24px;[^}]*height: 24px;/.test(styles));
assert.ok(/\.gatewayMetrics\s*\{[^}]*gap: 8px;[^}]*border: 0;/.test(styles));
assert.ok(/\.resourceCopy > strong small\s*\{\s*display: inline;/.test(styles), 'capacity stays beside allocation like the approved demo');

// Rendering must preserve the distinction between a failed request and a known fault.
const textOf = element => element == null ? '' : Array.isArray(element) ? element.map(textOf).join('') :
  typeof element === 'object' ? textOf(element.props && element.props.children) : String(element);
const displayPage = new result.exports.default({
  match: { params: { eid: 'test' } }, dispatch: () => {},
  overview: { loading: {}, errors: {}, updatedAt: {}, shell: { global: { clusters: 1 } } }
});
let reloads = [];
displayPage.props.dispatch = action => reloads.push(action.type);
const runtimeNotice = displayPage.renderRuntimeNotice(data.runtimeAvailability(null, 'private transport details'));
assert.ok(textOf(runtimeNotice.props.message).includes('platformOverview.global.runtimeFailed'));
assert.ok(!textOf(runtimeNotice.props.message).includes('private transport details'));
nodes(runtimeNotice.props.message).find(item => item.type === antd.Button).props.onClick();
assert.deepStrictEqual(reloads, ['platformOverview/fetchRuntime'], 'retry is explicit and fetches only runtime status');

displayPage.getCurrentCluster = () => ({ region_name: 'test' });
displayPage.getCurrentSnapshot = () => ({ sections: {
  resources: { status: 'ok', data: { cpu: {}, memory: {}, pods: {}, versions: {} } },
  nodes: { status: 'ok', data: { total: 1, ready: null, alerts: [] } }
} });
assert.ok(!textOf(displayPage.renderClusterOverview()).includes('platformOverview.cluster.allReady'),
  'unknown node readiness must not render all nodes ready');
displayPage.props.overview.errors.cluster = 'refresh failed';
displayPage.getCurrentSnapshot = () => ({ sections: {
  components: { status: 'ok', data: [{ name: 'rbd-api', status: 'RUNNING', run_pods: 1, all_pods: 1 }] },
  plugins: { status: 'ok', data: [] }
} });
assert.ok(textOf(displayPage.renderServices()).includes('platformOverview.services.previousState'),
  'a failed cluster refresh identifies retained component data as last known status');

displayPage.props.overview.errors.cluster = null;
const restartComponents = ['rbd-api', 'rbd-gateway', 'rbd-worker', 'rbd-chaos', 'minio'].map(name => ({
  name, status: 'RUNNING', run_pods: 1, all_pods: 1, pods: [{ restart_count: name === 'minio' ? 3 : 0 }]
}));
displayPage.getCurrentSnapshot = () => ({ sections: {
  components: { status: 'ok', data: restartComponents }, plugins: { status: 'ok', data: [] }
} });
const restartServices = nodes(displayPage.renderServices());
assert.equal(restartServices.filter(item => item.props.className === 'componentRestartSummary').length, 1,
  'restart records cover every component, including those outside the four preview positions');
assert.ok(restartServices.filter(item => item.type === antd.Tooltip).some(item => textOf(item.props.title).includes('minio')));
assert.equal(restartServices.filter(item => item.props.className === 'componentRestartCount').length, 0,
  'stable representative rows remain uncluttered when another component has a restart record');
restartComponents[0].pods = [{ restart_count: 2 }, {}];
const partialRestartServices = nodes(displayPage.renderServices());
assert.ok(partialRestartServices.some(item => item.props.className === 'componentRestartCount' &&
  textOf(item).includes('platformOverview.services.restartCountAtLeast')));
assert.equal(partialRestartServices.filter(item => item.props.className === 'componentAbnormal').length, 0,
  'past restart records alone must not mark a currently ready component unhealthy');

const rankingSnapshot = { sections: {
  resources: { status: 'ok', data: { cpu: { capacity: 64 }, memory: { capacity: 131072 } } },
  teams: { status: 'ok', data: {
    memory: [{ tenant_id: 'a', tenant_name: 'a', memory_gib: 32 }, { tenant_id: 'b', tenant_name: 'b', memory_gib: 16 }],
    cpu: [{ tenant_id: 'a', tenant_name: 'a', cpu_cores: 8 }],
    applications: [{ tenant_id: 'a', tenant_name: 'a', applications: 10 }],
    totals: { cpu_cores: 8, memory_gib: 48, applications: 40 }
  } }
} };
displayPage.getCurrentSnapshot = () => rankingSnapshot;
displayPage.state.teamMetric = 'memory';
const rankingBars = () => nodes(displayPage.renderTeamRanking()).filter(item => item.props.className === 'teamTrack')
  .map(item => item.props.children.props.style.width);
assert.deepStrictEqual(rankingBars(), ['25%', '12.5%'], 'bars represent cluster capacity, not the highest-ranked team or top-five sum');
displayPage.state.teamMetric = 'cpu';
assert.deepStrictEqual(rankingBars(), ['12.5%']);
displayPage.state.teamMetric = 'applications';
assert.deepStrictEqual(rankingBars(), ['25%']);
displayPage.state.teamMetric = 'memory';
rankingSnapshot.sections.resources.data.memory.capacity = 16384;
assert.deepStrictEqual(rankingBars(), ['100%', '100%'], 'overcommitted resource bars stay inside their track');
rankingSnapshot.sections.resources.status = 'unavailable';
assert.ok(textOf(displayPage.renderTeamRanking()).includes('platformOverview.teams.shareUnavailable'));

const postureRuntime = { status: 'ok', global: {
  clusters: { total: 1, healthy: 1, warning: 0, unavailable: 0 },
  nodes: { status: 'ok', total: 2, ready: 2 },
  applications: { status: 'ok', total: 13, running: 11 },
  components: { status: 'ok', total: 39, running: 34 },
  application_alarms: { status: 'ok', total: 1, items: [] }
} };
displayPage.props.overview.shell = { global: { clusters: 1, teams: 4, users: 2, applications: 13, components: 39 } };
displayPage.props.overview.runtime = postureRuntime;
const postureMetrics = () => nodes(displayPage.renderGlobalPosture()).filter(item =>
  typeof item.props.className === 'string' && item.props.className.startsWith('globalMetric '));
const completeMetrics = postureMetrics();
assert.equal(nodes(completeMetrics[2]).filter(item => item.type === 'em').length, 0, 'team counts do not need a platform-scope filler');
assert.equal(nodes(completeMetrics[3]).filter(item => item.type === 'em').length, 0, 'user counts do not need an unexplained active-user label');
assert.ok(textOf(completeMetrics[4]).includes('13 / 39'));
assert.deepStrictEqual(translations.filter(item => item.id === 'platformOverview.global.runningCounts').pop().values,
  { applications: 11, components: 34 }, 'workload detail reports actual runtime counts rather than repeating the heading');
displayPage.setState = update => { displayPage.state = { ...displayPage.state, ...update }; };
completeMetrics[5].props.onClick();
assert.equal(displayPage.state.applicationModalVisible, true, 'retrieved application alarms keep their existing modal action');
postureRuntime.global.applications.status = 'partial';
postureRuntime.global.components.status = 'partial';
assert.ok(textOf(postureMetrics()[4]).includes('platformOverview.global.runningPartial'));
postureRuntime.global.application_alarms.status = 'partial';
postureRuntime.global.application_alarms.total = 0;
const partialAlarm = postureMetrics()[5];
assert.ok(textOf(partialAlarm).includes('platformOverview.global.alarmPartial'));
assert.ok(!textOf(partialAlarm).includes('platformOverview.global.none'), 'partial zero is not an all-clear');
delete postureRuntime.global.application_alarms.total;
assert.ok(textOf(postureMetrics()[5]).includes('-'), 'a missing alarm count remains unknown');
postureRuntime.global.applications.status = 'ok';
postureRuntime.global.components.status = 'ok';
postureRuntime.global.applications.running = 0;
postureRuntime.global.components.running = 0;
postureMetrics();
assert.deepStrictEqual(translations.filter(item => item.id === 'platformOverview.global.runningCounts').pop().values,
  { applications: 0, components: 0 }, 'known zero running counts are preserved');
displayPage.props.overview.errors.runtime = 'failed';
assert.ok(textOf(postureMetrics()[4]).includes('platformOverview.global.previousRunningCounts'));
displayPage.props.overview.runtime = null;
delete displayPage.props.overview.shell.global.components;
const unavailableWorkload = textOf(postureMetrics()[4]);
assert.ok(unavailableWorkload.includes('13 / -') && unavailableWorkload.includes('platformOverview.global.runningUnavailable'));
assert.ok(!unavailableWorkload.includes('undefined') && !unavailableWorkload.includes('null'));

// Copy must preserve the difference between current activity and cumulative history.
const localeMessages = language => {
  const locale = { exports: {} };
  const localeCode = esbuild.transformSync(fs.readFileSync(path.join(__dirname, `../../locales/${language}/enterprise.js`), 'utf8'), { format: 'cjs' }).code;
  new Function('module', 'exports', localeCode)(locale, locale.exports);
  return locale.exports.default;
};
for (const language of ['zh-CN', 'en-US']) {
  const messages = localeMessages(language);
  const running = messages['platformOverview.global.runningCounts'];
  assert.ok(running.includes('{applications}') && running.includes('{components}') && !running.includes(' / '));
  assert.match(running, language === 'zh-CN' ? /应用.*组件/ : /apps.*components/);
  assert.match(messages['platformOverview.services.restartCount'], language === 'zh-CN' ? /累计/ : /cumulative/);
  assert.match(messages['platformOverview.services.restartGroups'], language === 'zh-CN' ? /记录/ : /records/);
}
const gatewaySnapshot = { sections: { gateway: { status: 'ok', data: { http_domains: 7, tcp_routes: 2, certificates: [], issues: [] } } } };
displayPage.getCurrentSnapshot = () => gatewaySnapshot;
const clearGateway = displayPage.renderGateway();
assert.ok(clearGateway.props.className.includes('gatewayModule'));
assert.ok(!nodes(clearGateway).some(item => item.type === 'button'), 'normal gateway state does not invent an action');
gatewaySnapshot.sections.gateway.data.issues = [{ domain: 'expired.example.com' }];
const gatewayAction = nodes(displayPage.renderGateway()).find(item => item.type === 'button');
assert.ok(gatewayAction);
gatewayAction.props.onClick();
assert.equal(displayPage.state.gatewayModalVisible, true, 'certificate issues retain their existing modal entry');
gatewaySnapshot.sections.gateway.status = 'empty';
assert.equal(displayPage.renderGateway(), null, 'an empty gateway section remains hidden');
console.log('overview visual parity rendering and interaction checks passed');
