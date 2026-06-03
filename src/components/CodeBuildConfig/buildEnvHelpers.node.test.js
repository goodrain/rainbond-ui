const assert = require('assert');
const {
  hasNodePackageManagerPrefix,
  isBuildEnvTruthy,
  mergeCreateRuntimeInfo,
  mergeRuntimeBuildEnvs
} = require('./buildEnvHelpers');

assert.strictEqual(
  hasNodePackageManagerPrefix('npm run build'),
  true,
  'should reject npm run build for Node.js CNB script fields'
);

assert.strictEqual(
  hasNodePackageManagerPrefix('yarn build'),
  true,
  'should reject yarn build for Node.js CNB script fields'
);

assert.strictEqual(
  hasNodePackageManagerPrefix('pnpm run build:prod'),
  true,
  'should reject pnpm run build:prod for Node.js CNB script fields'
);

assert.strictEqual(
  hasNodePackageManagerPrefix('build:prod'),
  false,
  'should allow package.json script names'
);

assert.strictEqual(
  hasNodePackageManagerPrefix('yarn-build'),
  false,
  'should only reject npm, pnpm, or yarn as the first command token'
);

assert.strictEqual(
  isBuildEnvTruthy('True'),
  true,
  'should treat backend-serialized True as enabled'
);

assert.strictEqual(
  isBuildEnvTruthy('FALSE'),
  false,
  'should treat case-insensitive false strings as disabled'
);

assert.deepStrictEqual(
  mergeCreateRuntimeInfo(
    {
      CNB_FRAMEWORK: 'other-static',
      CNB_BUILD_SCRIPT: 'build',
      KEEP_ME: 'present'
    },
    {
      build_strategy: 'cnb',
      build_env_dict: {
        CNB_FRAMEWORK: 'nestjs',
        CNB_BUILD_SCRIPT: 'start',
        CNB_OUTPUT_DIR: 'dist'
      }
    }
  ),
  {
    CNB_FRAMEWORK: 'nestjs',
    CNB_BUILD_SCRIPT: 'start',
    CNB_OUTPUT_DIR: 'dist',
    KEEP_ME: 'present',
    build_strategy: 'cnb'
  },
  'should prefer the latest source-build detection over stale backend runtime info during create flow'
);

assert.deepStrictEqual(
  mergeCreateRuntimeInfo(
    {
      BP_JVM_VERSION: '11',
      BUILD_PROCFILE: 'web: java -jar old.jar',
      BUILD_MAVEN_SETTING_NAME: 'corp-mirror'
    },
    {
      build_strategy: 'cnb',
      build_env_dict: {
        BP_JVM_VERSION: '17',
        BUILD_PROCFILE: 'web: java -jar new.jar'
      }
    }
  ),
  {
    BP_JVM_VERSION: '17',
    BUILD_PROCFILE: 'web: java -jar new.jar',
    BUILD_MAVEN_SETTING_NAME: 'corp-mirror',
    build_strategy: 'cnb'
  },
  'should merge java create-flow envs without dropping unrelated runtime settings'
);

assert.deepStrictEqual(
  mergeCreateRuntimeInfo(
    {
      BP_CPYTHON_VERSION: '3.10',
      PIP_INDEX_URL: 'https://old.example.com/simple',
      BUILD_PYTHON_PACKAGE_MANAGER: 'pip'
    },
    {
      build_strategy: 'cnb',
      build_env_dict: {
        BP_CPYTHON_VERSION: '3.11',
        PIP_INDEX_URL: 'https://new.example.com/simple'
      }
    }
  ),
  {
    BP_CPYTHON_VERSION: '3.11',
    PIP_INDEX_URL: 'https://new.example.com/simple',
    BUILD_PYTHON_PACKAGE_MANAGER: 'pip',
    build_strategy: 'cnb'
  },
  'should merge python create-flow envs so newer detection can override stale runtime values'
);

assert.deepStrictEqual(
  mergeCreateRuntimeInfo(
    {
      BP_GO_VERSION: '1.22',
      GOPROXY: 'https://goproxy.cn',
      BUILD_PROCFILE: ''
    },
    {
      build_strategy: 'cnb',
      build_env_dict: {
        BP_GO_VERSION: '1.23',
        GOPROXY: 'https://goproxy.io'
      }
    }
  ),
  {
    BP_GO_VERSION: '1.23',
    GOPROXY: 'https://goproxy.io',
    BUILD_PROCFILE: '',
    build_strategy: 'cnb'
  },
  'should merge golang create-flow envs using the latest detected values'
);

assert.deepStrictEqual(
  mergeRuntimeBuildEnvs(
    {
      BUILD_NO_CACHE: 'True',
      BUILD_PROCFILE: 'web: ./demo',
      BUILD_ENABLE_ORACLEJDK: true
    },
    {
      BUILD_NO_CACHE: false,
      GO_START_MODE: 'default',
      JDK_TYPE: 'OpenJDK'
    }
  ),
  {},
  'should remove disabled cache, default procfile, and stale oracle jdk flags from merged envs'
);

assert.deepStrictEqual(
  mergeRuntimeBuildEnvs(
    {
      CNB_START_SCRIPT: 'node server.js',
      CNB_FRAMEWORK: 'express'
    },
    {
      CNB_FRAMEWORK: 'other-static'
    }
  ),
  {
    CNB_FRAMEWORK: 'other-static'
  },
  'should drop stale node start commands when the framework switches to a static target'
);
