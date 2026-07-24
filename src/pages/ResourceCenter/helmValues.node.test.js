const assert = require('assert');
const {
  decodeBase64Text,
  getPreferredHelmValuesFileKey,
  getSortedHelmValuesFileKeys,
} = require('./helmValues');

function encodeBase64(value) {
  return Buffer.from(value, 'utf8').toString('base64');
}

function decodeBinary(value) {
  return Buffer.from(value, 'base64').toString('latin1');
}

assert.strictEqual(
  getPreferredHelmValuesFileKey({
    'common-chart/charts/common/values.yaml': 'child-values',
    'common-chart/values.yaml': 'root-values',
  }),
  'common-chart/values.yaml',
  'should prefer the chart root values.yaml over nested dependency values files'
);

assert.deepStrictEqual(
  getSortedHelmValuesFileKeys({
    'highgo-stack/charts/hghac-see/values.yaml': 'database-values',
    'highgo-stack/values.yaml': 'root-values',
    'highgo-stack/charts/hgproxy/values.yaml': 'proxy-values',
  }),
  ['highgo-stack/values.yaml'],
  'should only expose the root values file as install overrides'
);

assert.strictEqual(
  getPreferredHelmValuesFileKey({
    'demo/charts/common/values.yaml': 'child-values',
    'demo/templates/values.yaml': 'template-values',
  }),
  '',
  'should not use dependency or template values files when the root values file is missing'
);

assert.strictEqual(
  decodeBase64Text(encodeBase64('\uFEFF# highgo-stack - 瀚高数据库完整部署栈'), decodeBinary),
  '# highgo-stack - 瀚高数据库完整部署栈',
  'should decode UTF-8 values files and remove the byte order mark'
);

assert.strictEqual(
  decodeBase64Text(encodeBase64('# 健康检查\nperiod: 10\n'), decodeBinary),
  '# 健康检查\nperiod: 10\n',
  'should preserve UTF-8 Chinese comments'
);

assert.strictEqual(
  decodeBase64Text(encodeBase64('enabled: true\n'), decodeBinary),
  'enabled: true\n',
  'should preserve ASCII values files'
);

assert.strictEqual(decodeBase64Text('', decodeBinary), '', 'should return an empty string for empty input');
assert.strictEqual(
  decodeBase64Text('not valid base64', () => { throw new Error('invalid base64'); }),
  '',
  'should return an empty string for invalid base64'
);
