import React, { PureComponent, useEffect, useRef, useState } from 'react';
import { Button, Collapse, Dropdown, Icon, Input, Menu, Modal, Tag } from 'antd';
import ReactMarkdown from 'react-markdown';
import styles from './index.less';
import * as autoApprovalPolicy from './autoApprovalPolicy';

function ReasoningBlock({ reasoning, streaming }) {
  // Default open while reasoning is still streaming so the user can watch the
  // model think; auto-collapse the moment streaming closes so the final
  // answer is the visual focus. Manual toggle stays available either way.
  const [collapsed, setCollapsed] = useState(false);
  const wasStreamingRef = useRef(streaming);
  useEffect(() => {
    if (wasStreamingRef.current && !streaming) {
      setCollapsed(true);
    }
    wasStreamingRef.current = streaming;
  }, [streaming]);

  return (
    <div className={styles.reasoningBlock}>
      <button
        type="button"
        className={styles.reasoningToggle}
        onClick={() => setCollapsed(value => !value)}
      >
        <Icon type={collapsed ? 'right' : 'down'} className={styles.reasoningChevron} />
        <Icon type="bulb" className={styles.reasoningIcon} />
        <span className={styles.reasoningLabel}>
          {streaming ? '思考中…' : '思考过程'}
        </span>
        {streaming ? (
          <Icon type="loading" className={styles.reasoningSpinner} />
        ) : null}
      </button>
      {!collapsed && reasoning ? (
        <pre className={styles.reasoningBody}>{reasoning}</pre>
      ) : null}
    </div>
  );
}
const approvalMeta = require('./approvalMeta');
const displayFilters = require('./displayFilters');
const { renderMarkdownSource } = require('./markdownHelpers');
const { getApprovalRiskMeta, getApprovalScopeMeta } = approvalMeta;
const { shouldRenderMessageItem, shouldRenderWorkflowSummary } = displayFilters;

const { TextArea } = Input;
const { confirm } = Modal;
const { Panel } = Collapse;

export default class AgentHost extends PureComponent {
  constructor(props) {
    super(props);
    this.messagesRef = null;
  }

  componentDidMount() {
    this.scrollToBottom();
  }

  componentDidUpdate(prevProps) {
    const prevMessages = (prevProps.agent && prevProps.agent.messages) || [];
    const nextMessages = (this.props.agent && this.props.agent.messages) || [];
    const wasVisible = prevProps.agent && prevProps.agent.visible;
    const isVisible = this.props.agent && this.props.agent.visible;
    const prevLastMessage = prevMessages[prevMessages.length - 1];
    const nextLastMessage = nextMessages[nextMessages.length - 1];
    const lastMessageChanged =
      prevLastMessage &&
      nextLastMessage &&
      prevLastMessage.id === nextLastMessage.id &&
      (
        prevLastMessage.content !== nextLastMessage.content ||
        prevLastMessage.streaming !== nextLastMessage.streaming
      );

    if (
      prevMessages.length !== nextMessages.length ||
      lastMessageChanged ||
      (!wasVisible && isVisible)
    ) {
      this.scrollToBottom();
    }
  }

  componentWillUnmount() {
  }

  setMessagesRef = node => {
    this.messagesRef = node;
  };

  scrollToBottom = () => {
    if (this.messagesRef) {
      window.requestAnimationFrame(() => {
        this.messagesRef.scrollTop = this.messagesRef.scrollHeight;
      });
    }
  };

