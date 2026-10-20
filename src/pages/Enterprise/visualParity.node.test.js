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
new Function('require', 'module', 'exports', code)(name => {
  if (name === 'antd') return antd;
  if (name === 'dva') return { connect: () => Component => Component };
  if (name === 'dva/router') return { routerRedux: { replace: route => ({ route }) } };
  if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
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
const runtimeStatus = result.exports.clusterRuntimeStatus;
const healthySnapshot = () => ({ sections: {
  // Console _normalize_nodes returns no data.status; availability lives on the envelope.
  nodes: { status: 'ok', data: { ready: 2, total: 2, disk_stats_status: 'ok', certificate_status: 'ok', alerts: [] } },
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
assert.ok(/\.module\s*\{[^}]*box-shadow: @rbd-min-card-shadow;/.test(styles));
assert.ok(!/\.pluginList\s*\{[^}]*overflow-y: auto;/.test(styles));
assert.ok(/\.fullPluginList\s*\{[^}]*overflow-y: auto;/.test(styles));
assert.ok(/\.componentGrid button\s*\{[^}]*min-height: 46px;/.test(styles));
assert.ok(/\.pluginList button\s*\{[^}]*min-height: 38px;/.test(styles));
assert.ok(/\.gatewayMetrics\s*\{[^}]*gap: 8px;[^}]*border: 0;/.test(styles));
assert.ok(/\.resourceCopy > strong small\s*\{\s*display: inline;/.test(styles), 'capacity stays beside allocation like the approved demo');
assert.ok(/\.resourceCopy > strong\s*\{[^}]*color: darken\(@heading-color, 10%\);/.test(styles), 'allocation uses dark text, not the node-count accent');
assert.ok(/\.resourceContent\s*\{[^}]*grid-template-columns: minmax\(82px, 1fr\) 100px;/.test(styles));
assert.ok(/\.resourceGauge\s*\{[^}]*width: 100px;[^}]*height: 72px;[^}]*justify-self: end;/.test(styles));
console.log('overview visual parity rendering and interaction checks passed');
