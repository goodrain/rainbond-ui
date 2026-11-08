const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const { workspaceLanding, workspaceRows, quotaFromFields, quotaToFields, identity } = require('./teamApplications');

test('quota uses cores/GB in forms and preserves millicores/MiB in API payloads', () => {
  const quota = { cpu_millicores: 1500, memory_mib: 1536, storage_gib: 20 };
  assert.deepEqual(quotaToFields(quota), { cpu_cores: 1.5, memory_gb: 1.5, storage_gb: 20 });
  assert.deepEqual(quotaFromFields(quotaToFields(quota)), quota);
  assert.throws(() => quotaFromFields({ cpu_cores: 0, memory_gb: 1, storage_gb: 10 }), /invalidQuota/);
});
test('no-team landing and approved records depend on actual team membership', () => {
  const user = { enterprise_id: 'enterprise', user_id: 1, teams: [] };
  assert.equal(workspaceLanding(user), '/account/center/teams');
  const application = { id: 'application', status: 'approved', team_id: 'team-1' };
  assert.equal(workspaceRows([], [application])[0].status, 'approved');
  const team = { team_id: 'team-1', team_name: 'team', region: [{ team_region_name: 'region' }] };
  assert.equal(workspaceRows([team], [application]).length, 1);
  assert.equal(workspaceRows([team], [application])[0].status, 'joined');
});
test('service loads real paginated applications and submits review requests without local storage', async () => {
  const calls = [];
  const source = fs.readFileSync(`${__dirname}/../services/teamApplications.js`, 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  const context = { require, apiconfig: { baseUrl: '' }, request: async (url, options) => {
    calls.push({ url, options });
    return { bean: { list: options.params && options.params.page === 1 ? Array.from({ length: 100 }, (_, id) => ({ id })) : [{ id: 100 }], total: 101 } };
  } };
  vm.runInNewContext(source, context);
  const user = { enterprise_id: 'enterprise', user_id: 1 };
  assert.equal((await context.listTeamApplications({ user })).bean.list.length, 101);
  await context.submitTeamApplication({ user, values: { team_name: 'Team' } });
  assert.equal(calls[2].options.data.previous_id, null);
  await context.reviewTeamApplication({ user, id: 'request-id', decision: 'approved', comment: 'Ready' });
  assert.equal(calls[3].url, '/console/enterprises/enterprise/team-applications/request-id/review');
  assert.equal(calls[3].options.data.decision, 'approved');
  assert.equal(calls[3].options.method, 'post');
  assert.equal(identity(user).enterprise, 'enterprise');
});
