const assert = require('assert/strict');
const path = require('path');
const test = require('node:test');

const { getCreateComponentState } = require(path.join(__dirname, 'createComponentState.js'));

test('resets starter-card creation state for normal opening and closing', () => {
  assert.deepEqual(getCreateComponentState(true), {
    createComponentVisible: true,
    currentView: null,
    featuredMarketApp: null
  });
  assert.deepEqual(getCreateComponentState(false), {
    createComponentVisible: false,
    currentView: null,
    featuredMarketApp: null
  });
});
