const assert = require('assert');
const {
  buildPublishFormValues,
  resolveInitialTemplateSelection
} = require('./publishVersionHelpers');

assert.deepStrictEqual(
  buildPublishFormValues(
    {
      version: '1.0',
      version_alias: 'stable',
      describe: 'enterprise template version'
    },
    {
      isCreate: false
    }
  ),
  {
    version: '',
    version_alias: 'stable',
    describe: 'enterprise template version'
  },
  'should keep the version field empty on first load until the user picks a version'
);

assert.deepStrictEqual(
  buildPublishFormValues(
    {
      version: '1.0',
      version_alias: 'stable',
      describe: 'enterprise template version'
    },
    {
      requestedVersion: '1.0'
    }
  ),
  {
    version: '1.0',
    version_alias: 'stable',
    describe: 'enterprise template version'
  },
  'should set the version field when the user explicitly chooses a version'
);

assert.deepStrictEqual(
  buildPublishFormValues(
    {
      version: '1.0',
      version_alias: 'stable',
      describe: 'enterprise template version'
    },
    {
      requestedVersion: { key: 'nginx1' }
    }
  ),
  {
    version: '',
    version_alias: 'stable',
    describe: 'enterprise template version'
  },
  'should ignore non-string version payloads from other control events'
);

assert.deepStrictEqual(
  resolveInitialTemplateSelection({
    query: {
      preferred_app_id: 'query-app-id'
    },
    bean: {
      app_id: 'bean-app-id'
    },
    list: [{ app_id: 'query-app-id' }, { app_id: 'first-app-id' }]
  }),
  {
    selectedAppId: 'query-app-id',
    selectedVersion: ''
  },
  'should prefer a requested template id only when it exists in the candidate list'
);

assert.deepStrictEqual(
  resolveInitialTemplateSelection({
    query: {
      preferred_app_id: 'hidden-snapshot-id'
    },
    bean: {
      app_id: 'bean-app-id'
    },
    list: [{ app_id: 'bean-app-id' }, { app_id: 'first-app-id' }]
  }),
  {
    selectedAppId: 'bean-app-id',
    selectedVersion: ''
  },
  'should ignore a preferred template id that does not exist in the candidate list'
);

assert.deepStrictEqual(
  resolveInitialTemplateSelection({
    list: [{ app_id: 'first-app-id' }]
  }),
  {
    selectedAppId: 'first-app-id',
    selectedVersion: ''
  },
  'should fall back to the first template when there is no stored selection'
);

console.log('publish version helper tests passed');
