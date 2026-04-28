function buildPublishFormValues(versionInfo, options) {
  const opts = options || {};
  const isCreate = !!opts.isCreate;
  const publishMode = opts.publishMode || 'runtime';
  const requestedVersion =
    typeof opts.requestedVersion === 'string' ? opts.requestedVersion : '';

  let version = '';
  if (isCreate) {
    version = '0.1';
  } else if (requestedVersion) {
    version = requestedVersion;
  } else if (publishMode === 'snapshot' && versionInfo && versionInfo.version) {
    version = versionInfo.version;
  }

  return {
    version,
    version_alias: versionInfo ? versionInfo.version_alias : '',
    describe: versionInfo ? versionInfo.describe || versionInfo.app_describe : ''
  };
}

function buildSnapshotPublishFormPatch(versionInfo, publishMode, currentVersion) {
  if (publishMode !== 'snapshot' || !versionInfo || currentVersion) {
    return null;
  }
  return buildPublishFormValues(versionInfo, {
    publishMode
  });
}

module.exports = {
  buildPublishFormValues,
  buildSnapshotPublishFormPatch
};
