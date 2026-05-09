const assert = require('assert');
const { shouldShowGenericVisitAction } = require('./visitActionHelpers');

assert.strictEqual(
  shouldShowGenericVisitAction({
    method: 'vm',
    canVisit: true,
    isShowThirdParty: false,
    isAccess: true
  }),
  false,
  'should hide the generic visit button for virtual machines so the UI does not fall back to port configuration prompts'
);

assert.strictEqual(
  shouldShowGenericVisitAction({
    method: 'stateless',
    canVisit: true,
    isShowThirdParty: false,
    isAccess: true
  }),
  true,
  'should keep the generic visit button for regular components that expose visit actions through ports'
);

assert.strictEqual(
  shouldShowGenericVisitAction({
    method: 'stateless',
    canVisit: false,
    isShowThirdParty: true,
    isAccess: true
  }),
  true,
  'should preserve the existing third-party access rule'
);

console.log('visit action helper tests passed');
