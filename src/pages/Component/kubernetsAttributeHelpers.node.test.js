const assert = require('assert');
const {
  buildEditableAttributeFields,
  formatRawJsonAttributeValue,
  isRawJsonAttribute,
  normalizeKeyValueAttributeValue,
  normalizeBooleanAttributeValue,
  parseRawJsonAttributeValue
} = require('./kubernetsAttributeHelpers');

assert.deepStrictEqual(
  normalizeKeyValueAttributeValue({ app: 'demo', tier: 'backend', config: { enabled: true } }),
  [
    { key: 'app', value: 'demo' },
    { key: 'tier', value: 'backend' },
    { key: 'config', value: '{"enabled":true}' }
  ],
  'should normalize object-shaped labels into the key/value rows used by the UI'
);
assert.deepStrictEqual(
  normalizeKeyValueAttributeValue('{"app":"demo"}'),
  [{ key: 'app', value: 'demo' }],
  'should normalize persisted JSON strings before rendering'
);
assert.deepStrictEqual(
  normalizeKeyValueAttributeValue('invalid-json'),
  [],
  'should render an empty state for malformed key/value JSON instead of calling map on a string'
);

assert.strictEqual(
  isRawJsonAttribute('vm_gpu_resources', {
    save_type: 'json'
  }),
  true,
  'should treat vm_gpu_resources as a raw JSON attribute instead of a key/value JSON attribute'
);

assert.strictEqual(
  isRawJsonAttribute('labels', {
    save_type: 'json'
  }),
  false,
  'should keep classic key/value JSON attributes on their existing editor path'
);

assert.strictEqual(
  formatRawJsonAttributeValue(['nvidia.com/TU104', 'nvidia.com/TU106']),
  '[\n  "nvidia.com/TU104",\n  "nvidia.com/TU106"\n]',
  'should pretty-print raw JSON array values for editor reverse rendering'
);

assert.deepStrictEqual(
  parseRawJsonAttributeValue('[\"nvidia.com/TU104\",\"nvidia.com/TU106\"]'),
  ['nvidia.com/TU104', 'nvidia.com/TU106'],
  'should parse edited JSON array text back into the API payload shape'
);

assert.deepStrictEqual(
  buildEditableAttributeFields(['nodeSelector', 'labels'], 'vm_gpu_resources'),
  ['vm_gpu_resources', 'nodeSelector', 'labels'],
  'should keep the current attribute name visible in edit mode even when it is outside the addable field list'
);

assert.strictEqual(
  normalizeBooleanAttributeValue('true'),
  true,
  'should parse persisted true string as enabled'
);

assert.strictEqual(
  normalizeBooleanAttributeValue('false'),
  false,
  'should parse persisted false string as disabled'
);

assert.strictEqual(
  normalizeBooleanAttributeValue(false),
  false,
  'should keep boolean false disabled'
);

console.log('kubernets attribute helper tests passed');
