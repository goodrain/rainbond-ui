function normalizePortalBase(portalSite) {
  return (portalSite || '').replace(/\/+$/, '');
}

function buildPortalUrl(portalSite, path, params) {
  const base = normalizePortalBase(portalSite);
  if (!base) {
    return '';
  }

  const target = `${base}${path}`;
  try {
    const url = new URL(target);
    Object.keys(params || {}).forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  } catch (error) {
    const query = new URLSearchParams(params || {}).toString();
    return query ? `${target}?${query}` : target;
  }
}

export function buildPortalLoginUrl(portalSite, redirect) {
  return buildPortalUrl(portalSite, '/login', { redirect });
}

export function buildPortalSsoUrl(portalSite, token, redirect) {
  return buildPortalUrl(portalSite, '/sso', { token, redirect });
}
