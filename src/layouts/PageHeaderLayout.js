import { DefaultFooter } from '@ant-design/pro-layout';
import { Link } from 'dva/router';
import React from 'react';
import PageHeader from '../components/PageHeader';
import styles from './PageHeaderLayout.less';

export default ({ children, wrapperClassName, top, ...restProps }) => (
  <div style={{ margin: '-24px -24px 0' }} className={wrapperClassName}>
    {top}
   <PageHeader key="pageheader" {...restProps} linkElement={Link} />
    {children ? <div className={styles.content}>{children}</div> : null}
   <DefaultFooter 
      copyright="2020 北京好雨科技有限公司出品"
      links={[
        {
          key: 'Rainbond Cloud',
          title: 'Rainbond Cloud',
          blankTarget: true,
        },
      ]}
    ></DefaultFooter>
  </div>
);
