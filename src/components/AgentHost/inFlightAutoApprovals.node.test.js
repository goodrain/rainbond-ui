const test = require('node:test');
const assert = require('node:assert');

const { claim, release, _reset } = require('./inFlightAutoApprovals');

test('claim returns true the first time and false on subsequent calls for same id', () => {
  _reset();
  assert.strictEqual(claim('approval-1'), true);
  assert.strictEqual(claim('approval-1'), false);
  assert.strictEqual(claim('approval-1'), false);
});

test('claim allows different ids independently', () => {
  _reset();
  assert.strictEqual(claim('a'), true);
  assert.strictEqual(claim('b'), true);
  assert.strictEqual(claim('a'), false);
  assert.strictEqual(claim('b'), false);
});

test('release removes id so claim can succeed again', () => {
  _reset();
  assert.strictEqual(claim('x'), true);
  assert.strictEqual(claim('x'), false);
  release('x');
  assert.strictEqual(claim('x'), true);
});

test('release on unknown id is a no-op', () => {
  _reset();
  release('never-claimed');
  assert.strictEqual(claim('never-claimed'), true);
});

test('claim ignores empty/falsy ids by returning false (defensive)', () => {
  _reset();
  assert.strictEqual(claim(''), false);
  assert.strictEqual(claim(null), false);
  assert.strictEqual(claim(undefined), false);
});

test('two concurrent-style claims for same id only succeed once', () => {
  _reset();
  // Simulate two saga instances reaching claim() in the same JS turn.
  const first = claim('race-id');
  const second = claim('race-id');
  assert.strictEqual(first, true);
  assert.strictEqual(second, false);
});
