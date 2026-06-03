const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveAgentPlatformPolicy,
} = require('./agentLauncherAction');

test('open source initial enterprise admin should continue with plugin and config checks', () => {
  assert.equal(
    resolveAgentPlatformPolicy({
      isEnterpriseAdmin: true,
      access: {
        edition: 'open_source',
        is_open_source: true,
        can_open_agent: true,
        is_initial_enterprise_admin: true,
      },
    }),
    'plugin_then_config'
  );
});

test('open source non-initial enterprise admin should see enterprise upgrade prompt', () => {
  assert.equal(
    resolveAgentPlatformPolicy({
      isEnterpriseAdmin: true,
      access: {
        edition: 'open_source',
        is_open_source: true,
        can_open_agent: false,
        is_initial_enterprise_admin: false,
      },
    }),
    'open_source_upgrade'
  );
});

test('open source normal user should see enterprise upgrade prompt', () => {
  assert.equal(
    resolveAgentPlatformPolicy({
      isEnterpriseAdmin: false,
      access: {
        edition: 'open_source',
        is_open_source: true,
        can_open_agent: false,
        is_initial_enterprise_admin: false,
      },
    }),
    'open_source_upgrade'
  );
});

test('enterprise admin should continue with plugin and config checks', () => {
  assert.equal(
    resolveAgentPlatformPolicy({
      isEnterpriseAdmin: true,
      access: {
        edition: 'enterprise',
        is_open_source: false,
        can_open_agent: true,
        is_initial_enterprise_admin: false,
      },
    }),
    'plugin_then_config'
  );
});

test('enterprise normal user should only check configuration', () => {
  assert.equal(
    resolveAgentPlatformPolicy({
      isEnterpriseAdmin: false,
      access: {
        edition: 'enterprise',
        is_open_source: false,
        can_open_agent: true,
        is_initial_enterprise_admin: false,
      },
    }),
    'config_only'
  );
});
