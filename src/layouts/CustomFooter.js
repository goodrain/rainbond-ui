import { DefaultFooter } from '@ant-design/pro-layout';
import { Icon } from 'antd';
import React from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import cookie from '..//utils/cookie';
import styles from './PageHeaderLayout.less';

export default () => (
  <DefaultFooter
    style={{background:'none'}}
    className={styles.customFooter}
    copyright={new Date().getFullYear() + `${formatMessage({id:'CustomFooter.goodrain'})}`}
    links={[
      {
        key: 'Rainbond',
        title: formatMessage({id:'CustomFooter.website'}),
        href: (cookie.get('language') === 'zh-CN' ? true : false)  ?  'https://www.rainbond.com' : 'https://www.rainbond.com/en/',
        blankTarget: true
      },
      {
        key: 'poc',
        title: formatMessage({id:'CustomFooter.services'}),
        href: (cookie.get('language') === 'zh-CN' ? true : false) ? 'https://www.rainbond.com/enterprise_server' : 'https://www.rainbond.com/en/enterprise_server/',
        blankTarget: true
      },
      {
        key: 'community',
        title: formatMessage({id:'CustomFooter.community'}),
        href: (cookie.get('language') === 'zh-CN' ? true : false) ? 'https://www.rainbond.com/community/support' : 'https://www.rainbond.com/en/community/support/',
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
