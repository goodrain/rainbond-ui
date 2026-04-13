const NODE_STATIC_LANGUAGES = new Set(['node.js', 'nodejs', 'node', 'nodejsstatic', 'static']);

const NODE_STATIC_BUILD_ENV_KEYS = [
  'CNB_FRAMEWORK',
  'CNB_BUILD_SCRIPT',
  'CNB_OUTPUT_DIR',
  'CNB_NODE_VERSION',
  'CNB_NODE_ENV',
  'CNB_MIRROR_SOURCE',
  'CNB_MIRROR_NPMRC',
  'CNB_MIRROR_YARNRC',
  'CNB_START_SCRIPT',
  'BUILD_HAS_NPMRC',
  'BUILD_HAS_YARNRC'
];

const NODE_STATIC_PAYLOAD_KEYS = [
  'cnb_framework',
  'cnb_build_script',
  'cnb_output_dir',
  'cnb_node_version',
  'cnb_node_env',
  'cnb_start_script',
  'cnb_mirror_source',
  'cnb_mirror_npmrc',
  'cnb_mirror_yarnrc',
  'has_npmrc',
  'has_yarnrc'
];

const normalizeBuildLanguage = language => (language || '').toLowerCase();

const isPlainObject = value => !!value && typeof value === 'object' && !Array.isArray(value);

const sanitizePackageToolPayload = (body = {}) => {
  const payload = { ...(body || {}) };
  const buildEnvDict = isPlainObject(payload.build_env_dict) ? { ...payload.build_env_dict } : payload.build_env_dict;
  const isNodeStaticLanguage = NODE_STATIC_LANGUAGES.has(normalizeBuildLanguage(payload.lang));

  if (!isNodeStaticLanguage) {
    NODE_STATIC_PAYLOAD_KEYS.forEach(key => {
      delete payload[key];
    });
    if (isPlainObject(buildEnvDict)) {
      NODE_STATIC_BUILD_ENV_KEYS.forEach(key => {
        delete buildEnvDict[key];
      });
    }
  }

  payload.build_env_dict = buildEnvDict;
  return payload;
};

module.exports = {
  sanitizePackageToolPayload
};
