// Mount the production editors with real React/Antd Form; only API/DVA boundaries are stubbed.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'http://localhost' });
Object.assign(global, {
  window: dom.window, document: dom.window.document,
  HTMLElement: dom.window.HTMLElement, Node: dom.window.Node,
  SVGElement: dom.window.SVGElement, HTMLBodyElement: dom.window.HTMLBodyElement,
  HTMLCollection: dom.window.HTMLCollection, getComputedStyle: dom.window.getComputedStyle
});
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
window.requestAnimationFrame = global.requestAnimationFrame = callback => setTimeout(callback, 0);
window.cancelAnimationFrame = global.cancelAnimationFrame = clearTimeout;
window.scrollTo = () => {};
const React = require('react');
const ReactDOM = require('react-dom');
const { act, Simulate } = require('react-dom/test-utils');
const antd = require('antd');
const babel = require('@umijs/deps/compiled/babel/core');
const root = path.resolve(__dirname, '../../../..');
const compile = source => babel.transformSync(source, {
  babelrc: false, configFile: false,
  presets: [[require('@umijs/babel-preset-umi').default, {
    env: { targets: { node: 'current' }, modules: 'commonjs' }, react: {}
  }]]
}).code;
function load(file, dependencies) {
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compile(fs.readFileSync(path.join(root, file), 'utf8')))(name => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}
const directoryHelpers = load('src/utils/buildSourceDirectory.js', {});
const Empty = () => null;
const appUtil = {
  isCodeAppByBuildSource: source => source?.service_source === 'source_code',
  isImageAppByBuildSource: source => source?.service_source === 'docker_run',
  isOauthByBuildSource: source => !!source?.code_from?.startsWith('oauth_'),
  isMarketAppByBuildSource: () => false, isUploadFilesAppSource: () => false,
  isCreateFromCustomCode: () => false, getLanguage: () => 'nodejs',
  getCreateTypeCNByBuildSource: () => '源码'
};
const globalUtil = { getCurrTeamName: () => 'team', getCurrRegionName: () => 'region' };
const shared = {
  react: React, antd, dva: { connect: () => Component => Component },
  umi: { FormattedMessage: ({ id }) => React.createElement('span', null, id) },
  '@/utils/intl': { formatMessage: ({ id }) => id }
};
const Editor = load('src/pages/Component/setting/edit-buildsource.js', {
  ...shared, '../../../utils/buildSourceDirectory': directoryHelpers,
  '../../../utils/app': appUtil, '../../../utils/global': globalUtil,
  '../../../utils/cookie': { get: () => 'zh-CN' },
  '../../../services/app': { getCodeBranch: () => Promise.resolve({ list: ['main'] }) },
  '../../../components/ShowRegionKey': Empty
}).default;
const Resource = load('src/pages/Component/resource.js', {
  ...shared, 'dva/router': { Link: Empty },
  '../../utils/buildSourceDirectory': directoryHelpers,
  '../../utils/app': appUtil, '../../utils/global': globalUtil,
  '../../utils/error': () => {}, '../../utils/rainbond': { OauthbEnable: () => false },
  '../../utils/utils': { languageObj: {} }, './resource.less': {},
  './resourceHelpers': { shouldShowCodeBuildConfig: () => false, findResourceActionElement: () => null },
  '../../components/CodeBuildConfig': Empty, '../../components/MarketAppDetailShow': Empty,
  '../../components/NoPermTip': Empty, './setting/auto-deploy': Empty,
  './setting/edit-buildsource': Editor, '../Create/modify-url': Empty,
  './funContext': { ResumeContext: React.createContext({}) }
}).default;
const source = {
  arch: ['amd64'], service_source: 'source_code', server_type: 'git',
  git_url: 'https://example.com/old.git?dir=jc-ui', code_version: 'main',
  full_name: 'team/old', oauth_service_id: 'provider'
};
const tick = () => new Promise(resolve => setTimeout(resolve, 15));
async function perform(action) { await act(async () => { action(); await tick(); }); }
async function mount(Component, overrides = {}) {
  let instance;
  const actions = [];
  const props = {
    buildSource: { ...source, ...overrides }, appAlias: 'app',
    appDetail: { service: { service_alias: 'app' } }, componentPermissions: { isSource: true },
    dispatch: action => { actions.push(action); },
    wrappedComponentRef: ref => { instance = ref; }
  };
  await perform(() => ReactDOM.render(React.createElement(Component, props), document.getElementById('root')));
  return {
    get instance() { return instance; }, actions,
    lastSave: () => actions.filter(action => action.type === 'appControl/putAppBuidSource').at(-1),
    unmount: () => perform(() => ReactDOM.unmountComponentAtNode(document.getElementById('root')))
  };
}
async function input(id, value) {
  await perform(() => {
    const element = document.getElementById(id);
    assert.ok(element, `Input ${id} is mounted`);
    element.value = value;
    Simulate.change(element);
  });
}
async function type(editor, value) {
  await perform(() => {
    editor.instance.props.form.setFieldsValue({ server_type: value });
    editor.instance.changeServerType(value);
  });
}

