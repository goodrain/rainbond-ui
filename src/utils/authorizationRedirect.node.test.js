const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getAuthorizationRedirect,
  getSafeRedirect,
  redirectToAuthorization
} = require('./authorizationRedirect');

const ORIGIN = 'https://rainbond.example.com';

test('accepts same-origin device and legacy authorization routes', () => {
  assert.equal(
    getAuthorizationRedirect(
      'https://rainbond.example.com/#/device?user_code=BCDF-GHJK',
      ORIGIN
    ),
    'https://rainbond.example.com/#/device?user_code=BCDF-GHJK'
  );
  assert.equal(
    getAuthorizationRedirect('/device?user_code=BCDF-GHJK', ORIGIN),
    'https://rainbond.example.com/device?user_code=BCDF-GHJK'
  );
  assert.equal(
    getAuthorizationRedirect('/#/cli-auth?state=abc', ORIGIN),
    'https://rainbond.example.com/#/cli-auth?state=abc'
  );
});

test('preserves encoded user codes and rejects foreign or unrelated routes', () => {
  assert.equal(
    getAuthorizationRedirect('/#/device?user_code=BCDF%2DGHJK', ORIGIN),
    'https://rainbond.example.com/#/device?user_code=BCDF%2DGHJK'
  );
  assert.equal(
    getAuthorizationRedirect('https://attacker.example/#/device', ORIGIN),
    null
  );
  assert.equal(getAuthorizationRedirect('/#/team/demo', ORIGIN), null);
});

test('safe login redirects allow same-origin destinations only', () => {
  assert.equal(
    getSafeRedirect('/#/team/demo', ORIGIN),
    'https://rainbond.example.com/#/team/demo'
  );
  assert.equal(getSafeRedirect('javascript:alert(1)', ORIGIN), null);
  assert.equal(getSafeRedirect('https://attacker.example/path', ORIGIN), null);
});

test('authorization redirect clears storage and assigns the validated target', () => {
  const removed = [];
  const assigned = [];
  const storage = { removeItem: key => removed.push(key) };
  const location = {
    origin: ORIGIN,
    assign: target => assigned.push(target)
  };

  const redirected = redirectToAuthorization(
    '/#/device?user_code=BCDF-GHJK',
    location,
    storage
  );

  assert.equal(redirected, true);
  assert.deepEqual(removed, ['redirect']);
  assert.deepEqual(assigned, [
    'https://rainbond.example.com/#/device?user_code=BCDF-GHJK'
  ]);
});
