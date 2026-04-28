const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

assert.match(
  source,
  /item\.key === 'llm-display'/,
  'CreateComponentModal should still handle clicks on the LLM entry explicitly'
);

assert.match(
  source,
  /handleOpenLlmSelector\(\)/,
  'CreateComponentModal should open the host-side LLM deploy modal for the LLM entry'
);

assert.match(
  source,
  /createTeamLlmDownload/,
  'CreateComponentModal should call the plugin download endpoint for the modelscope flow'
);

assert.match(
  source,
  /uploadTeamLlmArtifact/,
  'CreateComponentModal should call the plugin upload endpoint for the upload flow'
);

assert.match(
  source,
  /jumpToLlmPlugin\(selectedLlmModel\.model_key\)/,
  'CreateComponentModal should still auto-open the instance drawer when local models are selected'
);

assert.match(
  source,
  /handleJumpToLlmMarket/,
  'CreateComponentModal should expose a dedicated jump handler for the model market entry'
);

assert.match(
  source,
  /CreateComponentModal\.llm_model_market/,
  'CreateComponentModal should render a model market text link in the deploy modal'
);

assert.doesNotMatch(
  source,
  /handlePluginClick\(llmPlugin/,
  'CreateComponentModal should no longer open an embedded plugin page for the LLM entry'
);

console.log('CreateComponentModal llm entry flow test passed');
