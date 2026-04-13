const assert = require('assert');
const { sanitizePackageToolPayload } = require('./sourceBuildPayload');

assert.deepStrictEqual(
  sanitizePackageToolPayload({
    team_name: 'team-a',
    app_alias: 'svc-a',
    lang: 'Python',
    package_tool: 'pip',
    build_strategy: 'cnb',
    build_env_dict: {
      BUILD_PYTHON_PACKAGE_MANAGER: 'pip',
      BUILD_PROCFILE: 'web: flask run --host 0.0.0.0 --port $PORT',
      BP_CPYTHON_VERSION: '3.14',
      CNB_FRAMEWORK: 'other-static',
      CNB_BUILD_SCRIPT: 'build',
      CNB_OUTPUT_DIR: 'dist',
      CNB_MIRROR_SOURCE: 'global',
      BUILD_HAS_NPMRC: '',
      BUILD_HAS_YARNRC: ''
    },
    cnb_framework: 'other-static',
    cnb_build_script: 'build',
    cnb_output_dir: 'dist',
    cnb_mirror_source: 'global',
    has_npmrc: '',
    has_yarnrc: ''
  }),
  {
    team_name: 'team-a',
    app_alias: 'svc-a',
    lang: 'Python',
    package_tool: 'pip',
    build_strategy: 'cnb',
    build_env_dict: {
      BUILD_PYTHON_PACKAGE_MANAGER: 'pip',
      BUILD_PROCFILE: 'web: flask run --host 0.0.0.0 --port $PORT',
      BP_CPYTHON_VERSION: '3.14'
    }
  },
  'should strip node/static-only CNB payload fields for python requests'
);

assert.deepStrictEqual(
  sanitizePackageToolPayload({
    team_name: 'team-a',
    app_alias: 'svc-a',
    lang: 'Node.js',
    package_tool: 'pnpm',
    build_strategy: 'cnb',
    build_env_dict: {
      CNB_FRAMEWORK: 'nextjs',
      CNB_BUILD_SCRIPT: 'build',
      CNB_OUTPUT_DIR: '.next',
      CNB_NODE_VERSION: '20.20.0'
    },
    cnb_framework: 'nextjs',
    cnb_build_script: 'build',
    cnb_output_dir: '.next',
    cnb_node_version: '20.20.0'
  }),
  {
    team_name: 'team-a',
    app_alias: 'svc-a',
    lang: 'Node.js',
    package_tool: 'pnpm',
    build_strategy: 'cnb',
    build_env_dict: {
      CNB_FRAMEWORK: 'nextjs',
      CNB_BUILD_SCRIPT: 'build',
      CNB_OUTPUT_DIR: '.next',
      CNB_NODE_VERSION: '20.20.0'
    },
    cnb_framework: 'nextjs',
    cnb_build_script: 'build',
    cnb_output_dir: '.next',
    cnb_node_version: '20.20.0'
  },
  'should keep node/static CNB payload fields for node requests'
);

console.log('source build payload tests passed');
