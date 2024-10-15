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
  <div style={{ margin: '-24px -24px 0', backgroundColor: global.getPublicColor('rbd-background-color') }} className={wrapperClassName}>
    {top}
    <PageHeader key="pageheader" {...restProps} linkElement={Link} />
    {children ? <div className={restProps.isContent ? styles.contents : styles.content} style={{backgroundImage: (restProps.tabList && restProps.tabList.length > 0) ? `linear-gradient(#fff 10%,  ${global.getPublicColor('rbd-background-color')} 30%)` : null}}>{children}</div> : null}
    {!isFooter && cookie.get('enterprise_edition') === 'false' && (
      <CustomFooter />
    )}
  </div>
);
