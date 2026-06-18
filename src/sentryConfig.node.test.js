const assert = require('assert');

const {
  buildIssueFingerprint,
  buildReadableErrorMessage,
  classifyHttpError,
  extractResponseMetadata,
  getPathPattern,
  getSentryConfig,
  buildSentryTunnelUrl,
  parseStackFrames,
  sanitizeObject,
  sanitizeStack,
  sanitizeUrl,
  shouldPreferFetchTransport,
  shouldReportRequestError,
  shouldSuppressRequestError
} = require('./sentryConfig');

function test(name, fn) {
  try {
    fn();
    console.log('ok - ' + name);
  } catch (error) {
    console.error('not ok - ' + name);
    throw error;
  }
}

test('sentry config stays disabled without a dsn', function() {
  const original = process.env;
  process.env = {};

  try {
    assert.strictEqual(getSentryConfig().enabled, false);
  } finally {
    process.env = original;
  }
});

test('sentry config reads environment values and clamps trace rate', function() {
  const original = process.env;
  process.env = {
    RAINBOND_ERROR_REPORTING_FRONTEND_DSN: 'https://example.invalid/1',
    RAINBOND_ERROR_REPORTING_ENVIRONMENT: 'production',
    RAINBOND_ERROR_REPORTING_RELEASE: 'v6.9.1-dev',
    SENTRY_TRACES_SAMPLE_RATE: '2'
  };

  try {
    assert.deepStrictEqual(getSentryConfig(), {
      enabled: true,
      dsn: 'https://example.invalid/1',
      environment: 'production',
      release: 'v6.9.1-dev',
      tunnel: '',
      tracesSampleRate: 1
    });
  } finally {
    process.env = original;
  }
});

test('sentry config reads tunnel override', function() {
  const original = process.env;
  process.env = {
    RAINBOND_ERROR_REPORTING_FRONTEND_DSN: 'https://example.invalid/1',
    RAINBOND_ERROR_REPORTING_FRONTEND_TUNNEL: '/console/sentry'
  };

  try {
    assert.strictEqual(getSentryConfig().tunnel, '/console/sentry');
  } finally {
    process.env = original;
  }
});

test('buildSentryTunnelUrl appends envelope path and query to same-origin tunnel', function() {
  assert.strictEqual(
    buildSentryTunnelUrl('/console/sentry', '/api/2/envelope/', '?sentry_version=7&sentry_key=public'),
    '/console/sentry/api/2/envelope/?sentry_version=7&sentry_key=public'
  );
});

test('buildSentryTunnelUrl supports absolute tunnel with a base path', function() {
  assert.strictEqual(
    buildSentryTunnelUrl('https://rainbond.example.com/console/sentry/', '/prefix/api/2/envelope/', '?sentry_key=public'),
    'https://rainbond.example.com/console/sentry/prefix/api/2/envelope/?sentry_key=public'
  );
});

test('buildSentryTunnelUrl supports central sentry ingest tunnel', function() {
  assert.strictEqual(
    buildSentryTunnelUrl('https://sentry.goodrain.com', '/api/2/envelope/', '?sentry_version=7&sentry_key=public'),
    'https://sentry.goodrain.com/api/2/envelope/?sentry_version=7&sentry_key=public'
  );
});

test('sentry config can be disabled by telemetry switch', function() {
  const original = process.env;
  process.env = {
    RAINBOND_TELEMETRY_DISABLED: 'true',
    RAINBOND_ERROR_REPORTING_FRONTEND_DSN: 'https://example.invalid/1'
  };

  try {
    assert.strictEqual(getSentryConfig().enabled, false);
  } finally {
    process.env = original;
  }
});

test('sanitizeObject filters sensitive fields recursively', function() {
  assert.deepStrictEqual(
    sanitizeObject({
      token: 'abc',
      nested: {
        password: 'pw',
        keep: 'value',
        message: 'authorization=Bearer abc123'
      }
    }),
    {
      token: '[Filtered]',
      nested: {
        password: '[Filtered]',
        keep: 'value',
        message: 'authorization=[Filtered]'
      }
    }
  );
});

test('sanitizeUrl removes query strings', function() {
  assert.strictEqual(sanitizeUrl('/console/apps?token=abc&page=1'), '/console/apps?[Filtered]');
  assert.strictEqual(sanitizeUrl('/console/apps'), '/console/apps');
});

test('getPathPattern removes ids from paths', function() {
  assert.strictEqual(
    getPathPattern('/console/teams/team-a/apps/123456/overview?token=abc'),
    '/console/teams/:id/apps/:id/overview?[Filtered]'
  );
  assert.strictEqual(
    getPathPattern('/console/apps/6f4bd4d4c97b4f249e3ce80148c77b16/events'),
    '/console/apps/:id/events'
  );
  assert.strictEqual(
    getPathPattern('https://example.com/console/teams/acme/apps/app-alias/overview#token=abc'),
    '/console/teams/:id/apps/:id/overview?[Filtered]'
  );
  assert.strictEqual(
    getPathPattern('https://example.com/console/#/team/team-a/region/bj/apps/app-1/overview?token=abc'),
    '/team/:id/region/:id/apps/:id/overview?[Filtered]'
  );
});

test('sanitizeStack removes absolute tenant urls and credentials', function() {
  assert.strictEqual(
    sanitizeStack('at https://example.com/console/teams/acme/apps/app-alias/overview?token=abc\nError: password=abc'),
    'at /console/teams/:id/apps/:id/overview?[Filtered]\nError: password=[Filtered]'
  );
});

