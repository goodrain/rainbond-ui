import React, { PureComponent } from 'react';
import { formatMessage } from 'umi';
import { Alert, Button, Icon, Input, Modal, Popover, Tag, message } from 'antd';
import { routerRedux } from 'dva/router';
import ReactMarkdown from 'react-markdown';
import styles from './index.less';
import * as autoApprovalPolicy from './autoApprovalPolicy';
import * as approvalMeta from './approvalMeta';
import * as composerState from './composerState';
import * as closeBehavior from './closeBehavior';
import * as displayFilters from './displayFilters';
import * as markdownHelpers from './markdownHelpers';
import * as scrollBehavior from './scrollBehavior';
import MemorySettingsModal from './MemorySettingsModal';
import ConversationTurn from './ConversationTurn';
import ApprovalRecord from './ApprovalRecord';
import ToolCallRow from './ToolCallRow';
import * as turnPresentation from './turnPresentation';

function AgentBrandIcon() {
  return (
    <span className={styles.panelBrandIcon} aria-hidden="true">
      <svg
        viewBox="0 0 1024 1024"
        className={styles.panelBrandIconSvg}
        focusable="false"
      >
        <path
          d="M773.592949 798.845831c92.576542-51.429966 153.877695-140.240271 153.877695-241.381967 0-63.965288-24.779932-122.862644-66.199864-170.673898a387.562305 387.562305 0 0 0 4.647051-56.840678c0-8.829831-0.976271-17.442712-1.562034-26.142373 76.643797 62.863186 124.667661 151.430508 124.667661 249.869017 0 110.409763-60.342237 208.453424-153.882034 271.620339v172.053695l-172.509288-104.695322a463.589966 463.589966 0 0 1-73.697628 6.104949c-118.510644 0-193.874441-44.691525-267.138169-115.317152 12.058034 0.685559 24.055322 1.549017 36.321627 1.549017 17.182373 0 34.130441-0.837424 50.904949-2.169492 57.842983 39.233085 100.200136 62.841492 179.911593 62.841492a394.543729 394.543729 0 0 0 79.620339-8.352543l105.033763 69.020204v-107.485288z m-338.536135-74.517695a913.464407 913.464407 0 0 1-103.515119-7.992407L158.073492 815.338305v-172.045017c-80.414373-67.479864-123.105627-161.219254-123.105628-271.620339 0-190.576814 178.818169-345.070644 400.093289-345.070644 183.942508 0 369.308203 154.493831 369.308203 345.070644s-148.349831 352.655186-369.312542 352.655187z m-110.401085-69.024543c25.6 5.258847 82.926644 8.348203 110.405424 8.348204 186.96678 0 307.75539-129.019661 307.755389-288.190916s-154.719458-288.190915-307.755389-288.190915c-192.256 0-338.536136 129.032678-338.536136 288.190915 0 101.128678 48.023864 181.308746 123.101288 241.36895v107.498305z m279.669152-234.335457a45.507254 45.507254 0 1 1 46.16678-45.507255 45.837017 45.837017 0 0 1-46.16678 45.507255z m-184.654101 0a45.507254 45.507254 0 1 1 46.16244-45.507255A45.841356 45.841356 0 0 1 419.67078 420.968136z m-184.658441 0a45.507254 45.507254 0 1 1 46.16678-45.507255 45.837017 45.837017 0 0 1-46.16678 45.507255z"
          fill="#FFFFFF"
        />
      </svg>
    </span>
  );
}

