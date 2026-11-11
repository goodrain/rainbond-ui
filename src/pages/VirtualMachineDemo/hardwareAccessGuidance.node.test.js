const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { JSDOM } = require('jsdom');
const babel = require('@umijs/deps/compiled/babel/core');

function load(relative, dependencies = {}) {
  const filename = path.resolve(__dirname, relative);
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, babelrc: false, configFile: false,
    presets: [[require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
      require('@umijs/deps/compiled/babel/preset-react').default],
    plugins: [[require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]]
  }).code;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    throw new Error(`Unexpected dependency: ${name}`);
  } }, { filename });
  return exports.default;
}

function renderGuidance(locale, sshRequired = false, step = 0) {
  const messages = load(`../../locales/${locale}/vmDemo.js`);
  const translate = (key, values = {}) => String(messages[`vmDemo.${key}`] || key)
    .replace(/\{(\w+)\}/g, (_, name) => values[name] || name);
  const box = ({ children, title }) => React.createElement('div', null, title, children);
  const Radio = {
    Group: ({ children }) => React.createElement('div', { 'data-presets': true }, children),
    Button: ({ children, value }) => React.createElement('label', null, React.createElement('input', { type: 'radio', value }), children)
  };
  const Form = ({ children }) => React.createElement('form', null, children);
  Form.create = () => Component => Component;
  Form.Item = ({ label, extra, children }) => React.createElement('div', { 'data-form-item': true },
    React.createElement('label', null, label), children,
    extra && React.createElement('div', { 'data-form-extra': true }, extra));
  const Steps = box;
  Steps.Step = box;
  const Descriptions = box;
  Descriptions.Item = box;
  const Select = ({ children, disabled }) => React.createElement('select', { disabled }, children);
  Select.Option = ({ value, children }) => React.createElement('option', { value }, children);
  const components = { Form, Steps, Descriptions, Radio,
    Card: ({ title, children }) => React.createElement('section', { 'data-card': true }, React.createElement('h2', null, title), children),
    Select,
    Alert: ({ message, description }) => React.createElement('div', { role: 'alert' }, message, ' ', description),
    Button: ({ children }) => React.createElement('button', { type: 'button' }, children),
    Checkbox: ({ children, disabled, checked }) => React.createElement('label', null,
      React.createElement('input', { type: 'checkbox', disabled, checked, readOnly: true }), children),
    Input: ({ value, readOnly }) => React.createElement('input', { value, readOnly }),
    InputNumber: () => React.createElement('input', { type: 'number' }),
    Icon: () => null,
    Popover: ({ content, children }) => React.createElement(React.Fragment, null,
      children, React.createElement('aside', { role: 'tooltip' }, content))
  };
  const teamMessages = load(`../../locales/${locale}/team.js`);
  const shared = { react: React, antd: components, './messages': { t: translate }, './index.less': {},
    '@/utils/intl': { formatMessage: ({ id }) => teamMessages[id] || messages[id] || id } };
  const HelpLabel = load('HelpLabel.js', shared);
  const CreateVm = load('CreateVm.js', { ...shared, './HelpLabel': HelpLabel, './state': require('./state') });
  const values = { cpu: 4, memory: 8, disk: 80, disk_volume_type: 'actual-platform-type' };
  const form = {
    getFieldDecorator: (name, options) => element => { if (!Object.hasOwn(values, name)) values[name] = options?.initialValue; return element; },
    getFieldValue: name => values[name]
  };
  const view = new CreateVm({ form,
    creationStorage: { status: 'ready', options: [{ value: 'actual-platform-type', label: 'Actual platform storage' }] },
    sourceSummary: { name: 'vm-name', sourceType: 'url', sourceName: 'installer.iso', os: 'Explicit operating system', sshRequired }
  });
  view.state = { ...view.state, step };
  const markup = ReactDOMServer.renderToStaticMarkup(view.render());
  const dom = new JSDOM(markup);
  return { dom, document: dom.window.document, messages };
}

