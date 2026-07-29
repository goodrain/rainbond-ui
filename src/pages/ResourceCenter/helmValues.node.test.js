const assert = require('assert');
const {
  buildHelmValuesOverride,
  decodeHelmValuesFiles,
  decodeBase64Text,
  getPreferredHelmValuesFileKey,
  getSortedHelmValuesFileKeys,
} = require('./helmValues');
const yaml = require('js-yaml');

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
    'highgo-stack/templates/values.yaml': 'template-values',
  }),
  [
    'highgo-stack/values.yaml',
    'highgo-stack/charts/hghac-see/values.yaml',
    'highgo-stack/charts/hgproxy/values.yaml',
  ],
  'should expose root and dependency values files without template files'
);

assert.strictEqual(
  getPreferredHelmValuesFileKey({
    'demo/charts/common/values.yaml': 'child-values',
    'demo/templates/values.yaml': 'template-values',
  }),
  'demo/charts/common/values.yaml',
  'should use a dependency values file when the root values file is missing'
);

const encodedValuesFiles = {
  'highgo-stack/values.yaml': encodeBase64('hghac-see:\n  enabled: true\n'),
  'highgo-stack/charts/hghac-see/values.yaml': encodeBase64('enabled: false\nreplicas: 1\n'),
  'highgo-stack/charts/hgproxy/values.yaml': encodeBase64('enabled: false\nperiod: 0\n'),
};
const decodedValuesFiles = decodeHelmValuesFiles(encodedValuesFiles, decodeBinary);

assert.deepStrictEqual(
  decodedValuesFiles,
  {
    'highgo-stack/values.yaml': 'hghac-see:\n  enabled: true\n',
    'highgo-stack/charts/hghac-see/values.yaml': 'enabled: false\nreplicas: 1\n',
    'highgo-stack/charts/hgproxy/values.yaml': 'enabled: false\nperiod: 0\n',
  },
  'should initialize an independent UTF-8 draft for every values file'
);

const unchangedRootValues = '# root comment\nhghac-see:\n  enabled: true\n';
assert.strictEqual(
  buildHelmValuesOverride({
    valuesMap: encodedValuesFiles,
    drafts: {
      ...decodedValuesFiles,
      'highgo-stack/values.yaml': unchangedRootValues,
    },
    dirtyFiles: {
      'highgo-stack/values.yaml': true,
    },
  }),
  unchangedRootValues,
  'should preserve root values formatting when no dependency file was edited'
);

const mergedValues = yaml.load(buildHelmValuesOverride({
  valuesMap: encodedValuesFiles,
  drafts: {
    ...decodedValuesFiles,
    'highgo-stack/charts/hghac-see/values.yaml': 'enabled: false\nreplicas: 3\n',
  },
  dirtyFiles: {
    'highgo-stack/charts/hghac-see/values.yaml': true,
  },
}));

assert.deepStrictEqual(
  mergedValues,
  {
    'hghac-see': {
      enabled: true,
      replicas: 3,
    },
  },
  'should merge an edited dependency draft under its Helm dependency name while preserving root overrides'
);
assert.strictEqual(
  Object.prototype.hasOwnProperty.call(mergedValues, 'hgproxy'),
  false,
  'should not submit dependency defaults that the user did not edit'
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
