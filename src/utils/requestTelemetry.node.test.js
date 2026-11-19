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
  `${declaration('getRequestFailureMetadata')}\nreturn { getRequestFailureMetadata };`
)();

assert.deepStrictEqual(
  helpers.getRequestFailureMetadata({
    response: { status: 422, data: { code: 10412 } }
  }),
  { error_code: 'business_10412', error_category: 'business_failure', http_status: 422 }
);

assert.deepStrictEqual(
  helpers.getRequestFailureMetadata({ response: { status: 404, data: {} } }),
  { error_code: 'http_404', error_category: 'http_4xx', http_status: 404 }
);

assert.deepStrictEqual(
  helpers.getRequestFailureMetadata({ response: { status: 503, data: {} } }),
  { error_code: 'http_503', error_category: 'http_5xx', http_status: 503 }
);

assert.deepStrictEqual(
  helpers.getRequestFailureMetadata({ code: 'ECONNABORTED' }),
  { error_code: 'timeout', error_category: 'timeout', http_status: 0 }
);

assert.deepStrictEqual(
  helpers.getRequestFailureMetadata({ code: 'ERR_NETWORK' }),
  { error_code: 'network_error', error_category: 'network_error', http_status: 0 }
);

assert.ok(
  source.includes('captureErrorViewed(failureMetadata.error_category'),
  'error_viewed should use normalized failure metadata'
);

console.log('request telemetry tests passed');
