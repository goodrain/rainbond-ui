// The data lives only in an owning layout instance. This shared module carries
// invalidation notifications, never plugin results or authentication material.
const changeListeners = new Set();

function pluginScope(enterpriseId, regionName) {
  return JSON.stringify([enterpriseId, regionName]);
}

function isSuccessfulPluginResponse(response, requireList = true) {
  return Boolean(response && (!requireList || Array.isArray(response.list)) &&
    ['status_code', 'business_code', '_condition']
      .every(field => response[field] === undefined || response[field] === 200));
}

function staleInitializationError() {
  const error = new Error('Plugin initialization is no longer current');
  error.code = 'PLUGIN_INITIALIZATION_STALE';
  return error;
}

function createPluginInitializationLoader(request, onSuccess, isOwnerCurrent = () => true) {
  const entries = new Map();
  let disposed = false;

  const invalidate = regionName => {
    if (regionName) {
      entries.forEach((entry, key) => {
        if (entry.regionName === regionName) {
          entries.delete(key);
          if (entry.cancel) entry.cancel(staleInitializationError());
        }
      });
    } else {
      entries.forEach((entry, key) => {
        entries.delete(key);
        if (entry.cancel) entry.cancel(staleInitializationError());
      });
    }
  };

  return {
    invalidate,
    dispose() {
      disposed = true;
      invalidate();
    },
    isCurrentResponse({ enterpriseId, regionName }, response) {
      const entry = entries.get(pluginScope(enterpriseId, regionName));
      return Boolean(!disposed && isOwnerCurrent() && entry && entry.status === 'success' && entry.response === response);
    },
    load({ enterpriseId, regionName, force = false }) {
      if (disposed || !enterpriseId || !regionName) {
        return Promise.reject(staleInitializationError());
      }
      const scope = pluginScope(enterpriseId, regionName);
      if (!force && entries.has(scope)) return entries.get(scope).promise;
      const previous = entries.get(scope);
      if (previous && previous.cancel) previous.cancel(staleInitializationError());

      const entry = { regionName, status: 'pending' };
      entries.set(scope, entry);
      const isCurrent = () => !disposed && isOwnerCurrent() && entries.get(scope) === entry;
      let resolveResult;
      let rejectResult;
      entry.promise = new Promise((resolve, reject) => {
        resolveResult = resolve;
        rejectResult = reject;
      });
      let settled = false;
      const fail = error => {
        if (settled) return;
        settled = true;
        if (entries.get(scope) === entry) entries.delete(scope);
        rejectResult(error || new Error('Failed to load enterprise plugins'));
      };
      entry.cancel = fail;
      const succeed = response => {
        if (settled) return;
        if (!isCurrent()) {
          fail(staleInitializationError());
          return;
        }
        if (!isSuccessfulPluginResponse(response)) {
          fail(new Error('Invalid enterprise plugin response'));
          return;
        }
        try {
          if (onSuccess) onSuccess(response, { enterpriseId, regionName });
          if (!isCurrent()) {
            fail(staleInitializationError());
            return;
          }
          entry.status = 'success';
          entry.response = response;
          settled = true;
          resolveResult(response);
        } catch (error) {
          fail(error);
        }
      };
      try {
        const result = request({ enterprise_id: enterpriseId, region_name: regionName }, succeed, fail, isCurrent);
        if (result && typeof result.then === 'function') {
          result.then(() => {
            if (!settled) fail(new Error('Enterprise plugin request completed without a response'));
          }, fail);
        }
      } catch (error) {
        fail(error);
      }
      return entry.promise;
    }
  };
}

function subscribeEnterprisePluginsChanged(listener) {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

function notifyEnterprisePluginsChanged({ enterpriseId, regionName } = {}) {
  if (!enterpriseId) return;
  changeListeners.forEach(listener => {
    try {
      listener({ enterpriseId, regionName });
    } catch (error) {
      // A refresh subscriber must not turn a successful mutation into an API
      // failure or prevent another layout from invalidating its own snapshot.
    }
  });
}

module.exports = {
  createPluginInitializationLoader,
  isSuccessfulPluginResponse,
  notifyEnterprisePluginsChanged,
  pluginScope,
  subscribeEnterprisePluginsChanged
};
