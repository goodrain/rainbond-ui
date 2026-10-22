const assert = require('assert');
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const overviewData = require('./overviewData');

process.env.TZ = 'Asia/Shanghai';
const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const code = esbuild.transformSync(source.replace(/@connect\([\s\S]*?\n\}\)\)\n/, ''), { loader: 'jsx', format: 'cjs', target: 'es2017' }).code;
const fixedNow = Date.parse('2026-10-22T00:00:00Z');
const day = 86400000;
const originalNow = Date.now;
Date.now = () => fixedNow;

function runtime(language) {
  const localeSource = fs.readFileSync(path.join(__dirname, `../../locales/${language}/enterprise.js`), 'utf8');
  const localeModule = { exports: {} };
  new Function('module', 'exports', esbuild.transformSync(localeSource, { format: 'cjs' }).code)(localeModule, localeModule.exports);
  const locale = localeModule.exports.default;
  const antd = {};
  ['Alert', 'Badge', 'Button', 'Empty', 'Icon', 'Modal', 'Select', 'Skeleton', 'Tooltip'].forEach(name => { antd[name] = function Stub() {}; });
  antd.Select.Option = function Option() {};
  antd.Empty.PRESENTED_IMAGE_SIMPLE = 'empty';
  const result = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    if (name === 'antd') return antd;
    if (name === 'dva') return { connect: () => Component => Component };
    if (name === 'dva/router') return { routerRedux: {} };
    if (name === '@/utils/intl') return { formatMessage: ({ id }, values) => {
      assert.ok(Object.prototype.hasOwnProperty.call(locale, id), `${language}: missing translation ${id}`);
      return locale[id].replace(/\{(\w+)\}/g, (_, key) => values && values[key]);
    } };
    if (name === '@/utils/user') return {};
    if (name === './overviewData') return overviewData;
    if (name === './index.less') return new Proxy({}, { get: (target, key) => key });
    if (name.startsWith('./components/')) return function ComponentStub() {};
    return require(name);
  }, result, result.exports);
  return result.exports;
}

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

function snapshot(expiry = '2027-01-20T00:00:00Z') {
  return { generated_at: '2026-10-22T00:00:00Z', sections: {
    cluster: { status: 'ok', data: { region_name: 'test-cluster', provider: 'RKE2' } },
    nodes: { status: 'ok', data: {
      ready: 1, total: 1, disk_stats_status: 'ok', certificate_status: 'ok', alerts: [],
      items: [{ name: 'worker-rke2-01', certificate_status: 'ok', certificates: expiry ? [{ name: 'agent/client-kubelet.crt', expires_at: expiry }] : [] }]
    } },
    components: { status: 'ok', data: [{ status: 'Running', run_pods: 1, all_pods: 1 }] }
  } };
}

function render(api, current) {
  const page = new api.default({ overview: { errors: {} } });
  page.getCurrentSnapshot = () => current;
  page.getCurrentCluster = () => ({ region_name: 'test-cluster' });
  return page.renderClusterOverview();
}

