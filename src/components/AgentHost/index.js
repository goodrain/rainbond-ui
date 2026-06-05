import React, { PureComponent, useEffect, useRef, useState } from 'react';
import { Alert, Button, Dropdown, Icon, Input, Menu, Modal, Popover, Tag, message } from 'antd';
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

function ReasoningBlock({ reasoning, streaming }) {
  // Default open while reasoning is still streaming so the user can watch the
  // model think; auto-collapse the moment streaming closes so the final
  // answer is the visual focus. Manual toggle stays available either way.
  const [collapsed, setCollapsed] = useState(false);
  const wasStreamingRef = useRef(streaming);
  const reasoningBodyRef = useRef(null);
  useEffect(() => {
    if (wasStreamingRef.current && !streaming) {
      setCollapsed(true);
    }
    wasStreamingRef.current = streaming;
  }, [streaming]);

  useEffect(() => {
    if (collapsed || !reasoningBodyRef.current) {
      return;
    }

    reasoningBodyRef.current.scrollTop = reasoningBodyRef.current.scrollHeight;
  }, [collapsed, reasoning, streaming]);

  return (
    <div className={styles.reasoningBlock}>
      <button
        type="button"
        className={styles.reasoningToggle}
        onClick={() => setCollapsed(value => !value)}
      >
        <Icon type={collapsed ? 'right' : 'down'} className={styles.reasoningChevron} />
        <Icon type="bulb" className={styles.reasoningIcon} />
        <span
          className={`${styles.reasoningLabel} ${streaming ? styles.reasoningLabelStreaming : ''
            }`}
          data-text={streaming ? '思考中…' : undefined}
        >
          {streaming ? '思考中…' : '思考过程'}
        </span>
      </button>
      {!collapsed && reasoning ? (
        <div className={styles.reasoningBody} ref={reasoningBodyRef}>
          <div className={`${styles.markdownBody} ${styles.reasoningMarkdown}`}>
            {streaming ? (
              <PlainTextRenderer content={reasoning} />
            ) : (
              <MarkdownRenderer content={reasoning} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
  render() {
    const { item } = this.props;
    const trace = item.trace || {};
    const traceText = trace.displayTitle || trace.title || trace.toolName || '工具调用';

    return (
      <div className={styles.traceRow}>
        <span className={styles.traceInlineText}>
          <Icon type="api" className={styles.traceInlineIcon} />
          <span>{traceText}</span>
        </span>
      </div>
    );
  }
}

class ApprovalMessageCard extends PureComponent {
  renderHighRiskActions() {
    const { isSending, onDecision } = this.props;

    return (
      <React.Fragment>
        <div className={styles.approvalActions}>
          <div className={styles.approvalActionHalf}>
            <Button
              type="primary"
              className={styles.approvalApproveButton}
              loading={isSending}
              onClick={() => onDecision('approved')}
            >
              授权并执行
            </Button>
          </div>
          <div className={styles.approvalActionHalf}>
            <Button
              className={styles.approvalRejectButton}
              disabled={isSending}
              onClick={() => onDecision('rejected')}
            >
              取消
            </Button>
          </div>
        </div>
        <div className={styles.approvalCriticalNote}>高风险操作仅可逐次批准</div>
      </React.Fragment>
    );
  }

  renderNormalRiskActions() {
    const { approval, isSending, onDecision } = this.props;
    const targetRef = approval.targetRef || null;
    const targetKey = autoApprovalPolicy.targetRefToKey(targetRef);
    const targetLabel = targetRef
      ? targetRef.kind === 'service' ? '该组件'
        : targetRef.kind === 'app' ? '该应用'
          : targetRef.kind === 'team' ? '该团队'
            : '该资源'
      : '';

    const onAddPolicy = scope => () => {
      autoApprovalPolicy.addPolicy(scope);
      onDecision('approved');
    };

    const menu = (
      <Menu>
        {targetKey ? (
          <Menu.Item
            key="target"
            onClick={onAddPolicy({ kind: 'session-target', targetKey })}
          >
            {targetLabel}所有操作自动批准
          </Menu.Item>
        ) : null}
        {targetKey && approval.skillId ? (
          <Menu.Item
            key="target-op"
            onClick={onAddPolicy({
              kind: 'session-target-op',
              targetKey,
              skillId: approval.skillId,
            })}
          >
            {targetLabel}同类操作自动批准
          </Menu.Item>
        ) : null}
        {approval.skillId ? (
          <Menu.Item
            key="op"
            onClick={onAddPolicy({
              kind: 'session-op',
              skillId: approval.skillId,
            })}
          >
            全局同类操作自动批准
          </Menu.Item>
        ) : null}
        <Menu.Item
          key="all"
          onClick={onAddPolicy({ kind: 'session-all' })}
        >
          本会话全部自动批准
        </Menu.Item>
      </Menu>
    );

    return (
      <div className={styles.approvalActions}>
        <div className={styles.approvalActionHalf}>
          <Button.Group className={styles.approvalPrimaryActions}>
            <Button
              type="primary"
              className={styles.approvalApproveButton}
              loading={isSending}
              onClick={() => onDecision('approved')}
            >
              授权并执行
            </Button>
            <Dropdown overlay={menu} trigger={['click']}>
              <Button
                type="primary"
                className={styles.approvalPolicyButton}
                disabled={isSending}
                aria-label="选择自动批准策略"
              >
                <Icon type="more" />
              </Button>
            </Dropdown>
          </Button.Group>
        </div>
        <div className={styles.approvalActionHalf}>
          <Button
            className={styles.approvalRejectButton}
            disabled={isSending}
            onClick={() => onDecision('rejected')}
          >
            取消
          </Button>
        </div>
      </div>
    );
  }

  renderResolvedCompact() {
    const { item } = this.props;
    const approval = item.approval || {};
    const isApproved = approval.status === 'approved';
    const wasAutoApproved = !!approval.autoApproved;
    const iconType = isApproved ? 'check-circle' : 'close-circle';
    const statusLabel = isApproved
      ? (wasAutoApproved ? '已自动批准' : '已批准')
      : '已拒绝';
    const iconClassName = isApproved
      ? styles.approvalResolvedIconApproved
      : styles.approvalResolvedIconRejected;

    return (
      <div className={styles.approvalRow}>
        <span className={styles.approvalResolvedText}>
          <Icon type={iconType} className={iconClassName} />
          <span>{statusLabel}：{item.content}</span>
        </span>
      </div>
    );
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
      <div className={styles.approvalRow}>
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
          {approval.risk === 'high'
            ? this.renderHighRiskActions()
            : this.renderNormalRiskActions()}
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

class AssistantMessageRow extends PureComponent {
  render() {
    const { item, traceGroup, reasoningBlock, showAssistantBubble, renderSuggestedActions } = this.props;

    return (
      <div className={`${styles.messageRow} ${styles.assistantRow}`}>
        <div className={styles.messageMeta}>
          <span className={styles.messageRole}>AI</span>
          <span className={styles.messageTime}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className={styles.assistantMessageStack}>
          {reasoningBlock || traceGroup ? (
            <div className={styles.assistantSupportStack}>
              {reasoningBlock}
              {traceGroup}
            </div>
          ) : null}
          {showAssistantBubble ? (
            <div className={`${styles.messageBubble} ${styles.assistantBubble}`}>
              <AssistantMarkdownBody
                content={item.content || ''}
                suggestedActions={item.suggestedActions}
                renderSuggestedActions={renderSuggestedActions}
                streaming={!!item.streaming}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

class UserMessageRow extends PureComponent {
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
          {item.content}
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
  shouldRenderAssistantBubble,
  shouldRenderMessageItem,
  shouldRenderWorkflowSummary,
  shouldShowBottomThinking,
} = displayFilters;

const { TextArea } = Input;
const { confirm } = Modal;
function formatRelativeTime(iso) {
  if (!iso) return '';
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return '';
  const diffSec = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return '刚刚';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`;
  if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400)} 天前`;
  return new Date(ts).toLocaleDateString('zh-CN');
}

export default class AgentHost extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { historyPopoverVisible: false, updateBannerDismissed: false };
    this.messagesRef = null;
    this.isAutoScrollEnabled = true;
    this.lastRenderedMessagesRef = null;
    this.lastRenderedMessagesSending = null;
    this.lastRenderedMessagesOutput = null;
    this.composerRef = null;
    this.composerFocusFrame = null;
  }

  componentDidMount() {
    this.scrollToBottom({ force: true });
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
    })) {
      this.scrollToBottom();
    }

    if (this.shouldFocusComposerAfterRun(prevProps)) {
      this.focusComposerInput();
    }
  }

  componentWillUnmount() {
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

  scrollToBottom = options => {
    const force = !!(options && options.force);

    if (this.messagesRef && (force || this.isAutoScrollEnabled)) {
      window.requestAnimationFrame(() => {
        if (!this.messagesRef) {
          return;
        }

        this.messagesRef.scrollTop = this.messagesRef.scrollHeight;
      });
    }
  };

  resumeAutoScroll = () => {
    this.isAutoScrollEnabled = true;
  };

  handleMessagesScroll = event => {
    const target = (event && event.currentTarget) || this.messagesRef;
    if (!target) {
      return;
    }

    this.isAutoScrollEnabled = getNextAutoScrollEnabled(
      this.isAutoScrollEnabled,
      target,
      {
        isStreaming: !!(this.props.agent && this.props.agent.sending),
      }
    );
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

    this.resumeAutoScroll();
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
    this.resumeAutoScroll();
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

    this.resumeAutoScroll();
    const actionId = action.actionId || '';
    const optionKey = action.optionKey || '';
    const label = action.label || '';

    this.props.dispatch({
      type: 'agent/sendMessage',
      payload: {
        message: optionKey ? `选择方案 ${optionKey}${label ? `：${label}` : ''}` : label || '执行推荐方案',
        selectedActionId: actionId,
        selectedActionKey: optionKey,
        suppressUserEcho: true,
        context: this.props.agent && this.props.agent.context,
      },
    });
  };

  renderParsedSuggestedActions = (actions, options = {}) => {
    if (!actions || actions.length === 0) {
      return null;
    }
    const showTitle = options.showTitle !== false;

    return (
      <div className={styles.inlineSuggestionList}>
        {showTitle ? (
          <div className={styles.inlineSuggestionTitle}>后续建议</div>
        ) : null}
        {actions.map((action, index) => (
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

  handleConflictStopAndSend = () => {
    this.props.dispatch({ type: 'agent/stopAndSendMine' });
  };

  handleConflictKeepWaiting = () => {
    this.props.dispatch({ type: 'agent/keepWaiting' });
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
            onClick={this.handleConflictStopAndSend}
            style={{ marginRight: 8 }}
          >
            停止它并发送本条
          </Button>
          <Button
            size="small"
            onClick={this.handleConflictKeepWaiting}
            style={{ marginRight: 8 }}
          >
            继续等待
          </Button>
          <Button
            size="small"
            onClick={this.handleConflictCancelMine}
          >
            取消我的输入
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

  handleApprovalDecision = decision => {
    const { dispatch } = this.props;
    this.resumeAutoScroll();
    dispatch({
      type: 'agent/resolveApproval',
      payload: {
        decision,
      },
    });
  };

  renderTraceMessage = item => {
    return <TraceMessageRow key={item.id} item={item} />;
  };

  renderApprovalActions = item => {
    const { agent } = this.props;
    return (
      <ApprovalMessageCard
        item={item}
        approval={item.approval || {}}
        isSending={!!(agent && agent.sending)}
        onDecision={this.handleApprovalDecision}
      />
    );
  };

  renderApprovalMessage = item => {
    return (
      <ApprovalMessageCard
        key={item.id}
        item={item}
        approval={item.approval || {}}
        isSending={!!(this.props.agent && this.props.agent.sending)}
        onDecision={this.handleApprovalDecision}
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

  formatPolicyLabel = policy => {
    switch (policy.kind) {
      case 'session-all':
        return '本会话全部自动批准';
      case 'session-target':
        return `资源 ${policy.targetKey} 所有操作`;
      case 'session-op':
        return `操作 ${policy.skillId}（全局）`;
      case 'session-target-op':
        return `${policy.targetKey} · ${policy.skillId}`;
      default:
        return JSON.stringify(policy);
    }
  };

  handleHistoryVisibleChange = visible => {
    this.setState({ historyPopoverVisible: visible });
    if (visible) {
      this.props.dispatch({ type: 'agent/loadSessionList' });
    }
  };

  handleSwitchSession = sessionId => {
    this.setState({ historyPopoverVisible: false });
    this.props.dispatch({ type: 'agent/switchSession', payload: { sessionId } });
  };

  handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    confirm({
      title: '删除该会话？',
      content: '该操作不可恢复。',
      okType: 'danger',
      okText: '删除',
      cancelText: '取消',
      onOk: () => {
        this.props.dispatch({ type: 'agent/removeSession', payload: { sessionId } });
      },
    });
  };

  handleCancelSessionPending = () => {
    this.props.dispatch({ type: 'agent/cancelSessionPending' });
  };

  renderHistoryPopover = () => {
    const { agent } = this.props;
    const list = (agent && agent.sessionList) || [];
    const loading = !!(agent && agent.sessionListLoading);

    if (loading) {
      return <div className={styles.historyEmpty}>加载中…</div>;
    }
    if (!list.length) {
      return <div className={styles.historyEmpty}>暂无历史会话</div>;
    }

    return (
      <div className={styles.historyList}>
        {list.map(item => (
          <div
            key={item.session_id}
            className={styles.historyItem}
            onClick={() => this.handleSwitchSession(item.session_id)}
          >
            <div className={styles.historyItemBody}>
              <div className={styles.historyItemTitle} title={item.title || '新会话'}>
                {item.title || '新会话'}
              </div>
              <div className={styles.historyItemMeta}>
                {formatRelativeTime(item.updated_at)}
              </div>
            </div>
            <button
              type="button"
              className={styles.historyItemDelete}
              aria-label="删除会话"
              onClick={e => this.handleDeleteSession(e, item.session_id)}
            >
              <Icon type="delete" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  renderAutoApprovalSettings = () => {
    const policies = autoApprovalPolicy.getPolicies();
    if (policies.length === 0) {
      return (
        <div className={styles.autoApprovalEmpty}>
          <div>暂无自动批准策略</div>
          <div className={styles.autoApprovalHint}>
            策略仅在本次会话内生效，关闭浏览器后失效
          </div>
        </div>
      );
    }
    return (
      <div className={styles.autoApprovalList}>
        {policies.map((p, idx) => (
          <div key={idx} className={styles.autoApprovalItem}>
            <span>{this.formatPolicyLabel(p)}</span>
            <a
              onClick={() => {
                autoApprovalPolicy.removePolicy(p);
                this.forceUpdate();
              }}
            >
              移除
            </a>
          </div>
        ))}
        <div className={styles.autoApprovalActions}>
          <Button
            size="small"
            onClick={() => {
              autoApprovalPolicy.clearPolicies();
              this.forceUpdate();
            }}
          >
            全部清除
          </Button>
        </div>
        <div className={styles.autoApprovalHint}>
          策略仅在本次会话内生效，关闭浏览器后失效
        </div>
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

  renderMessages = () => {
    const { agent } = this.props;
    const messages = (agent && agent.messages) || [];
    const sending = !!(agent && agent.sending);
    if (
      this.lastRenderedMessagesRef === messages &&
      this.lastRenderedMessagesSending === sending &&
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

    const rendered = [];
    let pendingTraceItems = [];

    messages.forEach(item => {
      if (!shouldRenderMessageItem(item)) {
        return;
      }

      if (item.kind === 'context') {
        if (pendingTraceItems.length > 0) {
          rendered.push(this.renderStandaloneTraceGroup(pendingTraceItems));
          pendingTraceItems = [];
        }
        rendered.push(
          <div key={item.id} className={styles.contextRow}>
            <span className={styles.contextBadge}>{item.content}</span>
          </div>
        );
        return;
      }

      if (item.kind === 'trace') {
        pendingTraceItems.push(item);
        return;
      }

      if (item.kind === 'approval') {
        pendingTraceItems = [];
        rendered.push(this.renderApprovalMessage(item));
        return;
      }

      if (item.kind === 'status') {
        if (pendingTraceItems.length > 0) {
          rendered.push(this.renderStandaloneTraceGroup(pendingTraceItems));
          pendingTraceItems = [];
        }
        rendered.push(this.renderStatusMessage(item));
        return;
      }

      if (item.kind === 'error') {
        if (pendingTraceItems.length > 0) {
          rendered.push(this.renderStandaloneTraceGroup(pendingTraceItems));
          pendingTraceItems = [];
        }
        rendered.push(this.renderErrorMessage(item));
        return;
      }

      const isUser = item.role === 'user';
      const traceGroup = !isUser && pendingTraceItems.length > 0
        ? this.renderAssistantTraceGroup(pendingTraceItems)
        : null;
      const reasoningBlock = !isUser && (item.reasoning || item.reasoningStreaming) ? (
        <ReasoningBlock
          reasoning={item.reasoning || ''}
          streaming={!!item.reasoningStreaming}
        />
      ) : null;
      const showAssistantBubble = !isUser && shouldRenderAssistantBubble(item);
      if (isUser && pendingTraceItems.length > 0) {
        rendered.push(this.renderStandaloneTraceGroup(pendingTraceItems));
      }
      pendingTraceItems = [];

      if (isUser) {
        rendered.push(<UserMessageRow key={item.id} item={item} />);
      } else {
        rendered.push(
          <AssistantMessageRow
            key={item.id}
            item={item}
            traceGroup={traceGroup}
            reasoningBlock={reasoningBlock}
            showAssistantBubble={showAssistantBubble}
            renderSuggestedActions={this.renderParsedSuggestedActions}
          />
        );
      }
    });

    if (pendingTraceItems.length > 0) {
      rendered.push(this.renderStandaloneTraceGroup(pendingTraceItems));
    }

    this.lastRenderedMessagesRef = messages;
    this.lastRenderedMessagesSending = sending;
    this.lastRenderedMessagesOutput = rendered;

    return rendered;
  };

  render() {
    const { agent, panelConfig } = this.props;
    const visible = !!(agent && agent.visible);
    const sending = !!(agent && agent.sending);
    const messages = (agent && agent.messages) || [];
    const draft = (agent && agent.draft) || '';
    const lastError = (agent && agent.lastError) || '';
    const sessionPendingApprovals =
      (agent && agent.sessionPendingApprovals) || [];
    const cancellingPending = !!(agent && agent.cancellingPending);
    const cancellingRun = !!(agent && agent.cancellingRun);
    const activeRunId = (agent && agent.activeRunId) || '';
    const canStopRun = sending && !!activeRunId;
    const pendingDraftMode = (agent && agent.pendingDraftMode) || '';
    const isWaitingForOtherTab = pendingDraftMode === 'wait';
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
    const showBottomThinking = shouldShowBottomThinking({
      sending,
      messages,
    });
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
                <Popover
                  trigger="click"
                  placement="bottomRight"
                  content={this.renderHistoryPopover()}
                  overlayClassName={styles.historyPopover}
                  visible={this.state.historyPopoverVisible}
                  onVisibleChange={this.handleHistoryVisibleChange}
                >
                  <button className={styles.headerIconButton} aria-label="历史会话">
                    <Icon type="history" />
                  </button>
                </Popover>
                <Popover
                  trigger="click"
                  placement="bottomRight"
                  content={this.renderAutoApprovalSettings()}
                  overlayClassName={styles.autoApprovalPopover}
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
              >
                {this.renderWorkflowSummary()}
                {this.renderMessages()}
                {showBottomThinking ? (
                  <div className={styles.thinkingRow}>
                    <span className={styles.thinkingText} data-text="正在思考...">
                      正在思考...
                    </span>
                  </div>
                ) : null}
              </div>

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

              {isWaitingForOtherTab ? (
                <Alert
                  type="info"
                  showIcon
                  message="等待另一个窗口的当前运行结束后将自动发送你的输入"
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

              {lastError ? <div className={styles.errorText}>{lastError}</div> : null}

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
      </div>
    );
  }
}