function SendButtonIcon() {
  return (
    <span className={styles.footerSendIcon} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        className={styles.footerSendIconSvg}
        focusable="false"
      >
        <path
          d="M4 12.2 19 5.7c.65-.28 1.28.35 1.01 1L13.5 21.6c-.28.65-1.22.58-1.41-.11L9.9 15.2l-6.2-1.63c-.72-.19-.76-1.2-.05-1.37Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.35 5.95 9.9 15.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

class MarkdownRenderer extends PureComponent {
  render() {
    const { content } = this.props;

    return (
      <ReactMarkdown
        source={renderMarkdownSource(content || '')}
        escapeHtml={false}
      />
    );
  }
}

class PlainTextRenderer extends PureComponent {
  render() {
    const { content, className } = this.props;

    return (
      <div className={className || styles.streamingPlainText}>
        {content || ''}
      </div>
    );
  }
}

class AssistantMarkdownBody extends PureComponent {
  render() {
    const {
      content,
      suggestedActions,
      renderSuggestedActions,
      streaming,
    } = this.props;

    return (
      <div className={styles.markdownBody}>
        {streaming ? (
          <PlainTextRenderer content={content} />
        ) : (
          <MarkdownRenderer content={content} />
        )}
        {Array.isArray(suggestedActions) && suggestedActions.length > 0
          ? renderSuggestedActions(suggestedActions)
          : null}
      </div>
    );
  }
}

class TraceMessageRow extends PureComponent {
  render() { return <ToolCallRow item={this.props.item} />; }
}

class ApprovalMessageCard extends PureComponent {
  renderActions() {
    const { approval, isDeciding, onDecision } = this.props;
    const alwaysAllowed = autoApprovalPolicy.canAlwaysAllowApproval(approval);
    return (
      <React.Fragment>
        <div className={styles.approvalFlatActions}>
          <Button disabled={isDeciding || !alwaysAllowed}
            onClick={() => onDecision('approved', autoApprovalPolicy.toRememberPolicy('session-all'))}>
            始终允许
          </Button>
          <Button type="primary" loading={isDeciding} disabled={isDeciding}
            onClick={() => onDecision('approved')}>
            本次允许
          </Button>
          <Button disabled={isDeciding} onClick={() => onDecision('rejected')}>
            拒绝
          </Button>
        </div>
        <div className={styles.approvalChoiceHint}>
          当前会话有效，最长 24 小时；删除仍需手动确认。
          {!alwaysAllowed ? <span> 此操作仅支持本次允许或拒绝。</span> : null}
        </div>
      </React.Fragment>
    );
  }

  renderResolvedCompact() {
    return <ApprovalRecord item={this.props.item} />;
  }

  render() {
    const { item } = this.props;
    const approval = item.approval || {};
    const isPending = approval.status === 'pending';

    if (!isPending) {
      return this.renderResolvedCompact();
    }

    const wasAutoApproved = !!approval.autoApproved;
    const riskMeta = getApprovalRiskMeta(approval.risk, approval.levelLabel);
    const cardClassName = [
      styles.approvalCard,
      styles[riskMeta.cardClass]
    ].filter(Boolean).join(' ');

    return (
      <div className={styles.approvalRow} data-approval-action={approval.approvalId}>
        <div className={cardClassName}>
          <div className={styles.approvalHeader}>
            <span className={styles.approvalTitle}>
              <Icon type="exclamation-circle-o" />
              需要您的授权执行
            </span>
            <Tag color={riskMeta.color}>{riskMeta.label}</Tag>
          </div>
          <div className={styles.approvalContent}>
            <span className={styles.approvalContentLabel}>操作内容：</span>
            <span className={styles.approvalContentText}>{item.content}</span>
          </div>
          {wasAutoApproved ? (
            <div className={styles.approvalAutoNote}>已根据会话策略自动批准</div>
          ) : null}
          {this.renderActions()}
        </div>
      </div>
    );
  }
}

class SuggestedActionsCard extends PureComponent {
  render() {
    const { item, renderSuggestedActions } = this.props;
    const actions = Array.isArray(item.suggestedActions) ? item.suggestedActions : [];
    if (actions.length === 0) {
      return null;
    }

    return (
      <div className={styles.approvalRow}>
        <div className={styles.approvalCard}>
          <div className={styles.approvalHeader}>
            <span className={styles.approvalTitle}>
              <Icon type="appstore" />
              后续建议
            </span>
          </div>
          {item.content && item.content !== '后续建议' ? (
            <div className={styles.approvalContent}>{item.content}</div>
          ) : null}
          {renderSuggestedActions(actions, { showTitle: false })}
        </div>
      </div>
    );
  }
}

class StatusMessageRow extends PureComponent {
  render() {
    const { item } = this.props;

    return (
      <div className={styles.contextRow}>
        <span className={styles.statusBadge}>{item.content}</span>
      </div>
    );
  }
}

class ErrorMessageRow extends PureComponent {
  render() {
    const { item } = this.props;

    return (
      <div className={styles.errorRow}>
        <div className={styles.errorCard}>{item.content}</div>
      </div>
    );
  }
}

class UserMessageRow extends PureComponent {
  state = { expanded: false };
  render() {
    const { item } = this.props;

    return (
      <div className={`${styles.messageRow} ${styles.userRow}`}>
        <div className={styles.messageMeta}>
          <span className={styles.messageRole}>我</span>
          <span className={styles.messageTime}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className={`${styles.messageBubble} ${styles.userBubble}`}>
          <div id={`question:${item.id}`} className={item.content && item.content.length > 800 && !this.state.expanded ? styles.longQuestionCollapsed : undefined}>{item.content}</div>
          {item.content && item.content.length > 800 ? <button type="button" className={styles.longQuestionToggle}
            aria-expanded={this.state.expanded} aria-controls={`question:${item.id}`}
            onClick={() => this.setState(state => ({ expanded: !state.expanded }))}>
            {formatMessage({ id: `agent.execution.${this.state.expanded ? 'collapseQuestion' : 'expandQuestion'}` })}<Icon type={this.state.expanded ? 'up' : 'down'} />
          </button> : null}
        </div>
      </div>
    );
  }
}

const { getApprovalRiskMeta } = approvalMeta;
const {
  getComposerPlaceholder,
  hasRenderableMessages,
  resolveComposerMessage,
} = composerState;
const { renderMarkdownSource } = markdownHelpers;
const {
  getNextAutoScrollEnabled,
  isNearBottom,
  shouldAttemptAutoScrollUpdate,
} = scrollBehavior;
const {
  shouldRenderMessageItem,
  shouldRenderWorkflowSummary,
} = displayFilters;

const { TextArea } = Input;
const { confirm } = Modal;

export default class AgentHost extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      approvalSettingsVisible: false,
      memorySettingsVisible: false,
      updateBannerDismissed: false,
      followOutput: true,
    };
    this.messagesRef = null;
    this.messagesContentRef = null;
    this.messagesResizeObserver = null;
    this.scrollFrame = null;
    this.scrollGestureUntil = 0;
    this.scrollPointerActive = false;
    this.touchPosition = null;
    this.scrollRequest = null;
    this.scrollDirection = 0;
    this.lastScrollTop = 0;
    this.lastRenderedMessagesRef = null;
    this.lastRenderedMessagesSending = null;
    this.lastRenderedMessagesOutput = null;
    this.composerRef = null;
    this.composerFocusFrame = null;
  }

  componentDidMount() {
    this.scrollToBottom({ force: true });
    window.addEventListener('resize', this.handleMessagesResize);
    window.addEventListener('pointerup', this.handleScrollPointerUp);
  }

  componentDidUpdate(prevProps) {
    const prevMessages = (prevProps.agent && prevProps.agent.messages) || [];
    const nextMessages = (this.props.agent && this.props.agent.messages) || [];
    const wasVisible = prevProps.agent && prevProps.agent.visible;
    const isVisible = this.props.agent && this.props.agent.visible;

    if (shouldAttemptAutoScrollUpdate({
      prevMessages,
      nextMessages,
      wasVisible,
      isVisible,
      wasSending: !!(prevProps.agent && prevProps.agent.sending),
      isSending: !!(this.props.agent && this.props.agent.sending),
    })) {
      const lastMessage = nextMessages[nextMessages.length - 1];
      const userSentMessage = lastMessage && lastMessage.role === 'user' &&
        !prevMessages.some(item => item.id === lastMessage.id);
      const force = (!wasVisible && isVisible) || !!userSentMessage;
      if (force) this.resetOutputPosition();
      this.scrollToBottom({ force });
    }

    if (this.shouldFocusComposerAfterRun(prevProps)) {
      this.focusComposerInput();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleMessagesResize);
    window.removeEventListener('pointerup', this.handleScrollPointerUp);
    if (this.messagesResizeObserver) this.messagesResizeObserver.disconnect();
    if (this.scrollFrame) window.cancelAnimationFrame(this.scrollFrame);
    if (
      this.composerFocusFrame &&
      typeof window !== 'undefined' &&
      window.cancelAnimationFrame
    ) {
      window.cancelAnimationFrame(this.composerFocusFrame);
    }
  }

  setMessagesRef = node => {
    this.messagesRef = node;
  };

  setMessagesContentRef = node => {
    if (this.messagesResizeObserver) this.messagesResizeObserver.disconnect();
    this.messagesContentRef = node;
    this.messagesResizeObserver = null;
    if (node && typeof window.ResizeObserver === 'function') {
      this.messagesResizeObserver = new window.ResizeObserver(this.handleMessagesResize);
      this.messagesResizeObserver.observe(node);
    }
  };

  handleMessagesResize = () => {
    if (this.props.agent && this.props.agent.visible) this.scrollToBottom();
  };

  setComposerRef = node => {
    this.composerRef = node;
  };

  shouldFocusComposerAfterRun = prevProps => {
    const prevAgent = (prevProps && prevProps.agent) || {};
    const nextAgent = (this.props && this.props.agent) || {};
    const wasSending = !!prevAgent.sending;
    const isSending = !!nextAgent.sending;
    const isVisible = !!nextAgent.visible;
    const hasSessionPending =
      Array.isArray(nextAgent.sessionPendingApprovals) &&
      nextAgent.sessionPendingApprovals.length > 0;

    return wasSending && !isSending && isVisible && !hasSessionPending;
  };

  focusComposerInput = () => {
    const runFocus = () => {
      this.composerFocusFrame = null;
      const ref = this.composerRef;
      const target =
        ref && typeof ref.focus === 'function'
          ? ref
          : ref && ref.textArea && typeof ref.textArea.focus === 'function'
            ? ref.textArea
            : null;

      if (target) {
        target.focus();
      }
    };

    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      if (this.composerFocusFrame && window.cancelAnimationFrame) {
        window.cancelAnimationFrame(this.composerFocusFrame);
      }
      this.composerFocusFrame = window.requestAnimationFrame(runFocus);
      return;
    }

    runFocus();
  };

  setAutoScrollEnabled = enabled => {
    if (!enabled) {
      if (this.scrollFrame) window.cancelAnimationFrame(this.scrollFrame);
      this.scrollFrame = null;
      this.scrollRequest = null;
    }
    if (this.state.followOutput !== enabled) this.setState({ followOutput: enabled });
  };

  scheduleMessagesScroll = request => {
    // A deliberate reveal/anchor wins over generic resize and token updates.
    if (request.explicit || request.force || !this.scrollRequest || !this.scrollRequest.explicit) this.scrollRequest = request;
    if (this.scrollFrame) return;
    this.scrollFrame = window.requestAnimationFrame(() => {
      const view = this.scrollRequest;
      this.scrollFrame = null;
      this.scrollRequest = null;
      const panel = this.messagesRef;
      if (!panel || !view || (view.follow && !view.force && !this.state.followOutput)) return;
      this.scrollGestureUntil = 0;
      const target = view.getTarget && view.getTarget();
      if (target && target.isConnected !== false) {
        const bounds = target.getBoundingClientRect();
        const viewport = panel.getBoundingClientRect();
        if (view.align === 'start') panel.scrollTop += bounds.top - viewport.top - 12;
        else if (bounds.bottom > viewport.bottom) panel.scrollTop += bounds.bottom - viewport.bottom;
        else if (bounds.top < viewport.top) panel.scrollTop += bounds.top - viewport.top;
      } else if (view.follow) panel.scrollTop = panel.scrollHeight;
      else if (view.anchor && view.anchor.isConnected !== false) {
        panel.scrollTop += view.anchor.getBoundingClientRect().top - view.anchorTop;
      }
      this.lastScrollTop = panel.scrollTop;
    });
  };

  scrollToBottom = options => {
    const force = !!(options && options.force);
    if (force || this.state.followOutput) this.scheduleMessagesScroll({ follow: true, force });
  };

  resetOutputPosition = () => {
    this.setAutoScrollEnabled(true);
  };

  handleExecutionViewChange = options => {
    const changesFollow = typeof options.follow === 'boolean';
    const follow = changesFollow ? options.follow : this.state.followOutput;
    const anchorTop = options.anchor && options.anchor.getBoundingClientRect().top;
    this.scrollGestureUntil = 0;
    this.scrollDirection = 0;
    if (changesFollow) this.setAutoScrollEnabled(follow);
    if (!options.pauseOnly) this.scheduleMessagesScroll({ ...options, follow, anchorTop, explicit: true });
  };

  handleContinueFollowing = () => {
    this.setAutoScrollEnabled(true);
    this.scrollToBottom({ force: true });
  };

  handleMessagesScroll = event => {
    const target = (event && event.currentTarget) || this.messagesRef;
    if (!target) {
      return;
    }

    const userInitiated = this.scrollPointerActive || Date.now() < this.scrollGestureUntil;
    if (userInitiated && target.scrollTop !== this.lastScrollTop) {
      this.scrollDirection = target.scrollTop > this.lastScrollTop ? 1 : -1;
    }
    this.lastScrollTop = target.scrollTop;
    const nextEnabled = getNextAutoScrollEnabled(
      this.state.followOutput,
      target,
      {
        isStreaming: !!(this.props.agent && this.props.agent.sending),
        userInitiated,
        movingUp: userInitiated && this.scrollDirection < 0,
      }
    );
    if (nextEnabled && !this.state.followOutput) this.handleContinueFollowing();
    else if (!nextEnabled && this.state.followOutput) this.setAutoScrollEnabled(false);
  };

  handleMessagesWheel = event => {
    this.scrollGestureUntil = Date.now() + 250;
    this.scrollDirection = Math.sign(event.deltaY);
    if (event.deltaY < 0) this.setAutoScrollEnabled(false);
  };

  handleMessagesTouchStart = event => {
    this.touchPosition = event.touches[0] && event.touches[0].clientY;
  };

  handleMessagesTouchMove = event => {
    const touch = event.touches[0];
    if (!touch) return;
    this.scrollGestureUntil = Date.now() + 250;
    this.scrollDirection = this.touchPosition == null ? 0 : Math.sign(this.touchPosition - touch.clientY);
    if (this.touchPosition != null && touch.clientY > this.touchPosition) this.setAutoScrollEnabled(false);
    this.touchPosition = touch.clientY;
  };

  handleMessagesKeyDown = event => {
    const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
    if (!keys.includes(event.key)) return;
    const target = event.target;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
    if (event.key === ' ' && target !== this.messagesRef && target && target.closest &&
      target.closest('button, [role="button"]')) return;
    this.scrollGestureUntil = Date.now() + 250;
    if (['ArrowUp', 'PageUp', 'Home'].includes(event.key) || (event.key === ' ' && event.shiftKey)) {
      this.scrollDirection = -1;
      this.setAutoScrollEnabled(false);
    } else this.scrollDirection = 1;
  };

  handleScrollPointerDown = event => {
    if (event.target !== this.messagesRef) return;
    const bounds = this.messagesRef.getBoundingClientRect();
    const scrollbarWidth = Math.max(16, this.messagesRef.offsetWidth - this.messagesRef.clientWidth);
    if (event.clientX >= bounds.right - scrollbarWidth) {
      this.scrollPointerActive = true;
      this.scrollDirection = 0;
      this.setAutoScrollEnabled(false);
    }
  };

  handleScrollPointerUp = () => {
    if (!this.scrollPointerActive) return;
    this.scrollPointerActive = false;
    this.scrollGestureUntil = Date.now() + 250;
    this.handleMessagesScroll();
  };

  closeDrawer = () => {
    const { dispatch, agent } = this.props;
    if (!closeBehavior.shouldConfirmClose(agent)) {
      dispatch({
        type: 'agent/hide',
      });
      return;
    }

    confirm({
      title: '确认停止并关闭聊天窗口',
      content: '当前对话正在输出中，确认后会先停止本次对话，再关闭聊天窗口。',
      okText: '停止并关闭',
      cancelText: '取消',
      onOk: () => {
        this.handleStopRun({ hideAfterAbort: true });
      },
    });
  };

  // 跳转到 AI 助手插件对应应用的升级页（复用平台既有升级流程），并关闭面板。
  handleGoUpgrade = () => {
    const { agent, dispatch } = this.props;
    const update = (agent && agent.agentUpdate) || null;
    if (!update || !update.appId || !update.teamName || !update.regionName) {
      return;
    }
    const url = `/team/${update.teamName}/region/${update.regionName}/apps/${update.appId}/upgrade`;
    if (dispatch) {
      dispatch(routerRedux.push(url));
      dispatch({ type: 'agent/hide' });
    }
  };

  // 忽略本次更新提示（仅当前会话内生效，刷新后或下次有新版本会重新出现）。
  handleDismissUpdateBanner = () => {
    this.setState({ updateBannerDismissed: true });
  };

  handleDraftChange = event => {
    const { dispatch } = this.props;
    dispatch({
      type: 'agent/saveDraft',
      payload: event.target.value,
    });
  };

  handleSend = () => {
    const { dispatch, agent } = this.props;
    const messages = (agent && agent.messages) || [];
    const draft = (agent && agent.draft) || '';
    const hasSessionPending =
      !!(agent && agent.sessionPendingApprovals && agent.sessionPendingApprovals.length > 0);
    const nextMessage = resolveComposerMessage({
      draft,
      messages,
    });

    if (hasSessionPending) {
      message.warning('请先取消未处理审批');
      return;
    }

    if (!nextMessage) {
      message.warning('无内容');
      return;
    }

    this.resetOutputPosition();
    dispatch({
      type: 'agent/sendMessage',
      payload: {
        message: nextMessage,
        context: agent && agent.context,
      },
    });
  };

  handleContinueWorkflowAction = () => {
    const { dispatch, agent } = this.props;
    this.resetOutputPosition();
    dispatch({
      type: 'agent/sendMessage',
      payload: {
        message: '继续执行',
        context: agent && agent.context,
      },
    });
  };

  handleSelectStructuredSuggestedAction = action => {
    if (!action) {
      return;
    }

    this.resetOutputPosition();
    const actionId = action.actionId || '';
    const optionKey = action.optionKey || '';
    const label = action.label || '';

    this.props.dispatch({
      type: 'agent/sendMessage',
      payload: {
        message: optionKey ? `选择方案 ${optionKey}${label ? `：${label}` : ''}` : label || '执行推荐方案',
        selectedActionId: actionId,
        selectedActionKey: optionKey,
        context: this.props.agent && this.props.agent.context,
      },
    });
  };

  renderParsedSuggestedActions = (actions, options = {}) => {
    const visibleActions = displayFilters.getVisibleSuggestedActions(actions);
    if (!visibleActions.length) return null;
    const showTitle = options.showTitle !== false;

    return (
      <div className={styles.inlineSuggestionList}>
        {showTitle ? (
          <div className={styles.inlineSuggestionTitle}>后续建议</div>
        ) : null}
        {visibleActions.map((action, index) => (
          <button
            key={`${action.optionKey || 'option'}-${index}`}
            type="button"
            className={styles.inlineSuggestionCard}
            onClick={() => this.handleSelectStructuredSuggestedAction(action)}
          >
            <div className={styles.inlineSuggestionHeader}>
              <div className={styles.inlineSuggestionCardTitle}>
                方案 {action.optionKey}
                {action.label ? ` · ${action.label}` : ''}
              </div>
              {action.recommended ? <Tag color="green">推荐</Tag> : null}
            </div>
            {action.description ? (
              <div className={styles.inlineSuggestionDescription}>
                {action.description}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    );
  };

  handlePressEnter = event => {
    if (event.shiftKey) {
      return;
    }
    event.preventDefault();
    this.handleSend();
  };

  handleClear = () => {
    const { dispatch, currentUser } = this.props;
    confirm({
      title: '确认清空对话',
      content: '将删除当前会话的所有消息和操作记录，不可恢复。',
      okType: 'danger',
      okText: '清空',
      cancelText: '取消',
      onOk: () => {
        dispatch({
          type: 'agent/clearConversation',
          payload: {
            userId: currentUser && String(currentUser.user_id),
          },
        });
      },
    });
  };

  handleStopRun = options => {
    const { dispatch } = this.props;
    dispatch({
      type: 'agent/abortRun',
      payload: {
        hideAfterAbort: !!(options && options.hideAfterAbort),
      },
    });
  };

  handleConflictForceStop = () => {
    this.props.dispatch({ type: 'agent/forceStopConflict' });
  };

  handleConflictCancelMine = () => {
    this.props.dispatch({ type: 'agent/cancelMyInput' });
  };

  formatConflictElapsed = startedAt => {
    if (!startedAt) return '';
    const ts = Date.parse(startedAt);
    if (Number.isNaN(ts)) return '';
    const diffSec = Math.max(1, Math.floor((Date.now() - ts) / 1000));
    if (diffSec < 60) return `${diffSec} 秒`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分 ${diffSec % 60} 秒`;
    return `${Math.floor(diffSec / 3600)} 小时${Math.floor((diffSec % 3600) / 60)} 分`;
  };

  renderRunConflictNotice = () => {
    const { agent } = this.props;
    const conflict = agent && agent.runConflict;
    if (!conflict || !conflict.currentRun) {
      return null;
    }
    const cr = conflict.currentRun;
    const elapsed = this.formatConflictElapsed(cr.startedAt);
    const iterText = cr.iteration ? `第 ${cr.iteration} 次 LLM 调用` : '';
    const phaseText = cr.currentPhase || '';
    const subPieces = [
      elapsed ? `已运行 ${elapsed}` : '',
      iterText,
      phaseText,
    ].filter(Boolean);
    const excerpt = cr.userMessageExcerpt || '';
    const cancelling = !!(agent && agent.cancellingRun);

    const description = (
      <div>
        <div style={{ marginBottom: 8 }}>
          另一个窗口正在处理 <strong>「{excerpt}」</strong>
          {subPieces.length > 0 ? `（${subPieces.join('，')}）` : ''}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Button
            size="small"
            type="primary"
            loading={cancelling}
            onClick={this.handleConflictForceStop}
            style={{ marginRight: 8 }}
          >
            强制停止
          </Button>
          <Button
            size="small"
            onClick={this.handleConflictCancelMine}
          >
            取消输入
          </Button>
        </div>
      </div>
    );

    return (
      <Alert
        type="warning"
        showIcon
        message="另一个窗口已有运行"
        description={description}
        style={{ margin: '8px 12px' }}
      />
    );
  };

  handleApprovalDecision = (decision, rememberPolicy = null, approvalId) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'agent/resolveApproval',
      payload: {
        decision,
        rememberPolicy,
        approvalId,
      },
    });
  };

  renderTraceMessage = item => {
    // 记忆的写入/检索过程不在聊天里展示，避免打扰。
    const toolName = (item.trace && item.trace.toolName) || '';
    if (/^memory_/i.test(toolName) || /记忆/.test(toolName)) return null;
    return <TraceMessageRow key={item.id} item={item} />;
  };

  renderApprovalActions = item => {
    const { agent } = this.props;
    return (
      <ApprovalMessageCard
        item={item}
        approval={item.approval || {}}
        isDeciding={
          !!agent && agent.decidingApprovalId === (item.approval && item.approval.approvalId)
        }
        onDecision={(decision, policy) => this.handleApprovalDecision(decision, policy, item.approval && item.approval.approvalId)}
      />
    );
  };

  renderApprovalMessage = item => {
    return (
      <ApprovalMessageCard
        key={item.id}
        item={item}
        approval={item.approval || {}}
        isDeciding={
          !!this.props.agent &&
          this.props.agent.decidingApprovalId === (item.approval && item.approval.approvalId)
        }
        onDecision={(decision, policy) => this.handleApprovalDecision(decision, policy, item.approval && item.approval.approvalId)}
      />
    );
  };

  renderSuggestedActionsMessage = item => {
    return (
      <SuggestedActionsCard
        key={item.id}
        item={item}
        renderSuggestedActions={this.renderParsedSuggestedActions}
      />
    );
  };

  renderStatusMessage = item => {
    return <StatusMessageRow key={item.id} item={item} />;
  };

  renderErrorMessage = item => {
    return <ErrorMessageRow key={item.id} item={item} />;
  };

  handleApprovalSettingsVisibleChange = visible => {
    this.setState({ approvalSettingsVisible: visible });
    if (visible) {
      this.props.dispatch({ type: 'agent/loadApprovalPolicies' });
    }
  };

  handleRemoveApprovalPolicy = policyId => {
    this.props.dispatch({
      type: 'agent/removeApprovalPolicy',
      payload: { policyId },
    });
  };

  handleClearApprovalPolicies = () => {
    this.props.dispatch({ type: 'agent/clearApprovalPolicies' });
  };

  handleCancelSessionPending = () => {
    this.props.dispatch({ type: 'agent/cancelSessionPending' });
  };

  renderAutoApprovalSettings = () => {
    const { agent } = this.props;
    const policies = (agent && agent.approvalPolicies) || [];
    const loading = !!(agent && agent.approvalPoliciesLoading);
    const error = (agent && agent.approvalPolicyError) || '';
    const notice = (agent && agent.approvalPolicyNotice) || '';
    if (loading) return <div className={styles.autoApprovalEmpty}>加载中…</div>;
    const allAllowed = policies.some(policy => policy.kind === 'session_all');
    const mode = allAllowed ? '始终允许' : policies.length ? '部分操作已自动允许' : '每次询问';
    return (
      <div className={styles.autoApprovalList}>
        <div className={styles.autoApprovalItem}>
          <span>当前会话</span><Tag color={policies.length ? 'blue' : undefined}>{mode}</Tag>
        </div>
        {notice ? <div className={styles.autoApprovalHint}>{notice}</div> : null}
        {error ? <div className={styles.autoApprovalError}>{error}</div> : null}
        <div className={styles.autoApprovalHint}>
          删除仍需手动确认；其他强制审批操作也不会自动放行。
          规则仅对当前会话生效，最长 24 小时。
        </div>
        {policies.length ? (
          <div className={styles.autoApprovalActions}>
            <Button size="small" onClick={this.handleClearApprovalPolicies}>恢复每次询问</Button>
          </div>
        ) : <div className={styles.autoApprovalEmpty}>可在审批卡片中选择“始终允许”。</div>}
      </div>
    );
  };

  renderWorkflowSummary = () => {
    if (!shouldRenderWorkflowSummary()) {
      return null;
    }
    return null;
  };

  renderStandaloneTraceGroup = traces => {
    if (!traces || traces.length === 0) {
      return null;
    }

    return (
      <div className={styles.traceGroupStandalone} key={`trace-group-${traces[0].id}`}>
        {traces.map(item => this.renderTraceMessage(item))}
      </div>
    );
  };

  renderAssistantTraceGroup = traces => {
    if (!traces || traces.length === 0) {
      return null;
    }

    return (
      <div className={styles.messageTraceGroup}>
        {traces.map(item => this.renderTraceMessage(item))}
      </div>
    );
  };

  renderTurnProcessAnswer = item => (
    <AssistantMarkdownBody content={displayFilters.getAssistantDisplayContent(item)}
      renderSuggestedActions={this.renderParsedSuggestedActions} streaming={!!item.streaming} />
  );

  renderTurnAnswer = item => (
    <div key={`answer:${item.id}`} className={`${styles.messageBubble} ${styles.assistantBubble}`}>
      <AssistantMarkdownBody content={displayFilters.getAssistantDisplayContent(item)} suggestedActions={item.suggestedActions}
        renderSuggestedActions={this.renderParsedSuggestedActions} streaming={!!item.streaming} />
    </div>
  );

  renderTurnNotice = item => {
    if (item.kind === 'error') return this.renderErrorMessage(item);
    if (item.kind === 'suggested_actions') return this.renderSuggestedActionsMessage(item);
    return this.renderStatusMessage(item);
  };

  renderMessages = () => {
    const { agent } = this.props;
    const messages = (agent && agent.messages) || [];
    const sending = !!(agent && agent.sending);
    if (
      this.lastRenderedMessagesRef === messages &&
      this.lastRenderedMessagesSending === sending &&
      this.lastRenderedActiveRunId === (agent && agent.activeRunId) &&
      this.lastRenderedDecidingApprovalId === (agent && agent.decidingApprovalId) &&
      this.lastRenderedFollowing === this.state.followOutput &&
      this.lastRenderedMessagesOutput
    ) {
      return this.lastRenderedMessagesOutput;
    }
    const hasVisibleMessages = hasRenderableMessages(messages);

    if (!hasVisibleMessages) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>Rainbond AI 助手</div>
          <div className={styles.emptyText}>
            <div className={styles.emptyFeatureList}>
              <div className={styles.emptyFeatureItem}>
                <span>帮你解答 Rainbond 的使用问题。</span>
              </div>
              <div className={styles.emptyFeatureItem}>
                <span>帮你通过镜像、源码等方式安装和部署应用。</span>
              </div>
              <div className={styles.emptyFeatureItem}>
                <span>帮你查看服务状态，定位问题并给出处理建议。</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const groups = turnPresentation.groupConversationMessages(messages, {
      sending, activeRunId: agent && agent.activeRunId,
    });
    const rendered = groups.map(group => {
      if (group.kind === 'user') return <UserMessageRow key={group.key} item={group.item} />;
      if (group.kind === 'context') return (
        <div key={group.key} className={styles.contextRow}>
          <span className={styles.contextBadge}>{group.item.content}</span>
        </div>
      );
      return <ConversationTurn key={group.key} turn={group}
        following={this.state.followOutput}
        onViewChange={this.handleExecutionViewChange}
        renderTrace={this.renderTraceMessage}
        renderApproval={this.renderApprovalMessage}
        renderNotice={this.renderTurnNotice}
        renderAnswer={this.renderTurnAnswer}
        renderProcessAnswer={this.renderTurnProcessAnswer}
      />;
    });

    this.lastRenderedMessagesRef = messages;
    this.lastRenderedMessagesSending = sending;
    this.lastRenderedActiveRunId = agent && agent.activeRunId;
    this.lastRenderedDecidingApprovalId = agent && agent.decidingApprovalId;
    this.lastRenderedFollowing = this.state.followOutput;
    this.lastRenderedMessagesOutput = rendered;

    return rendered;
  };

  render() {
    const { agent, panelConfig } = this.props;
    const visible = !!(agent && agent.visible);
    const sending = !!(agent && agent.sending);
    const messages = (agent && agent.messages) || [];
    const draft = (agent && agent.draft) || '';
    const sessionPendingApprovals =
      (agent && agent.sessionPendingApprovals) || [];
    const cancellingPending = !!(agent && agent.cancellingPending);
    const cancellingRun = !!(agent && agent.cancellingRun);
    const activeRunId = (agent && agent.activeRunId) || '';
    const canStopRun = sending && !!activeRunId;
    const hasSessionPending = sessionPendingApprovals.length > 0;
    // F14 — compaction lifecycle banner. `compaction.active` is set while
    // the backend is compressing the conversation history; a brief
    // 1.5-second window after a failed pass surfaces a warning.
    const compaction = (agent && agent.compaction) || null;
    const compactionActive = !!(compaction && compaction.active);
    const compactionFailedRecently =
      !!(compaction && compaction.lastFailedAt && Date.now() - compaction.lastFailedAt < 1500);
    const compactionBannerMessage = compactionActive
      ? (compaction && compaction.mode === 'sync_forced'
          ? '正在同步压缩对话历史以节省 token...'
          : '正在压缩对话历史以节省 token...')
      : '';
    const compactionFailureMessage = compactionFailedRecently
      ? '压缩历史失败，已用原始历史继续'
      : '';
    const composerPlaceholder = getComposerPlaceholder({
      messages,
      hasSessionPending,
    });
    const width = (panelConfig && panelConfig.width) || 420;
    const mode = (panelConfig && panelConfig.mode) || 'push';
    const isOverlay = mode === 'overlay';

    // 插件更新提示：仅在确实可升级且跳转所需信息齐全、且未被本次会话忽略时展示。
    const agentUpdate = (agent && agent.agentUpdate) || null;
    const showUpdateBanner = !!(
      agentUpdate &&
      agentUpdate.upgradeable &&
      agentUpdate.appId &&
      agentUpdate.teamName &&
      agentUpdate.regionName &&
      !this.state.updateBannerDismissed
    );

    return (
      <div className={styles.agentHost}>
        <div
          className={`${styles.agentPanel} ${visible ? styles.agentPanelVisible : styles.agentPanelHidden
            } ${isOverlay ? styles.agentPanelOverlay : styles.agentPanelPush}`}
          style={{ width }}
        >
          {isOverlay && visible ? (
            <div className={styles.overlayMask} onClick={this.closeDrawer} />
          ) : null}

          <div
            className={`${styles.panelBody} ${!isOverlay ? styles.panelBodyPushFixed : ''
              }`}
          >
            <div className={styles.panelHeader}>
              <div className={styles.panelBrand}>
                <AgentBrandIcon />
                <div className={styles.panelBrandTitle}>
                  <span className={styles.panelBrandTitleText}>RainAgent</span>
                  <span className={styles.panelBrandBeta}>Beta</span>
                </div>
              </div>
              <div className={styles.panelHeaderActions}>
                <button
                  className={styles.headerIconButton}
                  aria-label="我的记忆"
                  onClick={() => this.setState({ memorySettingsVisible: true })}
                >
                  <Icon type="bulb" />
                </button>
                <Popover
                  trigger="click"
                  placement="bottomRight"
                  content={this.renderAutoApprovalSettings()}
                  overlayClassName={styles.autoApprovalPopover}
                  visible={this.state.approvalSettingsVisible}
                  onVisibleChange={this.handleApprovalSettingsVisibleChange}
                >
                  <button className={styles.headerIconButton} aria-label="自动批准设置">
                    <Icon type="setting" />
                  </button>
                </Popover>
                <button className={styles.closeButton} onClick={this.closeDrawer}>
                  <Icon type="close" />
                </button>
              </div>
            </div>

            {showUpdateBanner && (
              <div className={styles.updateBanner}>
                <Icon type="arrow-up" className={styles.updateBannerIcon} />
                <div className={styles.updateBannerText}>
                  <span className={styles.updateBannerTitle}>AI 助手有新版本</span>
                  <span className={styles.updateBannerVersion}>
                    {(agentUpdate.installedVersion || '当前')}
                    {' → '}
                    {(agentUpdate.latestVersion || '最新')}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.updateBannerButton}
                  onClick={this.handleGoUpgrade}
                >
                  去更新
                </button>
                <button
                  type="button"
                  className={styles.updateBannerClose}
                  aria-label="忽略更新提示"
                  onClick={this.handleDismissUpdateBanner}
                >
                  <Icon type="close" />
                </button>
              </div>
            )}

            <div className={styles.drawerBody}>
              <div
                className={styles.messagesPanel}
                ref={this.setMessagesRef}
                onScroll={this.handleMessagesScroll}
                onWheel={this.handleMessagesWheel}
                onTouchStart={this.handleMessagesTouchStart}
                onTouchMove={this.handleMessagesTouchMove}
                onKeyDown={this.handleMessagesKeyDown}
                onPointerDown={this.handleScrollPointerDown}
                tabIndex={0}
              >
                <div className={styles.messagesContent} ref={this.setMessagesContentRef}>
                  {this.renderWorkflowSummary()}
                  {this.renderMessages()}
                </div>
              </div>

              {!this.state.followOutput && (sending || hasSessionPending) ? (
                <div className={styles.followOutputBar}>
                  <button type="button" onClick={this.handleContinueFollowing}>
                    <Icon type="arrow-down" aria-hidden="true" />
                    {formatMessage({ id: 'agent.execution.continueFollowing' })}
                  </button>
                </div>
              ) : null}

              {this.renderRunConflictNotice()}

              {compactionActive ? (
                <Alert
                  type="info"
                  showIcon
                  message={compactionBannerMessage}
                  style={{ margin: '8px 12px' }}
                />
              ) : compactionFailureMessage ? (
                <Alert
                  type="warning"
                  showIcon
                  message={compactionFailureMessage}
                  style={{ margin: '8px 12px' }}
                />
              ) : null}

              {hasSessionPending ? (
                <div className={styles.pendingBanner}>
                  <div className={styles.pendingBannerText}>
                    该会话有 {sessionPendingApprovals.length} 项未处理审批，
                    请先取消后再继续。
                  </div>
                  <Button
                    size="small"
                    type="danger"
                    loading={cancellingPending}
                    onClick={this.handleCancelSessionPending}
                  >
                    取消并继续
                  </Button>
                </div>
              ) : null}

              <div className={styles.footer}>
                <div className={styles.footerComposer}>
                  <TextArea
                    ref={this.setComposerRef}
                    className={styles.footerTextarea}
                    value={draft}
                    onChange={this.handleDraftChange}
                    onPressEnter={this.handlePressEnter}
                    placeholder={composerPlaceholder}
                    autosize={{ minRows: 2, maxRows: 8 }}
                    disabled={sending || hasSessionPending}
                  />
                  <div className={styles.footerActions}>
                    <Button
                      className={styles.footerClearButton}
                      onClick={this.handleClear}
                      disabled={sending}
                      icon="delete"
                    >
                      清空对话
                    </Button>
                    {canStopRun ? (
                      <Button
                        type="danger"
                        className={styles.footerSendButton}
                        onClick={this.handleStopRun}
                        loading={cancellingRun}
                        icon="poweroff"
                      >
                        {cancellingRun ? '正在停止' : '停止'}
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        className={styles.footerSendButton}
                        onClick={this.handleSend}
                        loading={sending}
                        aria-label="发送"
                      >
                        <span>发送</span>
                        {!sending ? <SendButtonIcon /> : null}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <MemorySettingsModal
          visible={this.state.memorySettingsVisible}
          onClose={() => this.setState({ memorySettingsVisible: false })}
        />
      </div>
    );
  }
}
