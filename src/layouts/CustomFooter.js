import { DefaultFooter } from '@ant-design/pro-layout';
import { Icon } from 'antd';
import React from 'react';
import styles from './PageHeaderLayout.less';

export default () => (
  <DefaultFooter
    className={styles.customFooter}
    copyright={new Date().getFullYear() + ' 北京好雨科技有限公司出品'}
    links={[
      {
        key: 'Rainbond',
        title: '官网',
        href: 'https://www.rainbond.com',
        blankTarget: true
      },
      {
        key: 'poc',
        title: '企业服务',
        href: 'https://goodrain.com',
        blankTarget: true
      },
      {
        key: 'community',
        title: '社区',
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
);
