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

test('object role arrays and nested permission arrays have an order-independent scope', () => {
  const scope = createTeamOverviewScope();
  const base = { teamName: 't', regionName: 'r', userId: 1 };
  const first = scope(base);
  const userRoles = [
    { role_id: 2, role_name: 'developer', permissions: [{ name: 'write', enabled: true }, { name: 'read', enabled: true }] },
    { role_id: 1, role_name: 'viewer' }
  ];
  const permissions = { team: { sub_models: [
    { name: 'overview', actions: [{ name: 'read', enabled: true }, { name: 'edit', enabled: false }] },
    { name: 'member', actions: [{ name: 'read', enabled: true }] }
  ] } };
  const hydrated = { ...base, userRoles, permissions };
  assert.equal(scope(hydrated), first, 'first real metadata hydration must not restart initialization');
  assert.equal(scope({ ...base,
    userRoles: [userRoles[1], { permissions: [...userRoles[0].permissions].reverse(), role_name: 'developer', role_id: 2 }],
    permissions: { team: { sub_models: [permissions.team.sub_models[1], {
      actions: [...permissions.team.sub_models[0].actions].reverse(), name: 'overview'
    }] } }
  }), first, 'reordering objects, keys and nested permission sets must preserve the scope');
  const changedPermissions = JSON.parse(JSON.stringify(permissions));
  changedPermissions.team.sub_models[0].actions[1].enabled = true;
  const changed = scope({ ...hydrated, permissions: changedPermissions });
  assert.notEqual(changed, first, 'an actual nested permission change must invalidate the scope');
  const changedRoles = JSON.parse(JSON.stringify(userRoles));
  changedRoles[0].role_id = 3;
  assert.notEqual(scope({ ...hydrated, permissions: changedPermissions, userRoles: changedRoles }), changed);
});

test('canonicalizing mixed JSON permission values preserves types and never mutates frozen input', () => {
  const freeze = value => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };
  const permissions = freeze({ entries: [
    { key: 'b', nested: [[{ action: 'write' }, { action: 'read' }], [{ action: 'view' }]] },
    null, false, 2, '2', { key: 'a' }
  ] });
  const before = JSON.stringify(permissions);
  const scope = createTeamOverviewScope();
  const base = { teamName: 't', regionName: 'r', userId: 1, permissions };
  const first = scope(base);
  assert.equal(scope({ ...base, permissions: { entries: [...permissions.entries].reverse() } }), first);
  assert.equal(JSON.stringify(permissions), before);
  assert.notEqual(scope({ ...base, permissions: { entries: permissions.entries.filter(value => value !== 2) } }), first,
    'number and string permission values must remain distinct');
});

test('permission object keys cannot pollute prototypes or trigger object coercion during sorting', () => {
  const scope = createTeamOverviewScope();
  const permissions = JSON.parse('{"items":[{"__proto__":{"allowed":true},"toString":"data","valueOf":"data"},{"constructor":{"prototype":{"allowed":false}}}]}');
  const base = { teamName: 't', regionName: 'r', userId: 1, permissions };
  const first = scope(base);
  assert.equal(scope({ ...base, permissions: { items: [...permissions.items].reverse() } }), first);
  assert.equal(Object.prototype.allowed, undefined);
  const changed = JSON.parse(JSON.stringify(permissions));
  changed.items[0].__proto__.allowed = false;
  assert.notEqual(scope({ ...base, permissions: changed }), first);
});
