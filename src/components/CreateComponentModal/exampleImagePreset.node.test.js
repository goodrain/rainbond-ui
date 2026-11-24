const assert = require('assert/strict');
const path = require('path');
const test = require('node:test');

const { shouldUseExampleImagePreset } = require(path.join(__dirname, 'exampleImagePreset.js'));

test('clears the starter-card image preset after returning to the creation menu', () => {
  assert.equal(shouldUseExampleImagePreset('example-image', true), true);
  assert.equal(shouldUseExampleImagePreset('example-image', false), false);
  assert.equal(shouldUseExampleImagePreset('image', true), false);
});
