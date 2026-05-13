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
        summary: '已进入 bootstrap 子流程',
        suggestedActions: [
          {
            actionId: 'sa_get_component_logs',
            optionKey: '1',
            label: '先抓日志',
            description: '先查看最近 200 行日志再决定是否修复'
          }
        ]
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
    summary: '已进入 bootstrap 子流程',
    suggestedActions: [
      {
        actionId: 'sa_get_component_logs',
        optionKey: '1',
        label: '先抓日志',
        description: '先查看最近 200 行日志再决定是否修复'
      }
    ]
  }
});

console.log('agent workflow state tests passed');