try {
  for (const language of ['zh-CN', 'en-US']) {
    const api = runtime(language);
    const chinese = language === 'zh-CN';
    const heading = chinese ? '节点证书到期时间' : 'Node certificate expiry dates';
    const unknown = chinese ? '未获取到期时间' : 'Expiry dates have not been obtained';
    const coverage = chinese ? '未列出的证书有效期尚未获取' : 'expiry dates for unlisted certificates are not available';
    const current = snapshot();
    const rendered = render(api, current);
    const content = text(rendered);
    for (const expected of [heading, 'worker-rke2-01', 'agent/client-kubelet.crt', '2027-01-20 08:00:00 +08:00', chinese ? '剩余 90 天' : '90 days remaining', coverage]) assert.ok(content.includes(expected), `${language}: ${expected}`);
    assert.strictEqual(api.clusterRuntimeStatus(current), 'normal');
    assert.ok(!tree(rendered).some(item => item.type === 'aside'), 'known healthy expiry must not create an alert');
    const date = tree(rendered).find(item => item.type === 'time');
    assert.strictEqual(date.props.dateTime, '2027-01-20T00:00:00.000Z');
    assert.ok(!tree(rendered).some(item => item.type === 'li' && item.props.className === 'certificateExpiryCritical'));

    for (const seconds of [30 * 86400, 0, -86400]) {
      const expiry = new Date(fixedNow + seconds * 1000).toISOString();
      const risk = snapshot(expiry);
      risk.sections.nodes.data.alerts = [{ type: seconds > 0 ? 'certificate_expiring' : 'certificate_expired', severity: 'critical', node_name: 'worker-rke2-01', certificate_name: 'agent/client-kubelet.crt', expires_at: expiry, remaining_days: Math.ceil(seconds / 86400) }];
      const riskTree = render(api, risk);
      assert.ok(tree(riskTree).some(item => item.type === 'time' && item.props.dateTime === expiry));
      assert.ok(tree(riskTree).some(item => item.type === 'li' && item.props.className === 'certificateExpiryCritical'));
      assert.ok(tree(riskTree).some(item => item.type === 'button' && item.props.className === 'criticalAlert'));
      assert.strictEqual(api.clusterRuntimeStatus(risk), 'abnormal');
      if (seconds <= 0) assert.ok(text(riskTree).includes(chinese ? '已过期' : 'Expired'));
    }

    for (const status of ['ok', 'not_observed', 'unavailable', 'partial', undefined]) {
      const missing = snapshot(null);
      missing.sections.nodes.data.certificate_status = status;
      missing.sections.nodes.data.items[0].certificate_observed_at = '2027-01-20T00:00:00Z';
      missing.sections.nodes.data.items[0].certificate_checked_at = '2027-01-20T00:00:00Z';
      const missingTree = render(api, missing);
      assert.ok(text(missingTree).includes(unknown), `${language}: unknown dates must remain explicit for ${status}`);
      assert.strictEqual(api.clusterRuntimeStatus(missing), 'normal');
      assert.ok(!tree(missingTree).some(item => item.type === 'time'));
      for (const badText of ['NaN', 'Invalid date', 'undefined', '2027-01-20']) assert.ok(!text(missingTree).includes(badText));
    }

    const partial = snapshot();
    partial.sections.nodes.data.certificate_status = 'partial';
    partial.sections.nodes.data.items.push({ name: 'unobserved-node', certificate_status: 'unavailable', certificates: [] });
    const partialTree = render(api, partial);
    assert.ok(text(partialTree).includes('2027-01-20'));
    assert.ok(text(partialTree).includes(chinese ? '证书采集不完整或不可用' : 'Certificate collection is incomplete or unavailable'));
    assert.ok(text(partialTree).includes(coverage));

    const other = snapshot();
    other.sections.nodes.data.certificate_status = 'not_applicable';
    other.sections.nodes.data.items[0].certificate_status = 'not_applicable';
    assert.ok(!text(render(api, other)).includes(heading));

    const serverClock = snapshot('2026-11-01T08:00:00+08:00');
    serverClock.generated_at = '2026-10-01T08:00:00+08:00';
    assert.ok(text(render(api, serverClock)).includes(chinese ? '剩余 31 天' : '31 days remaining'), 'aware server clock is the comparison reference');
    assert.ok(!tree(render(api, serverClock)).some(item => item.type === 'li' && item.props.className === 'certificateExpiryCritical'));
    for (const invalidReference of ['2026-10-01T00:00:00', '2026-02-30T00:00:00Z', null, 0]) {
      serverClock.generated_at = invalidReference;
      assert.ok(text(render(api, serverClock)).includes(chinese ? '剩余 10 天' : '10 days remaining'), 'invalid or naive server clock falls back to current absolute time');
    }
  }

  const api = runtime('en-US');
  for (const malformed of [null, [], {}, { items: {} }, { items: [null, [], 1, 'node', { name: {}, certificates: [] }, { name: 'worker', certificates: {} }] }]) assert.deepStrictEqual(api.nodeCertificateExpiries(malformed, fixedNow), []);
  const malformed = snapshot().sections.nodes.data;
  malformed.items[0].certificates = [null, [], false, {}, { name: '', expires_at: '2027-01-20T00:00:00Z' }, ...['invalid', '2026-02-30T00:00:00Z', '2027-01-20T00:00:00', '2027-01-20', '2027-01-20T00:00:00+99:00', 0, null].map(expires_at => ({ name: 'agent/client-kubelet.crt', expires_at }))];
  assert.deepStrictEqual(api.nodeCertificateExpiries(malformed, fixedNow), []);

  const duplicates = { items: [
    { name: 'worker-b', certificates: [{ name: 'agent/client-kubelet.crt', expires_at: '2027-01-01T08:00:00+08:00' }, { name: 'agent/client-kubelet.crt', expires_at: '2026-11-21T00:00:00Z' }, { name: 'agent/client-kubelet.crt', expires_at: '2026-12-01T00:00:00Z' }] },
    { name: 'worker-a', certificates: [{ name: 'agent/client-rke2-controller.crt', expires_at: '2026-11-21T00:00:00Z' }, { name: 'agent/client-kubelet.crt', expires_at: '2026-11-21T00:00:00Z' }] }
  ] };
  const rows = api.nodeCertificateExpiries(duplicates, fixedNow);
  assert.strictEqual(rows.length, 3);
  assert.strictEqual(new Set(rows.map(item => item.key)).size, 3);
  assert.deepStrictEqual(rows.map(item => `${item.node_name}/${item.certificate_name}`), ['worker-a/agent/client-kubelet.crt', 'worker-a/agent/client-rke2-controller.crt', 'worker-b/agent/client-kubelet.crt']);
  assert.ok(rows.every(item => item.status === 'critical' && item.remaining_days === 30));
  assert.deepStrictEqual(api.nodeCertificateExpiries({ items: [{ name: 'worker', certificates: [{ name: 'agent/client-kubelet.crt', expires_at: new Date(fixedNow + 30 * day + 1).toISOString() }] }] }, fixedNow).map(item => [item.remaining_days, item.status]), [[31, 'normal']]);
  assert.strictEqual(api.nodeCertificateExpiries(snapshot().sections.nodes.data, NaN)[0].remaining_days, 90);
  console.log('Known certificate expiry dates, 30-day risks, partial coverage, strict dates, clock and bilingual rendering checks passed');
} finally {
  Date.now = originalNow;
}
