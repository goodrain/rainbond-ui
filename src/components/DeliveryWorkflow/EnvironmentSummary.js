import React, { PureComponent } from 'react';
import { taskStatusLabel, w } from './index';
import styles from './environment.less';
const { successfulDeliveryEnvironments } = require('../../utils/deliveryWorkflow');

export default class EnvironmentSummary extends PureComponent {
  render() {
    const { items, hideEmpty, compact } = this.props;
    const environments = successfulDeliveryEnvironments(items);
    const exports = items.filter(item => item.kind === 'offline');
    if (hideEmpty && !environments.length && !exports.length) return null;
    return <div className={`${styles.root} ${compact ? styles.compact : ''}`}>
      <div className={styles.fieldRow}><span className={styles.label}>{w('deliveryEnvironments')}</span>
        <div className={styles.values}>{environments.length ? environments.slice(0, 3).map(item => <div className={styles.environment} key={item.id}>
          <span className={styles.target}>{item.target.team_alias || item.target.team_name} / {item.target.region_alias || item.target.region_name}
            <small>{item.target.app_name}</small></span>
          <span className={styles.status}>{taskStatusLabel(item)}</span>
        </div>) : <span className={styles.empty}>{w('noEnvironmentDeliveries')}</span>}</div>
      </div>
      {exports.length > 0 && <div className={styles.fieldRow}><span className={styles.label}>{w('offlineExport')}</span>
        <div className={styles.exportValue}><span>{w('exportRecordCount', { count: exports.length })}</span>{taskStatusLabel(exports[0])}</div>
      </div>}
    </div>;
  }
}
