const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isAbnormalComponentStatus,
  shouldShowComponentAbnormalGuide,
} = require('./componentAbnormalGuide');

test('only unusual and abnormal are classified as abnormal guide states', () => {
  assert.equal(isAbnormalComponentStatus('unusual'), true);
  assert.equal(isAbnormalComponentStatus('abnormal'), true);
  ['running', 'closed', 'failed', 'undeploy', ''].forEach(status => {
    assert.equal(isAbnormalComponentStatus(status), false);
  });
});

test('requires overview, enabled and visible session permission', () => {
  const base = {
    activeTab: 'overview',
    status: 'unusual',
    agentEnabled: true,
    agentVisible: false,
    sessionAllows: true,
  };
  assert.equal(shouldShowComponentAbnormalGuide(base), true);
  assert.equal(shouldShowComponentAbnormalGuide({ ...base, activeTab: 'log' }), false);
  assert.equal(shouldShowComponentAbnormalGuide({ ...base, agentVisible: true }), false);
  assert.equal(shouldShowComponentAbnormalGuide({ ...base, sessionAllows: false }), false);
});
