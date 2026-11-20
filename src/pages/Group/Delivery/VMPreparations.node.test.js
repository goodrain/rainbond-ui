const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const parser = require('@babel/parser');

function harness() {
  const source = fs.readFileSync(`${__dirname}/VMPreparations.js`, 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties'] });
  const declaration = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const methods = declaration.body.body.filter(node => ['active', 'refresh', 'operate', 'logs', 'componentWillUnmount'].includes(node.key && node.key.name));
  const requests = [], timers = [], ready = [];
  const Target = vm.runInNewContext(`class Target { ${methods.map(node => source.slice(node.start, node.end)).join('\n')} }; Target`, {
    running: task => ['queued', 'running'].includes(task.status), setTimeout: callback => { timers.push(callback);return timers.length; }, clearTimeout: () => {}
  });
  const target = new Target();
  target.alive = true;target.generation = 0;target.completed = new Set();
  target.state = { tasks: [], busy: '', failed: false };
  target.props = { scope: { teamName: 'team', regionName: 'region', appID: '1' }, dispatch: request => requests.push(request), onReady: () => ready.push(true) };
  target.setState = (values, callback) => { Object.assign(target.state, values);if (callback) callback(); };
  return { target, requests, timers, ready };
}

test('accepted capture remains preparing until a completed version is observed', () => {
  const { target, requests, timers, ready } = harness();
  target.refresh();
  requests[0].callback({ items: [{ id: 'capture', status: 'running', version: '1.0.0', components: [] }] });
  assert.equal(target.state.tasks.length, 1);assert.equal(ready.length, 0);assert.equal(timers.length, 1);
  timers[0]();
  requests[1].callback({ items: [{ id: 'capture', status: 'succeeded', version_id: 'version' }] });
  assert.equal(target.state.tasks.length, 0);assert.equal(ready.length, 1);
  target.refresh();requests[2].callback({ items: [{ id: 'capture', status: 'succeeded', version_id: 'version' }] });
  assert.equal(ready.length, 1);
});

test('late responses after leaving the application cannot show a captured version', () => {
  const { target, requests, ready } = harness();
  target.refresh();target.componentWillUnmount();
  requests[0].callback({ items: [{ id: 'capture', status: 'succeeded' }] });
  assert.equal(ready.length, 0);assert.equal(target.state.tasks.length, 0);
});

test('an older poll cannot replace the state returned after retrying', () => {
  const { target, requests } = harness();
  target.refresh();target.refresh();
  requests[1].callback({ items: [{ id: 'capture', status: 'running' }] });
  requests[0].callback({ items: [{ id: 'capture', status: 'failed' }] });
  assert.equal(target.state.tasks[0].status, 'running');
});

test('uncertain retry requests keep controls blocked and report status loading failure', () => {
  const { target, requests } = harness();
  target.operate('retry', { id: 'capture' });target.operate('retry', { id: 'capture' });
  assert.equal(requests.length, 1);assert.equal(target.state.busy, 'capture');
  requests[0].onError();assert.equal(target.state.busy, '');assert.equal(target.state.failed, true);
});

test('closing a log viewer prevents a late response from reopening it', () => {
  const { target, requests } = harness();
  target.logs({ id: 'capture' }, { service_id: 'vm', name: 'VM' });
  target.logTicket += 1;target.state.log = null;
  requests[0].callback({ lines: ['done'] });
  assert.equal(target.state.log, null);
});
