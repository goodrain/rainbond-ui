const TEMPORARY_VOLUME_TYPES = new Set(['memoryfs', 'config-file']);

function normalizeVmCreationStorageOptions(options) {
  const seen = new Set();
  return (Array.isArray(options) ? options : []).reduce((result, option) => {
    if (!option || typeof option !== 'object' || typeof option.volume_type !== 'string') return result;
    const value = option.volume_type;
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(value) || TEMPORARY_VOLUME_TYPES.has(value.toLowerCase()) ||
      option.enable === false || seen.has(value)) return result;
    seen.add(value);
    const display = typeof option.name_show === 'string' ? option.name_show.trim() : '';
    result.push({ value, label: display && !/[\u0000-\u001f\u007f-\u009f]/.test(display) ? display.slice(0, 256) : value });
    return result;
  }, []);
}

function storageResult(options) {
  const safeOptions = normalizeVmCreationStorageOptions(options);
  return {
    status: safeOptions.length ? 'ready' : 'empty',
    options: safeOptions,
    reason: safeOptions.length ? 'available' : 'no-persistent-storage'
  };
}

function failed(reason = 'request-failed') {
  return { status: 'failed', options: [], reason };
}

function successful(response) {
  if (!response || typeof response !== 'object') return false;
  const status = Number(response.status_code || response._code);
  const code = response.business_code === undefined ? response._condition : response.business_code;
  return status >= 200 && status < 300 && (code === undefined || Number(code) >= 200 && Number(code) < 300);
}

function isCurrent(isActive) {
  try { return typeof isActive !== 'function' || Boolean(isActive()); } catch (_) { return false; }
}

async function fetchVmCreationStorage({ payload = {}, isActive } = {}, api = {}) {
  if (!/^[\w-]+$/.test(payload.team_name || '') || !/^[\w-]+$/.test(payload.region_name || ''))
    return failed('invalid-scope');
  if (!isCurrent(isActive)) return failed('cancelled');
  let capabilities;
  try {
    capabilities = await api.getCapabilities({ team_name: payload.team_name, region_name: payload.region_name });
  } catch (_) {
    return failed(isCurrent(isActive) ? 'request-failed' : 'cancelled');
  }
  if (!isCurrent(isActive)) return failed('cancelled');
  if (!successful(capabilities)) return failed();
  const bean = capabilities.bean;
  if (!bean || typeof bean !== 'object' || Array.isArray(bean)) return failed('invalid-response');
  if (bean.storage_options_error === true) return failed('capability-error');
  if (Object.prototype.hasOwnProperty.call(bean, 'storage_options')) {
    if (!Array.isArray(bean.storage_options)) return failed('invalid-response');
    // An explicitly empty capability list is authoritative. Only an absent
    // field identifies the legacy Console contract that needs a fallback.
    return storageResult(bean.storage_options);
  }
  if (!isCurrent(isActive)) return failed('cancelled');
  try {
    const legacy = await api.getLegacyVolumeOpts({ team_name: payload.team_name, region_name: payload.region_name });
    if (!isCurrent(isActive)) return failed('cancelled');
    if (!successful(legacy)) {
      if (Number(legacy && (legacy.status_code || legacy._code)) === 403)
        return { status: 'deferred', options: [], reason: 'legacy-permission' };
      return failed();
    }
    if (!Array.isArray(legacy.list)) return failed('invalid-response');
    return storageResult(legacy.list);
  } catch (error) {
    if (!isCurrent(isActive)) return failed('cancelled');
    return Number(error && error.status) === 403
      ? { status: 'deferred', options: [], reason: 'legacy-permission' } : failed();
  }
}

function storageReadError(status, reason = 'request-failed') {
  const error = new Error('VM storage request failed');
  error.name = 'VmStorageRequestError';
  error.status = Number.isInteger(status) && status >= 100 && status <= 599 ? status : 0;
  error.reason = reason;
  return error;
}

function requestVmCreationStorage(request, url, body, handleError, currentScope) {
  // request.js derives these headers from the live route. Reject a stale scope
  // synchronously before constructing the GET, so it cannot target a new route.
  if (!body.team_name || !body.region_name || body.team_name !== currentScope.team_name ||
    body.region_name !== currentScope.region_name) {
    if (handleError) handleError(storageReadError(0, 'scope-changed'));
    return Promise.resolve(undefined);
  }
  let httpStatus = 0;
  return request(url, {
    method: 'get', showMessage: false, showLoading: false, sensitiveError: true,
    headers: { X_REGION_NAME: body.region_name, X_TEAM_NAME: body.team_name },
    validateStatus: status => {
      httpStatus = status;
      return status >= 200 && status < 300;
    },
    handleError: () => {
      // Keep only the HTTP number, even though the shared sensitive request
      // path intentionally removes the original Axios response and config.
      if (handleError) handleError(storageReadError(httpStatus));
    }
  });
}

module.exports = {
  fetchVmCreationStorage,
  normalizeVmCreationStorageOptions,
  requestVmCreationStorage
};
