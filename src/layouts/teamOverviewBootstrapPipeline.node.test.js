/*
 * Integration boundary: production layout/page/child lifecycle methods, actual
 * model generators/reducers and service functions; only request/visual utilities
 * are fixtures. Node tests count the final request() boundary (not dispatches).
 * The companion localhost browser fixture mounts these same methods in React 16
 * and replaces that boundary with real loopback HTTP. Neither is full-app E2E.
 */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const test = require('node:test');
const parser = require('@babel/parser');
const { runSaga } = require('redux-saga');
const sagaEffects = require('redux-saga/effects');

const repo = path.resolve(__dirname, '../..');
const baseline = '7d1cbcaa';
const paths = {
  layout: 'src/layouts/TeamLayout.js', page: 'src/pages/Team/index.js',
  child: 'src/components/Team/TeamEventList/index.js',
  global: 'src/models/global.js', index: 'src/models/index.js', user: 'src/models/user.js',
  teamControl: 'src/models/teamControl.js', api: 'src/services/api.js',
  team: 'src/services/team.js', userService: 'src/services/user.js',
  helper: 'src/utils/teamOverviewBootstrap.js',
  cards: 'src/components/Team/TeamEventList/helpers.js',
  polling: 'src/pages/Component/componentPolling.js'
};

