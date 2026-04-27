const assert = require('assert');

const {
  buildLlmPluginNavigation,
  getLlmPluginFromList,
  getReadyLlmModels,
  resolveCurrentTeamNamespace,
} = require('./llmEntryHelpers');

assert.deepStrictEqual(
  getReadyLlmModels([
    { model_key: 'ready-1', status: 'ready' },
    { model_key: 'downloading-1', status: 'downloading' },
    { model_key: 'ready-2', status: 'READY' },
  ]).map((item) => item.model_key),
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
  'buildLlmPluginNavigation should point to the AI Engine page and preserve auto-open drawer support for local models'
);

assert.deepStrictEqual(
  buildLlmPluginNavigation({
    pluginName: 'rainbond-ai-engine',
    teamName: 'demo-team',
    regionName: 'demo-region',
  }),
  {
    pathname: '/team/demo-team/region/demo-region/plugins/rainbond-ai-engine',
  },
  'buildLlmPluginNavigation should also support queryless jumps after upload or modelscope submit'
);

assert.deepStrictEqual(
  getLlmPluginFromList([
    { name: 'foo-plugin', alias: 'Foo' },
    { name: 'rainbond-ai-engine', alias: 'AI Engine' },
  ]),
  { name: 'rainbond-ai-engine', alias: 'AI Engine' },
  'getLlmPluginFromList should prefer the exact rainbond-ai-engine plugin'
);

console.log('CreateComponentModal llmEntryHelpers test passed');
