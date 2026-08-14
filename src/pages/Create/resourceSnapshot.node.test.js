const assert = require('assert');
const {
  evaluateResourceAvailability,
  normalizeAvailableResources,
  shouldCheckAvailableResources
} = require('./resourceSnapshot');

assert.deepStrictEqual(
  normalizeAvailableResources({
    bean: {
      free_cpu: '2900',
      free_memory: 4995
    }
  }),
  {
    freeCpu: 2900,
    freeMemory: 4995
  },
  'available resource responses should normalize the bean fields to numbers'
);

assert.strictEqual(
  normalizeAvailableResources({ bean: { free_cpu: -1, free_memory: 1024 } }),
  null,
  'negative resource snapshots should be rejected'
);

assert.strictEqual(
  normalizeAvailableResources({ bean: { free_cpu: 1000 } }),
  null,
  'incomplete resource snapshots should be rejected'
);

[
  'source_code',
  'package_build',
  'docker_image',
  'docker_run'
].forEach(serviceSource => {
  assert.strictEqual(
    shouldCheckAvailableResources({
      service_source: serviceSource,
      service: {
        extend_method: 'stateless_multiple'
      }
    }),
    true,
    `${serviceSource} components should use the resource snapshot`
  );
});

assert.strictEqual(
  shouldCheckAvailableResources({
    service_source: 'docker_image',
    service: {
      extend_method: 'vm'
    }
  }),
  false,
  'virtual machines should not use the resource snapshot gate'
);

assert.strictEqual(
  shouldCheckAvailableResources({
    service_source: 'market',
    service: {
      extend_method: 'stateless_multiple'
    }
  }),
  false,
  'unsupported creation sources should not use the resource snapshot gate'
);

assert.strictEqual(
  shouldCheckAvailableResources({
    service: {
      extend_method: 'stateless_multiple',
      service_source: 'docker_run'
    }
  }),
  true,
  'nested service_source responses should remain compatible'
);

assert.deepStrictEqual(
  evaluateResourceAvailability(
    { min_cpu: 500, min_memory: 512 },
    { freeCpu: 500, freeMemory: 512 }
  ),
  {
    status: 'sufficient',
    shortages: []
  },
  'requirements equal to the snapshot should pass'
);

assert.deepStrictEqual(
  evaluateResourceAvailability(
    { min_cpu: 0, min_memory: 0 },
    { freeCpu: 0, freeMemory: 0 }
  ),
  {
    status: 'sufficient',
    shortages: []
  },
  'zero CPU and memory requirements should skip both checks'
);

assert.deepStrictEqual(
  evaluateResourceAvailability(
    { min_cpu: 0, min_memory: 1024 },
    { freeCpu: 0, freeMemory: 512 }
  ),
  {
    status: 'insufficient',
    shortages: [
      {
        key: 'memory',
        label: '内存',
        unit: 'Mi',
        required: 1024,
        available: 512,
        missing: 512
      }
    ]
  },
  'a zero CPU requirement should skip CPU while memory is still checked'
);

assert.deepStrictEqual(
  evaluateResourceAvailability(
    { min_cpu: 1200, min_memory: 2048 },
    { freeCpu: 1000, freeMemory: 1024 }
  ),
  {
    status: 'insufficient',
    shortages: [
      {
        key: 'cpu',
        label: 'CPU',
        unit: 'm',
        required: 1200,
        available: 1000,
        missing: 200
      },
      {
        key: 'memory',
        label: '内存',
        unit: 'Mi',
        required: 2048,
        available: 1024,
        missing: 1024
      }
    ]
  },
  'CPU and memory shortages should be returned together'
);

assert.deepStrictEqual(
  evaluateResourceAvailability(
    { min_cpu: 100, min_memory: 128 },
    null
  ),
  {
    status: 'invalid',
    shortages: []
  },
  'an invalid snapshot should fail closed'
);

console.log('resource snapshot tests passed');
