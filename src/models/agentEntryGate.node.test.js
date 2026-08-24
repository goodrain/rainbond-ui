const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modelSource = fs.readFileSync(path.join(__dirname, 'agent.js'), 'utf8');
const headerSource = fs.readFileSync(
  path.join(__dirname, '../components/GlobalHeader/index.js'),
  'utf8'
);

test('Agent model exposes cached entry data and a common open request', () => {
  assert.match(modelSource, /entryGate:/);
  assert.match(modelSource, /accessCacheKey/);
  assert.match(modelSource, /configStatus: 'unknown'/);
  assert.match(modelSource, /requestOpen\(state/);
  assert.match(modelSource, /gate\.accessLoaded/);
});

test('GlobalHeader writes entry data to and consumes requests from the Agent model', () => {
  assert.match(headerSource, /type: 'agent\/saveEntryGate'/);
  assert.match(headerSource, /agentEntryRequest/);
  assert.match(headerSource, /type: 'agent\/clearEntryRequest'/);
});