function readSources(ref) {
  const result = {};
  Object.entries(paths).forEach(([key, file]) => {
    try {
      result[key] = ref ? execFileSync('git', ['show', `${ref}:${file}`], { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) : fs.readFileSync(path.join(repo, file), 'utf8');
    } catch (error) {
      if (key !== 'helper') throw error;
      result[key] = '';
    }
  });
  return prepareSources(result);
}

function prepareSources(raw) {
  const parse = source => parser.parse(source, { sourceType: 'module', plugins: ['decorators-legacy', 'jsx'] });
  const hasJSX = node => node && typeof node === 'object' &&
    (node.type === 'JSXElement' || node.type === 'JSXFragment' || Object.keys(node).some(key => key !== 'loc' && (Array.isArray(node[key]) ? node[key].some(hasJSX) : hasJSX(node[key]))));
  const methods = source => {
    const ast = parse(source);
    const classNode = ast.program.body.map(node => node.type === 'ExportDefaultDeclaration' ? node.declaration : node)
      .find(node => node.type === 'ClassDeclaration');
    return classNode.body.body.filter(node => !hasJSX(node)).map(node => source.slice(node.start, node.end)).join('\n');
  };
  const objectMethod = (source, section, name) => {
    const object = parse(source).program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
    const value = section ? object.properties.find(node => node.key.name === section).value : object;
    const method = value.properties.find(node => node.key.name === name);
    return source.slice(method.start, method.end);
  };
  const fn = (source, name) => {
    const node = parse(source).program.body.map(item => item.type === 'ExportNamedDeclaration' ? item.declaration : item)
      .find(item => item && item.type === 'FunctionDeclaration' && item.id.name === name);
    return source.slice(node.start, node.end);
  };
  const effectSpecs = {
    global: ['getTeamOverview', 'fetchStorageUsed'],
    index: ['fetchOverview', 'fetchEvents'], user: ['fetchCurrent'],
    teamControl: ['fetchCurrentTeam', 'fetchCurrentTeamPermissions', 'fetchCurrentRegionName']
  };
  const reducerSpecs = {
    global: ['saveTeamOverview'], index: ['saveOverviewInfo', 'saveEvents'], user: ['saveCurrentUser'],
    teamControl: ['saveCurrentTeam', 'saveCurrentTeamPermissionsInfo', 'saveCurrentRegionName']
  };
  return {
    classes: { layout: methods(raw.layout), page: methods(raw.page), child: methods(raw.child) },
    effects: Object.fromEntries(Object.entries(effectSpecs).map(([namespace, names]) => [namespace,
      Object.fromEntries(names.map(name => [name, objectMethod(raw[namespace], 'effects', name)]))])),
    reducers: Object.fromEntries(Object.entries(reducerSpecs).map(([namespace, names]) => [namespace,
      Object.fromEntries(names.map(name => [name, objectMethod(raw[namespace], 'reducers', name)]))])),
    services: [fn(raw.team, 'getTeamRegionOverview'), fn(raw.team, 'getNewestEvent'),
      fn(raw.api, 'getTeamOverview'), fn(raw.api, 'fetchStorageUsed'), fn(raw.userService, 'getDetail')].join('\n'),
    helper: raw.helper, cards: raw.cards, polling: raw.polling,
    // This is checked as well as the methods: fixture provider must mirror the
    // production provider rather than invent an otherwise-unused channel.
    providerWired: /<Context.Provider value=\{this.getContext\(\)\}>/.test(raw.layout)
  };
}

function createPipeline(sources, options = {}) {
  const records = [], actions = [], errors = [], warnings = [], saved = [], tasks = new Set(), timers = new Map();
  const scope = { team: 'team-a', region: 'region-a' };
  const stores = { global: {}, index: {}, user: {}, teamControl: {} };
  let timerID = 0, layout, page, child, pageWanted = false, syncing = false, notifying = false;
  const React = options.React;
  const MenuContext = React ? React.createContext() : {};
  const cjs = source => { const module = { exports: {} }; new Function('module', 'exports', source)(module, module.exports); return module.exports; };
  const helper = sources.helper ? cjs(sources.helper) : {};
  const cardHelpers = cjs(sources.cards), pollingHelpers = cjs(sources.polling);
  class ManualComponent {
    constructor(props) { this.props = props; this.context = {}; }
    setState(update, callback) {
      const value = typeof update === 'function' ? update(this.state, this.props) : update;
      if (!value) return;
      const previous = this.state;
      this.state = { ...this.state, ...value };
      if (this._fixtureMounted) {
        syncTree();
        if (this.componentDidUpdate) this.componentDidUpdate(this.props, previous);
      }
      if (callback) callback();
    }
  }
  const permissions = { team: { team_overview: true, team_dynamic: true, team_member: true, revision: 1 } };
  const makeTeam = name => ({ team_name: name, tenant_actions: JSON.parse(JSON.stringify(permissions)), region: [{ team_region_name: scope.region }] });
  const user = { user_id: 'user-a', enterprise_id: 'enterprise-a', is_enterprise_admin: false,
    roles: ['admin'], teams: [makeTeam('team-a'), makeTeam('team-b')] };
  const storage = new Map();
  const windowFixture = React ? window : {
    localStorage: { getItem: key => storage.get(`local:${key}`) || null },
    sessionStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) },
    location: { href: '/team/team-a/region/region-a/team', reload() {} }
  };
  const queryPermissionsInfo = (team, type) => ({ isAccess: !!team?.[type] });
  const globalUtil = {
    getCurrTeamName: () => scope.team, getCurrRegionName: () => scope.region,
    getAppID: () => '', getComponentID: () => '', withoutPermission: dispatch => dispatch({ type: 'fixture/forbidden' })
  };
  const dependencies = {
    PureComponent: React ? React.PureComponent : ManualComponent, MenuContext, Context: MenuContext,
    PropTypes: { object: () => null, string: () => null },
    ...helper, ...cardHelpers, ...pollingHelpers,
    TeamImg: 'default-team-logo', isMobile: false, window: windowFixture,
    roleUtil: { queryPermissionsInfo }, newRole: { queryPermissionsInfo },
    PluginUtil: { isInstallPlugin: list => (list || []).some(item => item.name === 'rainbond-bill') },
    pluginUtile: { isInstallEnterprisePlugin: () => false }, globalUtil,
    cookie: { set() {} }, userUtil: {
      getTeamByTeamName: (currentUser, name) => currentUser?.teams?.find(team => team.team_name === name),
      hasTeamAndRegion: (currentUser, name, region) => currentUser?.teams?.find(team => team.team_name === name)?.region.find(item => item.team_region_name === region)
    },
    notification: { warning: value => warnings.push(value) }, formatMessage: value => value.id,
    notifyAPIWarning: error => errors.push(error), handleAPIError: error => errors.push(error),
    routerRedux: { push: payload => ({ type: 'router/push', payload }) },
    enquireScreen: callback => callback(false),
    getFallbackRoute: () => '/fallback', isMissingResourceError: () => false,
    setTimeout: (callback, delay) => { const id = ++timerID; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id)
  };
  const createClass = key => new Function(...Object.keys(dependencies), `return class extends PureComponent { ${sources.classes[key]} };`)(...Object.values(dependencies));
  const Layout = createClass('layout'), Page = createClass('page'), Child = createClass('child');
  const backend = {
    overview: { status_code: 200, bean: { eid: 'enterprise-a', team_id: 'team-id-a', logo: 'logo-a', region_health: true, team_app_num: 3 } },
    storage: { status_code: 200, bean: { used_storage: { value: 2, unit: 'GB' } } },
    user, hold: [], auto: options.auto !== false,
    complete(index = 0, response = backend.overview, error) {
      const pending = backend.hold.splice(index, 1)[0];
      if (!pending) throw new Error('No pending overview request');
      if (error) {
        if (pending.options.handleError) pending.options.handleError(error);
        pending.resolve(undefined);
      } else pending.resolve(response);
    }
  };
  let props = {
    dispatch, currentUser: options.initialUserReady === false ? null : user,
    currUser: options.initialUserReady === false ? null : user, enterprise: { enterprise_id: 'enterprise-a' },
    currentEnterprise: { enterprise_id: 'enterprise-a' },
    currentTeam: user.teams[0], currentRegionName: scope.region,
    currentTeamPermissionsInfo: JSON.parse(JSON.stringify(permissions)),
    rainbondInfo: { is_saas: !!options.saas }, pluginsList: options.billing ? [{ name: 'rainbond-bill' }] : [],
    match: { params: { teamName: scope.team, regionName: scope.region } },
    location: { pathname: '/team/team-a/region/region-a/team', search: '?tab=event' }
  };
  const request = (url, config = {}) => {
    const record = { url, params: config.params || {}, method: config.method || 'get', started: Date.now() };
    records.push(record);
    if (options.transport) return options.transport(url, config, record);
    if (/\/overview$/.test(url)) {
      if (backend.auto) return Promise.resolve(backend.overview);
      return new Promise(resolve => backend.hold.push({ resolve, options: config, record }));
    }
    if (/\/users\/details$/.test(url)) return Promise.resolve({ status_code: 200,
      bean: options.initialUserReady === false ? backend.user : props.currentUser });
    if (/\/storage_statistics$/.test(url)) {
      if (options.storageError) { config.handleError(new Error('storage fixture unavailable')); return Promise.resolve(); }
      return Promise.resolve(backend.storage);
    }
    return Promise.resolve({ status_code: 200, list: [], total: 0 });
  };
  const services = new Function('request', 'apiconfig', `const teamRegionOverviewRequests = {}; const userDetailRequests = {};
    ${sources.services}
    const getSharedTeamRegionOverview = getTeamRegionOverview;
    return { getTeamOverview, getTeamRegionOverview, getNewestEvent, fetchStorageUsed, getDetail };`)(request, { baseUrl: '' });
  const effectDeps = { ...services, identifyPostHogUser() {} };
  const modelMethods = entries => Object.fromEntries(Object.entries(entries).map(([namespace, methods]) => [namespace,
    Object.fromEntries(Object.entries(methods).map(([name, source]) => [name,
      new Function(...Object.keys(effectDeps), `return ({ ${source} }).${name};`)(...Object.values(effectDeps))]))]));
  const effects = modelMethods(sources.effects), reducers = modelMethods(sources.reducers);
  function notifyStore() {
    if (notifying || !options.hydrate) return;
    notifying = true;
    const next = {};
    if (stores.user.currentUser) next.currentUser = next.currUser = stores.user.currentUser;
    if (stores.teamControl.currentTeamPermissionsInfo) next.currentTeamPermissionsInfo = stores.teamControl.currentTeamPermissionsInfo;
    if (stores.teamControl.currentTeam) next.currentTeam = stores.teamControl.currentTeam;
    updateProps(next);
    notifying = false;
  }
  function dispatch(action) {
    actions.push(action);
    const [namespace, name] = action.type.split('/');
    if (reducers[namespace]?.[name]) {
      stores[namespace] = reducers[namespace][name](stores[namespace], action);
      saved.push({ type: action.type, payload: action.payload });
      notifyStore();
      return action;
    }
    if (effects[namespace]?.[name]) {
      const task = options.runSaga({
        dispatch: value => dispatch({ ...value, type: value.type.includes('/') ? value.type : `${namespace}/${value.type}` }),
        getState: () => stores, onError: error => errors.push(error)
      }, effects[namespace][name], action, options.sagaEffects);
      const pending = task.toPromise();
      tasks.add(pending);
      pending.then(() => tasks.delete(pending), () => tasks.delete(pending));
      return pending;
    }
    // Unrelated layout setup APIs are a backend fixture. The overview, user and
    // event/storage APIs above always execute their actual effects and services.
    if (action.callback) {
      let response = { status_code: 200, list: [] };
      if (action.type === 'region/getEnterpriseLicense') response.bean = { valid: true };
      if (action.type === 'global/fetchEnterpriseList') response.list = [{ enterprise_id: props.currentUser?.enterprise_id || 'enterprise-a' }];
      if (action.type === 'global/fetchTeamDetails') response.bean = { team_id: 'team-id-a' };
      Promise.resolve().then(() => action.callback(response));
    }
    return Promise.resolve();
  }
  function update(instance, next) {
    if (!instance) return;
    const previous = instance.props;
    const nextProps = { ...previous, ...next };
    if (instance.componentWillReceiveProps) instance.componentWillReceiveProps(nextProps);
    instance.props = nextProps;
    if (instance === page) instance.context = layout ? layout.getContext() : {};
    syncTree();
    if (instance.componentDidUpdate) instance.componentDidUpdate(previous, instance.state);
  }
  function mountChild() {
    child = new Child({ ...page.props, overviewSnapshot: page.state.overviewSnapshot });
    child._fixtureMounted = true;
    child.componentDidMount();
  }
  function syncTree() {
    if (React || syncing || !page) return;
    syncing = true;
    if (page.state.scope === 'event') {
      if (!child) mountChild();
      else update(child, { ...page.props, overviewSnapshot: page.state.overviewSnapshot });
    } else if (child) { child.componentWillUnmount(); child._fixtureMounted = false; child = null; }
    syncing = false;
  }
  let rerender;
  if (React) {
    Layout.prototype.render = function renderFixtureLayout() {
      return React.createElement(MenuContext.Provider, { value: this.getContext() }, this.props.fixtureShowPage
        ? React.createElement(Page, { ...this.props, ref: value => { page = value; } }) : null);
    };
    Page.prototype.render = function renderFixturePage() {
      return this.state.scope === 'event' ? React.createElement(Child, {
        ...this.props, overviewSnapshot: this.state.overviewSnapshot, ref: value => { child = value; }
      }) : React.createElement('div', null, 'Members');
    };
    Child.prototype.render = function renderFixtureCards() {
      return React.createElement('div', { id: 'overview-state' }, JSON.stringify({ loading: this.state.loadingOverview, data: this.state.overviewInfo }));
    };
    rerender = () => options.ReactDOM.render(React.createElement(Layout, {
      ...props, fixtureShowPage: pageWanted, ref: value => { layout = value; }
    }), options.container);
  }
  function updateProps(next = {}, { beforeLifecycle = false } = {}) {
    props = { ...props, ...next };
    if (next.match) { scope.team = next.match.params.teamName; scope.region = next.match.params.regionName; }
    if (React) { rerender(); return; }
    if (beforeLifecycle) {
      if (layout) layout.props = { ...layout.props, ...next };
      if (page) page.props = { ...page.props, ...next };
      if (child) child.props = { ...child.props, ...next };
      return;
    }
    update(layout, next); update(page, next); syncTree();
  }
  const pipeline = {
    records, actions, errors, warnings, saved, stores, timers, backend, scope,
    get props() { return props; }, get layout() { return layout; }, get page() { return page; }, get child() { return child; },
    count: suffix => records.filter(record => record.url.endsWith(suffix)).length,
    mountLayout() {
      if (React) { rerender(); return; }
      layout = new Layout(props);
      layout.componentWillMount();
      layout._fixtureMounted = true;
      layout.componentDidMount();
    },
    mountPage({ standalone = false } = {}) {
      pageWanted = true;
      if (React) { rerender(); return; }
      page = new Page(props);
      page.context = standalone || !layout ? {} : layout.getContext();
      page.componentWillMount();
      syncTree();
      page._fixtureMounted = true;
      page.componentDidMount();
    },
    mountStandaloneChild() {
      child = new Child(props); child._fixtureMounted = true; child.componentDidMount();
    },
    unmountPage() {
      pageWanted = false;
      if (React) { rerender(); return; }
      if (child) { child.componentWillUnmount(); child._fixtureMounted = false; child = null; }
      if (page) { page.componentWillUnmount(); page._fixtureMounted = false; page = null; }
    },
    unmount() {
      if (React) { options.ReactDOM.unmountComponentAtNode(options.container); return; }
      pipeline.unmountPage();
      if (layout) { layout.componentWillUnmount(); layout._fixtureMounted = false; }
    },
    update: updateProps,
    async flush() { for (let index = 0; index < 24; index += 1) await Promise.resolve(); },
    fireRetry() { const [id, timer] = [...timers][0]; timers.delete(id); timer.callback(); },
    dispatch
  };
  return pipeline;
}

