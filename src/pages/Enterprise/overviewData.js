const platformVersion = require('../../utils/platformVersion');

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
        .filter(item => Array.isArray(item) && isNumber(item[0]) && isNumber(item[1]))
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

function metricChartPoints(metrics) {
  const points = metricPoints(metrics).slice().sort((left, right) => left[0] - right[0]);
  const step = { '1h': 60000, '6h': 300000, '24h': 900000 }[(metrics || {}).range] || 300000;
  return points.reduce((result, point, index) => {
    if (index && point[0] - points[index - 1][0] > step * 1.8) {
      result.push([points[index - 1][0] + step, null]);
    }
    result.push(point);
    return result;
  }, []);
}

function runtimeSection(runtime, name) {
  if (!runtime) return { status: 'loading', data: null };
  if (runtime.status === 'unavailable' && name !== 'clusters') return { status: 'unavailable', data: null };
  const data = runtime.global && runtime.global[name];
  if (!data) return { status: runtime.status === 'partial' ? 'partial' : 'unavailable', data: null };
  return {
    status: data.status || (runtime.status === 'unavailable' ? 'unavailable' : runtime.status === 'partial' ? 'partial' : 'ok'),
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
  if (['CLOSED', 'STOPPED', 'DISABLED'].indexOf(normalized) > -1) {
    return { level: 'stopped', className: 'pluginUnknown', labelId: 'common.stopped' };
  }
  if (['STARTING', 'PENDING', 'DEPLOYING'].indexOf(normalized) > -1) {
    return { level: 'starting', className: 'pluginStarting', labelId: 'common.starting' };
  }
  if (['ABNORMAL', 'FAILED', 'ERROR'].indexOf(normalized) > -1) {
    return { level: 'warning', className: 'pluginWarning', labelId: 'common.abnormal' };
  }
  return { level: 'unknown', className: 'pluginUnknown', labelId: 'common.unknown' };
}

function isNumber(value) {
  return value !== null && value !== undefined && String(value).trim() !== '' && Number.isFinite(Number(value));
}

function formatNumber(value, precision = 1) {
  return isNumber(value) ? parseFloat(Number(value).toFixed(precision)) : '-';
}

function formatThroughput(value) {
  if (!isNumber(value)) return { value: '-', unit: 'B/s' };
  const bytes = Number(value);
  const units = ['B/s', 'KiB/s', 'MiB/s', 'GiB/s'];
  const index = Math.min(units.length - 1, Math.max(0, bytes > 0 ? Math.floor(Math.log(bytes) / Math.log(1024)) : 0));
  return { value: formatNumber(bytes / Math.pow(1024, index), index ? 1 : 0), unit: units[index] };
}

function pluginIcon(plugin) {
  const name = `${plugin.name || ''} ${plugin.alias || ''} ${plugin.display_name || ''}`.toLowerCase();
  if (/monitor|监控/.test(name)) return 'area-chart';
  if (/alert|告警/.test(name)) return 'bell';
  if (/pipeline|ci.?cd|流水线/.test(name)) return 'branches';
  if (/database|mysql|数据库/.test(name)) return 'database';
  if (/log|日志/.test(name)) return 'file-search';
  if (/backup|备份/.test(name)) return 'cloud-upload';
  if (/scan|security|安全|扫描/.test(name)) return 'safety-certificate';
  if (/ai|智能|助手/.test(name)) return 'robot';
  return 'appstore';
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
      const healthDifference = Number(isRunning(left.status)) - Number(isRunning(right.status));
      if (healthDifference) return healthDifference;
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
  isVersionNewer: platformVersion.isVersionNewer,
  isDevelopmentVersion: platformVersion.isDevelopmentVersion,
  latestStableVersion: platformVersion.latestStableVersion,
  isNumber,
  formatNumber,
  formatThroughput,
  licenseState,
  metricState,
  metricPoints,
  metricChartPoints,
  nodeAlertTranslation,
  pluginRuntimeState,
  pluginIcon,
  representativeComponents,
  sectionData,
  sectionEnvelope,
  sectionStatus,
  runtimeSection
};
