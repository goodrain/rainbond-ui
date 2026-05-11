const assert = require('assert');
const { extractWorkflowState } = require('./agentWorkflowState');

const result = extractWorkflowState([
  {
    type: 'workflow.stage',
    data: {
      workflow_id: 'rainbond-app-assistant',
      workflow_stage: 'select-subflow',
      next_action: 'bootstrap_topology'
    }
  },
  {
    type: 'workflow.completed',
    data: {
      workflow_id: 'rainbond-app-assistant',
      structured_result: {
        workflowId: 'rainbond-app-assistant',
        selectedWorkflow: 'rainbond-fullstack-bootstrap',
        summary: '已进入 bootstrap 子流程'
      }
    }
  }
]);

assert.deepStrictEqual(result, {
  workflowState: {
    workflow_id: 'rainbond-app-assistant',
    workflow_stage: 'select-subflow',
    next_action: 'bootstrap_topology'
  },
  structuredResult: {
    workflowId: 'rainbond-app-assistant',
    selectedWorkflow: 'rainbond-fullstack-bootstrap',
    summary: '已进入 bootstrap 子流程'
  }
});

console.log('agent workflow state tests passed');
