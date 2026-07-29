const assert = require('assert');

const {
  SLOW_REQUEST_MAX_EVENTS,
  SLOW_REQUEST_SAMPLE_RATE,
  SLOW_REQUEST_THRESHOLD_MS,
  SLOW_REQUEST_WINDOW_MS,
  buildIssueFingerprint,
  buildReadableErrorMessage,
  buildSlowRequestRouteTemplate,
  buildSlowRequestTransaction,
  classifyHttpError,
  completeSlowRequestTiming,
  consumeSlowRequestBudget,
  extractResponseMetadata,
  getPathPattern,
  getSentryConfig,
  buildSentryTunnelUrl,
  isSlowRequestEligible,
  mapHttpStatusToTraceStatus,
  parseStackFrames,
  sanitizeObject,
  sanitizeStack,
  sanitizeUrl,
  shouldSampleSlowRequest,
  shouldPreferFetchTransport,
  shouldReportRequestError,
  shouldSuppressBrowserError,
  shouldSuppressRequestError,
  startSlowRequestTiming
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

test('shouldSuppressBrowserError suppresses known browser runtime noise', function() {
  assert.strictEqual(
    shouldSuppressBrowserError(
      new Error('ResizeObserver loop completed with undelivered notifications.'),
      { errorSource: 'window_error' }
    ),
    true
  );

  assert.strictEqual(
    shouldSuppressBrowserError(
      new Error('ResizeObserver loop limit exceeded'),
      { errorSource: 'unhandledrejection' }
    ),
    true
  );

  const insertBeforeError = new Error(
    "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."
  );
  insertBeforeError.name = 'NotFoundError';

  assert.strictEqual(
    shouldSuppressBrowserError(insertBeforeError, { errorSource: 'window_error' }),
    true
  );
});

test('shouldSuppressBrowserError keeps app render and api errors reportable', function() {
  assert.strictEqual(
    shouldSuppressBrowserError(
      new Error('ResizeObserver loop completed with undelivered notifications.'),
      { errorSource: 'react_error_boundary' }
    ),
    false
  );

  const insertBeforeError = new Error("Failed to execute 'insertBefore' on 'Node'");
  insertBeforeError.name = 'Error';

  assert.strictEqual(
    shouldSuppressBrowserError(insertBeforeError, { errorSource: 'window_error' }),
    false
  );

  assert.strictEqual(
    shouldSuppressBrowserError(new Error('Request failed'), { errorSource: 'api' }),
    false
  );
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

test('slow request constants use the fixed sampling threshold and rolling cap', function() {
  assert.strictEqual(SLOW_REQUEST_SAMPLE_RATE, 0.01);
  assert.strictEqual(SLOW_REQUEST_THRESHOLD_MS, 1000);
  assert.strictEqual(SLOW_REQUEST_MAX_EVENTS, 10);
  assert.strictEqual(SLOW_REQUEST_WINDOW_MS, 60000);
});

test('buildSlowRequestRouteTemplate removes hosts and entire queries from api urls', function() {
  const relative = buildSlowRequestRouteTemplate(
    '/console/teams/team-private/apps/app-private/events?token=query-private#fragment-private'
  );
  const absolute = buildSlowRequestRouteTemplate(
    'https://host-private.example/openapi/v1/teams/team-private/apps/app-private/overview?user=user-private'
  );

  assert.strictEqual(relative, '/console/teams/:id/apps/:id/events');
  assert.strictEqual(absolute, '/openapi/v1/teams/:id/apps/:id/overview');
  assert.strictEqual(relative.includes('?'), false);
  assert.strictEqual(absolute.includes('?'), false);
  assert.strictEqual(absolute.includes('host-private.example'), false);
});

test('buildSlowRequestRouteTemplate keeps api roots and placeholders every unknown segment', function() {
  assert.strictEqual(buildSlowRequestRouteTemplate('/console?secret=value'), '/console');
  assert.strictEqual(buildSlowRequestRouteTemplate('/openapi#secret-fragment'), '/openapi');
  assert.strictEqual(
    buildSlowRequestRouteTemplate('/console/private-user-value/custom-action-value'),
    '/console/:unknown/:unknown'
  );
});

test('buildSlowRequestRouteTemplate fails closed for non-api malformed and encoded paths', function() {
  const unsafeUrls = [
    '',
    '/login',
    'console/teams/team-private',
    'https://',
    'https://[invalid]/console/teams/team-private',
    'https://host.example/console\\teams\\private',
    'http://host.example\\openapi\\v1\\private',
    'https://host.example/console/./teams/private',
    'https://host.example/console/../teams/private',
    'https://host.example/console/%2e/teams/private',
    'https://host.example/console/%2E%2E/teams/private',
    'https://host.example/console/.%2e/teams/private',
    'https://host.example/console/%2e./teams/private',
    '/console/teams/team-private%2Fadmin',
    '/console/teams/team-private%5cadmin',
    '/console/teams/team-private%252Fadmin',
    '/console//teams/team-private'
  ];

  unsafeUrls.forEach(function(url) {
    assert.strictEqual(buildSlowRequestRouteTemplate(url), null, url);
  });

  assert.strictEqual(
    buildSlowRequestRouteTemplate(
      'https://host.example/console/teams/private?redirect=/../%2e/%2e%2e'
    ),
    '/console/teams/:id'
  );
});

test('buildSlowRequestRouteTemplate placeholders inherited object property names', function() {
  ['constructor', 'toString', '__proto__'].forEach(function(segment) {
    assert.strictEqual(
      buildSlowRequestRouteTemplate(`/console/${segment}/private`),
      '/console/:unknown/:unknown',
      segment
    );
  });
});

test('buildSlowRequestTransaction rejects inherited object property names as static routes', function() {
  ['constructor', 'toString', '__proto__'].forEach(function(segment) {
    assert.strictEqual(
      buildSlowRequestTransaction({
        eventId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        route: `/console/${segment}`,
        method: 'GET',
        startedAt: 1000,
        endedAt: 2001,
        status: 200,
        environment: 'production',
        traceId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        spanId: 'cccccccccccccccc'
      }),
      null,
      segment
    );
  });
});

test('isSlowRequestEligible excludes telemetry skip and unsafe requests', function() {
  assert.strictEqual(isSlowRequestEligible({ url: '/console' }), true);
  assert.strictEqual(isSlowRequestEligible({ url: '/openapi' }), true);
  assert.strictEqual(isSlowRequestEligible({ url: '/console/apps/app-private' }), true);
  assert.strictEqual(isSlowRequestEligible({ url: '/console/sentry' }), false);
  assert.strictEqual(isSlowRequestEligible({ url: '/console/sentry/api/1/envelope/' }), false);
  assert.strictEqual(isSlowRequestEligible({ url: '/console/posthog' }), false);
  assert.strictEqual(isSlowRequestEligible({ url: '/console/posthog/capture' }), false);
  assert.strictEqual(
    isSlowRequestEligible({
      url: '/console/apps/app-private',
      skipSlowRequestTelemetry: true
    }),
    false
  );
  assert.strictEqual(isSlowRequestEligible({}), false);
  assert.strictEqual(isSlowRequestEligible({ url: '/login' }), false);
  assert.strictEqual(
    isSlowRequestEligible({ url: '/console/apps/app-private%2Fadmin' }),
    false
  );
});

test('shouldSampleSlowRequest uses a strict 0.01 random boundary', function() {
  assert.strictEqual(shouldSampleSlowRequest(0), true);
  assert.strictEqual(shouldSampleSlowRequest(0.009999999), true);
  assert.strictEqual(shouldSampleSlowRequest(0.01), false);
  assert.strictEqual(shouldSampleSlowRequest(1), false);
  assert.strictEqual(shouldSampleSlowRequest(-0.01), false);
});

test('startSlowRequestTiming never templates routes or reads clocks for an unsampled request', function() {
  let monotonicClockReads = 0;
  let epochClockReads = 0;
  let routeTemplateCalls = 0;
  const context = startSlowRequestTiming(
    {
      url: '/console/teams/team-private/apps/app-private/events',
      method: 'get'
    },
    function() { return 0.01; },
    function() {
      monotonicClockReads += 1;
      return 1234;
    },
    function() {
      epochClockReads += 1;
      return 1700000000000;
    },
    function() {
      routeTemplateCalls += 1;
      return '/console/teams/:id/apps/:id/events';
    }
  );

  assert.strictEqual(context, null);
  assert.strictEqual(monotonicClockReads, 0);
  assert.strictEqual(epochClockReads, 0);
  assert.strictEqual(routeTemplateCalls, 0);
});

test('slow request timing requires an explicit monotonic clock', function() {
  const context = startSlowRequestTiming(
    { url: '/console/apps/app-private/status', method: 'get' },
    function() { return 0; }
  );

  assert.strictEqual(context, null);
  assert.strictEqual(
    completeSlowRequestTiming({
      route: '/console/apps/:id/status',
      method: 'GET',
      monotonicStartedAt: 1000,
      startedAt: 1700000000000,
      completed: false
    }, { status: 200 }),
    null
  );
});

test('startSlowRequestTiming templates a sampled route exactly once and retains safe fields', function() {
  let routeTemplateCalls = 0;
  const context = startSlowRequestTiming(
    {
      url: 'https://host-private.example/console/teams/team-private/apps/app-private/events?token=query-private',
      method: 'post',
      headers: { Authorization: 'header-private' },
      data: { password: 'body-private' },
      componentId: 'component-private'
    },
    function() { return 0.009; },
    function() { return 1234; },
    function() { return 1700000000000; },
    function(url) {
      routeTemplateCalls += 1;
      return buildSlowRequestRouteTemplate(url);
    }
  );

  assert.deepStrictEqual(context, {
    route: '/console/teams/:id/apps/:id/events',
    method: 'POST',
    monotonicStartedAt: 1234,
    startedAt: 1700000000000,
    completed: false
  });
  assert.strictEqual(routeTemplateCalls, 1);
});

test('startSlowRequestTiming rejects sampled telemetry routes before reading clocks', function() {
  let clockReads = 0;
  const context = startSlowRequestTiming(
    { url: '/console/sentry', method: 'post' },
    function() { return 0; },
    function() {
      clockReads += 1;
      return 1000;
    },
    function() {
      clockReads += 1;
      return 1700000000000;
    }
  );

  assert.strictEqual(context, null);
  assert.strictEqual(clockReads, 0);
});

test('completeSlowRequestTiming drops the exact threshold and is idempotent', function() {
  const context = startSlowRequestTiming(
    { url: '/console/apps/app-private/status', method: 'get' },
    function() { return 0; },
    function() { return 1000; },
    function() { return 1700000000000; }
  );
  let completionClockReads = 0;

  assert.strictEqual(
    completeSlowRequestTiming(context, { status: 200 }, function() {
      completionClockReads += 1;
      return 2000;
    }),
    null
  );
  assert.strictEqual(
    completeSlowRequestTiming(context, { status: 200 }, function() {
      completionClockReads += 1;
      return 3000;
    }),
    null
  );
  assert.strictEqual(completionClockReads, 1);
});

test('completeSlowRequestTiming derives epoch end time from monotonic duration', function() {
  let epochClockReads = 0;
  const context = startSlowRequestTiming(
    { url: '/console/apps/app-private/status', method: 'patch' },
    function() { return 0; },
    function() { return 5000; },
    function() {
      epochClockReads += 1;
      return epochClockReads === 1 ? 1700000000000 : 1600000000000;
    }
  );

  assert.deepStrictEqual(
    completeSlowRequestTiming(context, { status: 204 }, function() { return 6001; }),
    {
      route: '/console/apps/:id/status',
      method: 'PATCH',
      startedAt: 1700000000000,
      endedAt: 1700000001001,
      status: 204
    }
  );
  assert.strictEqual(epochClockReads, 1);
});

test('completeSlowRequestTiming drops cancellation without reading the clock', function() {
  const context = startSlowRequestTiming(
    { url: '/console/apps/app-private/status' },
    function() { return 0; },
    function() { return 1000; },
    function() { return 1700000000000; }
  );
  let completionClockReads = 0;

  assert.strictEqual(
    completeSlowRequestTiming(context, { cancelled: true }, function() {
      completionClockReads += 1;
      return 5000;
    }),
    null
  );
  assert.strictEqual(completionClockReads, 0);
});

test('completeSlowRequestTiming labels missing responses as network_error', function() {
  const context = startSlowRequestTiming(
    { url: '/openapi/v1/apps/app-private' },
    function() { return 0; },
    function() { return 1000; },
    function() { return 1700000000000; }
  );

  assert.deepStrictEqual(
    completeSlowRequestTiming(context, {}, function() { return 2001; }),
    {
      route: '/openapi/v1/apps/:id',
      method: 'GET',
      startedAt: 1700000000000,
      endedAt: 1700000001001,
      status: 'network_error'
    }
  );
});

test('consumeSlowRequestBudget caps attempts in a rolling 60000ms window', function() {
  const attemptTimestamps = [];

  for (let index = 0; index < 10; index += 1) {
    assert.strictEqual(consumeSlowRequestBudget(attemptTimestamps, 0), true);
  }
  assert.strictEqual(consumeSlowRequestBudget(attemptTimestamps, 0), false);
  assert.strictEqual(consumeSlowRequestBudget(attemptTimestamps, 59999), false);
  assert.strictEqual(consumeSlowRequestBudget(attemptTimestamps, 60000), true);
  assert.deepStrictEqual(attemptTimestamps, [60000]);

  for (let index = 0; index < 9; index += 1) {
    assert.strictEqual(consumeSlowRequestBudget(attemptTimestamps, 60000), true);
  }
  assert.strictEqual(consumeSlowRequestBudget(attemptTimestamps, 60000), false);
});

test('mapHttpStatusToTraceStatus returns deterministic valid sentry statuses', function() {
  const cases = [
    [200, 'ok'],
    [302, 'ok'],
    [400, 'invalid_argument'],
    [401, 'unauthenticated'],
    [403, 'permission_denied'],
    [404, 'not_found'],
    [409, 'already_exists'],
    [418, 'failed_precondition'],
    [429, 'resource_exhausted'],
    [499, 'cancelled'],
    [500, 'internal_error'],
    [501, 'unimplemented'],
    [503, 'unavailable'],
    [504, 'deadline_exceeded'],
    [599, 'internal_error'],
    ['network_error', 'unavailable'],
    [undefined, 'unknown_error']
  ];
  const validStatuses = [
    'ok',
    'cancelled',
    'unknown_error',
    'invalid_argument',
    'deadline_exceeded',
    'not_found',
    'already_exists',
    'permission_denied',
    'resource_exhausted',
    'failed_precondition',
    'aborted',
    'out_of_range',
    'unimplemented',
    'internal_error',
    'unavailable',
    'data_loss',
    'unauthenticated'
  ];

  cases.forEach(function(item) {
    const status = mapHttpStatusToTraceStatus(item[0]);
    assert.strictEqual(status, item[1]);
    assert.strictEqual(validStatuses.includes(status), true);
  });
});

function validSlowRequestTransactionInput(overrides) {
  return Object.assign({
    eventId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    route: '/openapi/v1/apps/:id',
    method: 'GET',
    startedAt: 1000,
    endedAt: 2001,
    status: 200,
    environment: 'production',
    traceId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    spanId: 'cccccccccccccccc'
  }, overrides);
}

test('buildSlowRequestTransaction validates sentry environment rules and boundaries', function() {
  [
    '',
    'None',
    'production east',
    'production/east',
    'production\\east',
    'production\teast',
    'x'.repeat(65)
  ].forEach(function(environment) {
    assert.strictEqual(
      buildSlowRequestTransaction(validSlowRequestTransactionInput({ environment })),
      null,
      JSON.stringify(environment)
    );
  });

  const event = buildSlowRequestTransaction(
    validSlowRequestTransactionInput({ environment: 'e'.repeat(64) })
  );
  assert.strictEqual(event.environment, 'e'.repeat(64));
});

test('buildSlowRequestTransaction omits invalid releases and keeps sentry-compatible releases', function() {
  [
    'None',
    '.',
    '..',
    'release/name',
    'release\\name',
    'release\nname',
    'release\tname',
    ' leading',
    'trailing ',
    'x'.repeat(201)
  ].forEach(function(release) {
    const event = buildSlowRequestTransaction(validSlowRequestTransactionInput({ release }));
    assert.strictEqual(event !== null, true, JSON.stringify(release));
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(event, 'release'),
      false,
      JSON.stringify(release)
    );
  });

  const release = 'rainbond-ui@6.9.1 release-candidate';
  const event = buildSlowRequestTransaction(validSlowRequestTransactionInput({ release }));
  const boundaryEvent = buildSlowRequestTransaction(
    validSlowRequestTransactionInput({ release: 'r'.repeat(200) })
  );
  assert.strictEqual(event.release, release);
  assert.strictEqual(boundaryEvent.release, 'r'.repeat(200));
});

test('buildSlowRequestTransaction emits only the exact recursive allowlist', function() {
  const forbiddenValues = [
    'header-private',
    'body-private',
    'params-private',
    'auth-user-private',
    'auth-password-private',
    'https://host-private.example/console/raw?token=query-private',
    'host-private.example',
    'query-private',
    'user-private',
    'team-private',
    'region-private',
    'app-private',
    'component-private'
  ];
  const event = buildSlowRequestTransaction({
    eventId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    route: '/console/teams/:id/apps/:id/events/:unknown',
    method: 'post',
    startedAt: 1000,
    endedAt: 2001,
    status: 503,
    traceStatus: 'ok',
    environment: 'production',
    release: 'v6.9.1',
    traceId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    spanId: 'cccccccccccccccc',
    headers: { Authorization: 'header-private' },
    body: { content: 'body-private' },
    data: { content: 'body-private' },
    params: { search: 'params-private' },
    auth: { username: 'auth-user-private', password: 'auth-password-private' },
    url: 'https://host-private.example/console/raw?token=query-private',
    rawUrl: 'https://host-private.example/console/raw?token=query-private',
    userId: 'user-private',
    teamId: 'team-private',
    regionId: 'region-private',
    appId: 'app-private',
    componentId: 'component-private',
    options: {
      headers: { Authorization: 'header-private' },
      url: 'https://host-private.example/console/raw?token=query-private'
    }
  });

  assert.deepStrictEqual(event, {
    event_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    type: 'transaction',
    transaction: 'POST /console/teams/:id/apps/:id/events/:unknown',
    transaction_info: {
      source: 'custom'
    },
    start_timestamp: 1,
    timestamp: 2.001,
    platform: 'javascript',
    environment: 'production',
    release: 'v6.9.1',
    tags: {
      component: 'rainbond-ui',
      source: 'browser_slow_request',
      method: 'POST',
      status: '503',
      sample_rate: '0.01'
    },
    contexts: {
      trace: {
        trace_id: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        span_id: 'cccccccccccccccc',
        op: 'http.client',
        status: 'unavailable'
      }
    }
  });

  function recursiveKeys(value, prefix) {
    return Object.keys(value).reduce(function(keys, key) {
      const path = prefix ? prefix + '.' + key : key;
      const child = value[key];
      keys.push(path);
      if (child && typeof child === 'object' && !Array.isArray(child)) {
        return keys.concat(recursiveKeys(child, path));
      }
      return keys;
    }, []);
  }

  assert.deepStrictEqual(recursiveKeys(event, '').sort(), [
    'contexts',
    'contexts.trace',
    'contexts.trace.op',
    'contexts.trace.span_id',
    'contexts.trace.status',
    'contexts.trace.trace_id',
    'environment',
    'event_id',
    'platform',
    'release',
    'start_timestamp',
    'tags',
    'tags.component',
    'tags.method',
    'tags.sample_rate',
    'tags.source',
    'tags.status',
    'timestamp',
    'transaction',
    'transaction_info',
    'transaction_info.source',
    'type'
  ].sort());

  const serialized = JSON.stringify(event);
  forbiddenValues.forEach(function(value) {
    assert.strictEqual(serialized.includes(value), false, value);
  });
  [
    'headers',
    'body',
    'data',
    'params',
    'auth',
    'url',
    'rawUrl',
    'userId',
    'teamId',
    'regionId',
    'appId',
    'componentId',
    'options'
  ].forEach(function(key) {
    assert.strictEqual(recursiveKeys(event, '').includes(key), false, key);
  });
  assert.strictEqual(event.tags.component, 'rainbond-ui');
});

test('buildSlowRequestTransaction omits release when absent and rejects unsafe fields', function() {
  const withoutRelease = buildSlowRequestTransaction({
    eventId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    route: '/openapi/v1/apps/:id',
    method: 'GET',
    startedAt: 1000,
    endedAt: 2001,
    status: 'network_error',
    traceStatus: 'unavailable',
    environment: 'production',
    traceId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    spanId: 'cccccccccccccccc'
  });

  assert.strictEqual(Object.prototype.hasOwnProperty.call(withoutRelease, 'release'), false);
  assert.strictEqual(
    buildSlowRequestTransaction({
      eventId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      route: '/login/user-private',
      method: 'GET',
      startedAt: 1000,
      endedAt: 2001,
      status: 200,
      traceStatus: 'ok',
      environment: 'production',
      traceId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      spanId: 'cccccccccccccccc'
    }),
    null
  );
});
