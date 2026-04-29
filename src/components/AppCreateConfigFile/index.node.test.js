const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

assert.match(
  source,
  /const \{ mergeCreateRuntimeInfo \} = require\('\.\.\/CodeBuildConfig\/buildEnvHelpers'\);/,
  'AppCreateConfigFile should import mergeCreateRuntimeInfo for create-flow runtime hydration'
);

assert.match(
  source,
  /runtimeInfo:\s*mergeCreateRuntimeInfo\(runtimeInfo,\s*readSourceBuildConfig\(\)\)/,
  'AppCreateConfigFile should prefer the latest source-build detection when initializing runtimeInfo'
);
