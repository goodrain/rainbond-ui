const assert = require('assert');
const {
  DEFAULT_EMPTY_MESSAGE,
  DEFAULT_COMPOSER_PLACEHOLDER,
  EMPTY_COMPOSER_PLACEHOLDER,
  PENDING_APPROVAL_PLACEHOLDER,
  getComposerPlaceholder,
  hasRenderableMessages,
  resolveComposerMessage,
} = require('./composerState');

assert.strictEqual(
  hasRenderableMessages([]),
  false,
  'empty conversations should be treated as having no renderable messages'
);

assert.strictEqual(
  hasRenderableMessages([{ id: 'ctx_1', kind: 'context', content: '已切换上下文' }]),
  false,
  'hidden context markers should not suppress the empty composer state'
);

assert.strictEqual(
  hasRenderableMessages([{ id: 'msg_1', role: 'assistant', kind: 'normal', content: '你好' }]),
  true,
  'visible assistant replies should count as renderable messages'
);

assert.strictEqual(
  getComposerPlaceholder({ messages: [] }),
  EMPTY_COMPOSER_PLACEHOLDER,
  'the empty-session placeholder should guide the first prompt'
);

assert.strictEqual(
  getComposerPlaceholder({
    messages: [{ id: 'msg_1', role: 'assistant', kind: 'normal', content: '你好' }],
  }),
  DEFAULT_COMPOSER_PLACEHOLDER,
  'once a visible message exists the placeholder should switch to the normal prompt'
);

assert.strictEqual(
  getComposerPlaceholder({ messages: [], hasSessionPending: true }),
  PENDING_APPROVAL_PLACEHOLDER,
  'pending approvals should still override the normal placeholder'
);

assert.strictEqual(
  resolveComposerMessage({ draft: '  帮我检查应用状态  ', messages: [] }),
  '帮我检查应用状态',
  'typed drafts should keep taking priority over the empty-state shortcut'
);

assert.strictEqual(
  resolveComposerMessage({ draft: '   ', messages: [] }),
  DEFAULT_EMPTY_MESSAGE,
  'empty first-turn sends should fall back to the default helper prompt'
);

assert.strictEqual(
  resolveComposerMessage({
    draft: '',
    messages: [{ id: 'msg_1', role: 'user', kind: 'normal', content: '你好' }],
  }),
  '',
  'empty follow-up sends should still be rejected instead of auto-filling'
);

console.log('agent host composer state tests passed');
