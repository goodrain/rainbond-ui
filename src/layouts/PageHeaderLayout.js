import { Link } from 'dva/router';
import React from 'react';
import PageHeader from '../components/PageHeader';
import cookie from '../utils/cookie';
import CustomFooter from './CustomFooter';
import styles from './PageHeaderLayout.less';

export default ({
  isFooter,
  children,
  wrapperClassName,
  top,
  ...restProps
}) => (
  <div style={{ margin: '-24px -24px 0' }} className={wrapperClassName}>
    {top}
    <PageHeader key="pageheader" {...restProps} linkElement={Link} />
    {children ? <div className={styles.content}>{children}</div> : null}
    {!isFooter && cookie.get('enterprise_edition') === 'false' && (
      <CustomFooter />
    )}
  </div>
);
