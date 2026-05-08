const assert = require('assert');
const { getPreferredHelmValuesFileKey } = require('./helmValues');

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
