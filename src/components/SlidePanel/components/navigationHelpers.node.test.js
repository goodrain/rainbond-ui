const assert = require('assert');
const {
  buildAppOverviewFallbackRoute,
} = require('./navigationHelpers');

assert.strictEqual(
  buildAppOverviewFallbackRoute({
    prefixUrl: '/team/demo/region/test/',
    groupId: 42,
  }),
  '/team/demo/region/test/apps/42/overview',
  'incomplete component fallback should keep the user on the app overview'
);

assert.strictEqual(
  buildAppOverviewFallbackRoute({
    prefixUrl: '/team/demo/region/test/',
    groupId: '',
  }),
  '',
  'fallback should be empty when the app id is unavailable'
);

console.log('slide panel navigation helper tests passed');
