const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

assert.match(
  source,
  /item\.key === 'llm-display'/,
  'CreateComponentModal should handle clicks on the LLM entry explicitly'
);

assert.match(
  source,
  /getTeamLlmModels/,
  'CreateComponentModal should fetch existing team LLM models before navigating'
);

assert.match(
  source,
  /buildLlmPluginNavigation/,
  'CreateComponentModal should build the AI Engine plugin navigation from the selected model'
);

console.log('CreateComponentModal llm entry flow test passed');
