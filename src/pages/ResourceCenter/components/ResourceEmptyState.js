import React, { PureComponent } from 'react';
import { Button, Icon } from 'antd';
import ConfigIcon from './ConfigIcon';
import HelmIcon from './HelmIcon';
import NetworkIcon from './NetworkIcon';
import PodIcon from './PodIcon';
import StorageIcon from './StorageIcon';
import WorkloadIcon from './WorkloadIcon';
import styles from '../index.less';

function renderEmptyIcon(icon, size) {
  if (icon === 'helm-custom') return <HelmIcon size={size} />;
  if (icon === 'workload-custom') return <WorkloadIcon size={size} />;
  if (icon === 'pod-custom') return <PodIcon size={size} />;
  if (icon === 'network-custom') return <NetworkIcon size={size} />;
  if (icon === 'config-custom') return <ConfigIcon size={size} />;
  if (icon === 'storage-custom') return <StorageIcon size={size} />;
  return <Icon type={icon} />;
}

class ResourceEmptyState extends PureComponent {
  render() {
    const { meta, primaryActionLabel, onPrimaryAction } = this.props;

    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>
          {renderEmptyIcon(meta.icon, 36)}
        </div>
        <div className={styles.emptyStateTitle}>{meta.emptyTitle}</div>
        <div className={styles.emptyStateDescription}>{meta.emptyDescription}</div>
        <div className={styles.emptyStateActions}>
          {primaryActionLabel && onPrimaryAction && (
            <Button type="primary" onClick={onPrimaryAction}>
              {primaryActionLabel}
            </Button>
          )}
          <span className={styles.emptyStateHint}>{meta.emptyHint}</span>
        </div>
      </div>
    );
  }
}

export default ResourceEmptyState;
