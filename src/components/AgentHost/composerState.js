import * as displayFilters from './displayFilters';

const { shouldRenderMessageItem } = displayFilters;

export const EMPTY_COMPOSER_PLACEHOLDER = '输入命令，例如，帮我排查这个组件的问题。';
export const DEFAULT_COMPOSER_PLACEHOLDER = '请输入命令';
export const DEFAULT_EMPTY_MESSAGE = '帮我排查这个组件的问题。';
export const PENDING_APPROVAL_PLACEHOLDER = '请先取消未处理审批';

export function hasRenderableMessages(messages = []) {
  return Array.isArray(messages) && messages.some(item => shouldRenderMessageItem(item));
}

export function getComposerPlaceholder(options = {}) {
  const { messages, hasSessionPending } = options;

  if (hasSessionPending) {
    return PENDING_APPROVAL_PLACEHOLDER;
  }

  return hasRenderableMessages(messages)
    ? DEFAULT_COMPOSER_PLACEHOLDER
    : EMPTY_COMPOSER_PLACEHOLDER;
}

export function resolveComposerMessage(options = {}) {
  const { draft, messages } = options;
  const trimmedDraft = typeof draft === 'string' ? draft.trim() : '';

  if (trimmedDraft) {
    return trimmedDraft;
  }

  return hasRenderableMessages(messages) ? '' : DEFAULT_EMPTY_MESSAGE;
}
