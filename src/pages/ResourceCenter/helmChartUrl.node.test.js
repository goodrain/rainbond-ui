const assert = require('assert');
const {
  getHelmChartUrlValidation,
  getHelmChartUrlValidationMessage,
} = require('./helmChartUrl');

assert.deepStrictEqual(
  getHelmChartUrlValidation('https://', ''),
  {
    chartUrl: '',
    errorCode: '',
    hasValue: false,
  },
  'should treat empty chart address as missing input without a format error'
);

assert.deepStrictEqual(
  getHelmChartUrlValidation('https://', 'charts.bitnami.com/bitnami/nginx-15.9.0.tgz'),
  {
    chartUrl: 'https://charts.bitnami.com/bitnami/nginx-15.9.0.tgz',
    errorCode: '',
    hasValue: true,
  },
  'should prepend the selected protocol to a repo chart address'
);

assert.deepStrictEqual(
  getHelmChartUrlValidation('oci://', 'registry-1.docker.io/bitnamicharts/nginx:15.9.0'),
  {
    chartUrl: 'oci://registry-1.docker.io/bitnamicharts/nginx:15.9.0',
    errorCode: '',
    hasValue: true,
  },
  'should prepend the OCI protocol to an OCI chart address'
);

assert.deepStrictEqual(
  getHelmChartUrlValidation('https://', 'https://charts.bitnami.com/bitnami/nginx-15.9.0.tgz'),
  {
    chartUrl: '',
    errorCode: 'includes_protocol',
    hasValue: true,
  },
  'should reject chart addresses that repeat the protocol in the address field'
);

assert.deepStrictEqual(
  getHelmChartUrlValidation('https://', 'charts.bitnami.com /bitnami/nginx-15.9.0.tgz'),
  {
    chartUrl: '',
    errorCode: 'contains_whitespace',
    hasValue: true,
  },
  'should reject chart addresses that contain whitespace'
);

assert.strictEqual(
  getHelmChartUrlValidationMessage('contains_whitespace'),
  'Chart 地址中不能包含空格，请删除后再继续',
  'should expose the whitespace validation copy for UI reuse'
);

console.log('helm chart url validation tests passed');
