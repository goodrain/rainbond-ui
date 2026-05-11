const assert = require('assert');
const { shouldViewportLock } = require('./viewportLockState');

assert.strictEqual(
  shouldViewportLock({
    currentUser: { user_id: 1 },
    needLogin: false,
    location: { pathname: '/team/demo/overview' },
    agent: { visible: true, interactionLocked: false },
  }),
  false,
  'the viewport must stay interactive when the agent is visible but not locked'
);

assert.strictEqual(
  shouldViewportLock({
    currentUser: { user_id: 1 },
    needLogin: false,
    location: { pathname: '/team/demo/overview' },
    agent: { visible: true, interactionLocked: true },
  }),
  true,
  'the viewport should lock only when interactionLocked is true'
);

assert.strictEqual(
  shouldViewportLock({
    currentUser: { user_id: 1 },
    needLogin: false,
    location: { pathname: '/team/demo/overview' },
    agent: { visible: false, interactionLocked: true },
  }),
  false,
  'the viewport lock should disappear once the panel is hidden'
);

assert.strictEqual(
  shouldViewportLock({
    currentUser: { user_id: 1 },
    needLogin: false,
    location: { pathname: '/user/login' },
    agent: { visible: true, interactionLocked: true },
  }),
  false,
  'hidden agent routes should never show the viewport lock'
);

console.log('viewport lock state tests passed');
