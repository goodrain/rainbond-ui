const assert = require('assert');
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const { isExpansionInProgress } = require('../../utils/volumeExpansion');

function parseFile(relativePath) {
  const source = fs.readFileSync(path.join(__dirname, relativePath), 'utf8');
  return {
    source,
    ast: parser.parse(source, {
      sourceType: 'module',
      plugins: ['decorators-legacy', 'jsx']
    })
  };
}

const pageFile = parseFile('mnt.js');
const pageClass = pageFile.ast.program.body.find(
  node => node.type === 'ExportDefaultDeclaration'
).declaration;
const methodNames = [
  'constructor',
  'componentDidMount',
  'componentDidUpdate',
  'componentWillUnmount',
  'getVolumeRequestKey',
  'fetchVolumes',
  'clearVolumeExpansionPolling',
  'scheduleVolumeExpansionPolling'
];
const pageMethods = methodNames.map(name => {
  const member = pageClass.body.body.find(node => node.key.name === name);
  assert.ok(member, `storage page must provide ${name}`);
  return pageFile.source.slice(member.start, member.end);
}).join('\n');

const modelFile = parseFile('../../models/appControl.js');
const model = modelFile.ast.program.body.find(
  node => node.type === 'ExportDefaultDeclaration'
).declaration;
function modelMethod(groupName, methodName) {
  const group = model.properties.find(node => node.key.name === groupName).value;
  const method = group.properties.find(node => node.key.name === methodName);
  return modelFile.source.slice(method.start, method.end);
}
const fetchVolumes = new Function(
  'getVolumes',
  `return ({ ${modelMethod('effects', 'fetchVolumes')} }).fetchVolumes;`
)(() => {});
const saveVolumes = new Function(
  `return ({ ${modelMethod('reducers', 'saveVolumes')} }).saveVolumes;`
)();

function createHarness() {
  const context = { team: 'team-a', region: 'region-a' };
  const requests = [];
  const timers = new Map();
  const errors = [];
  let serial = 0;
  let state = { volumes: [] };
  let saves = 0;
  class PureComponent {
    constructor(props) {
      this.props = props;
    }
  }
  const Page = new Function(
    'PureComponent', 'cookie', 'globalUtil', 'handleAPIError',
    'isExpansionInProgress', 'setTimeout', 'clearTimeout',
    `return class extends PureComponent { ${pageMethods} };`
  )(
    PureComponent,
    { get: () => 'en-US' },
    {
      getCurrTeamName: () => context.team,
      getCurrRegionName: () => context.region
    },
    error => errors.push(error),
    isExpansionInProgress,
    (callback, delay) => {
      const id = ++serial;
      timers.set(id, { callback, delay });
      return id;
    },
    id => timers.delete(id)
  );
  const dispatch = action => {
    assert.strictEqual(action.type, 'appControl/fetchVolumes');
    const effect = fetchVolumes(action, {
      call: (fn, payload) => ({ call: payload }),
      put: update => ({ put: update })
    });
    assert.deepStrictEqual(effect.next().value, { call: action.payload });
    requests.push({ action, effect });
  };
  const page = new Page({ appAlias: 'component-a', method: 'docker', dispatch });
  page.fetchVolumeOpts = () => {};
  page.fetchBaseInfo = () => {};
  page.fetchVMDiskLayout = () => {};
  page.loadMntList = () => {};
  return {
    page, context, requests, timers, errors, dispatch,
    get state() { return state; },
    get saves() { return saves; },
    respond(index, response, beforeCallback) {
      const { effect } = requests[index];
      const step = effect.next(response);
      if (!step.done) {
        assert.strictEqual(step.value.put.type, 'saveVolumes');
        state = saveVolumes(state, step.value.put);
        saves += 1;
        if (beforeCallback) beforeCallback();
        assert.strictEqual(effect.next().done, true);
      }
    },
    fireTimer() {
      assert.strictEqual(timers.size, 1);
      const [id, timer] = [...timers][0];
      assert.strictEqual(timer.delay, 5000);
      timers.delete(id);
      timer.callback();
    }
  };
}

const expanding = { list: [{ volume_id: 1, expansion_status: 'resizing' }] };
const completed = { list: [{ volume_id: 1, expansion_status: 'completed' }] };

