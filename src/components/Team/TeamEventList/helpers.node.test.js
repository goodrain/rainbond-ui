const assert = require('assert');
const test = require('node:test');
const {
  buildTeamEventTarget,
  getTeamEventServiceLabel,
} = require('./helpers');

test('team event target requires app and component identifiers', () => {
  assert.strictEqual(buildTeamEventTarget('team', 'region', {
    target: 'service',
    app_id: 42,
    service_alias: 'demo',
  }), '/team/team/region/region/apps/42/overview?type=components&componentID=demo&tab=overview');
  assert.strictEqual(buildTeamEventTarget('team', 'region', {
    target: 'service',
    app_id: '',
    service_alias: 'demo',
  }), null);
  assert.strictEqual(buildTeamEventTarget('team', 'region', {
    target: 'service',
    app_id: 42,
  }), null);
});

test('team event label falls back to preserved metadata', () => {
  assert.strictEqual(getTeamEventServiceLabel({ service_name: 'Demo' }), 'Demo');
  assert.strictEqual(getTeamEventServiceLabel({ service_alias: 'demo' }), 'demo');
  assert.strictEqual(getTeamEventServiceLabel({ message: 'Deleted component' }), 'Deleted component');
});
