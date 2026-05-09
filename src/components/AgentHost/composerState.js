const { shouldRenderMessageItem } = require('./displayFilters');

const EMPTY_COMPOSER_PLACEHOLDER = '输入命令，例如，你可以帮我做些什么？';
const DEFAULT_COMPOSER_PLACEHOLDER = '请输入命令';
const DEFAULT_EMPTY_MESSAGE = '你可以帮我做些什么？';
const PENDING_APPROVAL_PLACEHOLDER = '请先取消未处理审批';

function hasRenderableMessages(messages = []) {
  return Array.isArray(messages) && messages.some(item => shouldRenderMessageItem(item));
}

function getComposerPlaceholder(options = {}) {
  const { messages, hasSessionPending } = options;

  if (hasSessionPending) {
    return PENDING_APPROVAL_PLACEHOLDER;
  }

  return hasRenderableMessages(messages)
    ? DEFAULT_COMPOSER_PLACEHOLDER
    : EMPTY_COMPOSER_PLACEHOLDER;
}

function resolveComposerMessage(options = {}) {
  const { draft, messages } = options;
  const trimmedDraft = typeof draft === 'string' ? draft.trim() : '';

  if (trimmedDraft) {
    return trimmedDraft;
  }

  return hasRenderableMessages(messages) ? '' : DEFAULT_EMPTY_MESSAGE;
}

module.exports = {
  DEFAULT_EMPTY_MESSAGE,
  DEFAULT_COMPOSER_PLACEHOLDER,
  EMPTY_COMPOSER_PLACEHOLDER,
  PENDING_APPROVAL_PLACEHOLDER,
  getComposerPlaceholder,
  hasRenderableMessages,
  resolveComposerMessage,
};
