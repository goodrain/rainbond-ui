function getStoreLocationRoute(location = {}) {
  return `${location.pathname || ''}${location.search || ''}`;
}

function getWindowLocationRoute(windowLike) {
  if (!windowLike || !windowLike.location) {
    return '';
  }

  if (windowLike.location.hash) {
    return windowLike.location.hash.replace(/^#/, '') || '/';
  }

  return `${windowLike.location.pathname || '/'}${windowLike.location.search || ''}`;
}

function getLiveLocationRoute(location = {}, windowLike) {
  const liveRoute = getWindowLocationRoute(
    typeof windowLike === 'undefined' ? window : windowLike
  );

  return liveRoute || getStoreLocationRoute(location);
}

function buildRefreshedRouteFromLocation(location = {}, windowLike) {
  const route = getLiveLocationRoute(location, windowLike);
  if (!route) {
    return '';
  }

  const [pathname, queryString = ''] = route.split('?');
  if (!pathname) {
    return '';
  }

  const params = new URLSearchParams(queryString);
  params.set('refresh', `${Date.now()}`);
  const nextSearch = params.toString();

  return `${pathname}${nextSearch ? `?${nextSearch}` : ''}`;
}

module.exports = {
  buildRefreshedRouteFromLocation,
  getLiveLocationRoute,
  getStoreLocationRoute,
  getWindowLocationRoute,
};
