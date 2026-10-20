const assert = require('assert/strict');
const test = require('node:test');
const { createTeamOverviewBootstrap, createTeamOverviewScope } = require('./teamOverviewBootstrap');

test('bootstrap shares pending and settled results, including synchronous reentrant consumers', async () => {
  let calls = 0;
  let resolve;
  let nested;
  const owner = createTeamOverviewBootstrap((payload, succeed) => {
    calls += 1;
    nested = owner.load('a', payload);
    resolve = succeed;
  }, () => true);
  const first = owner.load('a', {});
  assert.equal(first, nested);
  assert.equal(first, owner.load('a', {}));
  const response = { bean: {} };
  resolve(response);
  assert.equal(await first, response);
  assert.equal(await owner.load('a', {}), response);
  assert.equal(calls, 1);
  assert.equal(owner.isCurrentResponse(response), true);
});

test('force, invalidation and disposal reject stale work and settled-result continuations', async () => {
  const requests = [];
  let identity = 'a';
  const owner = createTeamOverviewBootstrap((payload, resolve, reject, valid) => {
    requests.push({ resolve, reject, valid });
  }, key => key === identity);
  const old = owner.load('a', {});
  const rejection = assert.rejects(old, { code: 'TEAM_OVERVIEW_STALE' });
  const next = owner.load('a', {}, { force: true });
  await rejection;
  assert.equal(requests[0].valid(), false);
  const response = { bean: {} };
  requests[1].resolve(response);
  await next;
  identity = 'b';
  assert.equal(owner.isCurrentResponse(response), false);
  await assert.rejects(owner.load('a', {}), { code: 'TEAM_OVERVIEW_STALE' });
  const pending = owner.load('b', {});
  const disposal = assert.rejects(pending, { code: 'TEAM_OVERVIEW_STALE' });
  owner.dispose();
  await disposal;
  await assert.rejects(owner.load('b', {}), { code: 'TEAM_OVERVIEW_STALE' });
});

test('failure is shared without automatic retries, explicit force recovers', async () => {
  let calls = 0;
  const owner = createTeamOverviewBootstrap((payload, resolve, reject) => {
    calls += 1;
    if (calls === 1) throw new Error('unavailable');
    resolve({ bean: {} });
  }, () => true);
  const failure = owner.load('a', {});
  await assert.rejects(failure, /unavailable/);
  assert.equal(owner.load('a', {}), failure);
  await assert.rejects(owner.load('a', {}), /unavailable/);
  await owner.load('a', {}, { force: true });
  assert.equal(calls, 2);
});

test('one consumer throwing cannot change the shared operation or another consumer', async () => {
  let resolve;
  const owner = createTeamOverviewBootstrap((payload, succeed) => { resolve = succeed; }, () => true);
  const first = owner.load('a', {});
  const broken = first.then(() => { throw new Error('consumer failed'); });
  const healthy = owner.load('a', {}).then(response => response.bean.value);
  resolve({ bean: { value: 42 } });
  await assert.rejects(broken, /consumer failed/);
  assert.equal(await healthy, 42);
  assert.equal((await first).bean.value, 42);
});

test('scope ignores equal props and first hydration, but detects real identity and permission changes immediately', () => {
  const scope = createTeamOverviewScope();
  const base = { teamName: 't', regionName: 'r', userId: '', enterpriseId: '', permissions: null };
  const first = scope(base);
  const known = { ...base, userId: 1, enterpriseId: 'e', permissions: { b: true, a: ['read', 'write'] } };
  assert.equal(scope(known), first);
  assert.equal(scope({ ...known, permissions: { a: ['write', 'read'], b: true } }), first);
  const changed = scope({ ...known, permissions: { a: ['read'], b: true } });
  assert.notEqual(changed, first);
  assert.notEqual(scope({ ...known, userId: 2 }), changed);
  const loggedOut = scope({ ...base });
  assert.notEqual(scope({ ...known }), loggedOut);
  assert.notEqual(scope({ ...known, teamName: 'other' }), first);
  assert.notEqual(scope({ ...known, regionName: 'other' }), first);
});

test('same-user admin/role changes invalidate while first metadata hydration does not', () => {
  const scope = createTeamOverviewScope();
  const base = { teamName: 't', regionName: 'r', userId: 1, enterpriseId: 'e' };
  const first = scope(base);
  const hydrated = { ...base, isEnterpriseAdmin: false, userRoles: ['viewer'] };
  assert.equal(scope(hydrated), first);
  const admin = scope({ ...hydrated, isEnterpriseAdmin: true });
  assert.notEqual(admin, first);
  assert.notEqual(scope({ ...hydrated, isEnterpriseAdmin: true, userRoles: ['admin'] }), admin);
});
