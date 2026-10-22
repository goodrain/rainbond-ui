const platformVersion = require('../../utils/platformVersion');

const REPRESENTATIVE_COMPONENTS = [
  'rbd-api',
  'rbd-gateway',
  'rbd-worker',
  'rbd-chaos'
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

function percentageAxisMax(points) {
  const peak = (Array.isArray(points) ? points : []).reduce(
    (maximum, point) => Array.isArray(point) && isNumber(point[1])
      ? Math.max(maximum, Number(point[1]))
      : maximum,
    0
  );
  const upper = Math.max(10, Math.ceil(peak * 1.2 / 10) * 10);
  return peak <= 100 ? Math.min(100, upper) : upper;
}

// Match historical measurements exactly; current cluster capacity is never used here.
function absoluteMetricLookup(metrics, metric) {
  const result = new Map();
  const absolute = metrics && metrics.absolute;
  const unit = metric === 'cpu' ? 'cores' : metric === 'memory' ? 'bytes' : null;
  if (!unit || !absolute || absolute.unit !== unit || !Array.isArray(absolute.samples)) return result;
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const percentages = new Map();
  const conflicts = new Set();
  const firstSeries = Array.isArray(metrics.series) ? metrics.series[0] : null;
  const values = firstSeries && Array.isArray(firstSeries.values) ? firstSeries.values : [];
  values.forEach(point => {
    if (!Array.isArray(point) || typeof point[0] === 'boolean' || typeof point[1] === 'boolean' || !isNumber(point[0]) || !isNumber(point[1])) return;
    const time = Number(point[0]) * 1000;
    const percent = Number(point[1]);
    if (!Number.isFinite(time) || time < 0 || percent < 0) return;
    if (percentages.has(time) && percentages.get(time) !== percent) conflicts.add(time);
    percentages.set(time, percent);
  });
  const seen = new Map();
  absolute.samples.forEach(sample => {
    if (!sample || !finite(sample.timestamp) || sample.timestamp < 0) return;
    const time = sample.timestamp * 1000;
    if (!Number.isFinite(time)) return;
    if (seen.has(time) && (seen.get(time).used !== sample.used || seen.get(time).capacity !== sample.capacity)) conflicts.add(time);
    seen.set(time, sample);
    if (!finite(sample.used) || !finite(sample.capacity) || sample.used < 0 || sample.capacity <= 0 || !percentages.has(time)) return;
    const percent = percentages.get(time);
    const ratio = sample.used / sample.capacity * 100;
    if (!Number.isFinite(ratio) || Math.abs(ratio - percent) > Math.max(0.0001, Math.abs(percent) * 0.000001)) return;
    result.set(time, { used: sample.used, capacity: sample.capacity, unit });
  });
  conflicts.forEach(time => result.delete(time));
  return result;
}

function formatMetricAmount(value, unit) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  if (unit === 'cores') return value > 0 && value < 0.01
    ? { value: formatNumber(value * 1000, 2), unit: 'mCore' }
    : { value: formatNumber(value, 2), unit: 'Core' };
  if (unit !== 'bytes') return null;
  const amount = formatThroughput(value);
  return { value: amount.value, unit: amount.unit.replace('/s', '') };
}

