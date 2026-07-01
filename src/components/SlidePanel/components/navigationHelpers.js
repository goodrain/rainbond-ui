function normalizeId(value) {
  if (value === undefined || value === null) {
    return '';
  }
  const normalized = String(value).trim();
  if (!normalized || normalized === 'undefined' || normalized === 'null') {
    return '';
  }
  return normalized;
}

function buildAppOverviewFallbackRoute({ prefixUrl = '', groupId = '' } = {}) {
  const normalizedGroupId = normalizeId(groupId);
  if (!normalizedGroupId) {
    return '';
  }
  return `${prefixUrl}apps/${normalizedGroupId}/overview`;
}

module.exports = {
  buildAppOverviewFallbackRoute,
};
