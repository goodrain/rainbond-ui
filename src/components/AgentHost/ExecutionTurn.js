import React, { PureComponent } from 'react';
import { Icon } from 'antd';
import { formatMessage } from 'umi';
import styles from './index.less';
import ExecutionDisclosure from './ExecutionDisclosure';

const t = (name, values) => formatMessage({ id: `agent.execution.${name}` }, values);

/** One user request owns one header and one chronological execution log. */
export default class ExecutionTurn extends PureComponent {
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
    const reasoningActive = !!(item && turn.running && !turn.waiting && !turn.failed &&
      !turn.cancelled && item.reasoningStreaming && !item.content && !node.events.length);
    return (
      <div className={styles.executionNode} key={node.key}>
        {item && (item.reasoning || item.reasoningStreaming) ? (
          <ExecutionDisclosure
            id={`${turn.key}:${node.key}:reasoning`}
            active={reasoningActive}
            className={styles.executionThought}
            toggleClassName={`${styles.executionToggle} ${styles.executionThoughtLabel}`}
            contentClassName={styles.executionThoughtContent}
            icon={<Icon type="bulb" className={styles.executionThoughtIcon} />}
            title={t('reasoning')}
          >
            {item.reasoning || ''}
            {reasoningActive ? <span className={styles.executionCursor} aria-hidden="true" /> : null}
          </ExecutionDisclosure>
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
          <ExecutionDisclosure
            id={`${turn.key}:execution`}
            active={!turn.failed && !turn.cancelled && (turn.running || turn.waiting)}
            className={styles.executionProcess}
            toggleClassName={styles.executionToggle}
            contentClassName={styles.executionLog}
            title={t('viewProcess')}
            extra={
              <span className={styles.executionStatus} role="status">
                {turn.running && !turn.waiting ? <Icon type="loading" /> : null}
                {this.getStatus()}
              </span>
            }
          >
            {turn.nodes.map(this.renderExecutionNode)}
          </ExecutionDisclosure>
        ) : null}
        {turn.pendingApprovals.map(renderApproval)}
        {turn.notices.map(renderNotice)}
        {turn.answer ? renderAnswer(turn.answer) : null}
      </div>
    );
  }
}
