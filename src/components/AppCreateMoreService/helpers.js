const {
  mergeRuntimeBuildEnvs
} = require('../CodeBuildConfig/buildEnvHelpers');

const MODULE_ROLE_RUNNABLE = 'runnable';
const MODULE_ROLE_POSSIBLE_DEPENDENCY = 'possible_dependency';
const MAVEN_CANONICAL_LEGACY_ALIASES = {
  BP_MAVEN_BUILD_ARGUMENTS: 'BUILD_MAVEN_CUSTOM_GOALS',
  BP_MAVEN_ADDITIONAL_BUILD_ARGUMENTS: 'BUILD_MAVEN_CUSTOM_OPTS',
  BP_MAVEN_BUILT_MODULE: 'BUILD_MAVEN_BUILT_MODULE',
  BP_MAVEN_BUILT_ARTIFACT: 'BUILD_MAVEN_BUILT_ARTIFACT'
};

const roleRank = role => {
  if (role === MODULE_ROLE_RUNNABLE) {
    return 0;
  }
  if (role === MODULE_ROLE_POSSIBLE_DEPENDENCY) {
    return 2;
  }
  return 1;
};

const cloneModule = module => {
  if (!module || typeof module !== 'object') {
    return module;
  }
  return {
    ...module,
    envs: Array.isArray(module.envs)
      ? module.envs.map(env =>
          env && typeof env === 'object' ? { ...env } : env
        )
      : module.envs
  };
};

const sortModules = (modules = []) =>
  (Array.isArray(modules) ? modules : [])
    .map((module, index) => ({ module: cloneModule(module), index }))
    .sort((left, right) => {
      const rankDiff =
        roleRank(left.module && left.module.module_role) -
        roleRank(right.module && right.module.module_role);
      return rankDiff || left.index - right.index;
    })
    .map(item => item.module);

const getDefaultSelectedKeys = (modules = []) => {
  const moduleList = Array.isArray(modules) ? modules : [];
  const runnableModules = moduleList.filter(
    module => module && module.module_role === MODULE_ROLE_RUNNABLE
  );
  const selectedModules = runnableModules.length ? runnableModules : moduleList;
  return selectedModules.map(module => module && module.id);
};

const getSelectedModules = (modules = [], selectedKeys = []) => {
  const keyList = Array.isArray(selectedKeys) ? selectedKeys : [];
  return (Array.isArray(modules) ? modules : []).filter(
    module => module && keyList.indexOf(module.id) !== -1
  );
};

const hasSameModuleIds = (previousModules = [], nextModules = []) => {
  const previousIds = (Array.isArray(previousModules) ? previousModules : []).map(
    module => module && module.id
  );
  const unmatchedIds = (Array.isArray(nextModules) ? nextModules : []).map(
    module => module && module.id
  );
  if (previousIds.length !== unmatchedIds.length) {
    return false;
  }
  return previousIds.every(id => {
    const matchIndex = unmatchedIds.indexOf(id);
    if (matchIndex === -1) {
      return false;
    }
    unmatchedIds.splice(matchIndex, 1);
    return true;
  });
};

const reconcileSelectedKeys = (
  previousModules = [],
  nextModules = [],
  selectedKeys = []
) => {
  if (!hasSameModuleIds(previousModules, nextModules)) {
    return getDefaultSelectedKeys(nextModules);
  }
  const nextIds = nextModules.map(module => module && module.id);
  return (Array.isArray(selectedKeys) ? selectedKeys : []).filter(
    key => nextIds.indexOf(key) !== -1
  );
};

const envListToMap = (envs = []) =>
  (Array.isArray(envs) ? envs : []).reduce((envMap, env) => {
    if (env && env.name) {
      envMap[env.name] = env.value;
    }
    return envMap;
  }, {});

const envMapToList = (envMap = {}) => {
  if (!envMap || typeof envMap !== 'object' || Array.isArray(envMap)) {
    return [];
  }
  return Object.keys(envMap).map(name => ({ name, value: envMap[name] }));
};

const normalizeDetectedModules = (modules = []) =>
  (Array.isArray(modules) ? modules : []).map((module, index) => ({
    ...(module || {}),
    index
  }));

const mergeModuleBuildEnvs = (existingEnvs = [], fieldsValue = {}) => {
  const canonicalFields =
    fieldsValue && typeof fieldsValue === 'object' ? fieldsValue : {};
  const mergedEnvMap = mergeRuntimeBuildEnvs(
    envListToMap(existingEnvs),
    canonicalFields
  );

  Object.keys(MAVEN_CANONICAL_LEGACY_ALIASES).forEach(canonicalName => {
    if (Object.prototype.hasOwnProperty.call(canonicalFields, canonicalName)) {
      delete mergedEnvMap[MAVEN_CANONICAL_LEGACY_ALIASES[canonicalName]];
    }
  });

  return envMapToList(mergedEnvMap);
};

module.exports = {
  MODULE_ROLE_POSSIBLE_DEPENDENCY,
  MODULE_ROLE_RUNNABLE,
  envListToMap,
  envMapToList,
  getDefaultSelectedKeys,
  getSelectedModules,
  mergeModuleBuildEnvs,
  normalizeDetectedModules,
  reconcileSelectedKeys,
  sortModules
};
