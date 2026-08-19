const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isCurrentAccessRequest,
  resolveRainskillsAccessStatus
} = require('./rainskillsAuthorizationAccess');

test('RainSkills access is allowed only by an explicit true response', () => {
  assert.equal(resolveRainskillsAccessStatus({ bean: { can_open_agent: true } }), 'allowed');
  assert.equal(resolveRainskillsAccessStatus({ bean: { can_open_agent: false } }), 'denied');
  assert.equal(resolveRainskillsAccessStatus({ bean: {} }), 'denied');
});

test('RainSkills access fails closed for missing or failed responses', () => {
  assert.equal(resolveRainskillsAccessStatus(null), 'error');
  assert.equal(resolveRainskillsAccessStatus({}), 'error');
  assert.equal(resolveRainskillsAccessStatus({ bean: { can_open_agent: true } }, new Error('failed')), 'error');
});

test('only the latest mounted access request may update authorization state', () => {
  assert.equal(isCurrentAccessRequest(true, 2, 2), true);
  assert.equal(isCurrentAccessRequest(true, 1, 2), false);
  assert.equal(isCurrentAccessRequest(false, 2, 2), false);
});
