import { DEFAULT_TABLE_COLUMN_WIDTH } from './constants';
import { getResourceStatusMeta } from './utils';

export function parseVersionToken(input) {
  const value = (input || '').trim();
  if (!value) {
    return null;
  }
  const matched = value.match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(.*)$/);
  if (!matched) {
    return null;
  }
  return {
    major: Number(matched[1] || 0),
    minor: Number(matched[2] || 0),
    patch: Number(matched[3] || 0),
    suffix: matched[4] || '',
  };
}

export function compareHelmVersions(left, right) {
  const a = parseVersionToken(left);
  const b = parseVersionToken(right);
  if (!a || !b) {
    return String(left || '').localeCompare(String(right || ''));
  }
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  return a.suffix.localeCompare(b.suffix);
}

export function getStatusSummary(list = []) {
  return list.reduce((summary, item) => {
    const tone = getResourceStatusMeta(item.status).tone;
    summary.total += 1;
    if (tone === 'running') {
      summary.running += 1;
    } else if (tone === 'warning') {
      summary.warning += 1;
    } else if (tone === 'error') {
      summary.error += 1;
    } else {
      summary.default += 1;
    }
    return summary;
  }, {
    total: 0,
    running: 0,
    warning: 0,
    error: 0,
    default: 0,
  });
}

export function getDistinctCount(list = [], getter) {
  return new Set(
    (list || [])
      .map(item => getter(item))
      .filter(Boolean)
  ).size;
}

export function getTableScroll(columns) {
  return {
    x: columns.reduce(
      (width, column) =>
        width + (typeof column.width === 'number' ? column.width : DEFAULT_TABLE_COLUMN_WIDTH),
      0
    ),
  };
}

export function getTablePagination(data = []) {
  return data.length > 10 ? { pageSize: 10, size: 'small' } : false;
}

export function getLatestRevision(list = []) {
  return Math.max.apply(null, [0].concat((list || []).map(item => item.revision || 0)));
}
