import { DefaultFooter } from '@ant-design/pro-layout';
import { connect } from 'dva';
import { Icon } from 'antd';
import React, { Component } from 'react'
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import cookie from '../utils/cookie';
import PluginUtil from '../utils/pulginUtils';
import styles from './PageHeaderLayout.less';

@connect(({ user, global, teamControl }) => ({
  user: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  pluginsList: teamControl.pluginsList
}))

export default class CustomFooter extends Component {
  constructor(props) {
    super(props)
    this.state = {

    }
  }

  render() {
    const { rainbondInfo, pluginsList } = this.props
    const showEnterpriseFootrt = PluginUtil.isInstallPlugin(pluginsList, 'rainbond-enterprise-base');
    const footer = (rainbondInfo && rainbondInfo.footer && rainbondInfo.footer.value) || formatMessage({ id: 'CustomFooter.goodrain' });
    return (
      <div>
        {(footer || showEnterpriseFootrt) ? (
          <div className={styles.footer}>
            {footer}
          </div>
        ) : (
          <DefaultFooter
            style={{ background: 'none' }}
            className={styles.customFooter}
            copyright={rainbondInfo?.footer?.enable && rainbondInfo?.footer?.value || new Date().getFullYear() + ` ${formatMessage({ id: 'CustomFooter.goodrain' })}`}
            links={[
              {
                key: 'Rainbond',
                title: formatMessage({ id: 'CustomFooter.website' }),
                href: (cookie.get('language') === 'zh-CN' ? true : false) ? 'https://www.rainbond.com' : 'https://www.rainbond.com/en/',
                blankTarget: true
              },
              {
                key: 'poc',
                title: formatMessage({ id: 'CustomFooter.services' }),
                href: (cookie.get('language') === 'zh-CN' ? true : false) ? 'https://www.rainbond.com/enterprise_server' : 'https://www.rainbond.com/en/enterprise_server/',
                blankTarget: true
              },
              {
                key: 'community',
                title: formatMessage({ id: 'CustomFooter.community' }),
                href: (cookie.get('language') === 'zh-CN' ? true : false) ? 'https://www.rainbond.com/docs/support' : 'https://www.rainbond.com/en/docs/support/',
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
    )
  }
}
