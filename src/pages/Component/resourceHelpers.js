const PACKAGE_BUILD_CONFIG_LANGUAGES = new Set([
  'java-maven',
  'java-jar',
  'java-war',
  'gradle',
  'java-gradle',
  'javagradle',
  'python',
  'php',
  'golang',
  'go',
  'nodejsstatic',
  'nodejs',
  'node',
  'node.js',
  '.netcore',
  'netcore',
  'dotnet',
  'dotnetcore'
]);

function normalizeLanguage(languageType) {
  return (languageType || '').toLowerCase();
}

function supportsPackageBuildConfig(languageType) {
  const normalizedLanguage = normalizeLanguage(languageType);
  return (
    PACKAGE_BUILD_CONFIG_LANGUAGES.has(normalizedLanguage) ||
    normalizedLanguage.includes('dockerfile')
  );
}

function shouldShowCodeBuildConfig({ buildSource, languageType, runtimeInfo }) {
  const serviceSource = buildSource && buildSource.service_source;
  const isSourceCodeBuild = serviceSource === 'source_code';
  const isPackageBuildWithConfig =
    serviceSource === 'package_build' && supportsPackageBuildConfig(languageType);

  return !!(
    buildSource &&
    (isSourceCodeBuild || isPackageBuildWithConfig) &&
    languageType &&
    runtimeInfo
  );
}

module.exports = {
  supportsPackageBuildConfig,
  shouldShowCodeBuildConfig
};
