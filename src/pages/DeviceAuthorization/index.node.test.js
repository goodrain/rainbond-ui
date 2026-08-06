const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

test('device authorization confirmation does not render an insecure HTTP warning', () => {
  assert.doesNotMatch(source, /window\.location\.protocol/);
  assert.doesNotMatch(source, /deviceAuthorization\.insecure\.(title|detail)/);
});