test('manual editor displays the directory, preserves it on repository/branch edits, and clears it explicitly', async t => {
  const editor = await mount(Editor); t.after(editor.unmount);
  assert.equal(document.getElementById('git_url').value, 'https://example.com/old.git');
  assert.equal(document.getElementById('subdirectories').value, 'jc-ui');
  await input('git_url', 'git@example.com:team/new.git');
  await input('code_version', 'develop');
  await perform(() => editor.instance.handleSubmit());
  assert.equal(editor.lastSave().payload.git_url, 'git@example.com:team/new.git?dir=jc-ui');
  assert.equal(editor.lastSave().payload.code_version, 'develop');
  assert.equal('subdirectories' in editor.lastSave().payload, false);
  await input('subdirectories', '');
  await perform(() => editor.instance.handleSubmit());
  assert.equal(editor.lastSave().payload.git_url, 'git@example.com:team/new.git');
});

test('pasting a legacy directory URL and immediately submitting saves its directory exactly once', async t => {
  const editor = await mount(Editor); t.after(editor.unmount);
  await perform(() => {
    const element = document.getElementById('git_url');
    element.value = 'https://example.com/new.git?dir=services/api';
    Simulate.change(element);
    editor.instance.handleSubmit();
  });
  assert.equal(editor.lastSave().payload.git_url, 'https://example.com/new.git?dir=services/api');
  assert.equal(document.getElementById('subdirectories').value, 'services/api');
});

test('Git to SVN to Git preserves the edited directory and SVN never submits it', async t => {
  const editor = await mount(Editor); t.after(editor.unmount);
  await input('subdirectories', 'services/new');
  await type(editor, 'svn');
  assert.ok(!document.getElementById('subdirectories'));
  await perform(() => editor.instance.handleSubmit());
  assert.equal(editor.lastSave().payload.git_url, 'https://example.com/old.git');
  await type(editor, 'git');
  assert.equal(document.getElementById('subdirectories').value, 'services/new');
  await perform(() => editor.instance.handleSubmit());
  assert.equal(editor.lastSave().payload.git_url, 'https://example.com/old.git?dir=services/new');
});

test('existing OSS source can save without a branch or directory', async t => {
  const editor = await mount(Editor, { server_type: 'oss', git_url: 'https://example.com/archive.tgz', code_version: '' });
  t.after(editor.unmount);
  assert.ok(!document.getElementById('subdirectories'));
  assert.ok(!document.getElementById('code_version'));
  await perform(() => editor.instance.handleSubmit());
  assert.equal(editor.lastSave().payload.git_url, 'https://example.com/archive.tgz');
  assert.equal(editor.lastSave().payload.server_type, 'oss');
});

test('invalid hidden Git directory does not block saving a non-Git source', async t => {
  const editor = await mount(Editor); t.after(editor.unmount);
  await input('subdirectories', '../invalid');
  await type(editor, 'svn');
  await perform(() => editor.instance.handleSubmit());
  assert.equal(editor.lastSave().payload.server_type, 'svn');
});

test('cancel and reopen uses saved directory instead of a discarded draft', async t => {
  const editor = await mount(Editor);
  await input('subdirectories', 'draft');
  await editor.unmount();
  const reopened = await mount(Editor); t.after(reopened.unmount);
  assert.equal(document.getElementById('subdirectories').value, 'jc-ui');
});

