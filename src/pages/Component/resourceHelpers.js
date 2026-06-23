function shouldShowCodeBuildConfig({ buildSource, languageType, runtimeInfo }) {
  const serviceSource = buildSource && buildSource.service_source;
  const normalizedLanguage = (languageType || '').toLowerCase();
  const isSourceCodeBuild = serviceSource === 'source_code';
  const isPackageJavaArchiveBuild =
    serviceSource === 'package_build' &&
    (normalizedLanguage === 'java-jar' || normalizedLanguage === 'java-war');

  return !!(
    buildSource &&
    (isSourceCodeBuild || isPackageJavaArchiveBuild) &&
    languageType &&
    runtimeInfo
  );
}

module.exports = {
  shouldShowCodeBuildConfig
};
