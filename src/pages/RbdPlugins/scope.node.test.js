const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const { isSuccessfulPluginResponse } = require('../../utils/pluginInitialization');
const { getPluginBaseId } = require('../../utils/pluginArchUtils');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const ast = parser.parse(source, { sourceType: 'module', plugins: ['decorators-legacy', 'jsx'] });
const declaration = ast.program.body.find(item => item.type === 'ExportDefaultDeclaration').declaration;
const methods = declaration.body.body.filter(item => item.key && [
  'constructor', 'getPluginScope', 'componentDidMount', 'componentDidUpdate', 'componentWillUnmount',
  'importPlugin', 'getPluginsList'
].includes(item.key.name)).map(item => source.slice(item.start, item.end)).join('\n');
class Component {
  constructor(props) { this.props = props; }
  setState(update) { this.state = { ...this.state, ...update }; }
}
const flush = () => new Promise(resolve => setImmediate(resolve));
const plugin = { name: 'rainbond-ai-engine', plugin_type: 'JSInject', plugin_views: ['Team'] };
const initial = {
  match: { params: { teamName: 'team-a', regionName: 'region-a', pluginId: plugin.name } },
  location: { pathname: '/team/team-a/region/region-a/plugins/rainbond-ai-engine', search: '' },
  user: { enterprise_id: 'enterprise-a' }
};
function harness(props = {}) {
  const requests = [];
  const imports = [];
  const Page = new Function('Component', 'Global', 'PluginUtil', 'importAppPagePlugin',
    'getPluginBaseId', 'isSuccessfulPluginResponse', 'window', `return class extends Component { ${methods} };`)(
    Component, { getCurrTeamName: () => '', getCurrRegionName: () => '', getCurrEnterpriseId: () => '',
      getSlidePanelTab: () => '' }, { getCurrentViewPosition: () => 'Team' },
    (meta, region, type) => new Promise((resolve, reject) => imports.push({ meta, region, type, resolve, reject })),
    getPluginBaseId, isSuccessfulPluginResponse, { location: { href: '' } }
  );
  const page = new Page({ ...initial, dispatch: action => requests.push(action), ...props });
  return { page, requests, imports };
}
function changeScope(h, teamName, regionName) {
  const previous = h.page.props;
  h.page.props = { ...previous,
    match: { params: { ...previous.match.params, teamName, regionName } },
    location: { pathname: `/team/${teamName}/region/${regionName}/plugins/${plugin.name}`, search: '' }
  };
  h.page.componentDidUpdate(previous);
}

test('switching region while the old list is pending starts the new request and rejects old store/list writes', () => {
  const h = harness();
  h.page.componentDidMount();
  changeScope(h, 'team-a', 'region-b');
  assert.equal(h.requests.length, 2);
  assert.equal(h.requests[1].payload.region_name, 'region-b');
  assert.equal(h.requests[0].shouldApply(), false);
  h.requests[0].callback({ list: [plugin] });
  assert.equal(h.imports.length, 0);
  h.requests[1].callback({ list: [plugin] });
  assert.equal(h.imports[0].region, 'region-b');
  assert.equal(h.imports[0].type, 'team');
});

test('late AMD success and rejection cannot replace another region or resurrect errors', async () => {
  for (const fail of [false, true]) {
    const h = harness();
    h.page.componentDidMount();
    h.requests[0].callback({ list: [plugin] });
    changeScope(h, 'team-a', 'region-b');
    h.requests[1].callback({ list: [plugin] });
    h.imports[1].resolve({ root: 'new-region-root' });
    await flush();
    if (fail) h.imports[0].reject(new Error('old region rejected'));
    else h.imports[0].resolve({ root: 'old-region-root' });
    await flush();
    assert.equal(h.page.state.app.root, 'new-region-root');
    assert.equal(h.page.state.error, false);
    assert.equal(h.page.state.pluginLoading, false);
  }
});

test('team switch discards old callbacks even when the plugin and region stay the same', () => {
  const h = harness();
  h.page.componentDidMount();
  changeScope(h, 'team-b', 'region-a');
  assert.equal(h.requests.length, 2);
  assert.equal(h.requests[0].shouldApply(), false);
  h.requests[0].handleError(new Error('old error'));
  assert.equal(h.page.state.error, false);
  assert.equal(h.page.state.loading, true);
});

test('explicit platform selected region beats unrelated global region and query updates reload', () => {
  const h = harness({ match: { params: { eid: 'enterprise-a', pluginId: plugin.name } },
    location: { pathname: '/enterprise/enterprise-a/plugins/ai', search: '?regionName=region-a&showSelect=true' } });
  h.page.componentDidMount();
  const previous = h.page.props;
  h.page.props = { ...previous, location: { ...previous.location, search: '?regionName=region-b&showSelect=true' } };
  h.page.componentDidUpdate(previous);
  assert.deepEqual(h.requests.map(request => request.payload.region_name), ['region-a', 'region-b']);
  assert.equal(h.page.state.regionName, 'region-b');
});

test('authorization/list/import failures remain visible and an explicit retry recovers', async () => {
  const h = harness();
  h.page.componentDidMount();
  h.requests[0].callback({ status_code: 403, list: [], msg: 'Forbidden' });
  assert.equal(h.page.state.error, true);
  assert.equal(h.page.state.errInfo, 'Forbidden');
  h.page.getPluginsList();
  h.requests[1].callback({ list: [plugin] });
  h.imports[0].reject(new Error('403 plugin license'));
  await flush();
  assert.equal(h.page.state.error, true);
  assert.match(h.page.state.errInfo, /403/);
  h.page.getPluginsList();
  h.requests[2].callback({ list: [plugin] });
  h.imports[1].resolve({ root: 'recovered' });
  await flush();
  assert.equal(h.page.state.app.root, 'recovered');
  assert.equal(h.page.state.error, false);
});

test('unmount prevents both list and AMD completions from writing', async () => {
  const h = harness();
  h.page.componentDidMount();
  h.requests[0].callback({ list: [plugin] });
  h.page.componentWillUnmount();
  assert.equal(h.requests[0].shouldApply(), false);
  const before = h.page.state;
  h.imports[0].resolve({ root: 'late' });
  h.requests[0].callback({ list: [plugin] });
  await flush();
  assert.equal(h.page.state, before);
});
