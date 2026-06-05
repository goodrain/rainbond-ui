function normalizeGroupId(value) {
  if (value === undefined || value === null) {
    return '';
  }

  const normalized = String(value).trim();
  if (
    !normalized ||
    normalized === 'undefined' ||
    normalized === 'null'
  ) {
    return '';
  }

  return normalized;
}

function resolveCreateCheckGroupId({ locationQuery = {}, appDetail = {} } = {}) {
  return (
    normalizeGroupId(locationQuery.group_id) ||
    normalizeGroupId(appDetail.group_id) ||
    normalizeGroupId(appDetail.service && appDetail.service.group_id)
  );
}

function buildCreatedComponentOverviewTarget({
  groupId,
  appAlias,
  serviceSource
} = {}) {
  const normalizedGroupId = normalizeGroupId(groupId);
  if (!normalizedGroupId || !appAlias) {
    return '';
  }

  const tab =
    serviceSource === 'third_party' ? 'thirdPartyServices' : 'overview';
  return `apps/${normalizedGroupId}/overview?type=components&componentID=${appAlias}&tab=${tab}`;
}

module.exports = {
  buildCreatedComponentOverviewTarget,
  resolveCreateCheckGroupId
};
