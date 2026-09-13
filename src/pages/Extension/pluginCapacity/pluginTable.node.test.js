const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const babel = require('@umijs/deps/compiled/babel/core');

const filename = path.join(__dirname, 'pluginTable.js');
const transformSource = filename => babel.transformSync(fs.readFileSync(filename, 'utf8'), {
  filename,
  babelrc: false,
  configFile: false,
  presets: [
    [require('@umijs/deps/compiled/babel/preset-env').default, { targets: { node: 'current' } }],
    require('@umijs/deps/compiled/babel/preset-react').default
  ],
  plugins: [
    [require('@umijs/deps/compiled/babel/plugin-proposal-decorators').default, { legacy: true }],
    [require('@umijs/deps/compiled/babel/plugin-proposal-class-properties').default, { loose: true }]
  ]
}).code;

const metadataFilename = path.resolve(__dirname, '../../../utils/offlinePlatformPluginMetadata.js');
const metadataSandbox = {
  exports: {},
  require: name => {
    if (name.endsWith('.svg')) {
      const svgPath = path.resolve(path.dirname(metadataFilename), name);
      assert.ok(fs.existsSync(svgPath), `Missing bundled icon: ${svgPath}`);
      return { ReactComponent: props => React.createElement('svg', { ...props, 'data-icon': path.basename(name, '.svg') }) };
    }
    return require(path.resolve(path.dirname(metadataFilename), name));
  }
};
vm.runInNewContext(transformSource(metadataFilename), metadataSandbox, { filename: metadataFilename });

const messages = {
  'teamOther.CreateAppFromPlugin.been_installed': '已安装',
  'extensionEnterprise.plugin.btn.manage': '管理'
};
const box = ({ children }) => React.createElement('div', null, children);
const antd = new Proxy({
  Tabs: { TabPane: box },
  Empty: Object.assign(() => React.createElement('div', null, 'EMPTY'), { PRESENTED_IMAGE_SIMPLE: 'simple' }),
  notification: { warning() {}, success() {} }
}, { get: (target, key) => target[key] || box });
const sandbox = {
  exports: {},
  setInterval: () => 1,
  clearInterval() {},
  require: name => {
    if (name === 'react') return React;
    if (name === 'antd') return antd;
    if (name === 'dva') return { connect: () => component => component };
    if (name === '@/utils/intl') return { formatMessage: ({ id }) => messages[id] || id };
    if (name.endsWith('/ApplicationState')) return ({ AppStatus }) => React.createElement('span', null, AppStatus);
    if (name.endsWith('/offlinePlatformPluginMetadata')) return metadataSandbox.exports;
    if (name.endsWith('/platformPluginIcon')) return { renderPlatformPluginIcon: () => null };
    if (name.endsWith('/global')) return { getPublicColor: () => '#155aef' };
    return {};
  }
};
vm.runInNewContext(transformSource(filename), sandbox, { filename });
const PluginTable = sandbox.exports.default;

const installedPlugin = {
  name: 'rainbond-enterprise-base',
  alias: '企业基础插件',
  status: 'RUNNING',
  version: '6.9.10',
  team_name: 'platform-team',
  app_id: 42
};

function createTable(marketResponse, installed = [installedPlugin], marketError = false) {
  const actions = [];
  const table = new PluginTable({
    regionName: 'offline-region',
    enterprise: { enterprise_id: 'test-enterprise' },
    dispatch: action => {
      actions.push(action);
      if (action.type === 'global/getEnterprisePluginList') {
        if (marketError) action.handleError();
        else action.callback(marketResponse);
      } else if (action.type === 'teamControl/fetchPluginUrl') {
        assert.strictEqual(action.payload.enterprise_id, 'test-enterprise');
        assert.strictEqual(action.payload.region_name, 'offline-region');
        action.callback({ list: installed });
      } else {
        throw new Error(`Unexpected action: ${action.type}`);
      }
    }
  });
  table.setState = update => Object.assign(table.state, typeof update === 'function' ? update(table.state) : update);
  return { table, actions };
}

// An offline Console successfully returns an empty market list.
for (const response of [{ list: [] }, undefined, {}]) {
  const { table, actions } = createTable(response);
  table.handlePluginList();
  assert.strictEqual(actions.length, 2, 'empty or invalid market data must load cluster plugins');
  const [plugin] = table.state.pluginList;
  assert.strictEqual(plugin.installed, true);
  assert.strictEqual(plugin.plugin_id, installedPlugin.name);
  assert.strictEqual(plugin.installed_version, '6.9.10');
  assert.strictEqual(plugin.app_id, 42);
  assert.strictEqual(plugin.upgradeable, false);
  const html = renderToStaticMarkup(table.render());
  assert.ok(html.includes('基础功能扩展') && html.includes('RUNNING') && html.includes('管理'));
  assert.ok(!html.includes('未安装'));
}

const offline = createTable(null, [installedPlugin], true).table;
offline.handlePluginList();
assert.strictEqual(offline.state.pluginList.length, 1, 'network failure must retain the installed-list fallback');

