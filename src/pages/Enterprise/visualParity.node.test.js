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
['Alert', 'Badge', 'Button', 'Empty', 'Icon', 'Select', 'Skeleton', 'Tooltip'].forEach(name => { antd[name] = function Stub() {}; });
antd.Select.Option = function Option() {};
antd.Empty.PRESENTED_IMAGE_SIMPLE = 'empty';
const result = { exports: {} };
new Function('require', 'module', 'exports', code)(name => {
  if (name === 'antd') return antd;
  if (name === 'dva') return { connect: () => Component => Component };
  if (name === 'dva/router') return { routerRedux: {} };
  if (name === '@/utils/intl') return { formatMessage: ({ id }) => id };
  if (name === '@/utils/user') return {};
  if (name === './overviewData') return data;
  if (name === './index.less') return new Proxy({}, { get: (target, key) => key });
  if (name.startsWith('./components/')) return function ComponentStub() {};
  return require(name);
}, result, result.exports);
const page = new result.exports.default({ overview: { loading: {}, errors: {} } });
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
assert.strictEqual(plugins.props.tabIndex, '0');
assert.strictEqual(nodes(plugins).filter(item => item.type === 'button').length, 12, 'no hidden plugin truncation');
assert.ok(/\.module\s*\{[^}]*box-shadow: @rbd-min-card-shadow;/.test(styles));
assert.ok(/\.pluginList\s*\{[^}]*overflow-y: auto;/.test(styles));
assert.ok(/\.gatewayMetrics\s*\{[^}]*gap: 8px;[^}]*border: 0;/.test(styles));
console.log('overview visual parity rendering and interaction checks passed');