{
  const h = createHarness();
  h.page.componentDidMount();
  h.respond(0, expanding);
  assert.deepStrictEqual(h.state.volumes, expanding.list);
  h.fireTimer();
  assert.strictEqual(h.requests.length, 2, 'active expansion must keep polling');
  h.respond(1, completed);
  assert.deepStrictEqual(h.state.volumes, completed.list);
  assert.strictEqual(h.timers.size, 0, 'completed expansion must stop polling');
}

{
  const h = createHarness();
  h.page.componentDidMount();
  h.page.componentWillUnmount();
  h.respond(0, expanding);
  h.requests[0].action.callback(expanding);
  h.requests[0].action.handleError(new Error('late failure'));
  h.page.fetchVolumes();
  assert.strictEqual(h.saves, 0, 'unmounted page must not overwrite shared volumes');
  assert.strictEqual(h.timers.size, 0, 'late callbacks must not restart polling');
  assert.strictEqual(h.errors.length, 0, 'late errors must not affect the next page');
  assert.strictEqual(h.requests.length, 1, 'unmounted page must not dispatch again');
}

for (const changedContext of ['component', 'team', 'region']) {
  const h = createHarness();
  h.page.componentDidMount();
  if (changedContext === 'component') {
    h.page.props = { ...h.page.props, appAlias: 'component-b' };
  } else {
    h.context[changedContext] = `${changedContext}-b`;
  }
  assert.strictEqual(h.requests[0].action.shouldApply(), false);
  h.page.componentDidUpdate();
  assert.strictEqual(h.requests.length, 2, `${changedContext} switch must refresh`);
  assert.strictEqual(h.requests[1].action.payload.team_name, h.context.team);
  assert.strictEqual(h.requests[1].action.payload.app_alias, h.page.props.appAlias);
  const current = { list: [{ volume_id: 2, expansion_status: 'resizing' }] };
  h.respond(1, current);
  h.respond(0, expanding);
  h.requests[0].action.callback(expanding);
  h.requests[0].action.handleError(new Error('stale request'));
  assert.deepStrictEqual(h.state.volumes, current.list, `${changedContext} data must survive late response`);
  assert.strictEqual(h.saves, 1);
  assert.strictEqual(h.errors.length, 0);
  h.fireTimer();
  assert.strictEqual(h.requests.length, 3, 'stale callbacks must leave current polling intact');
}

{
  const h = createHarness();
  h.page.componentDidMount();
  h.page.fetchVolumes();
  h.respond(1, completed);
  h.respond(0, expanding);
  assert.deepStrictEqual(h.state.volumes, completed.list, 'older refresh must not revert a newer response');
  assert.strictEqual(h.saves, 1);
  assert.strictEqual(h.timers.size, 0);
}

{
  const h = createHarness();
  h.page.componentDidMount();
  h.respond(0, expanding);
  h.context.team = 'team-b';
  h.fireTimer();
  assert.strictEqual(h.requests.length, 1, 'timer must verify request identity even before a React update');
}

{
  const h = createHarness();
  h.page.componentDidMount();
  h.respond(0, expanding);
  const queuedCallback = [...h.timers.values()][0].callback;
  h.page.componentWillUnmount();
  assert.strictEqual(h.timers.size, 0);
  queuedCallback();
  assert.strictEqual(h.requests.length, 1, 'a timer already queued at unmount must not dispatch');
}

{
  const h = createHarness();
  h.page.componentDidMount();
  h.page.props = { ...h.page.props, method: 'vm' };
  h.page.componentDidUpdate();
  h.respond(0, expanding);
  assert.strictEqual(h.saves, 0, 'switching to VM must invalidate container volume responses');
  assert.strictEqual(h.requests.length, 1, 'VM pages must not poll container volumes');
}

{
  const h = createHarness();
  let callbackCalls = 0;
  let current = true;
  h.dispatch({
    type: 'appControl/fetchVolumes',
    payload: { team_name: 'team-a', app_alias: 'component-a' },
    shouldApply: () => current,
    callback: () => { callbackCalls += 1; }
  });
  h.respond(0, expanding, () => { current = false; });
  assert.strictEqual(callbackCalls, 0, 'effect must recheck ownership after saving before callbacks');
}

{
  const h = createHarness();
  let result;
  h.dispatch({
    type: 'appControl/fetchVolumes',
    payload: { team_name: 'team-a', app_alias: 'legacy-component' },
    callback: response => { result = response; }
  });
  h.respond(0, completed);
  assert.deepStrictEqual(h.state.volumes, completed.list);
  assert.strictEqual(result, completed, 'existing callers without a guard must keep working');
}

console.log('storage volume polling lifecycle regression tests passed');
