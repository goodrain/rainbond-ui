const assert = require('assert');
const {
  envListToMap,
  envMapToList,
  getDefaultSelectedKeys,
  getSelectedModules,
  mergeModuleBuildEnvs,
  normalizeDetectedModules,
  reconcileSelectedKeys,
  sortModules
} = require('./helpers');

const detectedModules = [{ id: 'module-a' }, { id: 'module-b', index: 99 }];
const normalizedDetectedModules = normalizeDetectedModules(detectedModules);

assert.deepStrictEqual(
  normalizedDetectedModules,
  [{ id: 'module-a', index: 0 }, { id: 'module-b', index: 1 }],
  'should defensively normalize detected modules and assign stable display indexes'
);
assert.notStrictEqual(
  normalizedDetectedModules[0],
  detectedModules[0],
  'should clone detected module rows instead of mutating API response objects'
);
assert.deepStrictEqual(
  detectedModules,
  [{ id: 'module-a' }, { id: 'module-b', index: 99 }],
  'should leave the API response list untouched'
);
assert.deepStrictEqual(
  normalizeDetectedModules(null),
  [],
  'should normalize a missing detected module list to an empty array'
);

const modules = [
  { id: 'unknown-a' },
  { id: 'dep-a', module_role: 'possible_dependency' },
  { id: 'run-a', module_role: 'runnable' },
  { id: 'unknown-b', module_role: 'custom' },
  { id: 'run-b', module_role: 'runnable' },
  { id: 'dep-b', module_role: 'possible_dependency' }
];

assert.deepStrictEqual(
  sortModules(modules).map(item => item.id),
  ['run-a', 'run-b', 'unknown-a', 'unknown-b', 'dep-a', 'dep-b'],
  'should stably sort runnable modules first and possible dependencies last'
);

assert.deepStrictEqual(
  modules.map(item => item.id),
  ['unknown-a', 'dep-a', 'run-a', 'unknown-b', 'run-b', 'dep-b'],
  'should not mutate the detected module list while sorting'
);

const modulesWithEnvs = [
  {
    id: 'module-with-envs',
    module_role: 'runnable',
    envs: [{ name: 'BUILD_MAVEN_BUILT_MODULE', value: 'service-a' }]
  }
];
const normalizedModules = sortModules(modulesWithEnvs);

assert.notStrictEqual(
  normalizedModules[0],
  modulesWithEnvs[0],
  'should clone module objects while normalizing detected data'
);
assert.notStrictEqual(
  normalizedModules[0].envs,
  modulesWithEnvs[0].envs,
  'should clone module env arrays while normalizing detected data'
);
assert.notStrictEqual(
  normalizedModules[0].envs[0],
  modulesWithEnvs[0].envs[0],
  'should clone module env entries while normalizing detected data'
);
normalizedModules[0].envs[0].value = 'changed';
assert.strictEqual(
  modulesWithEnvs[0].envs[0].value,
  'service-a',
  'should keep source module env values untouched after editing normalized data'
);

assert.deepStrictEqual(
  getDefaultSelectedKeys(modules),
  ['run-a', 'run-b'],
  'should default-select only runnable modules when any are detected'
);

const modulesWithoutRunnable = [
  { id: 'unknown', module_role: 'custom' },
  { id: 'dep', module_role: 'possible_dependency' }
];

assert.deepStrictEqual(
  getDefaultSelectedKeys(modulesWithoutRunnable),
  ['unknown', 'dep'],
  'should select every module when no runnable module is detected'
);

assert.deepStrictEqual(
  getDefaultSelectedKeys([]),
  [],
  'should handle an empty module list'
);

assert.deepStrictEqual(
  getSelectedModules(modules, ['run-b', 'unknown-a']),
  [modules[0], modules[4]],
  'should derive selected modules in the current display order'
);

assert.deepStrictEqual(
  reconcileSelectedKeys(
    [{ id: 'module-a' }, { id: 'module-b' }],
    [{ id: 'module-b' }, { id: 'module-a' }],
    ['module-a', 'missing']
  ),
  ['module-a'],
  'should preserve and crop controlled selection when the dataset is unchanged'
);

assert.deepStrictEqual(
  reconcileSelectedKeys(
    [{ id: 'old-module' }],
    [
      { id: 'new-dependency', module_role: 'possible_dependency' },
      { id: 'new-runnable', module_role: 'runnable' }
    ],
    ['old-module']
  ),
  ['new-runnable'],
  'should apply runnable defaults when a genuinely new dataset arrives'
);

assert.deepStrictEqual(
  envListToMap([
    { name: 'BUILD_MAVEN_BUILT_MODULE', value: 'service-a' },
    { name: 'CUSTOM_RUNTIME', value: 'keep' }
  ]),
  {
    BUILD_MAVEN_BUILT_MODULE: 'service-a',
    CUSTOM_RUNTIME: 'keep'
  },
  'should convert an environment variable list to a value map'
);

