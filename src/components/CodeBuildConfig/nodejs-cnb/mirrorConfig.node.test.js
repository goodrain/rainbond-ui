const assert = require('assert');
const {
  DEFAULT_MIRROR_CONFIGS,
  getConfigForPackageManager,
  getDefaultMirrorEnvByPackageManager,
  getMirrorContentForPackageManager
} = require('./mirrorConfig');

assert.strictEqual(
  getConfigForPackageManager('pnpm').fieldName,
  'CNB_MIRROR_NPMRC',
  'pnpm should reuse .npmrc mirror configuration'
);

assert.strictEqual(
  getMirrorContentForPackageManager('npm', {}),
  DEFAULT_MIRROR_CONFIGS['.npmrc'],
  'npm should default to the platform .npmrc mirror template'
);

assert.strictEqual(
  getMirrorContentForPackageManager('yarn', {}),
  DEFAULT_MIRROR_CONFIGS['.yarnrc'],
  'yarn should default to the platform .yarnrc mirror template'
);

assert.strictEqual(
  getMirrorContentForPackageManager('npm', {
    CNB_MIRROR_NPMRC: 'registry=https://example.com'
  }),
  'registry=https://example.com',
  'saved npm mirror content should override the default template'
);

assert.deepStrictEqual(
  getDefaultMirrorEnvByPackageManager('yarn', {}),
  {
    CNB_MIRROR_NPMRC: '',
    CNB_MIRROR_YARNRC: DEFAULT_MIRROR_CONFIGS['.yarnrc']
  },
  'global yarn mirror payload should include the default .yarnrc content'
);
