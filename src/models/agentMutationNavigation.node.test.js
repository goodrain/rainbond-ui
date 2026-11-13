const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const finalizer = require('./agentComponentMutationFinalizer');

// Exercise the real event effect with a small store, keeping chat rendering
// outside this navigation test.
function harness(toolName) {
  const source = fs.readFileSync(`${__dirname}/agent.js`, 'utf8');
  let state = {
    runEpoch: 0,
    context: { teamName: 'demo', regionName: 'test', appId: '8' },
    pendingMutationTool: toolName,
    ...finalizer.createClearedComponentMutationTrackingState(),
  };
  const navigations = [];
  const context = {
    Date, Math, ...finalizer,
    adaptAgentEvent: require('../services/agentEventAdapter').adaptAgentEvent,
    captureAgentRetentionEvent() {},
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(`${__dirname}/../utils/agentMutationRouteMap.js`, 'utf8')
    .replace(/\bexport function /g, 'function '), context);
  const helpersStart = source.indexOf('function buildMutationNavigationPayload(');
  vm.runInContext(source.slice(helpersStart, source.indexOf('function findApprovalMessageIndex(', helpersStart)), context);
  vm.runInContext(`effects = ({${source.slice(source.indexOf('*applyStreamEvent('), source.indexOf('*clearSession('))}})`, context);

  function send(event) {
    const iterator = context.effects.applyStreamEvent({ payload: { event } }, {
      put: action => ({ action }),
      select: select => ({ select }),
    });
    let value;
    for (;;) {
      const next = iterator.next(value);
      if (next.done) return;
      if (next.value.select) value = next.value.select({ agent: state });
      else {
        const action = next.value.action;
        if (action.type === 'saveState') {
          state = { ...state, ...action.payload };
          if (action.payload.pendingMutationNavigationKey) navigations.push(action.payload.pendingMutationRoute);
        }
        value = undefined;
      }
    }
  }
  return { send, navigations, getState: () => state };
}

for (const toolName of ['rainbond_manage_component_envs', 'rainbond_manage_component_ports',
  'rainbond_manage_component_storage', 'rainbond_horizontal_scale_component']) {
  test(`${toolName} opens only the final component home once`, () => {
    const h = harness(toolName);
    h.send({ type: 'chat.trace', sequence: 1, data: { tool_name: toolName,
      output: { structuredContent: { result_ref: {
        kind: 'service', team_name: 'demo', region_name: 'test', app_id: '9', service_alias: 'target',
      } } },
    } });
    assert.equal(h.navigations.length, 0, 'tool output must not switch pages');
    h.send({ type: 'run.status', data: { status: 'done' } });
    assert.equal(h.navigations.length, 1);
    const [pathname, query] = h.navigations[0].split('?');
    assert.equal(pathname, '/team/demo/region/test/apps/9/overview');
    assert.equal(new URLSearchParams(query).get('componentID'), 'target');
    assert.equal(new URLSearchParams(query).get('tab'), 'overview');
    h.send({ type: 'run.status', data: { status: 'done' } });
    assert.equal(h.navigations.length, 1, 'replayed completion must not navigate again');
    assert.equal(h.getState().lastComponentMutationTool, '');
  });
}

for (const status of ['error', 'cancelled']) {
  test(`${status} clears the target without navigating`, () => {
    const toolName = 'rainbond_manage_component_storage';
    const h = harness(toolName);
    h.send({ type: 'chat.trace', sequence: 1, data: { tool_name: toolName,
      output: { structuredContent: { result_ref: {
        kind: 'service', team_name: 'demo', region_name: 'test', app_id: '8', service_alias: 'api',
      } } },
    } });
    h.send({ type: 'run.status', data: { status } });
    h.send({ type: 'run.status', data: { status: 'done' } });
    assert.equal(h.navigations.length, 0);
    assert.equal(h.getState().lastComponentMutationTool, '');
  });
}
