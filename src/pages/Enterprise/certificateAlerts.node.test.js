const assert = require('assert');
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const data = require('./overviewData');
const localeSource = fs.readFileSync(path.join(__dirname, '../../locales/en-US/enterprise.js'), 'utf8');
const localeModule = { exports: {} };
new Function('module', 'exports', esbuild.transformSync(localeSource, {format: 'cjs'}).code)(localeModule, localeModule.exports);
const locale = localeModule.exports.default;
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
  if (name === '@/utils/intl') return { formatMessage: ({ id }, values) => { const text = locale[id] || id; return text.replace(/\{(\w+)\}/g, (_, key) => values && values[key]); } };
  if (name === '@/utils/user') return {};
  if (name === './overviewData') return data;
  if (name === './index.less') return new Proxy({}, { get: (target, key) => key });
  if (name.startsWith('./components/')) return function ComponentStub() {};
  return require(name);
}, result, result.exports);

const runtimeStatus = result.exports.clusterRuntimeStatus;
const snapshot = () => ({ sections: {
  cluster: { status: 'ok', data: { region_name: 'test-cluster', provider: 'RKE2' } },
  nodes: { status: 'ok', data: { ready: 2, total: 2, disk_stats_status: 'ok', certificate_status: 'ok', alerts: [] } },
  components: { status: 'ok', data: [{ status: 'Running', run_pods: 1, all_pods: 1 }] }
} });
function tree(element) {
  if (Array.isArray(element)) return element.flatMap(tree);
  if (!element || typeof element !== 'object') return [];
  return [element, ...tree(element.props && element.props.children)];
}
function text(element) {
  if (Array.isArray(element)) return element.map(text).join(' ');
  if (element == null || typeof element === 'boolean') return '';
  if (typeof element !== 'object') return String(element);
  return text(element.props.children);
}
function render(current) {
  const page = new result.exports.default({ overview: { errors: {} } });
  page.getCurrentSnapshot = () => current;
  page.getCurrentCluster = () => ({ region_name: 'test-cluster' });
  return page.renderClusterOverview();
}
for (const type of ['certificate_expiring', 'certificate_expired']) {
  const current = snapshot();
  current.sections.nodes.data.alerts = [{ type, severity: 'critical', node_name: 'worker-rke2-01', certificate_name: 'agent/client-rke2-controller.crt', expires_at: '2026-11-01T12:34:56Z', remaining_days: type === 'certificate_expired' ? -18 : 12 }];
  const rendered = render(current);
  const fullText = text(rendered);
  assert.strictEqual(runtimeStatus(current), 'abnormal');
  for (const value of ['worker-rke2-01', 'agent/client-rke2-controller.crt', '2026-11-01', 'Critical']) assert.ok(fullText.includes(value), value);
  assert.ok(fullText.includes(type === 'certificate_expired' ? 'has expired' : '12 days remaining'));
  if (type === 'certificate_expired') assert.ok(fullText.includes('-18 days remaining'), 'expired certificates retain signed remaining days');
  assert.ok(!fullText.includes('Node is not ready'));
  assert.ok(tree(rendered).some(item => item.type === 'button' && item.props.className === 'criticalAlert'));
}
for (const status of ['partial', 'unavailable', undefined]) {
  const current = snapshot(); current.sections.nodes.data.certificate_status = status;
  assert.strictEqual(runtimeStatus(current), 'normal', 'optional certificate coverage must not override runtime health');
  assert.ok(text(render(current)).includes('certificate validity is unknown'));
}
for (const status of ['ok', 'not_applicable']) {
  const current = snapshot(); current.sections.nodes.data.certificate_status = status;
  assert.strictEqual(runtimeStatus(current), 'normal');
  assert.ok(!tree(render(current)).some(item => item.type === 'aside'));
  assert.ok(!text(render(current)).includes('certificate validity is unknown'));
}
assert.strictEqual(data.nodeAlertTranslation({ type: 'unrecognized_certificate' }).id, 'cluster.unknownAlert');
assert.strictEqual(data.nodeAlertTranslation({ type: 'node_not_ready' }).id, 'cluster.nodeNotReady');
assert.deepStrictEqual(data.nodeAlertTranslation({ type: 'disk_usage', filesystem: 'container', usage_percent: 91 }), { id: 'cluster.diskUsage', values: { filesystem: 'container', percent: 91 } });
console.log('Certificate expiry, critical metadata rendering, unknown collection and renewal checks passed');
