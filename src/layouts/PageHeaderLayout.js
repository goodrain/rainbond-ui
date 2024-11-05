import { Link } from 'dva/router';
import React from 'react';
import PageHeader from '../components/PageHeader';
import global from '@/utils/global';
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
  <div style={{ margin: '0', padding: '12px', boxSizing: 'border-box', backgroundColor: '#fff' }} className={wrapperClassName}>
    {top}
    <PageHeader key="pageheader" {...restProps} linkElement={Link} />
    {children ? <div className={restProps.tabList && restProps.tabList.length> 0 ? styles.contents : styles.content} >{children}</div> : null}
    {!isFooter && cookie.get('enterprise_edition') === 'false' && (
      <CustomFooter />
    )}
  </div>
);
