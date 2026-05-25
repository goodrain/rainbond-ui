const test = require('node:test');
const assert = require('node:assert/strict');

const { isRainbondInfoAgentEnabled } = require('./agentVisibility');

test('AI assistant is visible when customization is not configured', () => {
  assert.equal(isRainbondInfoAgentEnabled({}), true);
});

test('AI assistant is hidden when customization is explicitly disabled', () => {
  assert.equal(
    isRainbondInfoAgentEnabled({
      show_ai_assistant: {
        enable: false,
        value: 'false'
      }
    }),
    false
  );
});

test('AI assistant is visible when customization is explicitly enabled', () => {
  assert.equal(
    isRainbondInfoAgentEnabled({
      show_ai_assistant: {
        enable: true,
        value: 'true'
      }
    }),
    true
  );
});
