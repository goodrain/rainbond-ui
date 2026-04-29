function normalizeRequestedVersion(requestedVersion) {
  return typeof requestedVersion === 'string' ? requestedVersion : '';
}

function buildPublishFormValues(versionInfo, options) {
  const opts = options || {};
  const isCreate = !!opts.isCreate;
  const requestedVersion = normalizeRequestedVersion(opts.requestedVersion);

  let version = '';
  if (isCreate) {
    version = '0.1';
  } else if (requestedVersion) {
    version = requestedVersion;
  }

  return {
    version,
    version_alias: versionInfo ? versionInfo.version_alias : '',
    describe: versionInfo ? versionInfo.describe || versionInfo.app_describe : ''
  };
}

function resolveInitialTemplateSelection(context) {
  const data = context || {};
  const query = data.query || {};
  const list = data.list || [];
  const bean = data.bean || {};
  const listIds = list.map(item => item && item.app_id).filter(Boolean);
  const preferredAppId =
    query.preferred_app_id && listIds.indexOf(query.preferred_app_id) > -1
      ? query.preferred_app_id
      : '';
  const beanAppId =
    bean.app_id && listIds.indexOf(bean.app_id) > -1 ? bean.app_id : '';

  const selectedAppId =
    preferredAppId ||
    beanAppId ||
    (list[0] && list[0].app_id) ||
    '';

  return {
    selectedAppId,
    selectedVersion: ''
  };
}

module.exports = {
  buildPublishFormValues,
  resolveInitialTemplateSelection
};
