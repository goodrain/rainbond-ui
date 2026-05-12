const START_MODE_FIELDS = [
  'GO_START_MODE',
  'DOTNET_START_MODE',
  'PHP_START_MODE',
  'JAVA_START_MODE'
];

const META_FIELDS = [
  'runtime_info',
  'build_strategy',
  'cnb_version_policy',
  'JDK_TYPE',
  ...START_MODE_FIELDS
];

const isBuildEnvTruthy = value => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
  return value === true || value === 1;
};

const isStaticNodeFramework = framework =>
  typeof framework === 'string' &&
  (framework === 'other-static' || framework.endsWith('-static'));

const hasNodePackageManagerPrefix = value =>
  typeof value === 'string' &&
  /^(npm|pnpm|yarn)(\s|$)/i.test(value.trim());

const mergeCreateRuntimeInfo = (runtimeInfo = {}, sourceBuildConfig = null) => {
  const mergedRuntimeInfo = { ...(runtimeInfo || {}) };
  const buildEnvDict = sourceBuildConfig?.build_env_dict;

  if (buildEnvDict && typeof buildEnvDict === 'object') {
    Object.assign(mergedRuntimeInfo, buildEnvDict);
  }

  if (sourceBuildConfig?.build_strategy) {
    mergedRuntimeInfo.build_strategy = sourceBuildConfig.build_strategy;
  }

  return mergedRuntimeInfo;
};

const mergeRuntimeBuildEnvs = (existingEnvs = {}, fieldsValue = {}) => {
  const mergedValues = { ...(existingEnvs || {}), ...(fieldsValue || {}) };

  if (fieldsValue.BUILD_NO_CACHE === false) {
    delete mergedValues.BUILD_NO_CACHE;
  }

  if (fieldsValue.BUILD_MAVEN_MIRROR_DISABLE === false) {
    delete mergedValues.BUILD_MAVEN_MIRROR_DISABLE;
  }

  if (fieldsValue.JDK_TYPE && fieldsValue.JDK_TYPE !== 'Jdk') {
    delete mergedValues.BUILD_ENABLE_ORACLEJDK;
  }

  if (
    typeof fieldsValue.BUILD_PROCFILE === 'string' &&
    fieldsValue.BUILD_PROCFILE.trim() === ''
  ) {
    delete mergedValues.BUILD_PROCFILE;
  }

  if (START_MODE_FIELDS.some(field => fieldsValue[field] === 'default')) {
    delete mergedValues.BUILD_PROCFILE;
  }

  if (
    typeof fieldsValue.CNB_START_SCRIPT === 'string' &&
    fieldsValue.CNB_START_SCRIPT.trim() === ''
  ) {
    delete mergedValues.CNB_START_SCRIPT;
  }

  if (isStaticNodeFramework(fieldsValue.CNB_FRAMEWORK)) {
    delete mergedValues.CNB_START_SCRIPT;
  }

  META_FIELDS.forEach(field => {
    delete mergedValues[field];
  });

  return mergedValues;
};

module.exports = {
  hasNodePackageManagerPrefix,
  isBuildEnvTruthy,
  mergeCreateRuntimeInfo,
  mergeRuntimeBuildEnvs
};
