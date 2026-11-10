const assert = require('assert');
const {
  isWorkflowStatusMessage,
  shouldRenderAssistantBubble,
  shouldShowBottomThinking,
  shouldRenderMessageItem,
  shouldRenderWorkflowSummary
} = require('./displayFilters');

assert.strictEqual(
  shouldRenderMessageItem({
    kind: 'context',
    content: '已切换到 团队 default / 集群 rainbond'
  }),
  false
);

assert.strictEqual(
  isWorkflowStatusMessage({
    kind: 'status',
    content: '已进入流程 Rainbond App Assistant'
  }),
  true
);

assert.strictEqual(
  isWorkflowStatusMessage({
    kind: 'status',
    content: '当前阶段：select-subflow'
  }),
  true
);

assert.strictEqual(
  shouldRenderMessageItem({
    kind: 'status',
    content: '本次操作已取消。'
  }),
  true
);

assert.strictEqual(
  shouldRenderMessageItem({
    kind: 'approval',
    content: '回滚当前应用到快照版本 1.0.1'
  }),
  true
);

assert.strictEqual(
  shouldRenderAssistantBubble({
    role: 'assistant',
    kind: 'normal',
    content: '',
    suggestedActions: []
  }),
  false
);

assert.strictEqual(
  shouldRenderAssistantBubble({
    role: 'assistant',
    kind: 'normal',
    content: '下面是结果',
    suggestedActions: []
  }),
  true
);

assert.strictEqual(
  shouldRenderAssistantBubble({
    role: 'assistant',
    kind: 'normal',
    content: '   ',
    suggestedActions: [{ optionKey: 'A' }]
  }),
  true
);

assert.strictEqual(
  shouldShowBottomThinking({
    sending: true,
    messages: [
      { role: 'assistant', kind: 'normal', reasoningStreaming: true }
    ]
  }),
  false
);

assert.strictEqual(
  shouldShowBottomThinking({
    sending: true,
    messages: [
      { role: 'assistant', kind: 'normal', reasoningStreaming: false }
    ]
  }),
  true
);

assert.strictEqual(shouldRenderWorkflowSummary(), false);

console.log('agent host display filter tests passed');
