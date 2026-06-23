const assert = require('assert');

let helpers = {};
try {
  helpers = require('./resourceHelpers');
} catch (error) {
  helpers = {};
}

assert.strictEqual(
  typeof helpers.shouldShowCodeBuildConfig,
  'function',
  'should expose a helper for deciding whether source-code build config is visible'
);

assert.strictEqual(
  helpers.shouldShowCodeBuildConfig({
    buildSource: { service_source: 'source_code' },
    languageType: 'java-maven',
    runtimeInfo: { BUILD_RUNTIMES: 'OpenJDK' }
  }),
  true,
  'should show source-code build config for source-code components with language runtime info'
);

assert.strictEqual(
  helpers.shouldShowCodeBuildConfig({
    buildSource: { service_source: 'docker_image' },
    languageType: 'java-maven',
    runtimeInfo: { BUILD_RUNTIMES: 'OpenJDK' }
  }),
  false,
  'should hide source-code build config for image components even if language runtime info exists'
);

assert.strictEqual(
  helpers.shouldShowCodeBuildConfig({
    buildSource: { service_source: 'source_code' },
    languageType: '',
    runtimeInfo: { BUILD_RUNTIMES: 'OpenJDK' }
  }),
  false,
  'should hide source-code build config without a detected language'
);

assert.strictEqual(
  helpers.shouldShowCodeBuildConfig({
    buildSource: { service_source: 'source_code' },
    languageType: 'java-maven',
    runtimeInfo: null
  }),
  false,
  'should hide source-code build config without runtime info'
);

console.log('resource helper tests passed');
