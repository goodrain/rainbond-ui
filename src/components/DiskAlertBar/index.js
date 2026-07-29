import React, { PureComponent } from 'react';
import { Alert } from 'antd';
import { formatMessage } from '@/utils/intl';
import { DISK_ALERT_THRESHOLD } from '../../utils/nodeDisk';
import styles from './index.less';

class DiskAlertBar extends PureComponent {
  getTitle = alert =>
    formatMessage(
      { id: 'enterpriseColony.disk.alert.usageTitle' },
      {
        thresholdPercent: DISK_ALERT_THRESHOLD,
        usagePercent: Math.round(Number(alert.usagePercent) || 0)
      }
    );

  handleNodeClick = (event, alert) => {
    const { onView } = this.props;
    event.preventDefault();
    if (onView) {
      onView(alert);
    }
  };

  render() {
    const { alerts = [], onView } = this.props;
    if (!alerts.length) {
      return null;
    }

    const sortedAlerts = [...alerts].sort(
      (left, right) => right.usagePercent - left.usagePercent
    );

    return (
      <div className={styles.alertList}>
        {sortedAlerts.slice(0, 3).map(alert => {
          return (
            <Alert
              className={styles.alert}
              key={alert.key}
              type="error"
              showIcon
              message={(
                <span>
                  {onView ? (
                    <a
                      className={styles.nodeLink}
                      href="#node"
                      onClick={event => this.handleNodeClick(event, alert)}
                    >
                      {alert.node}
                    </a>
                  ) : (
                    <span className={styles.nodeName}>{alert.node}</span>
                  )}
                  <span>{this.getTitle(alert)}</span>
                </span>
              )}
            />
          );
        })}
      </div>
    );
  }
}

export default DiskAlertBar;
