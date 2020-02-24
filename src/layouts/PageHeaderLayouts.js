import React from 'react';
import { Link } from 'dva/router';
import styles from './PageHeaderLayouts.less';
import { Icon } from 'antd';

export default ({ children, wrapperClassName, title, content }) => (
  <div style={{ margin: '-24px -24px 0' }} className={wrapperClassName}>
    <div className={styles.headerBox}>
      <div className={styles.icons}>
        <Icon type="arrow-left" />
      </div>
      <div className={styles.titBox}>
        <div>{title}</div>
        <div>{content}</div>
      </div>
    </div>

    {children ? <div className={styles.content}>{children}</div> : null}
  </div>
);
