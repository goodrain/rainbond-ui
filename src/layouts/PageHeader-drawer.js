import { Link } from 'dva/router';
import React from 'react';
import CustomFooter from './CustomFooter';
import PageHeader from '../components/PageHeaderDrawer';
import styles from './PageHeaderLayout.less';
import cookie from '../utils/cookie';

export default ({
  isFooter,
  children,
  wrapperClassName,
  top,
  ...restProps
}) => (
  <div style={{ margin: '-20px' }} className={wrapperClassName}>
    {top}
    <PageHeader key="pageheader" {...restProps} linkElement={Link} />
    {children ? <div className={styles.content} style={{background: restProps.isDrawer && "#fff"}}>{children}</div> : null}
    {!isFooter && cookie.get('enterprise_edition') === 'false' && (
      <CustomFooter />
    )}
  </div>
);
