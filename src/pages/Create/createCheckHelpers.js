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

function shouldShowMultiModuleBuildChoice({
  isMulti = false,
  serviceInfo = []
} = {}) {
  if (!isMulti || !Array.isArray(serviceInfo)) {
    return false;
  }

  const languageInfo = serviceInfo.find(item => item.type === 'language');
  const languages = String((languageInfo && languageInfo.value) || '')
    .split(',')
    .map(language => language.trim().toLowerCase());
  const dockerfileInfo = serviceInfo.find(item => item.type === 'dockerfiles');
  const dockerfiles = dockerfileInfo && dockerfileInfo.value;

  return (
    languages.includes('dockerfile') &&
    Array.isArray(dockerfiles) &&
    dockerfiles.length > 0
  );
}

function shouldEnterMultiServiceBuild({
  isMulti = false,
  codeLanguage = ''
} = {}) {
  return (
    isMulti && String(codeLanguage).trim().toLowerCase() !== 'dockerfile'
  );
}

module.exports = {
  buildCreatedComponentOverviewTarget,
  resolveCreateCheckGroupId,
  shouldEnterMultiServiceBuild,
  shouldShowMultiModuleBuildChoice
};
