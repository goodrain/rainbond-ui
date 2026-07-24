const assert = require('assert');
const { decodeBase64Text, getPreferredHelmValuesFileKey } = require('./helmValues');

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

assert.strictEqual(
  getPreferredHelmValuesFileKey({
    'demo/charts/common/templates/values.yaml': 'deep-values',
    'demo/charts/common/values.yaml': 'child-values',
  }),
  'demo/charts/common/values.yaml',
  'should fall back to the shortest nested values path when no root values exists'
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
