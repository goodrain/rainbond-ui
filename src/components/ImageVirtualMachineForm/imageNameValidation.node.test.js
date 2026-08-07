const assert = require('assert');
const {
  OCI_IMAGE_TAG_PATTERN,
  resetImageSourceFields
} = require('./imageNameValidation');

['ubuntu', 'DBServer_TongYong', 'image.name-1', '_private'].forEach(name => {
  assert.strictEqual(OCI_IMAGE_TAG_PATTERN.test(name), true, `should accept ${name}`);
});

['DBServer(TongYong)', '-invalid', '.invalid', 'has space', ''].forEach(name => {
  assert.strictEqual(OCI_IMAGE_TAG_PATTERN.test(name), false, `should reject ${name}`);
});

assert.strictEqual(
  OCI_IMAGE_TAG_PATTERN.test(`a${'b'.repeat(127)}`),
  true,
  'should accept a 128-character image name'
);
assert.strictEqual(
  OCI_IMAGE_TAG_PATTERN.test(`a${'b'.repeat(128)}`),
  false,
  'should reject image names longer than 128 characters'
);

const sourceSwitchCalls = [];
resetImageSourceFields(
  {
    resetFields(fieldNames) {
      sourceSwitchCalls.push(['resetFields', fieldNames]);
    },
    setFieldsValue(fields) {
      sourceSwitchCalls.push(['setFieldsValue', fields]);
    }
  },
  'existing'
);
assert.deepStrictEqual(sourceSwitchCalls, [
  ['resetFields', ['image_name']],
  ['setFieldsValue', { imagefrom: 'existing', asset_id: '' }]
], 'should clear the prior image name and asset when switching image sources');

console.log('vm image name validation tests passed');
