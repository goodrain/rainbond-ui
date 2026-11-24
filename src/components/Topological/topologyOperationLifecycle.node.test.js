const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const generate = require('@babel/generator').default;
const coordination = require('../../utils/topologyRefresh');
const { isVirtualMachineComponent } = require('../../utils/virtualMachineComponent');
const location = { hash: '#/team/team/region/region/apps/31/overview', origin: 'http://fixture' };

function parse(relative) {
  return parser.parse(fs.readFileSync(path.resolve(__dirname, relative), 'utf8'), {
    sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties', 'optionalChaining']
  }).program.body;
}

function service(name, request) {
  const node = parse('../../services/app.js').find(item => item.type === 'ExportNamedDeclaration' && item.declaration && item.declaration.id && item.declaration.id.name === name);
  return new Function('request', 'apiconfig', 'captureTopologyOperation', `${generate(node.declaration).code}; return ${name};`)(
    request, { baseUrl: '' }, payload => coordination.captureTopologyOperation(payload, location));
}

for (const [name, method, suffix] of [
  ['addRelationedApp', 'post', '/dependency'], ['removeRelationedApp', 'delete', '/dependency/dependency'], ['updateRolling', 'post', '/upgrade']
]) {
  test(`real ${name} preserves request/result/error and rejects stale completion`, async () => {
    let count = 0; let resolve; let reject; let recorded;
    let remove = coordination.subscribeTopologyRefresh(coordination.topologyScope('team', 'region', 31), () => { count += 1; }, () => [{ service_alias: 'component' }]);
    const run = service(name, (url, options) => { recorded = { url, options }; return new Promise((ok, fail) => { resolve = ok; reject = fail; }); });
    const payload = { team_name: 'team', app_alias: 'component', dep_service_id: 'dependency' };
    const response = { status_code: 200, business_code: 200, bean: { id: 'event' } };
    const result = run(payload); resolve(response);
    assert.equal(await result, response); assert.equal(count, 1);
    assert.equal(recorded.options.method, method); assert.equal(recorded.url, `/console/teams/team/apps/component${suffix}`);
    const stale = run(payload); remove();
    remove = coordination.subscribeTopologyRefresh(coordination.topologyScope('team', 'region', 32), () => { count += 1; }, () => [{ service_alias: 'component' }]);
    resolve(response); assert.equal(await stale, response); assert.equal(count, 1);
    const failed = run(payload); const error = new Error('request rejected'); reject(error);
    await assert.rejects(failed, error); assert.equal(count, 1); remove();
  });
}

test('real DVA operation success boundaries refresh without changing callbacks', () => {
  const definition = parse('../../models/appControl.js').find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const effects = definition.properties.find(node => node.key.name === 'effects').value.properties;
  const names = ['putDeploy', 'putUpgrade', 'putReStart', 'putStart', 'putStop', 'putBatchStart', 'putBbatchStop', 'batchOperation'];
  const services = ['deploy', 'upgrade', 'restart', 'start', 'stop', 'batchStart', 'batchStop', 'batchOperation'];
  names.forEach(name => {
    let count = 0; let callbacks = 0;
    const remove = coordination.subscribeTopologyRefresh(coordination.topologyScope('team', 'region', 31), () => { count += 1; }, () => [{ service_alias: 'component', service_id: 'id' }]);
    const method = effects.find(node => node.key.name === name);
    const factory = new Function('captureTopologyOperation', 'captureAppOperation', 'buildAppControlProperties', 'trackOperationSucceeded', 'REQUEST_TELEMETRY_OPTIONS', 'trackOperationFailed', 'isRequestFailure', 'startServiceAttempt', 'createRequestTelemetryOptions', 'getDeployType', ...services,
      `return ({${generate(method).code}}).${name};`);
    const execute = factory(payload => coordination.captureTopologyOperation(payload, location), () => {}, () => ({}), () => {}, { returnErrorMetadata: true }, () => {}, response => !!(response && response.__rainbondRequestFailure), () => '123e4567-e89b-42d3-a456-426614174000', attemptId => ({ returnErrorMetadata: true, attemptId }), () => 'other', ...services.map(() => () => {}));
    const iterator = execute({ payload: { team_name: 'team', app_alias: 'component', serviceIds: ['id'] }, callback: () => { callbacks += 1; } }, { call: (...args) => args });
    iterator.next(); iterator.next({ status_code: 200, business_code: 200 });
    assert.equal(count, 1, name); assert.equal(callbacks, 1, name); remove();
  });
});

