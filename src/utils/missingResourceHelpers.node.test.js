const assert = require('assert');
const test = require('node:test');
const {
  getFallbackRoute,
  isMissingResourceError,
} = require('./missingResourceHelpers');

test('missing resource helper recognizes status and business messages', () => {
  assert.strictEqual(isMissingResourceError({ response: { status: 404, data: {} } }), true);
  assert.strictEqual(isMissingResourceError({ data: { code: 400, msg_show: '应用不存在' } }), true);
  assert.strictEqual(isMissingResourceError({ data: { code: 500, msg_show: 'region unavailable' } }), false);
});

test('fallback route ignores the stale current route and selects an available team', () => {
  assert.strictEqual(getFallbackRoute({
    teams: [{ team_name: 'default', region: [{ team_region_name: 'rainbond' }] }],
  }), '/team/default/region/rainbond/index');
  assert.strictEqual(getFallbackRoute({
    teams: [
      { team_name: 'deleted', region: [{ team_region_name: 'rainbond' }] },
      { team_name: 'default', region: [{ team_region_name: 'rainbond' }] },
    ],
  }, 'deleted'), '/team/default/region/rainbond/index');
  assert.strictEqual(getFallbackRoute({
    teams: [],
    is_enterprise_admin: true,
    enterprise_id: 'eid',
  }), '/enterprise/eid/index');
});