module.exports = { readSources, createPipeline, baseline };

if (!process.env.RAINBOND_PIPELINE_FIXTURE_ONLY) {
  const current = () => readSources();
  const harness = options => createPipeline(current(), { ...options, runSaga, sagaEffects });
  const create = async (options = {}) => { const h = harness(options); h.mountLayout(); await h.flush(); return h; };
  const success = h => {
    assert.equal(h.child.state.loadingOverview, false);
    assert.equal(h.child.state.overviewInfo.team_id, 'team-id-a');
    assert.equal(h.stores.global.teamOverview.team_id, 'team-id-a');
    assert.equal(h.stores.index.overviewInfo.team_id, 'team-id-a');
  };
  const withReactPipeline = async (options, verify) => {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://127.0.0.1/' });
    const globals = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
      // jsdom has no browser MessageChannel. Do not accidentally make React's
      // browser scheduler own Node worker MessagePorts that keep this test alive.
      MessageChannel: undefined,
      requestAnimationFrame: callback => setTimeout(callback, 0), cancelAnimationFrame: clearTimeout };
    dom.window.requestAnimationFrame = globals.requestAnimationFrame;
    dom.window.cancelAnimationFrame = globals.cancelAnimationFrame;
    const previous = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(global, key)]));
    Object.entries(globals).forEach(([key, value]) => Object.defineProperty(global, key, { configurable: true, writable: true, value }));
    let h;
    try {
      h = harness({ ...options, React: require('react'), ReactDOM: require('react-dom'), container: dom.window.document.getElementById('root'),
        // A real HTTP response arrives on a later task, not a synchronous
        // resolved-Promise fixture inside the same React lifecycle commit.
        transport: url => new Promise(resolve => setImmediate(() => {
          if (url.endsWith('/console/users/details')) resolve({ status_code: 200, bean: h.props.currentUser });
          else if (url.endsWith('/overview')) resolve(url.includes('/teams/team-b/')
            ? { ...h.backend.overview, bean: { ...h.backend.overview.bean, team_id: 'team-id-b' } } : h.backend.overview);
          else resolve({ status_code: 200, list: [], total: 0 });
        }))
      });
      const flushMicrotasks = h.flush;
      h.flush = async () => {
        for (let index = 0; index < 5; index += 1) {
          await new Promise(resolve => setImmediate(resolve)); await flushMicrotasks();
        }
      };
      h.mountLayout(); await h.flush(); h.mountPage(); await h.flush();
      await verify(h);
    } finally {
      if (h) { h.unmount(); await h.flush(); }
      dom.window.close();
      Object.keys(globals).forEach(key => { if (previous[key]) Object.defineProperty(global, key, previous[key]); else delete global[key]; });
    }
  };

  const verifyLatePageCount = async (ref, count) => {
    const sources = readSources(ref);
    assert.equal(sources.providerWired, true);
    const h = createPipeline(sources, { runSaga, sagaEffects, hydrate: true });
    h.mountLayout(); await h.flush();
    assert.equal(h.count('/overview'), 1);
    await new Promise(resolve => setTimeout(resolve, 450));
    h.mountPage(); await h.flush();
    assert.equal(h.count('/overview'), count, `${ref || 'worktree'} actual final request count`);
    success(h); h.unmount();
  };

  test('current full production chain: settled layout + page mounted 450ms later sends 1 request',
    () => verifyLatePageCount(null, 1));

  // Historical characterization is opt-in: regular/shallow CI never needs a
  // past Git object. All current production-chain tests above/below always run.
  if (process.env.RAINBOND_COMPARE_BOOTSTRAP_BASELINE === '1') {
    test('historical baseline full production chain: settled layout + late page sends 2 requests',
      () => verifyLatePageCount(baseline, 2));
  }

  for (const hydrate of [false, true]) {
    test(`layout/page share pending initialization with real generators/services (hydrate=${hydrate})`, async () => {
      const h = await create({ auto: false, hydrate, billing: true });
      h.mountPage(); await h.flush();
      assert.equal(h.count('/overview'), 1);
      h.backend.complete(); await h.flush(); success(h);
      assert.equal(h.count('/storage_statistics'), 1);
      assert.equal(h.actions.filter(action => action.type === 'teamControl/fetchPluginUrl').length, 1);
      h.update({ currentUser: { ...h.props.currentUser }, currUser: { ...h.props.currUser },
        currentTeamPermissionsInfo: JSON.parse(JSON.stringify(h.props.currentTeamPermissionsInfo)) });
      await h.flush(); assert.equal(h.count('/overview'), 1); h.unmount();
    });
  }

  test('page-first initialization invokes the layout owner and later layout setup does not duplicate', async () => {
    const h = harness({ auto: false });
    h.mountLayout(); h.mountPage(); await h.flush();
    h.layout.getTeamOverview(); await h.flush();
    assert.equal(h.count('/overview'), 1);
    h.backend.complete(); await h.flush(); success(h); h.unmount();
  });

  test('member return and edit refresh once, automatic permission hydration does not refresh', async () => {
    const h = await create(); h.mountPage(); await h.flush(); success(h);
    h.page.handleTabChange('member'); h.page.handleTabChange('event'); await h.flush();
    assert.equal(h.count('/overview'), 2); success(h);
    h.page.handleEditName({ team_alias: 'fixture-new-name' }); await h.flush();
    assert.equal(h.count('/overview'), 3); success(h); h.unmount();
  });

  test('same-scope real page unmount/remount refreshes once but first late mount reuses bootstrap', async () => {
    const h = await create(); h.mountPage(); await h.flush();
    assert.equal(h.count('/overview'), 1);
    h.unmountPage(); h.update({ location: { pathname: '/team/team-a/region/region-a/index', search: '' } });
    h.update({ location: { pathname: '/team/team-a/region/region-a/team', search: '?tab=event' } });
    h.mountPage(); await h.flush(); assert.equal(h.count('/overview'), 2); success(h); h.unmount();
  });

  test('page departure while initialization is pending does not cancel needed layout bootstrap side effects', async () => {
    const h = await create({ auto: false, saas: true }); h.mountPage(); await h.flush();
    h.unmountPage(); h.backend.complete(); await h.flush();
    assert.equal(h.stores.global.teamOverview.team_id, 'team-id-a');
    assert.equal(h.layout.state.eid, 'enterprise-a');
    assert.equal(h.actions.filter(action => action.type === 'global/fetchTeamDetails').length, 1);
    assert.equal(h.actions.filter(action => action.type === 'teamControl/fetchPluginUrl').length, 1);
    assert.equal(h.actions.filter(action => action.type === 'global/fetchPlatformSettings').length, 1);
    h.unmount();
  });

  test('unknown principal waits for real user-effect hydration: HTTP 0 then 1', async () => {
    const h = harness({ auto: false, hydrate: true, initialUserReady: false });
    h.mountLayout();
    assert.equal(h.count('/overview'), 0);
    await h.flush();
    assert.equal(h.count('/overview'), 1);
    h.mountPage(); await h.flush();
    assert.equal(h.count('/overview'), 1);
    h.backend.complete(); await h.flush(); success(h); h.unmount();
  });

  test('logout and login with the same user ID starts a fresh authenticated epoch', async () => {
    const h = await create({ auto: false }); h.mountPage(); await h.flush();
    h.backend.complete(); await h.flush(); success(h);
    const originalUser = h.props.currentUser;
    h.update({ currentUser: null, currUser: null }); await h.flush();
    assert.equal(h.count('/overview'), 1);
    h.update({ currentUser: originalUser, currUser: originalUser }); await h.flush();
    assert.equal(h.count('/overview'), 2);
    assert.equal(h.child.state.loadingOverview, true);
    assert.equal(h.child.state.overviewInfo, null);
    h.backend.complete(); await h.flush(); success(h); h.unmount();
  });

  // These joint hydration/commit cases deliberately use real React DOM. The
  // synchronous manual lifecycle harness above is not a React batching model.
  test('real React commit: different team-derived permissions share one new route initialization',
    () => withReactPipeline({ hydrate: true }, async h => {
      success(h);
      const currentUser = JSON.parse(JSON.stringify(h.props.currentUser));
      currentUser.teams[1].tenant_actions.team.revision = 2;
      // Update through the real reducer; props-only injection would allow a
      // later unrelated reducer to rehydrate the old user from the fixture store.
      h.dispatch({ type: 'user/saveCurrentUser', payload: currentUser }); await h.flush();
      assert.equal(h.count('/overview'), 1, 'changing another team metadata must not refresh this team');
      h.update({
        match: { params: { teamName: 'team-b', regionName: 'region-a' } },
        location: { pathname: '/team/team-b/region/region-a/team', search: '?tab=event' }
      });
      await h.flush();
      assert.equal(h.count('/overview'), 2, 'route-derived Redux hydration belongs to one React commit');
      assert.equal(h.child.state.loadingOverview, false);
    }));

  test('real React commit: same Page instance switches teams then real remount reads the new team again',
    () => withReactPipeline({ hydrate: true }, async h => {
      success(h);
      const firstPage = h.page;
      h.update({
        match: { params: { teamName: 'team-b', regionName: 'region-a' } },
        location: { pathname: '/team/team-b/region/region-a/team', search: '?tab=event' }
      });
      await h.flush();
      assert.equal(h.page, firstPage, 'this is an in-place route switch, not an accidental first mount');
      assert.equal(h.count('/overview'), 2);
      h.unmountPage(); h.mountPage(); await h.flush();
      assert.notEqual(h.page, firstPage);
      assert.equal(h.count('/overview'), 3, 'the visited second team must not be mistaken for its first late mount');
    }));

  for (const scopeChange of ['user', 'enterprise', 'team', 'region', 'permissions', 'permissionsCleared', 'admin', 'roles', 'logout']) {
    for (const beforeLifecycle of [false, true]) {
      test(`${scopeChange} change blocks old store writes (before update lifecycle=${beforeLifecycle})`, async () => {
        const h = await create({ auto: false }); h.mountPage(); await h.flush();
        let next = {};
        if (scopeChange === 'user') next = { currentUser: { ...h.props.currentUser, user_id: 'user-b' }, currUser: { ...h.props.currUser, user_id: 'user-b' } };
        if (scopeChange === 'enterprise') next = { currentUser: { ...h.props.currentUser, enterprise_id: 'enterprise-b' }, currUser: { ...h.props.currUser, enterprise_id: 'enterprise-b' }, enterprise: { enterprise_id: 'enterprise-b' }, currentEnterprise: { enterprise_id: 'enterprise-b' } };
        if (scopeChange === 'team' || scopeChange === 'region') next = { match: { params: { teamName: scopeChange === 'team' ? 'team-b' : 'team-a', regionName: scopeChange === 'region' ? 'region-b' : 'region-a' } }, currentRegionName: scopeChange === 'region' ? 'region-b' : 'region-a' };
        if (scopeChange === 'permissions') next = { currentTeamPermissionsInfo: { team: { ...h.props.currentTeamPermissionsInfo.team, revision: 2 } } };
        if (scopeChange === 'permissionsCleared') next = { currentTeamPermissionsInfo: null };
        if (scopeChange === 'admin') next = { currentUser: { ...h.props.currentUser, is_enterprise_admin: true }, currUser: { ...h.props.currUser, is_enterprise_admin: true } };
        if (scopeChange === 'roles') next = { currentUser: { ...h.props.currentUser, roles: ['viewer'] }, currUser: { ...h.props.currUser, roles: ['viewer'] } };
        if (scopeChange === 'logout') next = { currentUser: null, currUser: null, currentTeamPermissionsInfo: null };
        h.update(next, { beforeLifecycle });
        h.backend.complete(0, { status_code: 200, bean: { team_id: 'obsolete', eid: 'old-enterprise', logo: 'wrong', region_health: true } });
        await h.flush();
        assert.equal(h.saved.some(entry => entry.payload?.team_id === 'obsolete'), false);
        assert.notEqual(h.child?.state.overviewInfo?.team_id, 'obsolete');
        if (!beforeLifecycle) {
          assert.equal(h.count('/overview'), scopeChange === 'logout' ? 1 : 2);
          if (scopeChange !== 'logout') { h.backend.complete(); await h.flush(); }
        }
        h.unmount();
      });
    }
  }

  test('same-scope force supersedes the prior response including store writes and layout side effects', async () => {
    const h = await create({ auto: false }); h.mountPage(); await h.flush();
    h.page.loadOverview(); await h.flush();
    assert.equal(h.count('/overview'), 2);
    h.backend.complete(0, { status_code: 200, bean: { team_id: 'obsolete', eid: 'obsolete' } });
    await h.flush();
    assert.equal(h.saved.some(entry => entry.payload?.team_id === 'obsolete'), false);
    h.backend.complete(); await h.flush(); success(h);
    assert.equal(h.actions.filter(action => action.type === 'teamControl/fetchPluginUrl').length, 1); h.unmount();
  });

  test('force between owner Promise resolution and index continuation rejects the old index write', async () => {
    const h = await create({ auto: false });
    const pending = h.layout.loadSharedTeamOverview({ team_name: 'team-a', region_name: 'region-a' });
    pending.then(() => h.page.loadOverview());
    h.mountPage(); await h.flush();
    h.backend.complete(0, { status_code: 200, bean: { team_id: 'first-generation', eid: 'enterprise-a' } });
    await h.flush();
    assert.equal(h.count('/overview'), 2);
    assert.equal(h.saved.some(entry => entry.type === 'index/saveOverviewInfo' && entry.payload?.team_id === 'first-generation'), false);
    h.backend.complete(); await h.flush(); success(h); h.unmount();
  });

  test('SaaS and enterprise/plugin setup remain one per identity after explicit successful refreshes', async () => {
    const h = await create({ saas: true }); h.mountPage(); await h.flush();
    h.page.loadOverview(); await h.flush(); h.page.loadOverview(); await h.flush();
    assert.equal(h.count('/overview'), 3);
    assert.equal(h.actions.filter(action => action.type === 'global/fetchTeamDetails').length, 1);
    assert.equal(h.actions.filter(action => action.type === 'teamControl/fetchPluginUrl').length, 1);
    assert.equal(h.actions.filter(action => action.type === 'global/fetchPlatformSettings').length, 1);
    h.unmount();
  });

  for (const failure of ['empty', 'business', 'businessCode', 'http', '10411', '10412']) {
    test(`${failure} settles layout/page consumers once; late mount does not retry; force recovers`, async () => {
      const h = await create({ auto: false });
      if (failure === 'empty') h.backend.complete(0, null);
      else if (failure === 'business') h.backend.complete(0, { status_code: 503, bean: { team_id: 'invalid' } });
      else if (failure === 'businessCode') h.backend.complete(0, { status_code: 200, business_code: 503, _condition: 503, bean: { team_id: 'invalid' } });
      else h.backend.complete(0, null, { status: 503, data: { code: failure === 'http' ? 503 : Number(failure) } });
      await h.flush(); h.mountPage(); await h.flush();
      assert.equal(h.count('/overview'), 1);
      assert.equal(h.child.state.loadingOverview, false);
      assert.equal(h.child.state.overviewInfo, null);
      assert.notEqual(h.stores.global.teamOverview?.team_id, 'invalid');
      assert.notEqual(h.stores.index.overviewInfo?.team_id, 'invalid');
      if (failure === '10411' || failure === '10412') {
        assert.equal(h.warnings.length, 1);
        assert.equal(h.warnings[0].message, failure === '10411' ? '当前集群不可用' : '当前集群不存在');
        assert.equal(h.actions.filter(action => action.type === 'router/push').length, 1);
      }
      h.update(); await h.flush(); assert.equal(h.count('/overview'), 1);
      h.page.loadOverview(); await h.flush(); assert.equal(h.count('/overview'), 2);
      h.backend.complete(); await h.flush(); success(h); h.unmount();
    });
  }

  test('unmount rejects late callbacks without stores, layout side effects or retry', async () => {
    const h = await create({ auto: false }); h.mountPage(); await h.flush(); h.unmount();
    h.backend.complete(); await h.flush();
    assert.equal(h.saved.some(entry => entry.type === 'global/saveTeamOverview' || entry.type === 'index/saveOverviewInfo'), false);
    assert.equal(h.actions.some(action => action.type === 'teamControl/fetchPluginUrl'), false);
    assert.equal(h.timers.size, 0);
  });

  for (const standalone of ['page', 'child']) {
    test(`standalone ${standalone} keeps the actual index effect/service fallback`, async () => {
      const h = harness({ billing: true });
      if (standalone === 'page') h.mountPage({ standalone: true }); else h.mountStandaloneChild();
      await h.flush(); assert.equal(h.count('/overview'), 1);
      assert.equal(h.child.state.overviewInfo.team_id, 'team-id-a');
      assert.equal(h.count('/storage_statistics'), 1); h.unmount();
    });
  }

  for (const gate of ['billing', 'permission', 'health', 'teamID']) {
    test(`storage gate ${gate} and one bounded retry survive shared bootstrap`, async () => {
      const h = await create({ billing: gate !== 'billing', storageError: true, auto: false });
      if (gate === 'permission') h.update({ currentTeamPermissionsInfo: { team: { ...h.props.currentTeamPermissionsInfo.team, team_overview: false } } });
      h.mountPage(); await h.flush();
      const response = JSON.parse(JSON.stringify(h.backend.overview));
      if (gate === 'health') response.bean.region_health = false;
      if (gate === 'teamID') delete response.bean.team_id;
      while (h.backend.hold.length > 1) h.backend.complete(0, response);
      h.backend.complete(0, response); await h.flush();
      assert.equal(h.count('/storage_statistics'), 0);
      if (gate === 'billing') h.update({ pluginsList: [{ name: 'rainbond-bill' }] });
      if (gate === 'permission') h.update({ currentTeamPermissionsInfo: { team: { ...h.props.currentTeamPermissionsInfo.team, team_overview: true } } });
      if (gate === 'health' || gate === 'teamID') { h.page.loadOverview(); await h.flush(); h.backend.complete(); }
      if (gate === 'permission') { await h.flush(); h.backend.complete(); }
      await h.flush();
      assert.equal(h.count('/storage_statistics'), 1); assert.equal(h.timers.size, 1);
      h.update(); h.update(); await h.flush(); assert.equal(h.count('/storage_statistics'), 1);
      h.fireRetry(); await h.flush(); assert.equal(h.count('/storage_statistics'), 2);
      assert.equal(h.timers.size, 0); h.unmount();
    });
  }
}
