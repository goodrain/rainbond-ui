const assert = require('assert');
const { runCloseCallback } = require('./closeCallback');

let called = false;
runCloseCallback(() => {
  called = true;
});
assert.strictEqual(called, true, 'should invoke function callbacks');

assert.doesNotThrow(() => {
  runCloseCallback({
    type: 'click',
    target: null
  });
}, 'should ignore drawer close events instead of treating them as callbacks');

console.log('app version close callback tests passed');
