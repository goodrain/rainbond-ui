const assert = require('assert');
const {
  envListToMap,
  getBuildModule,
  getDefaultOpenJDKVersion,
  getDefaultSelectedKeys,
  getSelectedModules,
  isK8sNameDuplicate,
  normalizeDetectedModules,
  reconcileSelectedKeys
} = require('./helpers');

const detectedModules = [
  {
    id: 'module-b',
    name: 'services/pig-gateway',
    cname: '网关',
    module_role: 'possible_dependency',
    envs: [
      { name: 'BUILD_MAVEN_CUSTOM_GOALS', value: 'clean install' },
      { name: 'BUILD_MAVEN_BUILT_MODULE', value: 'services/pig-gateway' },
      { name: 'BUILD_MAVEN_BUILT_ARTIFACT', value: 'target/app.jar' }
    ]
  },
  {
    id: 'module-a',
    name: 'pig-register',
    cname: 'pig-register',
    envs: [
      { name: 'BP_MAVEN_BUILT_MODULE', value: 'pig-register' },
      { name: 'BP_JVM_VERSION', value: '21' }
    ]
  }
];
const normalizedModules = normalizeDetectedModules(detectedModules);

assert.deepStrictEqual(
  normalizedModules.map(item => item.id),
  ['module-b', 'module-a'],
  'should preserve the module order returned by the detection API'
);
assert.deepStrictEqual(
  normalizedModules.map(item => item.index),
  [0, 1],
  'should assign stable display indexes without changing order'
);
assert.deepStrictEqual(
  normalizedModules[0].envs,
  [{ name: 'BP_MAVEN_BUILT_MODULE', value: 'services/pig-gateway' }],
  'should keep only the canonical build-module environment variable'
);
assert.deepStrictEqual(
  normalizedModules[1].envs,
  [{ name: 'BP_MAVEN_BUILT_MODULE', value: 'pig-register' }],
  'should prefer the canonical build-module value when it is present'
);
assert.strictEqual(
  normalizedModules[0].k8s_component_name,
  'pig-gateway',
  'should derive a valid English component name from the module leaf name'
);
assert.strictEqual(
  Object.prototype.hasOwnProperty.call(normalizedModules[0], 'module_role'),
  false,
  'should remove the obsolete module-role classification from the create payload'
);
assert.notStrictEqual(
  normalizedModules[0],
  detectedModules[0],
  'should clone module objects instead of mutating the API response'
);
assert.deepStrictEqual(
  detectedModules[0].envs,
  [
    { name: 'BUILD_MAVEN_CUSTOM_GOALS', value: 'clean install' },
    { name: 'BUILD_MAVEN_BUILT_MODULE', value: 'services/pig-gateway' },
    { name: 'BUILD_MAVEN_BUILT_ARTIFACT', value: 'target/app.jar' }
  ],
  'should leave the API response environment variables untouched'
);

const duplicateNames = normalizeDetectedModules([
  { id: 'one', name: '123_Service_With_A_Very_Long_Name' },
  { id: 'two', name: '123_Service_With_A_Very_Long_Name' },
  { id: 'three', name: '中文模块' }
]).map(item => item.k8s_component_name);

assert.deepStrictEqual(
  duplicateNames,
  ['component-123-se', 'component-123-2', 'component'],
  'should generate deterministic and unique English names within 16 characters'
);
duplicateNames.forEach(name => {
  assert.ok(name.length <= 16, 'generated English names should not exceed 16 characters');
  assert.ok(
    /^[a-z]([-a-z0-9]*[a-z0-9])?$/.test(name),
    'generated English names should satisfy the existing component-name validator'
  );
});

assert.deepStrictEqual(
  getDefaultSelectedKeys(normalizedModules),
  [],
  'should not select any detected module by default'
);
assert.strictEqual(
  isK8sNameDuplicate(normalizedModules, 'pig-register', 'module-b'),
  true,
  'should reject an English component name already used by another module'
);
assert.strictEqual(
  isK8sNameDuplicate(normalizedModules, 'pig-register', 'module-a'),
  false,
  'should ignore the module currently being edited during duplicate checks'
);
assert.deepStrictEqual(
  getSelectedModules(normalizedModules, ['module-a']),
  [normalizedModules[1]],
  'should derive selected modules in the original display order'
);
assert.deepStrictEqual(
  reconcileSelectedKeys(
    [{ id: 'module-a' }, { id: 'module-b' }],
    [{ id: 'module-b' }, { id: 'module-a' }],
    ['module-a', 'missing']
  ),
  ['module-a'],
  'should preserve and crop controlled selection for the same dataset'
);
assert.deepStrictEqual(
  reconcileSelectedKeys(
    [{ id: 'old-module' }],
    [{ id: 'new-module' }],
    ['old-module']
  ),
  [],
  'should keep a new dataset unselected by default'
);

assert.strictEqual(
  getBuildModule({ name: 'fallback-module', envs: [] }),
  'fallback-module',
  'should use the detected module name when no build-module env is present'
);
assert.strictEqual(
  getBuildModule({
    name: 'fallback-module',
    envs: [
      { name: 'BP_MAVEN_BUILT_MODULE', value: '   ' },
      { name: 'BUILD_MAVEN_BUILT_MODULE', value: 'legacy-module' }
    ]
  }),
  'legacy-module',
  'should ignore an empty canonical value when a legacy module value is available'
);
assert.deepStrictEqual(
  envListToMap(normalizedModules[0].envs),
  { BP_MAVEN_BUILT_MODULE: 'services/pig-gateway' },
  'should expose normalized environments to the read-only summary'
);
assert.strictEqual(
  getDefaultOpenJDKVersion({
    java: {
      jdk: {
        visible_versions: ['11', '17', '21'],
        default_version: '17.0.12'
      }
    }
  }),
  '17',
  'should resolve the displayed OpenJDK version from the existing CNB policy'
);

assert.deepStrictEqual(normalizeDetectedModules(null), [], 'should tolerate missing module data');
assert.deepStrictEqual(envListToMap(), {}, 'should tolerate a missing env list');
