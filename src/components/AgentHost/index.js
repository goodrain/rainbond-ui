import React, { PureComponent } from 'react';
import { Button, Icon, Input, Modal, Tag } from 'antd';
import styles from './index.less';

const { TextArea } = Input;
const { confirm } = Modal;

function buildContextTags(context = {}) {
  const tags = [];

  if (context.enterpriseId) {
    tags.push({
      key: 'enterprise',
      label: `企业 ${context.enterpriseId}`,
    });
  }
  if (context.teamName) {
    tags.push({
      key: 'team',
      label: `团队 ${context.teamName}`,
    });
  }
  if (context.regionName) {
    tags.push({
      key: 'region',
      label: `集群 ${context.regionName}`,
    });
  }
  if (context.appId) {
    tags.push({
      key: 'app',
      label: `应用 ${context.appId}`,
    });
  }
  if (context.componentId) {
    tags.push({
      key: 'component',
      label: `组件 ${context.componentId}`,
    });
  }

  return tags;
}

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

    if (
      prevMessages.length !== nextMessages.length ||
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
        <div className={styles.traceCard}>
          <div className={styles.traceHeader}>
            <Icon type="api" />
            <span>{trace.title || '工具调用'}</span>
          </div>
          {trace.detail ? (
            <pre className={styles.traceBody}>{trace.detail}</pre>
          ) : null}
        </div>
      </div>
    );
  };

  renderApprovalMessage = item => {
    const { agent } = this.props;
    const approval = item.approval || {};
    const isPending = approval.status === 'pending';
    const isSending = !!(agent && agent.sending);

    return (
      <div key={item.id} className={styles.approvalRow}>
        <div className={styles.approvalCard}>
          <div className={styles.approvalHeader}>
            <span className={styles.approvalTitle}>需要审批</span>
            <Tag color={approval.risk === 'high' ? 'red' : 'orange'}>
              {approval.risk === 'high' ? '高风险' : '中风险'}
            </Tag>
          </div>
          <div className={styles.approvalContent}>{item.content}</div>
          <div className={styles.approvalMeta}>
            状态：
            {approval.status === 'approved'
              ? '已批准'
              : approval.status === 'rejected'
                ? '已拒绝'
                : '待处理'}
          </div>
          {isPending ? (
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
          ) : null}
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

      return messages.map(item => {
      if (item.kind === 'context') {
        return (
          <div key={item.id} className={styles.contextRow}>
            <span className={styles.contextBadge}>{item.content}</span>
          </div>
        );
      }

      if (item.kind === 'trace') {
        return this.renderTraceMessage(item);
      }

      if (item.kind === 'approval') {
        return this.renderApprovalMessage(item);
      }

      if (item.kind === 'status') {
        return this.renderStatusMessage(item);
      }

      if (item.kind === 'error') {
        return this.renderErrorMessage(item);
      }

      const isUser = item.role === 'user';
      return (
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
            {item.content}
          </div>
        </div>
      );
    });
  };

  render() {
    const { agent, panelConfig } = this.props;
    const context = (agent && agent.context) || {};
    const visible = !!(agent && agent.visible);
    const sending = !!(agent && agent.sending);
    const draft = (agent && agent.draft) || '';
    const lastError = (agent && agent.lastError) || '';
    const tags = buildContextTags(context);
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
            <div className={styles.contextPanel}>
              <div className={styles.contextTitle}>当前上下文</div>
              <div className={styles.contextTags}>
                {tags.length > 0
                  ? tags.map(item => (
                      <Tag key={item.key} className={styles.contextTag}>
                        {item.label}
                      </Tag>
                    ))
                  : (
                    <span className={styles.contextFallback}>未识别到具体业务上下文</span>
                  )}
              </div>
            </div>

            <div className={styles.messagesPanel} ref={this.setMessagesRef}>
              {this.renderMessages()}
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
