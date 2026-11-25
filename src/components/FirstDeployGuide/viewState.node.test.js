const assert = require('assert/strict');
const path = require('path');
const test = require('node:test');

const { createFirstDeployGuideViewTracker } = require(path.join(__dirname, 'viewState.js'));

test('records the guide view only once for a team-dashboard page instance', () => {
  const markViewed = createFirstDeployGuideViewTracker();

  assert.equal(markViewed(), true);
  assert.equal(markViewed(), false);
});
