const assert = require('assert');

const {
  getPostHogConfig,
  sanitizeObject,
  sanitizePostHogEvent,
  buildPostHogUserProperties
} = require('./posthogConfig');

const DEFAULT_POSTHOG_PROJECT_TOKEN = 'phc_oCoPwcxutKCU9AZtUT63dMTNhWezUxCXCLtSZE6a4wvE';
const DEFAULT_POSTHOG_API_HOST = '/console/posthog';
const DEFAULT_POSTHOG_UI_HOST = 'https://posthog.goodrain.com';

function test(name, fn) {
  try {
    fn();
    console.log('ok - ' + name);
  } catch (error) {
    console.error('not ok - ' + name);
    throw error;
  }
}

test('posthog config defaults to enabled without an env project token', function() {
  const original = process.env;
  process.env = {};

  try {
    assert.deepStrictEqual(getPostHogConfig(), {
      enabled: true,
      projectToken: DEFAULT_POSTHOG_PROJECT_TOKEN,
      apiHost: DEFAULT_POSTHOG_API_HOST,
      uiHost: DEFAULT_POSTHOG_UI_HOST,
      defaults: '2026-05-30',
      personProfiles: 'identified_only',
      autocapture: true,
      sessionRecording: false,
      maskAllText: false,
      maskAllElementAttributes: true,
      capturePageleave: false,
      disableFlags: true,
      debug: false
    });
  } finally {
    process.env = original;
  }
});

test('posthog config ignores env project token and keeps built-in token', function() {
  const original = process.env;
  process.env = {
    RAINBOND_POSTHOG_PROJECT_TOKEN: 'project-token'
  };

  try {
    assert.deepStrictEqual(getPostHogConfig(), {
      enabled: true,
      projectToken: DEFAULT_POSTHOG_PROJECT_TOKEN,
      apiHost: DEFAULT_POSTHOG_API_HOST,
      uiHost: DEFAULT_POSTHOG_UI_HOST,
      defaults: '2026-05-30',
      personProfiles: 'identified_only',
      autocapture: true,
      sessionRecording: false,
      maskAllText: false,
      maskAllElementAttributes: true,
      capturePageleave: false,
      disableFlags: true,
      debug: false
    });
  } finally {
    process.env = original;
  }
});

test('posthog config can be disabled globally or by scoped switch', function() {
  const original = process.env;
  process.env = {
    RAINBOND_TELEMETRY_DISABLED: 'true',
    RAINBOND_POSTHOG_PROJECT_TOKEN: 'project-token'
  };

  try {
    assert.strictEqual(getPostHogConfig().enabled, false);
    process.env = {
      RAINBOND_POSTHOG_DISABLED: 'true',
      RAINBOND_POSTHOG_PROJECT_TOKEN: 'project-token'
    };
    assert.strictEqual(getPostHogConfig().enabled, false);
  } finally {
    process.env = original;
  }
});

test('sanitizeObject filters sensitive fields recursively', function() {
  assert.deepStrictEqual(
    sanitizeObject({
      token: 'abc',
      nested: {
        email: 'user@example.com',
        keep: 'value',
        message: 'authorization=Bearer abc123'
      }
    }),
    {
      token: '[Filtered]',
      nested: {
        email: '[Filtered]',
        keep: 'value',
        message: 'authorization=[Filtered]'
      }
    }
  );
});

test('sanitizePostHogEvent filters event properties', function() {
  assert.deepStrictEqual(
    sanitizePostHogEvent({
      event: 'demo',
      properties: { token: 'abc', route: '/console' },
      $set: { email: 'user@example.com' }
    }),
    {
      event: 'demo',
      properties: { token: '[Filtered]', route: '/console' },
      $set: { email: '[Filtered]' }
    }
  );
});

test('buildPostHogUserProperties keeps identifiers minimal', function() {
  assert.deepStrictEqual(
    buildPostHogUserProperties({
      user_id: 1,
      email: 'user@example.com',
      nick_name: 'alice',
      enterprise_id: 'eid',
      is_enterprise_admin: true,
      teams: [{ team_name: 'team-a' }]
    }),
    {
      enterprise_id: 'eid',
      is_enterprise_admin: true,
      team_count: 1
    }
  );
});