const empty = createTable({ list: [] }, []).table;
empty.handlePluginList();
const emptyHtml = renderToStaticMarkup(empty.render());
assert.ok(emptyHtml.includes('EMPTY'), 'a genuinely empty cluster must show an empty state');
assert.ok(!emptyHtml.includes('安装') && !emptyHtml.includes('监控中心'), 'empty state must not advertise mock plugins');

const noStatus = createTable({ list: [] }, [{ ...installedPlugin, status: '' }]).table;
noStatus.handlePluginList();
const noStatusHtml = renderToStaticMarkup(noStatus.render());
assert.ok(noStatusHtml.includes('已安装') && !noStatusHtml.includes('未安装'), 'missing runtime status must not mean uninstalled');

const marketPlugin = { plugin_id: 'rainbond-agent', plugin_name: 'AI 助手', installed: false };
const online = createTable({ list: [marketPlugin] });
online.table.handlePluginList();
assert.strictEqual(online.actions.length, 1, 'a nonempty market list must keep the normal online path');
assert.strictEqual(online.table.state.pluginList[0], marketPlugin);

let completed;
offline.completeInstallIfRunning = (id, plugins) => { completed = { id, plugins }; };
offline.startInstallPolling(installedPlugin.name);
assert.strictEqual(completed.id, installedPlugin.name);
assert.strictEqual(completed.plugins[0].status, 'RUNNING', 'installation polling must also fall back on market errors');

const expectedPlugins = [
  ['rainbond-ai-engine', 'AI大模型', 'free', 'brain-circuit'],
  ['rainbond-databases', '数据库插件', 'free', 'database'],
  ['rainbond-agent', 'AI助手', 'free', 'bot-message-square'],
  ['rainbond-vm', '虚拟机', 'free', 'gallery-horizontal-end'],
  ['rainbond-enterprise-pipeline', '流水线', 'enterprise', 'workflow'],
  ['rainbond-gpu', 'GPU管理', 'enterprise', 'gpu'],
  ['rainbond-sourcescan', '源码扫描', 'enterprise', 'shield-code'],
  ['rainbond-recovery', '灾备恢复', 'enterprise', 'database-backup'],
  ['rainbond-observability', '监控中心', 'enterprise', 'monitor-cog'],
  ['rainbond-enterprise-alarm', '告警中心', 'enterprise', 'siren'],
  ['rainbond-enterprise-logs', '日志中心', 'enterprise', 'scroll-text'],
  ['rainbond-enterprise-base', '基础功能扩展', 'enterprise', 'blocks'],
  ['rainbond-bill', '计量计费', 'enterprise', 'chart-column']
];

for (const [id, name, level, icon] of expectedPlugins) {
  const table = createTable({ list: [] }, [{ ...installedPlugin, name: id, logo: 'https://unreachable.invalid/icon.png' }]).table;
  table.handlePluginList();
  assert.strictEqual(table.state.pluginList.length, 1, 'local metadata must not create uninstalled entries');
  const [plugin] = table.state.pluginList;
  assert.strictEqual(plugin.plugin_name, name);
  assert.strictEqual(plugin.app_level, level);
  assert.ok(plugin.description && plugin.description.trim() === plugin.description);
  assert.strictEqual(plugin.status, 'RUNNING');
  assert.strictEqual(plugin.installed_version, '6.9.10');
  assert.strictEqual(plugin.app_id, 42);
  const html = renderToStaticMarkup(table.render());
  assert.ok(html.includes(`data-icon="${icon}"`) && html.includes('color:#155aef'));
  assert.ok(html.includes(level === 'free' ? '免费' : '商业'));
  assert.ok(!html.includes('<img') && !html.includes('unreachable.invalid'), 'known offline plugins must use local SVGs');
}

for (const [id, expectedName] of [
  ['rainbond-agent-ARM64', 'AI助手'],
  ['rainbond-enterprise-pipeline-amd64', '流水线'],
  ['rainbond-pipeline', '流水线'],
  ['pipeline', '流水线'],
  ['rainbond-source-scan', '源码扫描'],
  ['source-scan-ARM64', '源码扫描']
]) {
  const table = createTable({ list: [] }, [{ name: id, alias: 'Old name' }]).table;
  table.handlePluginList();
  assert.strictEqual(table.state.pluginList[0].plugin_id, id, 'display aliases must not rewrite the real identity');
  assert.strictEqual(table.state.pluginList[0].plugin_name, expectedName);
  assert.strictEqual(table.state.pluginList[0].installed_version, '', 'do not copy sample market versions');
}

const custom = createTable({ list: [] }, [{ name: 'custom-plugin', alias: '自定义插件', description: '集群提供的说明', app_level: 'free' }]).table;
custom.handlePluginList();
assert.strictEqual(custom.state.pluginList[0].plugin_name, '自定义插件');
assert.strictEqual(custom.state.pluginList[0].description, '集群提供的说明');
assert.strictEqual(custom.state.pluginList[0].app_level, 'free');
assert.strictEqual(custom.state.pluginList[0].offlineIcon, undefined);

console.log('pluginTable offline behavior checks passed');
