import React, { PureComponent } from 'react';
import styles from './index.less';
import ExecutionTurn from './ExecutionTurn';

/** One request, with durable checkpoint prose between its execution segments. */
export default class ConversationTurn extends PureComponent {
  state = { openedExecutionKey: null };

  handleProcessToggle = (key, expanded) => {
    this.setState({ openedExecutionKey: expanded ? key : null });
  };

  render() {
    const { turn, following, onViewChange, renderTrace, renderApproval, renderAnswer, renderNotice, renderProcessAnswer } = this.props;
    return <div className={`${styles.messageRow} ${styles.assistantRow}`}>
      <div className={styles.messageMeta}>
        <span className={styles.messageRole}>AI</span>
        <span className={styles.messageTime}>{new Date(turn.createdAt).toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit'
        })}</span>
      </div>
      <div className={styles.assistantMessageStack}>
        {turn.timeline.map(entry => entry.kind === 'answer' ? renderAnswer(entry.item) :
          <React.Fragment key={entry.key}><ExecutionTurn turn={entry.turn} embedded following={following}
            processExpanded={this.state.openedExecutionKey === entry.key}
            onProcessToggle={expanded => this.handleProcessToggle(entry.key, expanded)}
            onViewChange={onViewChange} renderTrace={renderTrace} renderApproval={renderApproval}
            renderAnswer={renderAnswer} renderNotice={renderNotice} renderProcessAnswer={renderProcessAnswer} />
            {entry.turn.pendingApprovals.map(renderApproval)}
          </React.Fragment>)}
        {turn.notices.filter(item => item.kind !== 'error').map(renderNotice)}
      </div>
    </div>;
  }
}
