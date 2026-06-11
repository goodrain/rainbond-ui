const assert = require('assert');
const {
  shouldShowGenericVisitAction,
  shouldShowWebTerminalAction
} = require('./visitActionHelpers');

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

assert.strictEqual(
  shouldShowWebTerminalAction({
    method: 'vm',
    isVisitWebTerminal: true,
    isShowThirdParty: false,
    isShowKubeBlocksComponent: false
  }),
  false,
  'should hide the top-level web terminal action for virtual machine components'
);

assert.strictEqual(
  shouldShowWebTerminalAction({
    method: 'stateless',
    isVisitWebTerminal: true,
    isShowThirdParty: false,
    isShowKubeBlocksComponent: false
  }),
  true,
  'should keep the top-level web terminal action for regular components'
);

assert.strictEqual(
  shouldShowWebTerminalAction({
    method: 'stateless',
    isVisitWebTerminal: true,
    isShowThirdParty: false,
    isShowKubeBlocksComponent: true
  }),
  false,
  'should continue hiding the top-level web terminal action for kubeblocks components'
);

console.log('visit action helper tests passed');
