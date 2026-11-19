const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@umijs/deps/compiled/babel/core');
const parser = require('@babel/parser');
const React = require('react');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const ast = parser.parse(source, { sourceType: 'module', plugins: ['decorators-legacy', 'jsx'] });
const declaration = ast.program.body.find(item => item.type === 'ExportDefaultDeclaration').declaration;
const methods = declaration.body.body.filter(item => item.key && [
  'getPluginTeam', 'getPluginNamespace', 'getPluginRenderComponent', 'rbdPluginsRender'
].includes(item.key.name)).map(item => source.slice(item.start, item.end)).join('\n');
const transformed = babel.transformSync(`class Host extends Component { ${methods} }`, {
  babelrc: false, configFile: false, presets: [require('@umijs/deps/compiled/babel/preset-react')]
}).code;

function Root() {}
function harness(props = {}) {
  const Host = new Function('React', 'Component', 'PluginsUtiles', 'Global', 'cookie', 'formatMessage',
    'Spin', 'Card', 'Button', 'Result', 'window', `${transformed}; return Host;`)(
    React, React.Component, { getPluginRenderComponent: () => Root }, {
      getCurrTeamName: () => 'team-b', getCurrRegionName: () => 'region-b',
      getComponentID: () => '', getAppID: () => '', getPublicColor: () => 'blue'
    }, { get: key => key === 'language' ? 'zh-CN' : 'fixture-token' }, value => value.id,
    'Spin', 'Card', 'Button', 'Result', { location: { href: '/team/team-b/region/region-b/plugins/ai' } }
  );
  const host = new Host({ dispatch: () => {}, ...props });
  return { host };
}
function findElement(element, type) {
  if (!element || typeof element !== 'object') return undefined;
  if (element.type === type) return element;
  for (const child of React.Children.toArray(element.props.children)) {
    const found = findElement(child, type);
    if (found) return found;
  }
}

const teamA = { team_name: 'team-a', namespace: 'namespace-a' };
const teamB = { team_name: 'team-b', namespace: 'namespace-b' };

test('namespace comes from the selected team, including while Redux still contains the previous team', () => {
  const { host } = harness({ currentTeam: teamA, currentUser: { teams: [teamB] } });
  assert.equal(host.getPluginNamespace(), 'namespace-b');
  assert.equal(host.getPluginNamespace('team-a'), 'namespace-a');
  assert.equal(host.getPluginNamespace('team-missing'), '');
  host.props = { currentTeam: { namespace: 'unidentified-old-namespace' } };
  assert.equal(host.getPluginNamespace(), '');
});

test('explicit host team takes precedence over global route and passes only matching team context', () => {
  const { host } = harness({ team_name: 'team-a', region_name: 'region-a', currentTeam: teamB,
    currentUser: { teams: [teamA] }, appID: 'app-a', componentID: 'component-a' });
  const element = findElement(host.rbdPluginsRender(), Root);
  assert.equal(element.props.baseInfo.team_name, 'team-a');
  assert.equal(element.props.baseInfo.region_name, 'region-a');
  assert.equal(element.props.baseInfo.namespace, 'namespace-a');
  assert.equal(element.props.baseInfo.currentTeam, teamA);
  assert.equal(element.props.baseInfo.app_id, 'app-a');
  assert.equal(element.props.baseInfo.component_id, 'component-a');
  assert.equal(element.props.baseInfo.token, 'fixture-token');
});

test('team and region changes replace the plugin instance and keep host callbacks and return navigation', () => {
  const dispatch = () => {};
  const { host } = harness({ currentTeam: teamB, dispatch });
  host.jumpRouter = () => {};
  const first = findElement(host.rbdPluginsRender(), Root);
  host.props = { ...host.props, teamName: 'team-a', regionName: 'region-a', currentTeam: teamA };
  const next = findElement(host.rbdPluginsRender(), Root);
  assert.notEqual(first.key, next.key);
  assert.equal(next.props.dispatch, dispatch);
  assert.equal(next.props.jumpRouter, host.jumpRouter);
  assert.equal(next.props.baseInfo.namespace, 'namespace-a');
});

test('failed plugin loading exposes the retry callback without rendering the business page', () => {
  const retryPlugin = () => {};
  const { host } = harness({ error: true, errInfo: '403 Forbidden', retryPlugin });
  const result = findElement(host.rbdPluginsRender(), 'Result');
  assert.equal(findElement(host.rbdPluginsRender(), Root), undefined);
  assert.match(result.props.description, /403 Forbidden/);
  assert.equal(result.props.actions.props.onClick, retryPlugin);
});
