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

function renderTabIcon(icon, size) {
  if (icon === 'helm-custom') return <HelmIcon size={size} />;
  if (icon === 'workload-custom') return <WorkloadIcon size={size} />;
  if (icon === 'pod-custom') return <PodIcon size={size} />;
  if (icon === 'network-custom') return <NetworkIcon size={size} />;
  if (icon === 'config-custom') return <ConfigIcon size={size} />;
  if (icon === 'storage-custom') return <StorageIcon size={size} />;
  return <Icon type={icon} style={{ fontSize: size }} />;
}

class ResourceSidebar extends PureComponent {
  render() {
    const { activeTab, tabOrder, tabMeta, onTabChange } = this.props;

    return (
      <aside className={styles.sidebar}>
        <div className={styles.sidebarGroupTitle}>{formatMessage({ id: 'resourceCenter.sidebar.title' })}</div>
        <div className={styles.sidebarGroupItems}>
          {tabOrder.map(tab => {
            const meta = tabMeta[tab];
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                className={`${styles.sidebarButton} ${isActive ? styles.sidebarButtonActive : ''}`}
                onClick={() => onTabChange(tab)}
              >
                <span className={styles.sidebarButtonIcon}>
                  {renderTabIcon(meta.icon, 18)}
                </span>
                <span className={styles.sidebarButtonBody}>
                  <span className={styles.sidebarButtonTitle}>{meta.title}</span>
                  <span className={styles.sidebarButtonDescription}>{meta.navDescription}</span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    );
  }
}

export default ResourceSidebar;
