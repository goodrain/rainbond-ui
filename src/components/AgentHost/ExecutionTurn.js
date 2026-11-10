import React, { PureComponent } from 'react';
import { Icon } from 'antd';
import { formatMessage } from 'umi';
import styles from './index.less';

const t = (name, values) => formatMessage({ id: `agent.execution.${name}` }, values);

/** One user request owns one header and one chronological execution log. */
export default class ExecutionTurn extends PureComponent {
  state = { expanded: true };

  getStatus = () => {
    const { turn } = this.props;
    if (turn.waiting) return t('waitingApproval');
    if (turn.failed) return t('failed');
    if (turn.cancelled) return t('cancelled');
    if (!turn.running) return t('finished');
    const latest = turn.latest;
    if (latest && latest.kind === 'trace' && latest.trace) {
      return latest.trace.title || t('working');
    }
    if (latest && latest.reasoningStreaming) return t('thinking');
    return turn.answer && turn.answer.streaming ? t('responding') : t('working');
  };

  renderProcessItem = item => {
    if (item.kind === 'trace') return this.props.renderTrace(item);
    if (item.kind === 'approval') return this.props.renderApproval(item);
    return null;
  };

  renderExecutionNode = node => {
    const { turn, renderProcessAnswer } = this.props;
    const item = node.output;
    return (
      <div className={styles.executionNode} key={node.key}>
        {item && (item.reasoning || item.reasoningStreaming) ? (
          <div className={styles.executionThought}>
            <div className={styles.executionThoughtLabel}>
              <Icon type="bulb" />
              <span>{t('reasoning')}</span>
            </div>
            <div className={styles.executionThoughtContent}>
              {item.reasoning || ''}
              {item.reasoningStreaming ? <span className={styles.executionCursor} aria-hidden="true" /> : null}
            </div>
          </div>
        ) : null}
        {item && item !== turn.answer && item.content ? (
          <div className={styles.executionNarration}>{renderProcessAnswer(item)}</div>
        ) : null}
        {node.events.map(this.renderProcessItem)}
      </div>
    );
  };

  render() {
    const { turn, renderApproval, renderNotice, renderAnswer } = this.props;
    const { expanded } = this.state;
    const showProcess = turn.process.length > 0 || turn.running || turn.waiting;
    return (
      <div className={`${styles.messageRow} ${styles.assistantRow}`}>
        <div className={styles.messageMeta}>
          <span className={styles.messageRole}>AI</span>
          <span className={styles.messageTime}>
            {new Date(turn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {showProcess ? (
          <div className={styles.executionProcess}>
            <button
              type="button"
              className={styles.executionToggle}
              aria-expanded={expanded}
              onClick={() => this.setState({ expanded: !expanded })}
            >
              <Icon type={expanded ? 'down' : 'right'} />
              <span>{t('viewProcess')}</span>
              <span className={styles.executionStatus} role="status">
                {turn.running && !turn.waiting ? <Icon type="loading" /> : null}
                {this.getStatus()}
              </span>
            </button>
            {expanded ? (
              <div className={styles.executionLog}>{turn.nodes.map(this.renderExecutionNode)}</div>
            ) : null}
          </div>
        ) : null}
        {turn.pendingApprovals.map(renderApproval)}
        {turn.notices.map(renderNotice)}
        {turn.answer ? renderAnswer(turn.answer) : null}
      </div>
    );
  }
}
