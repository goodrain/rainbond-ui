const REPRESENTATIVE_COMPONENTS = [
  'rbd-api',
  'rbd-gateway',
  'rbd-worker',
  'rbd-app-ui',
  'rbd-monitor',
  'rbd-chaos',
  'minio',
  'rbd-db'
];

function sectionData(snapshot, name) {
  const section = sectionEnvelope(snapshot, name);
  return section.status === 'ok' ? section.data : null;
}

function sectionStatus(snapshot, name) {
  return sectionEnvelope(snapshot, name).status;
}

function sectionEnvelope(snapshot, name) {
  if (!snapshot) return { status: 'loading', data: null };
  const section = snapshot.sections && snapshot.sections[name];
  if (!section) return { status: 'unavailable', data: null };
  return { status: section.status || 'unavailable', data: section.data || null };
}

function metricPoints(metrics) {
  const firstSeries = metrics && Array.isArray(metrics.series) ? metrics.series[0] : null;
  return firstSeries && Array.isArray(firstSeries.values)
    ? firstSeries.values
        .map(item => [Number(item[0]) * 1000, Number(item[1])])
        .filter(item => Number.isFinite(item[0]) && Number.isFinite(item[1]))
    : [];
}

function metricState(metrics) {
  if (!metrics) return { status: 'loading', points: [], data: null };
  const status = metrics.status || 'unavailable';
  return {
    status,
    points: status === 'ok' ? metricPoints(metrics) : [],
    data: status === 'ok' ? metrics : null
  };
}

function runtimeSection(runtime, name) {
  if (!runtime) return { status: 'loading', data: null };
  if (runtime.status === 'unavailable') return { status: 'unavailable', data: null };
  const data = runtime.global && runtime.global[name];
  if (!data) return { status: runtime.status === 'partial' ? 'partial' : 'unavailable', data: null };
  return {
    status: data.status || (runtime.status === 'partial' ? 'partial' : 'ok'),
    data
  };
}

function nodeAlertTranslation(alert) {
  if (alert && alert.type === 'disk_usage') {
    return {
      id: 'cluster.diskUsage',
      values: {
        filesystem: alert.filesystem === 'container' ? 'container' : 'root',
        percent: Number(alert.usage_percent || 0)
      }
    };
  }
  return { id: 'cluster.nodeNotReady', values: {} };
}

function licenseState(license) {
  if (!license) return { present: false, valid: false, reason: '', expireAt: null };
  const valid = license.valid === true;
  return {
    present: true,
    valid,
    reason: valid ? '' : license.reason || license.code || '',
    expireAt: valid && Number(license.expire_at || 0) > 0 ? Number(license.expire_at) : null
  };
}

function classifyLicenseRequestError(error) {
  const response = (error && error.response) || {};
  const body = response.data || {};
  const nested = body.data || {};
  const bean = nested.bean || body.bean || {};
  const code = Number(body.code || response.status || 0);
  const errorCode = String(body.error_code || nested.error_code || '').toLowerCase();
  const message = [body.msg, body.msg_show, errorCode].filter(Boolean).join(' ').toLowerCase();
  const isLicenseBusinessError =
    code === 400 && /license|authz|授权/.test(message);
  if (!isLicenseBusinessError) {
    return { status: 'error', reason: body.msg_show || body.msg || '' };
  }
  const explicitEmpty = /no[_\s-]?license|missing|not[_\s-]?found/.test(message);
  const invalidAuthzWithoutCode =
    /invalid[_\s-]?authz|invalid authz/.test(message) && !bean.authz_code;
  if (explicitEmpty || invalidAuthzWithoutCode) {
    return { status: 'empty', reason: body.msg_show || body.msg || '' };
  }
  return { status: 'invalid', reason: body.msg_show || body.msg || errorCode };
}

function isRunning(status) {
  return ['RUNNING', 'READY', 'HEALTHY', 'NORMAL', 'SUCCESS', 'COMPLETED'].indexOf(
    String(status || '').toUpperCase()
  ) > -1;
}

function pluginRuntimeState(status) {
  const normalized = String(status || '').trim().toUpperCase();
  if (['RUNNING', 'READY', 'HEALTHY', 'NORMAL', 'SUCCESS'].indexOf(normalized) > -1) {
    return { level: 'healthy', className: 'pluginHealthy', labelId: 'common.normal' };
  }
  if (['ABNORMAL', 'CLOSED', 'STARTING', 'FAILED', 'ERROR'].indexOf(normalized) > -1) {
    return { level: 'warning', className: 'pluginWarning', labelId: 'common.warning' };
  }
  return { level: 'unknown', className: 'pluginUnknown', labelId: 'common.unknown' };
}

function isVersionNewer(latest, current) {
  const parse = value => {
    const match = String(value || '').match(/\d+(?:\.\d+){1,2}/);
    return match ? match[0].split('.').map(Number) : [];
  };
  const latestParts = parse(latest);
  const currentParts = parse(current);
  if (!latestParts.length || !currentParts.length) return false;
  for (let index = 0; index < Math.max(latestParts.length, currentParts.length); index += 1) {
    const latestPart = latestParts[index] || 0;
    const currentPart = currentParts[index] || 0;
    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }
  return false;
}

function representativeComponents(components) {
  const list = Array.isArray(components) ? components : [];
  const priority = {};
  REPRESENTATIVE_COMPONENTS.forEach((name, index) => {
    priority[name] = index;
  });
  return list
    .slice()
    .sort((left, right) => {
      const leftPriority = Object.prototype.hasOwnProperty.call(priority, left.name)
        ? priority[left.name]
        : REPRESENTATIVE_COMPONENTS.length;
      const rightPriority = Object.prototype.hasOwnProperty.call(priority, right.name)
        ? priority[right.name]
        : REPRESENTATIVE_COMPONENTS.length;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return String(left.name || '').localeCompare(String(right.name || ''));
    })
    .slice(0, 8);
}

function compactVersion(version) {
  const match = String(version || '').match(/^v?\d+(?:\.\d+){1,2}/);
  return match ? `v${match[0].replace(/^v/, '')}` : version || '-';
}

module.exports = {
  compactVersion,
  classifyLicenseRequestError,
  isRunning,
  isVersionNewer,
  licenseState,
  metricState,
  metricPoints,
  nodeAlertTranslation,
  pluginRuntimeState,
  representativeComponents,
  sectionData,
  sectionEnvelope,
  sectionStatus,
  runtimeSection
};
