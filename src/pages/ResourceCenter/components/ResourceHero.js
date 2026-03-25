import React, { PureComponent } from 'react';
import { Icon } from 'antd';
import { formatMessage } from '@/utils/intl';
import ConfigIcon from './ConfigIcon';
import HelmIcon from './HelmIcon';
import NetworkIcon from './NetworkIcon';
import PodIcon from './PodIcon';
import StorageIcon from './StorageIcon';
import WorkloadIcon from './WorkloadIcon';
import styles from '../index.less';

function renderHeroIcon(icon, size) {
  if (icon === 'helm-custom') return <HelmIcon size={size} />;
  if (icon === 'workload-custom') return <WorkloadIcon size={size} />;
  if (icon === 'pod-custom') return <PodIcon size={size} />;
  if (icon === 'network-custom') return <NetworkIcon size={size} />;
  if (icon === 'config-custom') return <ConfigIcon size={size} />;
  if (icon === 'storage-custom') return <StorageIcon size={size} />;
  return <Icon type={icon} />;
}

class ResourceHero extends PureComponent {
  render() {
    const { meta, metrics, summary } = this.props;
    const summaryItems = [
      { label: formatMessage({ id: 'resourceCenter.summary.stable' }), value: summary.running, tone: styles.summaryItemRunning },
      { label: formatMessage({ id: 'resourceCenter.summary.attention' }), value: summary.warning, tone: styles.summaryItemWarning },
      { label: formatMessage({ id: 'resourceCenter.summary.abnormal' }), value: summary.error, tone: styles.summaryItemError },
    ];

    return (
      <div className={styles.sectionHero}>
        <div className={styles.sectionHeroTop}>
          <div className={styles.sectionHeroIntro}>
            <span className={styles.sectionHeroIcon}>
              {renderHeroIcon(meta.icon, 30)}
            </span>
            <div className={styles.sectionHeroCopy}>
              <div className={styles.sectionHeroTitleRow}>
                <h2 className={styles.sectionHeroTitle}>{meta.title}</h2>
              </div>
              <p className={styles.sectionHeroDescription}>{meta.description}</p>
            </div>
          </div>
        </div>
        <div className={styles.metricGrid}>
          {metrics.map(metric => (
            <div
              key={metric.label}
              className={`${styles.metricCard} ${styles[`metricCard${metric.tone.charAt(0).toUpperCase()}${metric.tone.slice(1)}`] || ''}`}
            >
              <div className={styles.metricLabel}>{metric.label}</div>
              <div className={styles.metricValue}>{metric.value}</div>
              <div className={styles.metricHelper}>{metric.helper}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default ResourceHero;
