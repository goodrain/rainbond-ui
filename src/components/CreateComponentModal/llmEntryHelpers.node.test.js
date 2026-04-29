const assert = require('assert');

const {
  buildLlmCatalogDownloadPayload,
  buildLlmPluginNavigation,
  buildLlmRepositoryEntries,
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

assert.deepStrictEqual(
  buildLlmCatalogDownloadPayload({
    model_id: 'qwen-2.5-7b-instruct',
    display_name: 'Qwen2.5 7B Instruct',
    model_source: 'Qwen/Qwen2.5-7B-Instruct',
    default_engine: 'vLLM',
  }),
  {
    model_id: 'qwen-2.5-7b-instruct',
    display_name: 'Qwen2.5 7B Instruct',
    source_type: 'modelscope',
    source_uri: 'Qwen/Qwen2.5-7B-Instruct',
    engine_type: 'vLLM',
    parameters: '7B',
  },
  'buildLlmCatalogDownloadPayload should turn catalog models into download payloads'
);

assert.deepStrictEqual(
  buildLlmRepositoryEntries(
    [
      {
        model_id: 'qwen-2.5-7b-instruct',
        display_name: 'Qwen2.5 7B Instruct',
        model_source: 'Qwen/Qwen2.5-7B-Instruct',
      },
    ],
    [
      {
        model_key: 'modelscope:qwen',
        model_id: 'qwen-2.5-7b-instruct',
        source_uri: 'Qwen/Qwen2.5-7B-Instruct',
        status: 'ready',
      },
      {
        model_key: 'custom:upload',
        display_name: 'Uploaded Model',
        status: 'ready',
      },
    ]
  ).map((entry) => ({
    type: entry.type,
    key: entry.key,
    assetKey: entry.asset && entry.asset.model_key,
  })),
  [
    { type: 'catalog', key: 'catalog-qwen-2.5-7b-instruct', assetKey: 'modelscope:qwen' },
    { type: 'asset', key: 'custom:upload', assetKey: 'custom:upload' },
  ],
  'buildLlmRepositoryEntries should merge catalog models with matching and extra team assets'
);

console.log('CreateComponentModal llmEntryHelpers test passed');