assert.deepStrictEqual(
  envMapToList({
    BP_MAVEN_BUILD_ARGUMENTS: 'clean package -pl service-a -am',
    BP_MAVEN_BUILT_MODULE: 'service-a',
    BP_MAVEN_BUILT_ARTIFACT: 'service-a/target/app.jar',
    BUILD_MAVEN_BUILT_MODULE: 'service-a',
    BUILD_MAVEN_BUILT_ARTIFACT: 'service-a/target/app.jar',
    CUSTOM_RUNTIME: 'keep'
  }),
  [
    {
      name: 'BP_MAVEN_BUILD_ARGUMENTS',
      value: 'clean package -pl service-a -am'
    },
    { name: 'BP_MAVEN_BUILT_MODULE', value: 'service-a' },
    {
      name: 'BP_MAVEN_BUILT_ARTIFACT',
      value: 'service-a/target/app.jar'
    },
    { name: 'BUILD_MAVEN_BUILT_MODULE', value: 'service-a' },
    {
      name: 'BUILD_MAVEN_BUILT_ARTIFACT',
      value: 'service-a/target/app.jar'
    },
    { name: 'CUSTOM_RUNTIME', value: 'keep' }
  ],
  'should convert canonical and legacy Maven environment values back to a list'
);

const existingModuleEnvs = [
  { name: 'BUILD_MAVEN_BUILT_MODULE', value: 'service-a' },
  {
    name: 'BUILD_MAVEN_BUILT_ARTIFACT',
    value: 'service-a/target/service-a.jar'
  },
  { name: 'BUILD_NO_CACHE', value: 'True' },
  { name: 'BUILD_PROCFILE', value: 'web: java -jar old.jar' },
  { name: 'CUSTOM_RUNTIME', value: 'keep' }
];
const mergedModuleEnvs = mergeModuleBuildEnvs(
  existingModuleEnvs,
  {
    BP_MAVEN_BUILD_ARGUMENTS: 'clean package -pl service-a -am',
    BP_MAVEN_BUILT_MODULE: 'service-a',
    BP_MAVEN_BUILT_ARTIFACT: 'service-a/target/service-a.jar',
    BUILD_NO_CACHE: false,
    BUILD_PROCFILE: '   ',
    JAVA_START_MODE: 'default',
    cnb_version_policy: { java: { jdk: {} } },
    runtime_info: { ignored: true }
  }
);
const mergedModuleEnvMap = envListToMap(mergedModuleEnvs);

assert.deepStrictEqual(
  mergedModuleEnvMap,
  {
    CUSTOM_RUNTIME: 'keep',
    BP_MAVEN_BUILD_ARGUMENTS: 'clean package -pl service-a -am',
    BP_MAVEN_BUILT_MODULE: 'service-a',
    BP_MAVEN_BUILT_ARTIFACT: 'service-a/target/service-a.jar'
  },
  'should preserve unrelated envs and canonical auto-detected module values while removing superseded legacy aliases'
);

assert.deepStrictEqual(
  envListToMap(
    mergeModuleBuildEnvs(
      [
        { name: 'BUILD_MAVEN_CUSTOM_GOALS', value: 'clean install' },
        { name: 'BUILD_MAVEN_CUSTOM_OPTS', value: '-DskipTests' },
        { name: 'BUILD_MAVEN_BUILT_MODULE', value: 'service-a' },
        {
          name: 'BUILD_MAVEN_BUILT_ARTIFACT',
          value: 'service-a/target/service-a.jar'
        },
        { name: 'CUSTOM_RUNTIME', value: 'keep' }
      ],
      {
        BP_MAVEN_BUILD_ARGUMENTS: '',
        BP_MAVEN_ADDITIONAL_BUILD_ARGUMENTS: '',
        BP_MAVEN_BUILT_MODULE: '',
        BP_MAVEN_BUILT_ARTIFACT: ''
      }
    )
  ),
  {
    CUSTOM_RUNTIME: 'keep',
    BP_MAVEN_BUILD_ARGUMENTS: '',
    BP_MAVEN_ADDITIONAL_BUILD_ARGUMENTS: '',
    BP_MAVEN_BUILT_MODULE: '',
    BP_MAVEN_BUILT_ARTIFACT: ''
  },
  'should remove legacy Maven aliases when canonical form fields are explicitly cleared'
);

assert.deepStrictEqual(
  envListToMap(
    mergeModuleBuildEnvs(
      [
        { name: 'BUILD_MAVEN_CUSTOM_GOALS', value: 'clean install' },
        { name: 'BUILD_MAVEN_CUSTOM_OPTS', value: '-DskipTests' },
        { name: 'BUILD_MAVEN_BUILT_MODULE', value: 'service-a' },
        {
          name: 'BUILD_MAVEN_BUILT_ARTIFACT',
          value: 'service-a/target/service-a.jar'
        }
      ],
      { BP_JVM_VERSION: '17' }
    )
  ),
  {
    BUILD_MAVEN_CUSTOM_GOALS: 'clean install',
    BUILD_MAVEN_CUSTOM_OPTS: '-DskipTests',
    BUILD_MAVEN_BUILT_MODULE: 'service-a',
    BUILD_MAVEN_BUILT_ARTIFACT: 'service-a/target/service-a.jar',
    BP_JVM_VERSION: '17'
  },
  'should preserve legacy Maven aliases until their canonical form fields are present'
);

assert.deepStrictEqual(
  envListToMap(envMapToList(mergedModuleEnvMap)),
  mergedModuleEnvMap,
  'should preserve merged module build values across the map/list round trip'
);

assert.deepStrictEqual(envListToMap(), {}, 'should tolerate a missing env list');
assert.deepStrictEqual(envMapToList(), [], 'should tolerate a missing env map');
