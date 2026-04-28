const assert = require('assert');
const {
  buildPublishFormValues,
  buildSnapshotPublishFormPatch
} = require('./publishVersionHelpers');

assert.deepStrictEqual(
  buildPublishFormValues(
    {
      version: '0.1',
      version_alias: 'stable',
      describe: 'enterprise template version'
    },
    {
      publishMode: 'snapshot'
    }
  ),
  {
    version: '0.1',
    version_alias: 'stable',
    describe: 'enterprise template version'
  },
  'should preload the selected template version during snapshot publish'
);

assert.deepStrictEqual(
  buildPublishFormValues(
    {
      version: '0.1',
      version_alias: 'stable',
      describe: 'enterprise template version'
    },
    {
      publishMode: 'runtime'
    }
  ),
  {
    version: '',
    version_alias: 'stable',
    describe: 'enterprise template version'
  },
  'should keep runtime publish version blank until the user chooses a version'
);

assert.deepStrictEqual(
  buildPublishFormValues(
    {
      version: '0.1',
      version_alias: 'stable',
      describe: 'enterprise template version'
    },
    {
      publishMode: 'snapshot',
      requestedVersion: '0.2'
    }
  ),
  {
    version: '0.2',
    version_alias: 'stable',
    describe: 'enterprise template version'
  },
  'should prefer an explicitly requested version over the default template version'
);

assert.deepStrictEqual(
  buildPublishFormValues(
    {
      version: '0.1',
      version_alias: 'stable',
      describe: 'enterprise template version'
    },
    {
      publishMode: 'snapshot',
      requestedVersion: { key: 'enterprise-app' }
    }
  ),
  {
    version: '0.1',
    version_alias: 'stable',
    describe: 'enterprise template version'
  },
  'should ignore non-string requested versions from the template selector change event'
);

assert.deepStrictEqual(
  buildSnapshotPublishFormPatch(
    {
      version: '0.1',
      version_alias: 'stable',
      describe: 'enterprise template version'
    },
    'snapshot',
    ''
  ),
  {
    version: '0.1',
    version_alias: 'stable',
    describe: 'enterprise template version'
  },
  'should restore the snapshot template version when the field is still blank'
);

assert.strictEqual(
  buildSnapshotPublishFormPatch(
    {
      version: '0.1',
      version_alias: 'stable',
      describe: 'enterprise template version'
    },
    'snapshot',
    '0.2'
  ),
  null,
  'should not overwrite a version that the user or previous selection already filled in'
);

console.log('publish version helper tests passed');
