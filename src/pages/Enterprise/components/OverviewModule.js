import { Alert, Button, Icon, Skeleton } from 'antd';
import React, { PureComponent } from 'react';
import styles from '../index.less';

export default class OverviewModule extends PureComponent {
  render() {
    const {
      title,
      description,
      extra,
      loading,
      error,
      onRetry,
      className = '',
      children
    } = this.props;
    return (
      <section className={`${styles.module} ${className}`}>
        <header className={styles.moduleHeader}>
          <div className={styles.moduleTitle}>
            <h2>{title}</h2>
            {description ? <span>{description}</span> : null}
          </div>
          {extra}
        </header>
        <div className={styles.moduleBody}>
          {loading && !children ? <Skeleton active paragraph={{ rows: 3 }} /> : null}
          {error ? (
            <div className={styles.moduleError}>
              <Alert type="warning" showIcon message={error} />
              {onRetry ? (
                <Button size="small" onClick={onRetry}>
                  <Icon type="reload" />
                </Button>
              ) : null}
            </div>
          ) : null}
          {children}
        </div>
      </section>
    );
  }
}
