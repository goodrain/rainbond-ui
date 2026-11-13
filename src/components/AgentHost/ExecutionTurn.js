import React, { PureComponent } from 'react';
import { Icon } from 'antd';
import { formatMessage } from 'umi';
import styles from './index.less';
import ExecutionDisclosure from './ExecutionDisclosure';
import ApprovalRecord from './ApprovalRecord';
import executionLabels from './executionLabels';
import AiExecutionIndicator from './AiExecutionIndicator';

const t = (name, values) => formatMessage({ id: `agent.execution.${name}` }, values);

class ActivityText extends PureComponent {
  state = { text: this.props.text, fresh: false };
  static getDerivedStateFromProps(props, state) {
    return props.text === state.text ? null : { text: props.text, fresh: true };
  }
  componentDidUpdate(previousProps) {
    if (previousProps.text === this.props.text) return;
    if (typeof window === 'undefined' || !window.requestAnimationFrame) {
      this.setState({ fresh: false });
      return;
    }
    if (this.frame) window.cancelAnimationFrame(this.frame);
    this.frame = window.requestAnimationFrame(() => { this.frame = null; this.setState({ fresh: false }); });
  }
  componentWillUnmount() {
    if (this.frame) window.cancelAnimationFrame(this.frame);
  }
  render() {
    return <span className={`${styles.executionActivityText} ${this.state.fresh ? styles.executionActivityFresh : ''}`}>{this.props.text}</span>;
  }
}

/** A real model message delimits a round; approvals remain with their tool issuer. */
export default class ExecutionTurn extends PureComponent {
  state = {
    processExpanded: false,
    openedNodeKey: null,
    reasoningExpanded: false,
  };

  requestView = options => {
    if (this.props.onViewChange) this.props.onViewChange(options);
  };

  toggleProcess = (expanded, anchor) => {
    const { turn } = this.props;
    const live = turn.running || turn.waiting;
    this.setState({ processExpanded: expanded, openedNodeKey: null, reasoningExpanded: false });
    if (this.props.onProcessToggle) this.props.onProcessToggle(expanded);
    this.requestView({ ...(expanded ? { follow: !!live } : {}), anchor });
  };

  toggleReasoning = (node, expanded, anchor) => {
    this.setState({ openedNodeKey: expanded ? node.key : null, reasoningExpanded: expanded });
    this.requestView({ ...(expanded ? { follow: false } : {}), anchor });
  };

  renderProcessItem = item => {
    if (item.kind === 'approval') return <ApprovalRecord key={item.id} item={item} />;
    return item.kind === 'trace' ? this.props.renderTrace(item) : null;
  };

  renderExecutionNode = node => {
    const { turn, renderProcessAnswer } = this.props;
    const item = node.output;
    const expanded = node.key === this.state.openedNodeKey && this.state.reasoningExpanded;
    return (
      <li key={node.key} className={styles.executionNode}>
        {item && (item.reasoning || item.reasoningStreaming) ? (
          <ExecutionDisclosure id={`${turn.key}:${node.key}:reasoning`}
            expanded={expanded} onToggle={(open, anchor) => this.toggleReasoning(node, open, anchor)}
            trailingChevron
            className={styles.executionThought}
            toggleClassName={`${styles.executionToggle} ${styles.executionThoughtLabel}`}
            contentClassName={styles.executionThoughtContent}
            icon={<Icon type="bulb" className={styles.executionThoughtIcon} />}
            title={t('reasoning')}
          >
            {expanded ? item.reasoning || '' : ''}
            {expanded && item.reasoningStreaming && turn.running ? <span className={styles.executionCursor} aria-hidden="true" /> : null}
          </ExecutionDisclosure>
        ) : null}
        {item && item !== turn.answer && item.content ? (
          <div className={styles.executionNarration}>{renderProcessAnswer(item)}</div>
        ) : null}
        {node.events.map(this.renderProcessItem)}
      </li>
    );
  };

  render() {
    const { turn, renderNotice, renderAnswer } = this.props;
    const processExpanded = this.props.processExpanded !== undefined ? this.props.processExpanded : this.state.processExpanded;
    const showProcess = turn.process.length > 0 || turn.running || turn.waiting;
    const activity = executionLabels.describeExecution(turn, t);
    const working = turn.running && !turn.waiting && !turn.segmentClosed && !turn.failed && !turn.cancelled;
    const mode = turn.waiting ? 'waiting' : working ? 'working' : 'ended';
    const label = t(mode === 'ended' ? 'executionEndedWithActivity' : 'aiActivity', { name: activity.text });
    return (
      <div className={this.props.embedded ? styles.assistantSupportStack : `${styles.messageRow} ${styles.assistantRow}`}>
        {!this.props.embedded ? <div className={styles.messageMeta}>
          <span className={styles.messageRole}>AI</span>
          <span className={styles.messageTime}>{new Date(turn.createdAt).toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit'
          })}</span>
        </div> : null}
        {showProcess ? <div className={styles.executionProcess}>
          <ExecutionDisclosure id={`${turn.key}:execution`} expanded={processExpanded}
            onToggle={this.toggleProcess}
            toggleClassName={`${styles.executionToggle} ${styles.executionProcessToggle}`}
            contentClassName={styles.executionLog}
            trailingChevron
            icon={<AiExecutionIndicator mode={mode} showCompleted={mode === 'ended' && !turn.failed && !turn.cancelled} />}
            title={<strong className={styles.executionHeadingCopy} role="status" aria-live="polite" title={label}>
              <ActivityText text={label} />
            </strong>}
          >
            {processExpanded ? <ol className={styles.executionRounds} aria-label={t('executionTimeline')}>
              {turn.nodes.map(this.renderExecutionNode)}
            </ol> : null}
          </ExecutionDisclosure>
        </div> : null}
        {turn.notices.filter(item => item.kind !== 'error').map(renderNotice)}
        {turn.answer ? renderAnswer(turn.answer) : null}
      </div>
    );
  }
}
