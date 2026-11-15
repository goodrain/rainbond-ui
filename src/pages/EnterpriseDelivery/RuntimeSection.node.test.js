const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const parser = require('@babel/parser');

function section() {
  const source = fs.readFileSync(`${__dirname}/RuntimeSection.js`, 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx', 'decorators-legacy', 'classProperties'] });
  const declaration = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;
  const methods = declaration.body.body.filter(node => node.key && ['loadEvents', 'loadVisits', 'componentDidUpdate', 'isDeleted'].includes(node.key.name));
  const Target = vm.runInNewContext(`class Target { ${methods.map(method => source.slice(method.start, method.end)).join('\n')} }; Target`);
  const target = new Target(), requests = [];
  target.alive = true;target.generation = 0;target.visitTicket = 0;target.pending = new Set();target.state = { events: {}, accesses: [] };
  target.props = { environment: { scope: { teamName: 'team', regionName: 'region', appID: '1' } }, dispatch: request => requests.push(request) };
  target.setState = update => { Object.assign(target.state, typeof update === 'function' ? update(target.state) : update); };
  return { target, requests };
}
const web = { service_id: 'web', service_alias: 'web', name: 'Web' };
const event = (id, hour) => ({ id, created_at: `2026-11-10T${hour}:00:00Z`, comment_text: id });

test('event pages append once and latest-event refresh preserves older loaded history', () => {
  const { target, requests } = section();
  target.loadEvents(web);target.loadEvents(web);
  assert.equal(requests.length, 1);
  requests[0].callback({ items: [event('b', '02'), event('a', '01')], page: 1, total: 4, has_more: true });
  target.loadEvents(web, 2);
  requests[1].callback({ items: [event('a', '01'), event('old', '00')], page: 2, total: 4, has_more: false });
  assert.equal(target.state.events.web.items.length, 3);
  assert.equal(target.state.events.web.page, 2);
  assert.equal(target.state.events.web.has_more, false, 'the API last-page result ends loading even when a record was filtered or duplicated');
  target.loadEvents(web);
  requests[2].callback({ items: [event('new', '03'), event('b', '02')], page: 1, total: 4, has_more: true });
  assert.equal(target.state.events.web.items.map(row => row.id).join(','), 'new,b,a,old');
  assert.equal(target.state.events.web.page, 2);
  assert.equal(target.state.events.web.has_more, false);
});

test('responses and failures remain attached to their component, and retry keeps loaded events', () => {
  const { target, requests } = section();
  const api = { service_id: 'api', service_alias: 'api', name: 'API' };
  target.loadEvents(web);target.loadEvents(api);
  requests[1].callback({ items: [event('api', '02')], page: 1, has_more: false });
  requests[0].callback({ items: [event('web', '01')], page: 1, has_more: true });
  target.loadEvents(web, 2);requests[2].onError();
  assert.equal(target.state.events.api.items[0].id, 'api');
  assert.equal(target.state.events.web.items[0].id, 'web');
  assert.equal(target.state.events.web.failedPage, 2);
  target.loadEvents(web, target.state.events.web.failedPage);
  assert.equal(requests[3].payload.page, 2);
  requests[3].callback({ items: [], page: 2, has_more: false });
  assert.equal(target.state.events.web.failed, false);
  assert.equal(target.state.events.web.items.length, 1);
  assert.equal(target.state.events.web.has_more, false);
});

test('responses from a previous application or an unmounted section cannot populate current events', () => {
  const { target, requests } = section();
  target.loadEvents(web);
  target.generation += 1;target.state.events = {};target.pending.clear();
  requests[0].callback({ items: [event('old-app', '01')], page: 1, has_more: false });
  assert.equal(Object.keys(target.state.events).length, 0);
  target.loadEvents(web);target.alive = false;
  requests[1].callback({ items: [event('unmounted', '02')], page: 1, has_more: false });
  assert.equal(target.state.events.web.items, undefined);
});

test('status refresh leaves a failed older-page request available for retry', () => {
  const { target, requests } = section();
  target.selected = () => web;target.ensureEvents = () => {};
  target.state.events.web = { items: [event('loaded', '01')], page: 1, failed: true, failedPage: 2 };
  target.props.data = {};target.props.loading = false;
  target.componentDidUpdate({ ...target.props, data: {} }, target.state);
  assert.equal(requests.length, 0);
  assert.equal(target.state.events.web.failedPage, 2);
  assert.equal(target.state.events.web.items.length, 1);
});

test('stale visit responses cannot expose another application or replace newer access information', () => {
  const { target, requests } = section();
  target.props.data = { components: [web] };
  target.loadVisits();
  target.generation += 1;target.state.accesses = [];
  target.props.environment = { scope: { teamName: 'other-team', regionName: 'other-region', appID: '2' } };
  target.loadVisits();requests[1].callback({ list: ['current-application'] });
  requests[0].callback({ list: ['previous-application'] });
  assert.equal(target.state.accesses[0], 'current-application');
  target.loadVisits();target.loadVisits();
  requests[3].callback({ list: ['latest-access'] });requests[2].onError();
  assert.equal(target.state.accesses[0], 'latest-access');
  target.loadVisits();target.alive = false;requests[4].callback({ list: ['unmounted'] });
  assert.equal(target.state.accesses[0], 'latest-access');
});

test('deleted source applications stop event/access reads and discard in-flight responses', () => {
  const { target, requests } = section();
  target.loadEvents(web);
  const before = target.props;
  target.props = { ...target.props, deleted: true };
  target.componentDidUpdate(before, target.state);
  requests[0].callback({ items: [event('late', '02')], page: 1, has_more: false });
  target.loadEvents(web);target.loadVisits();
  assert.equal(requests.length, 1);
  assert.equal(Object.keys(target.state.events).length, 0);
  assert.equal(target.state.accesses.length, 0);
});
