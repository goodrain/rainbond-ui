import { Link } from 'dva/router';
import React from 'react';
import CustomFooter from './CustomFooter';
import PageHeader from '../components/PageHeaderMarket/index';
import styles from './PageHeaderLayout.less';
import cookie from '../utils/cookie';

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
    {children ? <div className={styles.content} style={{backgroundImage: (restProps.tabList && restProps.tabList.length > 0) ? 'linear-gradient(#fff 10%, #f1f2f5 30%)' : null}}>{children}</div> : null}
    {!isFooter && cookie.get('enterprise_edition') === 'false' && (
      <CustomFooter />
    )}
  </div>
);
