import React, { PureComponent } from 'react';
import { Icon } from 'antd';
import { formatMessage } from 'umi';
import styles from './index.less';

/** The timeline contains the decision record; action buttons live outside it. */
export default class ApprovalRecord extends PureComponent {
  render() {
    const { item } = this.props;
    const approval = item.approval || {};
    const pending = approval.status === 'pending';
    const approved = approval.status === 'approved';
    const label = pending ? 'waitingApproval' : approved ? approval.autoApproved ? 'autoApproved' : 'approved'
      : approval.resolutionReason === 'timeout' ? 'timedOut' : approval.status === 'rejected' ? 'rejected' : 'cancelled';
    const icon = pending ? 'clock-circle-o' : approved ? 'safety-certificate' : 'close-circle';
    const color = pending ? styles.executionApprovalPending : approved ? styles.executionApprovalApproved : styles.executionApprovalResolved;
    return <div className={`${styles.executionApprovalRecord} ${color}`} data-approval-record={approval.approvalId}>
      <Icon type={icon} aria-hidden="true" />
      <span>{formatMessage({ id: `agent.execution.${label}` })}：{item.content || approval.description}</span>
    </div>;
  }
}
