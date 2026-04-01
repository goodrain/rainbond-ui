import React, { PureComponent } from 'react';
import { Button, Input } from 'antd';
import { formatMessage } from '@/utils/intl';
import styles from '../index.less';

class ResourceToolbar extends PureComponent {
  render() {
    const {
      leftContent,
      searchPlaceholder,
      searchText,
      onSearchChange,
      onRefresh,
      refreshLoading,
      primaryActionLabel,
      onPrimaryAction,
    } = this.props;

    return (
      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          {leftContent}
          <Input.Search
            placeholder={searchPlaceholder}
            className={styles.toolbarSearch}
            value={searchText}
            allowClear
            size="default"
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        <div className={styles.toolbarActions}>
          <Button icon="reload" onClick={onRefresh} loading={refreshLoading}>
            {formatMessage({ id: 'resourceCenter.common.refresh' })}
          </Button>
          <Button type="primary" icon="plus" onClick={onPrimaryAction}>
            {primaryActionLabel}
          </Button>
        </div>
      </div>
    );
  }
}

export default ResourceToolbar;
