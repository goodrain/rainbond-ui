const {
  resolveCnbPolicyVersion
} = require('../CodeBuildConfig/cnbVersionPolicy');

const BUILD_MODULE_ENV = 'BP_MAVEN_BUILT_MODULE';
const LEGACY_BUILD_MODULE_ENV = 'BUILD_MAVEN_BUILT_MODULE';
const MAX_K8S_COMPONENT_NAME_LENGTH = 16;

const envListToMap = (envs = []) =>
  (Array.isArray(envs) ? envs : []).reduce((envMap, env) => {
    if (env && env.name) {
      envMap[env.name] = env.value;
    }
    return envMap;
  }, {});

const getBuildModule = (module = {}) => {
  const envMap = envListToMap(module && module.envs);
  const candidates = [
    envMap[BUILD_MODULE_ENV],
    envMap[LEGACY_BUILD_MODULE_ENV],
    module && module.name
  ];
  for (let index = 0; index < candidates.length; index += 1) {
    const value = String(candidates[index] || '').trim();
    if (value) {
      return value;
    }
  }
  return '';
};

const normalizeK8sName = value => {
  const segments = String(value || '').split('/').filter(Boolean);
  const leafName = segments.length ? segments[segments.length - 1] : '';
  let normalized = leafName
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!normalized) {
    normalized = 'component';
  } else if (!/^[a-z]/.test(normalized)) {
    normalized = `component-${normalized}`;
  }

  return normalized
    .slice(0, MAX_K8S_COMPONENT_NAME_LENGTH)
    .replace(/-+$/g, '') || 'component';
};

const buildUniqueK8sName = (module, usedNames) => {
  const sourceName =
    (module && module.k8s_component_name) || getBuildModule(module) ||
    (module && module.cname);
  const baseName = normalizeK8sName(sourceName);
  let candidate = baseName;
  let suffixIndex = 2;

  while (usedNames.has(candidate)) {
    const suffix = `-${suffixIndex}`;
    const prefix = baseName
      .slice(0, MAX_K8S_COMPONENT_NAME_LENGTH - suffix.length)
      .replace(/-+$/g, '');
    candidate = `${prefix || 'component'}${suffix}`;
    suffixIndex += 1;
  }

  usedNames.add(candidate);
  return candidate;
};

const normalizeDetectedModules = (modules = []) => {
  const usedNames = new Set();
  return (Array.isArray(modules) ? modules : []).map((module, index) => {
    const normalizedModule = module && typeof module === 'object' ? module : {};
    const buildModule = getBuildModule(normalizedModule);
    const moduleWithoutRole = { ...normalizedModule };
    delete moduleWithoutRole.module_role;
    return {
      ...moduleWithoutRole,
      index,
      k8s_component_name: buildUniqueK8sName(normalizedModule, usedNames),
      envs: [{ name: BUILD_MODULE_ENV, value: buildModule }]
    };
  });
};

const getDefaultSelectedKeys = () => [];

const isK8sNameDuplicate = (modules = [], value = '', excludedId) => {
  const targetName = String(value || '').trim();
  if (!targetName) {
    return false;
  }
  return (Array.isArray(modules) ? modules : []).some(module =>
    module &&
    module.id !== excludedId &&
    String(module.k8s_component_name || '').trim() === targetName
  );
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
    return getDefaultSelectedKeys();
  }
  const nextIds = nextModules.map(module => module && module.id);
  return (Array.isArray(selectedKeys) ? selectedKeys : []).filter(
    key => nextIds.indexOf(key) !== -1
  );
};

const getDefaultOpenJDKVersion = (policy = {}) => {
  const runtimePolicy =
    policy && policy.java && policy.java.jdk ? policy.java.jdk : {};
  return resolveCnbPolicyVersion(
    'java',
    runtimePolicy.visible_versions || [],
    '',
    runtimePolicy.default_version || ''
  );
};

module.exports = {
  BUILD_MODULE_ENV,
  envListToMap,
  getBuildModule,
  getDefaultOpenJDKVersion,
  getDefaultSelectedKeys,
  getSelectedModules,
  isK8sNameDuplicate,
  normalizeDetectedModules,
  reconcileSelectedKeys
};
