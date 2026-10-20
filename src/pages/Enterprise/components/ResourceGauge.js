import React, { PureComponent } from 'react';
import overviewData from '../overviewData';
import styles from '../index.less';

export default class ResourceGauge extends PureComponent {
  render() {
    const { percent, label } = this.props;
    const available = overviewData.isNumber(percent);
    const value = available ? Math.max(0, Math.min(100, Number(percent))) : 0;
    return (
      <div className={`${styles.resourceGauge} ${available && Number(percent) >= 80 ? styles.gaugeWarning : ''}`}>
        <svg viewBox="0 0 100 64" aria-hidden="true">
          <path className={styles.gaugeTrack} d="M 8 56 A 42 42 0 0 1 92 56" pathLength="100" />
          {available ? <path className={styles.gaugeValue} d="M 8 56 A 42 42 0 0 1 92 56" pathLength="100" strokeDasharray={`${value} 100`} /> : null}
        </svg>
        <span><strong>{available ? `${overviewData.formatNumber(percent, 1)}%` : '-'}</strong><small>{label}</small></span>
      </div>
    );
  }
}