test('real topology lifecycle replaces scope callbacks, resets iframe graph and removes only its own callbacks', () => {
  const source = parse('index.js');
  const declaration = source.find(node => node.type === 'ClassDeclaration');
  const selected = ['componentWillMount', 'componentDidMount', 'componentDidUpdate', 'componentWillUnmount', 'installFrameCallbacks', 'bindTopologyRefresh', 'refreshFrame', 'triggerTopologyRefresh'];
  const methods = declaration.body.body.filter(node => selected.includes(node.key.name)).map(node => generate(node).code).join('\n');
  const callbackNames = source.find(node => node.type === 'VariableDeclaration' && node.declarations[0].id.name === 'frameCallbackNames');
  const window = { location }; const posts = [], navigation = [];
  const globalUtil = { getCurrTeamName: () => 'team', getCurrRegionName: () => 'region', getAppID: () => 31, getSlidePanelComponentID: () => 'component' };
  const Topology = new Function('window', 'globalUtil', 'apiconfig', 'topologyScope', 'subscribeTopologyRefresh', 'postTopologyRefresh', 'isVirtualMachineComponent', 'routerRedux',
    `${generate(callbackNames).code}; return class { ${methods} };`)(window, globalUtil, { baseUrl: '' }, coordination.topologyScope, coordination.subscribeTopologyRefresh,
    (frame, scope, type) => coordination.postTopologyRefresh(frame, scope, type, location.origin), isVirtualMachineComponent, { push: payload => ({ type: 'navigate', payload }) });
  const instance = new Topology(); instance.props = { group_id: 31, apps: [{ service_alias: 'component' }], dispatch: action => navigation.push(action.payload) };
  instance.state = { keyes: false }; instance.setState = update => Object.assign(instance.state, typeof update === 'function' ? update(instance.state) : update);
  instance.topologyFrame = { src: 'http://fixture/static/www/weavescope-topolog/index.html', contentWindow: { postMessage: (...args) => posts.push(args) } };
  instance.componentWillMount(); instance.componentDidMount();
  assert.match(window.iframeGetNodeUrl(), /group_id=31$/);
  instance.props.apps = [{ service_alias: 'vm-draft', status: 'creating', extend_method: 'vm' },
    { service_alias: 'container-draft', status: 'creating', extend_method: 'stateless_multiple', service_source: 'docker_run' }];
  window.clickNode('vm-node', 'vm-draft');
  assert.match(navigation.at(-1), /apps\/31\/overview\?type=components&componentID=vm-draft&tab=overview$/);
  window.clickNode('container-node', 'container-draft');
  assert.match(navigation.at(-1), /create\/create-check\/container-draft$/);
  const oldCompletion = coordination.captureTopologyOperation({ team_name: 'team', app_alias: 'component' }, location);
  instance.props = { ...instance.props, group_id: 32 }; instance.componentDidUpdate();
  assert.match(window.iframeGetNodeUrl(), /group_id=32$/); assert.equal(instance.state.keyes, true);
  oldCompletion({ status_code: 200, business_code: 200 }); assert.equal(posts.length, 0);
  instance.refreshFrame(); assert.equal(posts.length, 1); assert.equal(posts[0][0].scope, coordination.topologyScope('team', 'region', 32));
  const replacementCallback = () => 'new owner'; window.clickNode = replacementCallback;
  instance.componentWillUnmount(); assert.equal(window.iframeGetNodeUrl, undefined);
  assert.equal(window.clickNode, replacementCallback); assert.equal(posts.at(-1)[0].type, 'rainbond:topology-stop');
});

for (const caller of ['../../pages/Group/ComponentList.js', '../../pages/Group/ComponentListModal.js']) {
  test(`real ${path.basename(caller)} caller → DVA → subscription accepts comma-separated IDs`, () => {
    const definition = parse('../../models/appControl.js').find(node => node.type === 'ExportDefaultDeclaration').declaration;
    const effect = definition.properties.find(node => node.key.name === 'effects').value.properties.find(node => node.key.name === 'batchOperation');
    const execute = new Function('captureTopologyOperation', 'captureAppOperation', 'buildAppControlProperties', 'trackOperationSucceeded', 'REQUEST_TELEMETRY_OPTIONS', 'trackOperationFailed', 'isRequestFailure', 'batchOperation',
      `return ({${generate(effect).code}}).batchOperation;`)(payload => coordination.captureTopologyOperation(payload, location), () => {}, () => ({}), () => {}, { returnErrorMetadata: true }, () => {}, response => !!(response && response.__rainbondRequestFailure), () => {});
    const callerNodes = parse(caller);
    const callerClass = callerNodes.find(node => node.type === 'ClassDeclaration') ||
      callerNodes.find(node => node.type === 'ExportDefaultDeclaration').declaration;
    const callerMethod = callerClass.body.body.find(node => node.key.name === 'handleBatchOperation');
    const Caller = new Function('globalUtil', 'formatMessage', 'notification', `return class { ${generate(callerMethod).code} };`)(
      { getCurrTeamName: () => 'team' }, () => 'message', { success() {} });
    for (const ids of [['id'], ['unrelated', 'id']]) {
      let count = 0; let action; let iterator;
      const remove = coordination.subscribeTopologyRefresh(coordination.topologyScope('team', 'region', 31), () => { count += 1; }, () => [{ service_id: 'id' }]);
      const instance = new Caller(); instance.getSelectedKeys = () => ids; instance.handleOperationState = () => {};
      instance.props = { dispatch: value => { action = value; iterator = execute(value, { call: (...args) => args }); iterator.next(); } };
      instance.handleBatchOperation('stop');
      assert.equal(action.type, 'appControl/batchOperation'); assert.equal(action.payload.serviceIds, ids.join(','));
      iterator.next({ status_code: 200, business_code: 200 }); assert.equal(count, 1); remove();
    }
  });
}

