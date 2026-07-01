const assert = require('assert');

const {
  DENYLISTED_PROPERTIES,
  getPostHogConfig,
  sanitizeObject,
  sanitizePostHogEvent,
  buildHashedId,
  buildPostHogDistinctId,
  buildPostHogUserProperties,
  buildPostHogGroupProperties,
  classifyPostHogInteraction,
  inferPostHogCreateStep
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
      debug: false,
      instanceId: '',
      instanceProperties: {}
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
      debug: false,
      instanceId: '',
      instanceProperties: {}
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

test('posthog denylist keeps sdk token property for ingestion', function() {
  assert.strictEqual(DENYLISTED_PROPERTIES.includes('token'), false);
});

test('sanitizePostHogEvent preserves PostHog token while filtering event properties', function() {
  assert.deepStrictEqual(
    sanitizePostHogEvent({
      event: 'demo',
      properties: {
        token: 'public-project-token',
        route: '/console',
        nested: { token: 'user-token' }
      },
      $set: { email: 'user@example.com' }
    }),
    {
      event: 'demo',
      properties: {
        token: 'public-project-token',
        route: '/console',
        nested: { token: '[Filtered]' }
      },
      $set: { email: '[Filtered]' }
    }
  );
});

test('buildPostHogUserProperties keeps identifiers hashed and minimal', function() {
  const properties = buildPostHogUserProperties(
    {
      user_id: 1,
      email: 'user@example.com',
      nick_name: 'alice',
      enterprise_id: 'eid',
      is_enterprise_admin: true,
      teams: [{ team_name: 'team-a' }]
    },
    {
      instance_id: 'instance-a',
      rainbond_version: 'v6.0.0'
    }
  );

  assert.strictEqual(properties.enterprise_id_hash, buildHashedId('eid'));
  assert.strictEqual(properties.enterprise_id, undefined);
  assert.strictEqual(properties.is_enterprise_admin, true);
  assert.strictEqual(properties.team_count, 1);
  assert.strictEqual(properties.instance_id, 'instance-a');
  assert.strictEqual(properties.rainbond_version, 'v6.0.0');
});

test('buildPostHogGroupProperties builds enterprise group id without raw identifiers', function() {
  const group = buildPostHogGroupProperties(
    {
      enterprise_id: 'enterprise-raw',
      is_enterprise_admin: false,
      teams: [{}, {}]
    },
    {
      instance_id: 'instance-a'
    }
  );

  assert.strictEqual(group.enterpriseIdHash, buildHashedId('enterprise-raw', 'enterprise'));
  assert.strictEqual(group.enterpriseIdHash.indexOf('enterprise-raw'), -1);
  assert.deepStrictEqual(group.enterpriseProperties, {
    instance_id: 'instance-a',
    is_enterprise_admin: false,
    team_count: 2
  });
});

test('posthog config reads runtime instance metadata', function() {
  const originalWindow = global.window;
  global.window = {
    RAINBOND_POSTHOG: {
      enabled: true,
      instanceId: 'instance-a',
      instanceProperties: {
        instance_id: 'instance-a',
        rainbond_version: 'v6.0.0'
      }
    }
  };

  try {
    const config = getPostHogConfig();
    assert.strictEqual(config.instanceId, 'instance-a');
    assert.deepStrictEqual(config.instanceProperties, {
      instance_id: 'instance-a',
      rainbond_version: 'v6.0.0'
    });
  } finally {
    global.window = originalWindow;
  }
});

test('posthog distinct id is scoped by instance', function() {
  assert.notStrictEqual(buildPostHogDistinctId({ user_id: 1 }, 'instance-a'), buildPostHogDistinctId({ user_id: 1 }, 'instance-b'));
  assert.strictEqual(buildPostHogDistinctId({ user_id: 1 }, 'instance-a'), buildPostHogDistinctId({ user_id: '1' }, 'instance-a'));
});

test('inferPostHogCreateStep maps create routes to stable steps', function() {
  assert.strictEqual(inferPostHogCreateStep('/team/a/region/b/create/code'), 'source_code');
  assert.strictEqual(inferPostHogCreateStep('/team/a/region/b/create/market/:id'), 'market');
  assert.strictEqual(inferPostHogCreateStep('/team/a/region/b/create/create-configPort/app'), 'port_config');
  assert.strictEqual(inferPostHogCreateStep('/team/a/region/b/create-plugin'), 'plugin_create');
  assert.strictEqual(inferPostHogCreateStep('/team/a/region/b/apps/app/overview'), '');
});

test('classifyPostHogInteraction detects blocking recovery actions', function() {
  assert.deepStrictEqual(classifyPostHogInteraction({ element_text: '刷新重试' }), {
    event_name: 'retry_clicked',
    interaction_type: 'retry'
  });
  assert.deepStrictEqual(classifyPostHogInteraction({ element_href: '/docs/install', element_text: '查看文档' }), {
    event_name: 'support_opened',
    interaction_type: 'support'
  });
  assert.deepStrictEqual(classifyPostHogInteraction({ element_text: '复制修复命令' }), {
    event_name: 'fix_suggestion_copied',
    interaction_type: 'fix_copy'
  });
  assert.strictEqual(classifyPostHogInteraction({ element_text: '确认' }), null);
});
