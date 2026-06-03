const assert = require('assert');
const {
  getLiveLocationRoute,
  buildRefreshedRouteFromLocation,
} = require('./rootShellRouteHelpers');

const windowLike = {
  location: {
    hash: '#/team/demo/region/test/index?from=back',
    pathname: '/ignored',
    search: '?ignored=1',
  },
};

assert.strictEqual(
  getLiveLocationRoute(
    {
      pathname: '/team/demo/region/test/apps/8/overview',
      search: '?type=components&componentID=api&tab=overview',
    },
    windowLike
  ),
  '/team/demo/region/test/index?from=back',
  'live route detection should prefer the current browser URL when the router store is stale after back navigation'
);

const refreshedRoute = buildRefreshedRouteFromLocation(
  {
    pathname: '/team/demo/region/test/apps/8/overview',
    search: '?type=components&componentID=api&tab=overview',
  },
  windowLike
);

assert.ok(
  refreshedRoute.startsWith('/team/demo/region/test/index?from=back&refresh='),
  'refresh route should also use the live browser URL instead of refreshing the stale router-store route'
);

console.log('root shell route helper tests passed');
