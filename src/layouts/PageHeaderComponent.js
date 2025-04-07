import { Link } from 'dva/router';
import React from 'react';
import CustomFooter from './CustomFooter';
import PageHeader from '../components/PageHeaderComponent/index';
import styles from './PageHeaderLayout.less';
import cookie from '../utils/cookie';

export default ({
  isFooter,
  children,
  wrapperClassName,
  top,
  noMargin,
  ...restProps
}) => (
  <div style={{ margin: noMargin ? '0' : '-24px -24px 0'}} className={wrapperClassName}>
    {top}
    <PageHeader key="pageheader" {...restProps} linkElement={Link} />
    {children ? <div className={styles.content}>{children}</div> : null}
    {!isFooter && cookie.get('enterprise_edition') === 'false' && (
      <CustomFooter />
    )}
  </div>
);