test('the native config card keeps storage guidance with Storage and defers all network guidance to review', () => {
  const { dom, document, messages } = renderGuidance('zh-CN');
  try {
    const hardware = document.querySelector('[data-card]');
    assert.equal(document.body.textContent.includes(messages['vmDemo.hardwareNetwork']), false);
    assert.ok(document.body.textContent.includes(messages['vmDemo.vmConfiguration']));
    assert.ok([...hardware.querySelectorAll('label')].some(label => label.textContent.includes('系统盘（GiB）')));
    const storageItem = [...hardware.querySelectorAll('[data-form-item]')].find(item =>
      item.querySelector('label')?.textContent.includes(messages['vmDemo.storage']));
    assert.ok(storageItem);
    assert.equal(storageItem.querySelector('[data-form-extra]').textContent, messages['vmDemo.quickStartStorageHelp']);
    assert.equal(document.querySelector('section:not([data-card])'), null);
    assert.equal(document.body.textContent.includes('自动接入集群网络，可与容器互通'), false);
    assert.equal(document.querySelectorAll('input[type=file]').length, 0);
    assert.equal(document.querySelectorAll('input[type=radio]').length, 5);
    assert.equal(storageItem.querySelectorAll('select').length, 1);
    assert.ok(storageItem.textContent.includes('能否创建快照取决于所选存储及平台能力'));
    assert.ok(document.body.textContent.includes('硬件 → 存储'));
    assert.equal(document.body.textContent.includes('高级 → 存储'), false);
  } finally { dom.window.close(); }
});

test('the confirmation page provides the three real management access paths and conditional Noble notice', () => {
  const regular = renderGuidance('zh-CN', false, 1);
  const noble = renderGuidance('zh-CN', true, 1);
  const config = renderGuidance('zh-CN', true, 0);
  try {
    const network = regular.document.querySelector('section:not([data-card])');
    assert.ok(network.querySelector('h2').textContent.includes('网络与访问'));
    assert.ok(network.textContent.includes('自动接入集群网络，可与容器互通'));
    assert.deepEqual([...network.querySelectorAll('strong')].map(node => node.textContent), ['内网访问', '外部访问', '登录']);
    assert.ok(network.textContent.includes('“网络”添加 SSH 22、RDP 3389'));
    assert.ok(network.textContent.includes('独立开启对外访问，查看外部地址'));
    assert.ok(network.textContent.includes('打开Web VNC'));
    assert.equal(network.textContent.includes('高级 → 端口'), false);
    assert.equal(network.textContent.includes('不支持选择'), false);
    assert.equal(network.querySelectorAll('select').length, 0);
    assert.equal(network.querySelectorAll('[role=alert]').length, 0);
    assert.equal(config.document.querySelector('section:not([data-card])'), null);
    const notice = noble.document.querySelector('section:not([data-card]) [role=alert]');
    assert.ok(notice.textContent.includes('集群内 SSH · TCP/22'));
    assert.ok(notice.textContent.includes('需等待部署并检查来宾服务状态'));
    assert.equal(notice.textContent.includes('SSH 已就绪'), false);
    assert.ok(regular.document.body.textContent.includes('Explicit operating system'));
  } finally { regular.dom.window.close(); noble.dom.window.close(); config.dom.window.close(); }
});

test('English config/review retain native presets and use Hardware/Network management paths', () => {
  const config = renderGuidance('en-US');
  const review = renderGuidance('en-US', false, 1);
  try {
    assert.ok(config.document.querySelector('[data-form-extra]').textContent.includes(config.messages['vmDemo.quickStartStorageHelp']));
    assert.equal(config.document.querySelector('section:not([data-card])'), null);
    assert.ok(config.document.body.textContent.includes('Hardware → Storage'));
    assert.ok(config.document.body.textContent.includes('System disk (GiB)'));
    assert.ok(config.document.body.textContent.includes('2-core 2G'));
    assert.ok(config.document.body.textContent.includes('4-core 16G'));
    const network = review.document.querySelector('section:not([data-card])');
    assert.ok(network.textContent.includes('Network and access'));
    assert.deepEqual([...network.querySelectorAll('strong')].map(node => node.textContent), ['Internal access', 'External access', 'Login']);
    assert.ok(network.textContent.includes('under Network'));
    assert.ok(network.textContent.includes('Open Web VNC'));
    assert.equal(network.textContent.includes('Advanced → Ports'), false);
  } finally { config.dom.window.close(); review.dom.window.close(); }
});
