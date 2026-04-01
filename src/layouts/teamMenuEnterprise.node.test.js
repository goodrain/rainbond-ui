const assert = require('assert');
const { buildTeamMenuEnterpriseSettings } = require('./teamMenuEnterprise');

assert.deepStrictEqual(
  buildTeamMenuEnterpriseSettings(null, null),
  {},
  'team menu enterprise settings should default to an empty object'
);

assert.strictEqual(
  buildTeamMenuEnterpriseSettings(null, {
    enterprise_id: 'eid-demo',
    enable_team_resource_view: true,
  }).enable_team_resource_view,
  true,
  'team menu enterprise settings should fall back to the current enterprise when global enterprise info is unavailable'
);

assert.strictEqual(
  buildTeamMenuEnterpriseSettings(
    { enterprise_id: 'eid-demo', enable_team_resource_view: false },
    { enterprise_id: 'eid-demo', enable_team_resource_view: true }
  ).enable_team_resource_view,
  false,
  'team menu enterprise settings should prefer the latest global enterprise info when both sources are present'
);

console.log('team menu enterprise helper tests passed');