test('real DVA start and batch effects report then rethrow page handler errors', () => {
  const definition = parse('../../models/appControl.js').find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const effects = definition.properties.find(node => node.key.name === 'effects').value.properties;
  for (const [name, operation] of [['putStart', 'start'], ['batchOperation', 'stop']]) {
    const tracked = [];
    const effect = effects.find(node => node.key.name === name);
    const execute = new Function('captureTopologyOperation', 'captureAppOperation', 'buildAppControlProperties', 'trackOperationSucceeded', 'REQUEST_TELEMETRY_OPTIONS', 'trackOperationFailed', 'isRequestFailure', 'start', 'batchOperation',
      `return ({${generate(effect).code}}).${name};`)(() => () => {}, () => {}, () => ({}), () => {}, { returnErrorMetadata: true }, (action, payload, error) => tracked.push({ action, payload, error }), () => false, () => {}, () => {});
    const payload = { team_name: 'team', app_alias: 'component', action: operation };
    const iterator = execute({ payload, handleError: () => { throw new Error('page handler error'); } }, { call: () => {} });
    iterator.next();
    const error = new Error(`${name} request rejected`);
    assert.throws(() => iterator.throw(error), value => value === error);
    assert.deepEqual(tracked, [{ action: operation, payload, error }]);
  }
});

test('real DVA start and batch effects do not report failed after a successful callback throws', () => {
  const definition = parse('../../models/appControl.js').find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const effects = definition.properties.find(node => node.key.name === 'effects').value.properties;
  for (const [name, operation] of [['putStart', 'start'], ['batchOperation', 'stop']]) {
    const tracked = [];
    const effect = effects.find(node => node.key.name === name);
    const execute = new Function('captureTopologyOperation', 'captureAppOperation', 'buildAppControlProperties', 'trackOperationSucceeded', 'REQUEST_TELEMETRY_OPTIONS', 'trackOperationFailed', 'isRequestFailure', 'start', 'batchOperation',
      `return ({${generate(effect).code}}).${name};`)(() => () => {}, () => {}, () => ({}), action => tracked.push({ status: 'succeeded', action }), { returnErrorMetadata: true }, action => tracked.push({ status: 'failed', action }), () => false, () => {}, () => {});
    const callbackError = new Error(`${name} callback error`);
    const iterator = execute({ payload: { team_name: 'team', app_alias: 'component', action: operation }, callback: () => { throw callbackError; } }, { call: () => {} });
    iterator.next();
    assert.throws(() => iterator.next({ status_code: 200, business_code: 200 }), value => value === callbackError);
    assert.deepEqual(tracked, [{ status: 'succeeded', action: operation }]);
  }
});

test('trackOperationFailed uses request telemetry from a page handler error', () => {
  const trackerNode = parse('../../models/appControl.js').find(node => node.type === 'FunctionDeclaration' && node.id.name === 'trackOperationFailed');
  const events = [];
  const trackOperationFailed = new Function('captureAppOperation', 'buildAppControlProperties', `${generate(trackerNode).code}; return trackOperationFailed;`)(
    (...args) => events.push(args),
    (payload, overrides) => ({ ...payload, ...overrides })
  );
  const error = new Error('page handler error');
  error.requestTelemetry = { error_category: 'business_failure', error_code: 'business_10499', http_status: 422 };
  trackOperationFailed('start', { team_name: 'team' }, error);
  assert.deepEqual(events, [['start', 'failed', {
    team_name: 'team', action_type: 'start', error_category: 'business_failure', error_code: 'business_10499', http_status: 422
  }]]);
});
