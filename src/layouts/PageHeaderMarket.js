import { Link } from 'dva/router';
import React from 'react';
import CustomFooter from './CustomFooter';
import PageHeader from '../components/PageHeaderMarket/index';
import global from '@/utils/global';
import styles from './PageHeaderLayout.less';
import cookie from '../utils/cookie';

export default ({
  isFooter,
  children,
  wrapperClassName,
  top,
  ...restProps
}) => (
  <div  className={`${wrapperClassName} ${styles.pageHeaderWrapper}`}>
    {top}
    <PageHeader key="pageheader" {...restProps} linkElement={Link} />
    {children ? <div className={styles.mkContent}>{children}</div> : null}
    {!isFooter && cookie.get('enterprise_edition') === 'false' && (
      <CustomFooter />
    )}
  </div>
);