  openDrawer = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'agent/show',
    });
  };

  closeDrawer = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'agent/hide',
    });
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
    dispatch({
      type: 'agent/sendMessage',
      payload: {
        message: agent && agent.draft,
        context: agent && agent.context,
      },
    });
  };

  handleContinueWorkflowAction = () => {
    const { dispatch, agent } = this.props;
    dispatch({
      type: 'agent/sendMessage',
      payload: {
        message: '继续执行',
        context: agent && agent.context,
      },
    });
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
      title: '清空当前会话',
      content: '会清空当前全局 Agent 会话，但不会影响页面上下文。',
      okText: '清空',
      cancelText: '取消',
      onOk: () => {
        dispatch({
          type: 'agent/clearSession',
          payload: {
            userId: currentUser && String(currentUser.user_id),
            preserveVisible: true,
          },
        });
      },
    });
  };

  handleApprovalDecision = decision => {
    const { dispatch } = this.props;
    dispatch({
      type: 'agent/resolveApproval',
      payload: {
        decision,
      },
    });
  };

  renderTraceMessage = item => {
    const trace = item.trace || {};
    return (
      <div key={item.id} className={styles.traceRow}>
        <Collapse
          bordered={false}
          className={styles.traceCollapse}
          defaultActiveKey={[]}
          expandIconPosition="right"
        >
          <Panel
            key={item.id}
            header={(
              <div className={styles.traceHeader}>
                <span className={styles.traceHeaderLeft}>
                  <Icon type="api" />
                  <span className={styles.traceHeaderTitle}>
                    {trace.title || '工具调用'}
                  </span>
                </span>
              </div>
            )}
          >
            {trace.detail ? (
              <pre className={styles.traceBody}>{trace.detail}</pre>
            ) : null}
          </Panel>
        </Collapse>
      </div>
    );
  };

  renderApprovalActions = item => {
    const { agent } = this.props;
    const approval = item.approval || {};
    const isSending = !!(agent && agent.sending);
    const isHigh = approval.risk === 'high';
    const targetRef = approval.targetRef || null;
    const targetKey = targetRef ? `${targetRef.kind}:${targetRef.id}` : null;
    const targetLabel = targetRef
      ? targetRef.kind === 'service' ? '该组件'
        : targetRef.kind === 'app' ? '该应用'
        : targetRef.kind === 'team' ? '该团队'
        : '该资源'
      : '';

    if (isHigh) {
      return (
        <React.Fragment>
          <div className={styles.approvalActions}>
            <Button
              type="primary"
              size="small"
              loading={isSending}
              onClick={() => this.handleApprovalDecision('approved')}
            >
              批准
            </Button>
            <Button
              size="small"
              disabled={isSending}
              onClick={() => this.handleApprovalDecision('rejected')}
            >
              拒绝
            </Button>
          </div>
          <div className={styles.approvalCriticalNote}>
            高风险操作仅可逐次批准
          </div>
        </React.Fragment>
      );
    }

    const onAddPolicy = scope => () => {
      autoApprovalPolicy.addPolicy(scope);
      this.handleApprovalDecision('approved');
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
        <Dropdown.Button
          type="primary"
          size="small"
          loading={isSending}
          overlay={menu}
          onClick={() => this.handleApprovalDecision('approved')}
        >
          批准
        </Dropdown.Button>
        <Button
          size="small"
          disabled={isSending}
          onClick={() => this.handleApprovalDecision('rejected')}
        >
          拒绝
        </Button>
      </div>
    );
  };

  renderApprovalMessage = item => {
    const approval = item.approval || {};
    const isPending = approval.status === 'pending';
    const wasAutoApproved = !!approval.autoApproved;
    const riskMeta = getApprovalRiskMeta(approval.risk, approval.levelLabel);
    const scopeMeta = getApprovalScopeMeta(approval.scope, approval.scopeLabel);
    const cardClassName = [
      styles.approvalCard,
      styles[riskMeta.cardClass]
    ].filter(Boolean).join(' ');

    return (
      <div key={item.id} className={styles.approvalRow}>
        <div className={cardClassName}>
          <div className={styles.approvalHeader}>
            <span className={styles.approvalTitle}>
              <Icon type="safety-certificate" />
              需要审批
            </span>
            <div className={styles.approvalTags}>
              {scopeMeta.label ? (
                <Tag color={scopeMeta.color}>{scopeMeta.label}</Tag>
              ) : null}
              <Tag color={riskMeta.color}>{riskMeta.label}</Tag>
            </div>
          </div>
          <div className={styles.approvalContent}>{item.content}</div>
          {wasAutoApproved ? (
            <div className={styles.approvalAutoNote}>
              已根据会话策略自动批准
            </div>
          ) : null}
          {isPending ? this.renderApprovalActions(item) : null}
        </div>
      </div>
    );
  };

  renderStatusMessage = item => {
    return (
      <div key={item.id} className={styles.contextRow}>
        <span className={styles.statusBadge}>{item.content}</span>
      </div>
    );
  };

  renderErrorMessage = item => {
    return (
      <div key={item.id} className={styles.errorRow}>
        <div className={styles.errorCard}>{item.content}</div>
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
        <div className={styles.traceGroupTitle}>
          <Icon type="api" />
          <span>工具调用</span>
        </div>
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
        <div className={styles.traceGroupTitle}>
          <Icon type="api" />
          <span>工具调用</span>
        </div>
        {traces.map(item => this.renderTraceMessage(item))}
      </div>
    );
  };

  renderMessages = () => {
    const { agent } = this.props;
    const messages = (agent && agent.messages) || [];

    if (!messages.length) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>全局 AI 助手</div>
          <div className={styles.emptyText}>
            这里会在团队、企业、应用和组件上下文之间持续保留同一条会话。
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
      if (isUser && pendingTraceItems.length > 0) {
        rendered.push(this.renderStandaloneTraceGroup(pendingTraceItems));
      }
      pendingTraceItems = [];

      rendered.push(
        <div
          key={item.id}
          className={`${styles.messageRow} ${isUser ? styles.userRow : styles.assistantRow}`}
        >
          <div className={styles.messageMeta}>
            <span className={styles.messageRole}>
              {isUser ? '我' : 'AI'}
            </span>
            <span className={styles.messageTime}>
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div
            className={`${styles.messageBubble} ${
              isUser ? styles.userBubble : styles.assistantBubble
            }`}
          >
            {traceGroup}
            {!isUser && (item.reasoning || item.reasoningStreaming) ? (
              <ReasoningBlock
                reasoning={item.reasoning || ''}
                streaming={!!item.reasoningStreaming}
              />
            ) : null}
            {isUser ? (
              item.content
            ) : (
              <div className={styles.markdownBody}>
                <ReactMarkdown
                  source={renderMarkdownSource(item.content || '')}
                  escapeHtml={false}
                />
              </div>
            )}
          </div>
        </div>
      );
      });

      if (pendingTraceItems.length > 0) {
        rendered.push(this.renderStandaloneTraceGroup(pendingTraceItems));
      }

      return rendered;
  };

  render() {
    const { agent, panelConfig } = this.props;
    const visible = !!(agent && agent.visible);
    const sending = !!(agent && agent.sending);
    const draft = (agent && agent.draft) || '';
    const lastError = (agent && agent.lastError) || '';
    const width = (panelConfig && panelConfig.width) || 420;
    const mode = (panelConfig && panelConfig.mode) || 'push';
    const isOverlay = mode === 'overlay';

    return (
      <div className={styles.agentHost}>
        {!visible && (
          <button className={styles.launcher} onClick={this.openDrawer}>
            <span className={styles.launcherIcon}>
              <Icon type="message" />
            </span>
            <span className={styles.launcherText}>AI 助手</span>
          </button>
        )}

        <div
          className={`${styles.agentPanel} ${
            visible ? styles.agentPanelVisible : styles.agentPanelHidden
          } ${isOverlay ? styles.agentPanelOverlay : styles.agentPanelPush}`}
          style={{ width }}
        >
          {isOverlay && visible ? (
            <div className={styles.overlayMask} onClick={this.closeDrawer} />
          ) : null}

          <div className={styles.panelBody}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>AI 助手</div>
              <button className={styles.closeButton} onClick={this.closeDrawer}>
                <Icon type="close" />
              </button>
            </div>

            <div className={styles.drawerBody}>
            <div className={styles.messagesPanel} ref={this.setMessagesRef}>
              {this.renderWorkflowSummary()}
              {this.renderMessages()}
              {sending ? (
                <div className={styles.thinkingRow}>
                  <span className={styles.thinkingIcon}>
                    <Icon type="loading" />
                  </span>
                  <span className={styles.thinkingText}>AI 正在思考...</span>
                </div>
              ) : null}
            </div>

            {lastError ? <div className={styles.errorText}>{lastError}</div> : null}

            <div className={styles.footer}>
              <TextArea
                value={draft}
                onChange={this.handleDraftChange}
                onPressEnter={this.handlePressEnter}
                placeholder="输入你的问题，Shift + Enter 换行"
                autosize={{ minRows: 3, maxRows: 8 }}
                disabled={sending}
              />
              <div className={styles.footerActions}>
                <Button onClick={this.handleClear} disabled={sending}>
                  清空会话
                </Button>
                <Button
                  type="primary"
                  onClick={this.handleSend}
                  loading={sending}
                disabled={!draft.trim()}
              >
                发送
              </Button>
            </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  }
}
