function shouldShowCodeBuildConfig({ buildSource, languageType, runtimeInfo }) {
  return !!(
    buildSource &&
    buildSource.service_source === 'source_code' &&
    languageType &&
    runtimeInfo
  );
}

module.exports = {
  shouldShowCodeBuildConfig
};
