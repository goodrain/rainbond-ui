import React, { PureComponent } from 'react';
import { Icon } from 'antd';
import { formatMessage } from 'umi';
import styles from './index.less';
import executionLabels from './executionLabels';
const t = (name, values) => formatMessage({ id: `agent.execution.${name}` }, values);

/** Execution records show the action name; tool payloads remain in the data layer. */
export default class ToolCallRow extends PureComponent {
  render() {
    const trace = this.props.item.trace || {};
    const operation = executionLabels.describeTool(trace, t);
    return (
      <div
        className={`${styles.traceRow} ${styles.executionTool}`}
      >
        <div className={styles.executionToolRow}>
          <Icon
            type={operation.icon}
            className={styles.traceInlineIcon}
            aria-hidden="true"
          />
          <span className={styles.executionToolCopy}>
            {operation.internal ? operation.name : operation.action}
          </span>
        </div>
      </div>
    );
  }
}
