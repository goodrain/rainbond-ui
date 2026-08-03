const AUTHORIZATION_PATHS = ['/cli-auth', '/device'];

function getOrigin(origin) {
  if (origin) {
    return origin;
  }
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return null;
}

function getRoutePath(target) {
  const hashPath = target.hash.replace(/^#/, '').split('?')[0];
  return hashPath || target.pathname;
}

function getSafeRedirect(redirect, origin) {
  const currentOrigin = getOrigin(origin);
  if (!redirect || !currentOrigin) {
    return null;
  }
  try {
    const target = new URL(redirect, currentOrigin);
    if (target.origin === currentOrigin) {
      return target.href;
    }
  } catch (error) {
    return null;
  }
  return null;
}

function getAuthorizationRedirect(redirect, origin) {
  const safeRedirect = getSafeRedirect(redirect, origin);
  if (!safeRedirect) {
    return null;
  }
  const target = new URL(safeRedirect);
  return AUTHORIZATION_PATHS.includes(getRoutePath(target))
    ? target.href
    : null;
}

function redirectToAuthorization(redirect, location, storage) {
  const currentLocation =
    location || (typeof window !== 'undefined' ? window.location : null);
  const currentStorage =
    storage || (typeof window !== 'undefined' ? window.localStorage : null);
  const target = getAuthorizationRedirect(
    redirect,
    currentLocation && currentLocation.origin
  );
  if (!target || !currentLocation) {
    return false;
  }
  if (currentStorage) {
    currentStorage.removeItem('redirect');
  }
  currentLocation.assign(target);
  return true;
}

module.exports = {
  getAuthorizationRedirect,
  getSafeRedirect,
  redirectToAuthorization
};
