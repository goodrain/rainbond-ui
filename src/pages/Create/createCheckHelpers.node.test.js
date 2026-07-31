const assert = require('assert');
const {
  buildCreatedComponentOverviewTarget,
  resolveCreateCheckGroupId,
  shouldEnterMultiServiceBuild,
  shouldShowMultiModuleBuildChoice
} = require('./createCheckHelpers');

assert.strictEqual(
  resolveCreateCheckGroupId({
    locationQuery: { group_id: '17' },
    appDetail: { group_id: 42 }
  }),
  '17',
  'should prefer the group_id already present in the create-check route query'
);

assert.strictEqual(
  resolveCreateCheckGroupId({
    locationQuery: {},
    appDetail: { group_id: 42 }
  }),
  '42',
  'should fall back to the created component detail when the route query omits group_id'
);

assert.strictEqual(
  buildCreatedComponentOverviewTarget({
    groupId: '42',
    appAlias: 'demo-service',
    serviceSource: 'third_party'
  }),
  'apps/42/overview?type=components&componentID=demo-service&tab=thirdPartyServices',
  'should route third-party components back to the third-party tab'
);

assert.strictEqual(
  buildCreatedComponentOverviewTarget({
    groupId: '42',
    appAlias: 'demo-service',
    serviceSource: 'source_code'
  }),
  'apps/42/overview?type=components&componentID=demo-service&tab=overview',
  'should route regular components back to the overview tab'
);

const multiModuleWithDockerfile = [
  { type: 'language', value: 'Java-maven,dockerfile' },
  { type: 'dockerfiles', value: ['Dockerfile'] }
];

assert.strictEqual(
  shouldShowMultiModuleBuildChoice({
    isMulti: true,
    serviceInfo: multiModuleWithDockerfile
  }),
  true,
  'should show build choices when a Maven multi-module project also has a Dockerfile'
);

assert.strictEqual(
  shouldShowMultiModuleBuildChoice({
    isMulti: true,
    serviceInfo: [{ type: 'language', value: 'Java-maven' }]
  }),
  false,
  'should keep plain Maven multi-module projects on the multi-service result page'
);

assert.strictEqual(
  shouldEnterMultiServiceBuild({
    isMulti: true,
    serviceInfo: multiModuleWithDockerfile,
    codeLanguage: 'Java-maven'
  }),
  true,
  'should enter the multi-service flow when Maven is selected'
);

assert.strictEqual(
  shouldEnterMultiServiceBuild({
    isMulti: true,
    serviceInfo: multiModuleWithDockerfile,
    codeLanguage: 'dockerfile'
  }),
  false,
  'should continue the single-component flow when Dockerfile is selected'
);

console.log('create-check helper tests passed');
