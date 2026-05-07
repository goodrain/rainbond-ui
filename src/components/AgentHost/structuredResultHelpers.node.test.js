const assert = require('assert');
const {
  getExecutedAction,
  getProposedToolAction,
  getProposedActionLabel,
  getSuggestedWorkflowActions,
  isStandaloneExecutedActionResult
} = require('./structuredResultHelpers');

const lowRiskResult = {
  subflowData: {
    proposedToolAction: {
      toolName: 'rainbond_create_app_version_snapshot',
      requiresApproval: false
    }
  }
};

const highRiskResult = {
  subflowData: {
    proposedToolAction: {
      toolName: 'rainbond_install_app_model',
      requiresApproval: true
    }
  }
};

const executedResult = {
  executedAction: {
    toolName: 'rainbond_install_app_model',
    requiresApproval: true
  }
};

const standaloneExecutedResult = {
  nextAction: 'none',
  tool_calls: [{ name: 'rainbond_update_region', status: 'success' }],
  executedAction: {
    toolName: 'rainbond_update_region',
    requiresApproval: true
  }
};

const workflowExecutedResult = {
  workflowId: 'rainbond-app-assistant',
  nextAction: 'none',
  tool_calls: [{ name: 'rainbond_update_region', status: 'success' }],
  executedAction: {
    toolName: 'rainbond_update_region',
    requiresApproval: true
  }
};

const suggestedActionsResult = {
  suggestedActions: [
    {
      optionKey: 'A',
      label: '调回合理资源',
      description: '将组件调整到 250m CPU / 512MB 内存',
      recommended: true,
      pendingAction: {
        toolName: 'rainbond_vertical_scale_component',
        requiresApproval: true
      }
    }
  ]
};

assert.deepStrictEqual(getProposedToolAction(lowRiskResult), {
  toolName: 'rainbond_create_app_version_snapshot',
  requiresApproval: false
});
assert.strictEqual(getProposedActionLabel(lowRiskResult), '继续执行');

assert.deepStrictEqual(getProposedToolAction(highRiskResult), {
  toolName: 'rainbond_install_app_model',
  requiresApproval: true
});
assert.strictEqual(getProposedActionLabel(highRiskResult), '申请执行');

assert.strictEqual(getProposedToolAction({}), null);
assert.strictEqual(getProposedActionLabel({}), '');
assert.deepStrictEqual(getExecutedAction(executedResult), {
  toolName: 'rainbond_install_app_model',
  requiresApproval: true
});
assert.deepStrictEqual(getSuggestedWorkflowActions(suggestedActionsResult), [
  {
    optionKey: 'A',
    label: '调回合理资源',
    description: '将组件调整到 250m CPU / 512MB 内存',
    recommended: true,
    pendingAction: {
      toolName: 'rainbond_vertical_scale_component',
      requiresApproval: true
    }
  }
]);
assert.deepStrictEqual(getSuggestedWorkflowActions({}), []);
assert.strictEqual(getExecutedAction({}), null);
assert.strictEqual(isStandaloneExecutedActionResult(standaloneExecutedResult), true);
assert.strictEqual(isStandaloneExecutedActionResult(workflowExecutedResult), false);
assert.strictEqual(isStandaloneExecutedActionResult({}), false);

console.log('structured result helper tests passed');