test('parseStackFrames returns structured sanitized browser frames', function() {
  const frames = parseStackFrames(
    'Error: boom\n' +
    '    at renderApp (https://example.com/console/teams/team-a/apps/app-1/overview?token=abc:10:20)\n' +
    '    at https://example.com/umi.123.js:1:2'
  );

  assert.strictEqual(frames.length, 2);
  assert.deepStrictEqual(frames[1], {
    filename: '/console/teams/:id/apps/:id/overview?[Filtered]',
    function: 'renderApp',
    lineno: 10,
    colno: 20,
    in_app: true
  });
});

test('buildReadableErrorMessage summarizes api failures for issue lists', function() {
  assert.strictEqual(
    buildReadableErrorMessage(new Error('Request failed'), {
      errorSource: 'api',
      status: 500,
      method: 'post',
      route: '/console/teams/:id/apps/:id/overview'
    }),
    'API 500 POST /console/teams/:id/apps/:id/overview'
  );
});

test('buildIssueFingerprint groups api errors by error class and business code', function() {
  // All 502 errors group together regardless of endpoint
  assert.deepStrictEqual(
    buildIssueFingerprint(new Error('Request failed'), {
      errorSource: 'api',
      status: 502,
      method: 'get',
      route: '/console/teams/:id/apps/:id/events'
    }, []),
    ['rainbond-ui-api', 'gateway', 'no-code']
  );

  // 500 errors group together
  assert.deepStrictEqual(
    buildIssueFingerprint(new Error('Request failed'), {
      errorSource: 'api',
      status: 500,
      method: 'post',
      route: '/console/teams/:id/apps/:id/overview'
    }, []),
    ['rainbond-ui-api', 'backend', 'no-code']
  );

  // Network errors group together
  assert.deepStrictEqual(
    buildIssueFingerprint(new Error('Request failed'), {
      errorSource: 'api',
      status: 'network',
      method: 'get',
      route: '/console/teams/:id/apps/:id/configs'
    }, []),
    ['rainbond-ui-api', 'network', 'no-code']
  );

  // Errors with same business code group together
  assert.deepStrictEqual(
    buildIssueFingerprint(new Error('Request failed'), {
      errorSource: 'api',
      status: 500,
      method: 'get',
      route: '/console/teams/:id/apps/:id/overview',
      businessCode: '10411'
    }, []),
    ['rainbond-ui-api', 'backend', '10411']
  );
});

test('shouldReportRequestError reports network errors and server errors only', function() {
  assert.strictEqual(shouldReportRequestError(new Error('network')), true);
  assert.strictEqual(shouldReportRequestError({ response: { status: 500 } }), true);
  assert.strictEqual(shouldReportRequestError({ response: { status: 404 } }), false);
});

test('shouldPreferFetchTransport sends api errors through visible fetch requests', function() {
  assert.strictEqual(shouldPreferFetchTransport({ tags: { error_source: 'api' } }), true);
  assert.strictEqual(shouldPreferFetchTransport({ errorSource: 'api' }), true);
  assert.strictEqual(shouldPreferFetchTransport({ tags: { error_source: 'window_error' } }), false);
});

test('classifyHttpError returns correct error class', function() {
  // Network errors (no response)
  assert.strictEqual(classifyHttpError(null), 'network');
  assert.strictEqual(classifyHttpError({}), 'network');
  assert.strictEqual(classifyHttpError({ response: null }), 'network');

  // Specific 5xx classes
  assert.strictEqual(classifyHttpError({ response: { status: 502 } }), 'gateway');
  assert.strictEqual(classifyHttpError({ response: { status: 503 } }), 'overloaded');
  assert.strictEqual(classifyHttpError({ response: { status: 504 } }), 'timeout');
  assert.strictEqual(classifyHttpError({ response: { status: 500 } }), 'backend');
  assert.strictEqual(classifyHttpError({ response: { status: 599 } }), 'other');
});

test('shouldSuppressRequestError suppresses expected transient errors', function() {
  // Network errors WITH a custom handler are suppressed
  assert.strictEqual(
    shouldSuppressRequestError(new Error('timeout'), { handleError: () => {} }),
    true
  );

  // Network errors WITHOUT a custom handler are NOT suppressed
  assert.strictEqual(
    shouldSuppressRequestError(new Error('timeout'), {}),
    false
  );

  // 502, 503, 504 are suppressed (transient gateway errors)
  assert.strictEqual(shouldSuppressRequestError({ response: { status: 502 } }), true);
  assert.strictEqual(shouldSuppressRequestError({ response: { status: 503 } }), true);
  assert.strictEqual(shouldSuppressRequestError({ response: { status: 504 } }), true);

  // 500 is NOT suppressed (real backend errors should be reported)
  assert.strictEqual(shouldSuppressRequestError({ response: { status: 500 } }), false);

  // null error is not suppressed
  assert.strictEqual(shouldSuppressRequestError(null), false);
});

test('extractResponseMetadata pulls backend request id and error code', function() {
  assert.deepStrictEqual(
    extractResponseMetadata(null),
    {}
  );

  assert.deepStrictEqual(
    extractResponseMetadata({
      headers: { 'x-request-id': 'req-123' },
      data: { code: 10411, msg_show: 'cluster unavailable' }
    }),
    {
      request_id: 'req-123',
      backend_error_code: 10411,
      response_message: 'cluster unavailable'
    }
  );

  // Falls back to X-Request-Id (capitalized)
  assert.deepStrictEqual(
    extractResponseMetadata({
      headers: { 'X-Request-Id': 'req-456' },
      data: { msg: 'error' }
    }),
    {
      request_id: 'req-456',
      backend_error_code: '',
      response_message: 'error'
    }
  );

  // Empty response still returns defaults
  assert.deepStrictEqual(
    extractResponseMetadata({}),
    { request_id: '', backend_error_code: '', response_message: '' }
  );
});
