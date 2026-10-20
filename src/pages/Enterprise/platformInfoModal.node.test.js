const assert = require('assert');
const fs = require('fs');
const path = require('path');
const React = require('react');
const esbuild = require('esbuild');
const data = require('./overviewData');
const componentPath = path.join(__dirname, 'components/PlatformInfoModal.js');
const source = fs.readFileSync(componentPath, 'utf8');
const code = esbuild.transformSync(source, {
  loader: 'jsx',
  format: 'cjs',
  target: 'es2017'
}).code;
const antd = {};
['Alert', 'Button', 'Empty', 'Icon', 'Input', 'Modal', 'Skeleton'].forEach(
  (name) => {
    antd[name] = function Stub() {};
  }
);
antd.Empty.PRESENTED_IMAGE_SIMPLE = 'empty';
const moduleResult = { exports: {} };
new Function('require', 'module', 'exports', code)(
  (name) => {
    if (name === 'antd') return antd;
    if (name === '../overviewData') return data;
    if (name === '../index.less')
      return new Proxy({}, { get: (target, key) => key });
    return require(name);
  },
  moduleResult,
  moduleResult.exports
);
const PlatformInfoModal = moduleResult.exports.default;
const labels = new Proxy(
  { pluginCount: (count) => `plugins:${count}` },
  { get: (target, key) => target[key] || key }
);
const verified = {
  valid: true,
  company: 'Example company',
  expire_at: 1893456000,
  cluster_limit: 2,
  node_limit: 3,
  plugins: [
    { plugin_id: 'monitor', name: 'Monitoring' },
    { plugin_id: 'alert', name: 'Alerts' }
  ]
};
const baseProps = {
  visible: true,
  onCancel() {},
  onUpdateLicense() {},
  title: 'Platform information',
  labels,
  platform: {
    name: 'Example',
    version: 'v6.9.12',
    createdAt: '2026-10-09T16:46:00',
    enterpriseId: 'enterprise-example'
  },
  runtimeSummary: { level: 'warning', label: 'One cluster needs attention' },
  licenseLabel: 'License valid',
  license: verified,
  requestStatus: 'success',
  updating: false
};
function make(overrides = {}) {
  const instance = new PlatformInfoModal({ ...baseProps, ...overrides });
  instance.setState = (update) => {
    instance.state = {
      ...instance.state,
      ...(typeof update === 'function' ? update(instance.state) : update)
    };
  };
  return instance;
}
function nodes(element) {
  if (!element || typeof element !== 'object') return [];
  if (Array.isArray(element))
    return element.reduce((all, child) => all.concat(nodes(child)), []);
  return [element].concat(
    nodes(element.props && element.props.children),
    nodes(element.props && element.props.title),
    nodes(element.props && element.props.footer)
  );
}
function text(element) {
  if (element === null || element === undefined || typeof element === 'boolean')
    return '';
  if (typeof element !== 'object') return String(element);
  if (Array.isArray(element)) return element.map(text).join(' ');
  return [
    text(element.props && element.props.children),
    text(element.props && element.props.title),
    text(element.props && element.props.footer)
  ].join(' ');
}
function contentWithClass(element, name) {
  return nodes(element).filter(
    (item) => item.props && item.props.className === name
  );
}
const normal = make();
const normalTree = normal.render();
assert.strictEqual(normalTree.type, antd.Modal);
assert.strictEqual(normalTree.props.centered, true);
assert.strictEqual(normalTree.props.width, 900);
assert.strictEqual(contentWithClass(normalTree, 'platformInfoCard').length, 4);
assert.strictEqual(
  contentWithClass(normalTree, 'platformAllowedPluginGrid')[0].props.children
    .length,
  2
);
assert.ok(text(normalTree).includes('One cluster needs attention'));
assert.ok(!text(normalTree).includes('平台运行正常'));
assert.ok(
  !/fetch\(|dispatch\(|localStorage|sessionStorage|clipboard|authz_code|onManageLicense|dangerouslySetInnerHTML/.test(
    source
  )
);
assert.ok(/pluginIcon\(/.test(source));
assert.ok(!/type="text"|type="eye"|type="copy"/.test(source));
['idle', 'loading', 'error', 'empty', 'invalid'].forEach((requestStatus) => {
  const tree = make({ requestStatus, licenseLabel: 'Unverified' }).render();
  assert.strictEqual(
    contentWithClass(tree, 'platformLicenseMetrics').length,
    0,
    requestStatus
  );
  assert.strictEqual(
    contentWithClass(tree, 'platformAllowedPluginGrid').length,
    0,
    requestStatus
  );
  assert.ok(
    !nodes(tree).some(
      (node) =>
        node.props &&
        /platformInfoLicenseBadge.*platformInfoHealthy/.test(
          node.props.className || ''
        )
    ),
    requestStatus
  );
});
[
  null,
  {},
  { ...verified, valid: 'true' },
  { ...verified, valid: false, reason: 'no_region' },
  { ...verified, valid: false, reason: 'expired' }
].forEach((license) => {
  const tree = make({ license }).render();
  assert.strictEqual(
    contentWithClass(tree, 'platformLicenseMetrics').length,
    0
  );
  assert.strictEqual(
    contentWithClass(tree, 'platformAllowedPluginGrid').length,
    0
  );
});
[undefined, null, 0, -1, true, false, NaN, Infinity, 1e100].forEach((expire_at) => {
  const metrics = make({
    license: { ...verified, expire_at }
  }).renderLicenseContent();
  const expiry = metrics.props.children.find(
    (item) => item.props.children[0].props.children === 'expireAt'
  );
  assert.strictEqual(expiry.props.children[1].props.children, '-');
});
[undefined, null, '', 0, true, false, -2, 1.5, Infinity].forEach((value) =>
  assert.strictEqual(normal.formatQuota(value), '-')
);
assert.strictEqual(normal.formatQuota('3'), 3);
assert.strictEqual(normal.formatQuota(-1), 'unlimited');
assert.strictEqual(normal.formatQuota(0), '-');
const many = make({
  license: {
    ...verified,
    plugins: Array.from({ length: 12 }, (_, i) => ({
      plugin_id: `plugin-${i}`,
      name: `Plugin ${i}`
    }))
  }
}).render();
assert.strictEqual(
  contentWithClass(many, 'platformAllowedPluginGrid')[0].props.children.length,
  12
);
const editor = make();
editor.toggleEditor();
const input = nodes(editor.render()).find((item) => item.type === antd.Input);
assert.strictEqual(input.props.type, 'password');
assert.strictEqual(input.props.autoComplete, 'new-password');
assert.strictEqual(input.props.id, 'platform-info-license-input');
editor.submitLicense();
assert.strictEqual(editor.state.validationError, 'authorizationRequired');
const errorInput = nodes(editor.render()).find(
  (item) => item.type === antd.Input
);
assert.strictEqual(errorInput.props['aria-invalid'], true);
assert.strictEqual(
  errorInput.props['aria-describedby'],
  'platform-info-license-error'
);
editor.toggleEditor();
assert.strictEqual(editor.state.editing, false);
assert.strictEqual(editor.state.authorizationCode, '');
assert.strictEqual(editor.state.validationError, '');
editor.props = { ...editor.props, visible: false };
editor.componentDidUpdate({ visible: true });
assert.strictEqual(editor.state.authorizationCode, '');
let cancelled = 0;
const busy = make({
  updating: true,
  onCancel: () => {
    cancelled += 1;
  }
});
busy.handleCancel();
busy.toggleEditor();
busy.submitLicense();
assert.strictEqual(cancelled, 0);
assert.strictEqual(busy.state.editing, false);
assert.strictEqual(busy.render().props.closable, false);
assert.strictEqual(busy.render().props.keyboard, false);
assert.strictEqual(busy.render().props.maskClosable, false);
busy.props = { ...busy.props, updating: false };
busy.handleCancel();
assert.strictEqual(cancelled, 1);
const pending = make({
  onCancel: () => {
    cancelled += 1;
  }
});
pending.submissionPending = true;
pending.handleCancel();
pending.toggleEditor();
assert.strictEqual(cancelled, 1);
assert.strictEqual(pending.state.editing, false);
// A non-string sentinel exercises callback lifecycle without creating a code fixture.
const opaqueUpdate = Symbol('opaque update payload');
let updateCount = 0;
let finishUpdate;
const submission = make({
  onUpdateLicense: (value, callback) => {
    assert.strictEqual(value, opaqueUpdate);
    updateCount += 1;
    finishUpdate = callback;
  }
});
submission.state = {
  ...submission.state,
  editing: true,
  authorizationCode: { trim: () => opaqueUpdate }
};
submission.submitLicense();
submission.submitLicense();
assert.strictEqual(
  updateCount,
  1,
  'a second click before parent state updates must not submit twice'
);
assert.strictEqual(submission.state.submitting, true);
finishUpdate(false);
assert.strictEqual(submission.state.submitting, false);
assert.strictEqual(
  submission.state.editing,
  true,
  'a failed request preserves the editor for retry'
);
submission.submitLicense();
assert.strictEqual(updateCount, 2);
finishUpdate(true);
assert.strictEqual(submission.state.editing, false);
assert.strictEqual(submission.state.authorizationCode, '');
assert.strictEqual(submission.state.validationError, '');
assert.strictEqual(submission.state.submitting, false);
const unmounted = make({
  onUpdateLicense: (value, callback) => {
    finishUpdate = callback;
  }
});
unmounted.state = {
  ...unmounted.state,
  authorizationCode: { trim: () => opaqueUpdate }
};
unmounted.submitLicense();
unmounted.componentWillUnmount();
let lateStateUpdates = 0;
unmounted.setState = () => {
  lateStateUpdates += 1;
};
finishUpdate(true);
assert.strictEqual(lateStateUpdates, 0);
const styles = fs.readFileSync(path.join(__dirname, 'index.less'), 'utf8');
assert.ok(
  /\.platformInfoModal[\s\S]*:global\(\.ant-modal-body\)[\s\S]*max-height: calc\(100vh - 250px\);[\s\S]*overflow-y: auto;/.test(
    styles
  )
);
assert.ok(
  /\.platformInfoColumns \{ grid-template-columns: minmax\(0, 1fr\); \}/.test(
    styles
  )
);
assert.ok(
  /\.platformAllowedPluginGrid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/.test(
    styles
  )
);
console.log(
  'platform information modal structure, license truthfulness and secure update checks passed'
);
