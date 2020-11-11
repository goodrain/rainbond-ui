import { Link } from 'dva/router';
import React from 'react';
import { Icon } from 'antd';
import PageHeader from '../components/PageHeader';
import styles from './PageHeaderLayout.less';
import { DefaultFooter } from '@ant-design/pro-layout';
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
    {children ? <div className={styles.content}>{children}</div> : null}
    {!isFooter && cookie.get('enterprise_edition') === 'false' && (
      <DefaultFooter
        copyright="2020 北京好雨科技有限公司出品"
        links={[
          {
            key: 'Rainbond',
            title: 'Rainbond',
            href: 'https://www.rainbond.com',
            blankTarget: true
          },
          {
            key: 'poc',
            title: '申请POC',
            href: 'https://goodrain.goodrain.com/page/price#customForm',
            blankTarget: true
          },
          {
            key: 'community',
            title: '社区讨论',
            href: 'https://t.goodrain.com',
            blankTarget: true
          },
          {
            key: 'github',
            title: <Icon type="github" />,
            href: 'https://github.com/goodrain/rainbond',
            blankTarget: true
          }
        ]}
      />
    )}
  </div>
);
