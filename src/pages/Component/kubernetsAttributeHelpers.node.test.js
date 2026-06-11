const assert = require('assert');
const {
  buildEditableAttributeFields,
  formatRawJsonAttributeValue,
  isRawJsonAttribute,
  parseRawJsonAttributeValue
} = require('./kubernetsAttributeHelpers');

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

console.log('kubernets attribute helper tests passed');
