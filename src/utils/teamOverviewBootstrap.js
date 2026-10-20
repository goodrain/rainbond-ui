function staleOverviewError() {
  const error = new Error('Team overview bootstrap is stale');
  error.code = 'TEAM_OVERVIEW_STALE';
  return error;
}

// This is owned by one mounted layout, not a timed/global response cache.
function createTeamOverviewBootstrap(request, isOwnerCurrent) {
  let entry = null;
  let disposed = false;
  let generation = 0;
  const invalidate = () => {
    generation += 1;
    const previous = entry;
    entry = null;
    if (previous) previous.cancel(staleOverviewError());
  };
  const valid = current => !disposed && entry === current &&
    generation === current.generation && isOwnerCurrent(current.identity);
  return {
    invalidate,
    dispose() { disposed = true; invalidate(); },
    isCurrentResponse(response) {
      return Boolean(entry && entry.hasResponse && entry.response === response && valid(entry));
    },
    load(identity, payload, { force = false } = {}) {
      if (disposed || !identity || !isOwnerCurrent(identity)) return Promise.reject(staleOverviewError());
      if (!force && entry && entry.identity === identity) return entry.promise;
      invalidate();
      const current = { identity, generation };
      let resolve;
      let reject;
      let settled = false;
      // Publish the Promise before invoking request: synchronous/reentrant
      // consumers must also see this exact pending initialization.
      current.promise = new Promise((succeed, fail) => { resolve = succeed; reject = fail; });
      current.cancel = error => {
        if (settled) return;
        settled = true;
        reject(error);
      };
      entry = current;
      const succeed = response => {
        if (!valid(current)) { current.cancel(staleOverviewError()); return; }
        if (settled) return;
        settled = true;
        current.hasResponse = true;
        current.response = response;
        resolve(response);
      };
      try { request(payload, succeed, current.cancel, () => valid(current)); }
      catch (error) { current.cancel(error); }
      return current.promise;
    }
  };
}

function permissionFingerprint(value) {
  if (Array.isArray(value)) return value.map(permissionFingerprint).sort();
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = permissionFingerprint(value[key]);
      return result;
    }, Object.create(null));
  }
  return value;
}

// Initial Redux hydration fills an unknown identity without starting a second
// bootstrap. Once known, every actual change invalidates immediately, including
// checks made after props change but before componentDidUpdate executes.
function createTeamOverviewScope() {
  let route;
  let generation = 0;
  const fields = {};
  return ({ teamName, regionName, userId, enterpriseId, permissions, isEnterpriseAdmin, userRoles }) => {
    const nextRoute = JSON.stringify([teamName || '', regionName || '']);
    if (route !== nextRoute) {
      route = nextRoute;
      generation += 1;
      delete fields.permissions;
    }
    const values = {
      userId: userId === undefined || userId === null ? '' : String(userId),
      enterpriseId: enterpriseId || '',
      isEnterpriseAdmin: typeof isEnterpriseAdmin === 'boolean' ? String(isEnterpriseAdmin) : '',
      userRoles: userRoles == null ? '' : JSON.stringify(permissionFingerprint(userRoles)),
      permissions: permissions == null ? '' : JSON.stringify(permissionFingerprint(permissions))
    };
    Object.keys(values).forEach(key => {
      const value = values[key];
      if (!Object.prototype.hasOwnProperty.call(fields, key)) {
        if (value !== '') fields[key] = value;
      } else if (fields[key] !== value) {
        fields[key] = value;
        generation += 1;
      }
    });
    return teamName && regionName ? JSON.stringify([route, generation]) : '';
  };
}

module.exports = { createTeamOverviewBootstrap, createTeamOverviewScope };
