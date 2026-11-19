const assert = require('assert');
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const requestPath = path.join(__dirname, 'request.js');
const source = fs.readFileSync(requestPath, 'utf8');
const ast = parser.parse(source, { sourceType: 'module' });

function declaration(name) {
  const exported = ast.program.body.find(statement =>
    statement.type === 'ExportNamedDeclaration' &&
    statement.declaration &&
    statement.declaration.id &&
    statement.declaration.id.name === name
  ).declaration;
  return source.slice(exported.start, exported.end);
}

const helpers = new Function(
  `${declaration('getRequestFailureMetadata')}\n${declaration('getRequestFailureResult')}\nreturn { getRequestFailureMetadata, getRequestFailureResult };`
)();

const failures = [
  {
    name: 'business failure',
    error: { response: { status: 422, data: { code: 10412 } } },
    expected: { error_code: 'business_10412', error_category: 'business_failure', http_status: 422 }
  },
  {
    name: 'HTTP 4xx failure',
    error: { response: { status: 404, data: {} } },
    expected: { error_code: 'http_404', error_category: 'http_4xx', http_status: 404 }
  },
  {
    name: 'HTTP 5xx failure',
    error: { response: { status: 503, data: {} } },
    expected: { error_code: 'http_503', error_category: 'http_5xx', http_status: 503 }
  },
  {
    name: 'timeout failure',
    error: { code: 'ECONNABORTED' },
    expected: { error_code: 'timeout', error_category: 'timeout', http_status: 0 }
  },
  {
    name: 'network failure',
    error: { code: 'ERR_NETWORK' },
    expected: { error_code: 'network_error', error_category: 'network_error', http_status: 0 }
  }
];

failures.forEach(({ name, error, expected }) => {
  assert.deepStrictEqual(helpers.getRequestFailureMetadata(error), expected, name);
  assert.strictEqual(
    helpers.getRequestFailureResult(error, undefined, {}, undefined),
    undefined,
    `${name} without opt-in should keep the default undefined result`
  );
  assert.strictEqual(
    helpers.getRequestFailureResult(error, undefined, {}, 'handled'),
    'handled',
    `${name} should preserve the handleError return value without opt-in`
  );
  assert.deepStrictEqual(
    helpers.getRequestFailureResult(error, undefined, { returnErrorMetadata: true }, 'handled'),
    { __rainbondRequestFailure: true, ...expected },
    `${name} should return the telemetry envelope only when opted in`
  );
});

assert.ok(source.includes('return handleData(response);'), 'successful requests should continue returning response data');
assert.ok(
  source.includes('captureErrorViewed(failureMetadata.error_category'),
  'error_viewed should use normalized failure metadata'
);

console.log('request telemetry tests passed');