test('OAuth editor preserves directory when changing repositories, clears it, and discards cancelled drafts', async t => {
  const editor = await mount(Resource); t.after(editor.unmount);
  await perform(() => editor.instance.setState({
    buildSource: { ...source, code_from: 'oauth_github' }, buildSourceLoading: false,
    OauthLoading: false, tagsLoading: false, tags: ['main'],
    thirdInfo: { service_id: 'provider' }, tabList: [{ id: 'provider', name: 'Provider', enable: true }],
    fullList: [{ project_full_name: 'team/old', project_url: 'https://example.com/old.git', project_default_branch: 'main' },
      { project_full_name: 'team/new', project_url: 'https://example.com/new.git', project_default_branch: 'main' }]
  }));
  await perform(() => editor.instance.changeEditOauth());
  assert.equal(document.getElementById('subdirectories').value, 'jc-ui');
  await perform(() => {
    editor.instance.props.form.setFieldsValue({ full_name: 'team/new' });
    editor.instance.handleProjectChange('team/new');
  });
  await perform(() => editor.instance.handleSubmitOauth());
  assert.equal(editor.lastSave().payload.git_url, 'https://example.com/new.git?dir=jc-ui');
  await input('subdirectories', '');
  await perform(() => editor.instance.handleSubmitOauth());
  assert.equal(editor.lastSave().payload.git_url, 'https://example.com/new.git');
  await input('subdirectories', 'draft');
  await perform(() => editor.instance.hideEditOauth());
  await perform(() => editor.instance.changeEditOauth());
  assert.equal(document.getElementById('subdirectories').value, 'jc-ui');
});

after(() => dom.window.close());

test('a cleared root directory stays cleared after switching away from Git and back', async t => {
  const editor = await mount(Editor); t.after(editor.unmount);
  await input('subdirectories', '');
  await type(editor, 'svn');
  await type(editor, 'git');
  assert.equal(document.getElementById('subdirectories').value, '');
  await perform(() => editor.instance.handleSubmit());
  assert.equal(editor.lastSave().payload.git_url, 'https://example.com/old.git');
});

test('changing between image and source tabs keeps a directory draft without submitting it for the image', async t => {
  const editor = await mount(Editor); t.after(editor.unmount);
  await input('subdirectories', 'services/api');
  await perform(() => editor.instance.handleTabs('2'));
  assert.ok(!document.getElementById('subdirectories'));
  // The image fields are populated using the same registered Form as the production modal.
  await perform(() => editor.instance.props.form.setFieldsValue({ image: 'example/image:latest' }));
  await perform(() => editor.instance.handleSubmit());
  assert.equal(editor.lastSave().payload.service_source, 'docker_run');
  assert.equal('subdirectories' in editor.lastSave().payload, false);
  await perform(() => editor.instance.handleTabs('1'));
  assert.equal(document.getElementById('subdirectories').value, 'services/api');
});

test('changing the OAuth provider keeps the current directory while loading a new repository', async t => {
  const editor = await mount(Resource); t.after(editor.unmount);
  await perform(() => editor.instance.setState({
    buildSource: { ...source, code_from: 'oauth_github' }, buildSourceLoading: false,
    OauthLoading: false, tagsLoading: false, tags: ['main'],
    thirdInfo: { service_id: 'provider' },
    tabList: [{ id: 'provider', name: 'Provider', enable: true }, { id: 'other', name: 'Other', enable: true }],
    fullList: [{ project_full_name: 'team/old', project_url: 'https://example.com/old.git', project_default_branch: 'main' }]
  }));
  await perform(() => editor.instance.changeEditOauth());
  await input('subdirectories', 'services/custom');
  await perform(() => {
    editor.instance.props.form.setFieldsValue({ oauth_service_id: 'other' });
    editor.instance.handleProvinceChange('other');
  });
  const request = editor.actions.filter(action => action.type === 'global/codeWarehouseInfo').at(-1);
  await perform(() => request.callback({ status_code: 200, bean: { repositories: [{
    project_full_name: 'other/repo', project_url: 'git@example.com:other/repo.git', project_default_branch: 'main'
  }] } }));
  await perform(() => editor.instance.handleSubmitOauth());
  assert.equal(editor.lastSave().payload.oauth_service_id, 'other');
  assert.equal(editor.lastSave().payload.git_url, 'git@example.com:other/repo.git?dir=services/custom');
});