function metricTooltipHtml(point, options) {
  if (!point || !Array.isArray(point.value) || typeof point.value[0] === 'boolean' || typeof point.value[1] === 'boolean' || !isNumber(point.value[0]) || !isNumber(point.value[1])) return '';
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const { metric, lookup, timeLabel, seriesLabel, unitLabel, usageLabel, unavailableLabel } = options;
  const percent = Number(point.value[1]);
  const lines = [escape(timeLabel)];
  if (metric !== 'network') {
    const sample = lookup && lookup.get(Number(point.value[0]));
    const used = sample && formatMetricAmount(sample.used, sample.unit);
    const capacity = sample && formatMetricAmount(sample.capacity, sample.unit);
    lines.push(used && capacity
      ? `${escape(usageLabel)}: ${used.value} ${used.unit} / ${capacity.value} ${capacity.unit}`
      : escape(unavailableLabel));
  }
  const value = metric === 'network' ? formatThroughput(percent) : { value: percent.toFixed(2), unit: unitLabel };
  lines.push(`${escape(seriesLabel)} ${value.value} ${escape(value.unit)}`);
  return lines.join('<br/>');
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
  if (alert && ['certificate_expiring', 'certificate_expired'].indexOf(alert.type) > -1) {
    return {
      id: alert.type === 'certificate_expired' ? 'cluster.certificateExpired' : 'cluster.certificateExpiring',
      values: { certificate: alert.certificate_name || '-', date: alert.expires_at || '-', days: alert.remaining_days }
    };
  }
  if (alert && alert.type === 'certificate_warning') {
    return {
      id: alert.reason === 'CACertificateExpirationWarning' ? 'cluster.caCertificateWarning' : 'cluster.certificateWarning',
      values: {}
    };
  }
  return { id: alert && alert.type === 'node_not_ready' ? 'cluster.nodeNotReady' : 'cluster.unknownAlert', values: {} };
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

function platformLicenseSummary(license, requestStatus) {
  const result = (level, labelId, expireAt = null) => ({ level, labelId, expireAt });
  if (!requestStatus || requestStatus === 'idle' || requestStatus === 'loading') {
    return result('loading', 'header.licenseChecking');
  }
  if (requestStatus === 'error') return result('unknown', 'header.licenseUnavailable');
  if (requestStatus === 'empty') return result('neutral', 'header.licenseMissing');
  if (requestStatus === 'invalid') return result('warning', 'header.licenseInvalid');
  if (requestStatus !== 'success' || !license) return result('unknown', 'header.licenseUnknown');
  const expireAt = typeof license.expire_at !== 'boolean' && isNumber(license.expire_at) && Number(license.expire_at) > 0 ? Number(license.expire_at) : null;
  if (license.valid === true) return result('healthy', 'header.licenseValid', expireAt);
  const reason = String(license.reason || '').toLowerCase();
  if (license.valid === false && /expired|过期/.test(reason)) {
    return result('warning', 'header.licenseExpired', expireAt);
  }
  if (license.valid === false && /not.?yet.?valid|未生效/.test(reason)) {
    return result('neutral', 'header.licensePending', expireAt);
  }
  return result('unknown', 'header.licenseUnknown');
}

function platformClusterSummary(runtime) {
  const clusters = runtime && runtime.global && runtime.global.clusters;
  const result = (level, labelId, values = {}) => ({ level, labelId, values });
  if (!clusters) return result(runtime ? 'unknown' : 'loading', runtime ? 'header.runtimeUnknown' : 'header.runtimeChecking');
  const count = value => typeof value !== 'boolean' && isNumber(value) && Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
  const warning = count(clusters.warning);
  const unavailable = count(clusters.unavailable);
  if (warning !== null && unavailable !== null && warning + unavailable > 0) {
    return result('warning', 'header.clusterAttention', { count: warning + unavailable });
  }
  if (warning === 0 && unavailable === 0 && count(clusters.healthy) > 0) {
    return result('healthy', 'header.clusterReady', { count: Number(clusters.healthy) });
  }
  if (count(clusters.total) === 0) return result('neutral', 'header.clusterEmpty');
  if (count(clusters.disabled) > 0 && count(clusters.disabled) === count(clusters.total)) {
    return result('neutral', 'header.clusterDisabled', { count: Number(clusters.disabled) });
  }
  return result('unknown', 'header.runtimeUnknown');
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

function pluginPresentation(plugins) {
  const priority = { warning: 0, unknown: 1, starting: 2, healthy: 3, stopped: 4 };
  const ordered = (Array.isArray(plugins) ? plugins : []).map((plugin, index) => ({
    plugin, index, runtime: pluginRuntimeState(plugin.status)
  })).sort((a, b) => priority[a.runtime.level] - priority[b.runtime.level] || a.index - b.index);
  const summary = Object.keys(priority).map(level => ({
    level,
    count: ordered.filter(item => item.runtime.level === level).length,
    runtime: ordered.find(item => item.runtime.level === level)
  })).filter(item => item.count).map(item => ({ ...item, runtime: item.runtime.runtime }));
  return { ordered, preview: ordered.slice(0, 8), summary };
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
    .slice(0, 4);
}

function compactVersion(version) {
  const match = String(version || '').match(/^v?\d+(?:\.\d+){1,2}/);
  return match ? `v${match[0].replace(/^v/, '')}` : version || '-';
}

module.exports = {
  pluginPresentation,
  absoluteMetricLookup,
  formatMetricAmount,
  metricTooltipHtml,
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
  platformLicenseSummary,
  platformClusterSummary,
  metricState,
  metricPoints,
  metricChartPoints,
  percentageAxisMax,
  nodeAlertTranslation,
  pluginRuntimeState,
  pluginIcon,
  representativeComponents,
  sectionData,
  sectionEnvelope,
  sectionStatus,
  runtimeSection
};
