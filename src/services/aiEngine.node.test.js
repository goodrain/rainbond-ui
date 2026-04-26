const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'aiEngine.js'), 'utf8');

assert.match(
  source,
  /const AI_ENGINE_PLUGIN_BACKEND_PREFIX =[\s\S]*\/console\/regions\/rainbond\/backend\/plugins\/rainbond-ai-engine/,
  'aiEngine service should define the plugin backend prefix'
);

assert.match(
  source,
  /AI_ENGINE_PLUGIN_BACKEND_PREFIX\}\/api\/v1\/ai-engine\/team\/models/,
  'aiEngine service should request team models through the plugin backend prefix'
);

console.log('aiEngine service plugin prefix test passed');
