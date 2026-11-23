const assert = require('assert/strict');
const path = require('path');
const test = require('node:test');

const { createMarketRequestErrorHandlers } = require(path.join(__dirname, 'marketRequestErrorPolicy.js'));

function simulateRequestLayer(error, requestHandleError) {
  if (requestHandleError) {
    requestHandleError(error);
    return false;
  }
  return true;
}

test('ordinary market requests leave response, network, and 10409 errors to request-layer notifications', () => {
  const handlers = createMarketRequestErrorHandlers({}, () => {
    throw new Error('ordinary requests must not call the silent failure callback');
  });
  const errors = [
    { response: { data: { code: 500, msg_show: 'market unavailable' } } },
    new Error('network unavailable'),
    { response: { data: { code: 10409, msg_show: 'market request timed out' } } }
  ];

  errors.forEach(error => {
    assert.equal(simulateRequestLayer(error, handlers.requestHandleError), true);
  });
});

test('silent guide requests report each failed request once without request-layer notifications', () => {
  const failures = [];
  const handlers = createMarketRequestErrorHandlers({ silent: true }, error => failures.push(error));

  assert.equal(simulateRequestLayer(new Error('network unavailable'), handlers.requestHandleError), false);
  handlers.handleMissingResponse();
  assert.equal(failures.length, 1);
});
