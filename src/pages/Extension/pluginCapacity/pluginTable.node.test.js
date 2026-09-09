const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const babel = require('@umijs/deps/compiled/babel/core');

const filename = path.join(__dirname, 'pluginTable.js');
const { code } = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
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
});

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
    if (name.endsWith('/platformPluginIcon')) return { renderPlatformPluginIcon: () => null };
    if (name.endsWith('/global')) return { getPublicColor: () => '#155aef' };
    return {};
  }
};
vm.runInNewContext(code, sandbox, { filename });
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
  assert.ok(html.includes('企业基础插件') && html.includes('RUNNING') && html.includes('管理'));
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

console.log('pluginTable offline behavior checks passed');
