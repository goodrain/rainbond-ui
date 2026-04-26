const assert = require('assert');

const {
  buildLlmPluginNavigation,
  getReadyLlmModels,
  resolveCurrentTeamNamespace,
} = require('./llmEntryHelpers');

const readyModels = getReadyLlmModels([
  { model_key: 'ready-1', display_name: 'Qwen 7B', status: 'ready' },
  { model_key: 'downloading-1', display_name: 'Qwen 14B', status: 'downloading' },
  { model_key: 'ready-2', display_name: 'DeepSeek', status: 'READY' },
]);

assert.deepStrictEqual(
  readyModels.map((item) => item.model_key),
  ['ready-1', 'ready-2'],
  'getReadyLlmModels should keep only ready models'
);

assert.strictEqual(
  resolveCurrentTeamNamespace(
    {
      teams: [
        { team_name: 'team-a', namespace: 'ns-a' },
        { team_name: 'team-b', namespace: 'ns-b' },
      ],
    },
    'team-b'
  ),
  'ns-b',
  'resolveCurrentTeamNamespace should find the active team namespace from currentUser'
);

assert.deepStrictEqual(
  buildLlmPluginNavigation({
    pluginName: 'rainbond-ai-engine',
    teamName: 'demo-team',
    regionName: 'demo-region',
    modelKey: 'modelscope:qwen/Qwen2.5-7B-Instruct',
  }),
  {
    pathname: '/team/demo-team/region/demo-region/plugins/rainbond-ai-engine',
    query: {
      autoOpenModelDrawer: 'true',
      modelKey: 'modelscope:qwen/Qwen2.5-7B-Instruct',
    },
  },
  'buildLlmPluginNavigation should point to the team AI plugin page with drawer query params'
);

console.log('CreateComponentModal llmEntryHelpers test passed');
