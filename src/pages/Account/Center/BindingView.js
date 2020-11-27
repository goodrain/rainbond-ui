import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import { List } from 'antd';
import oauthUtil from '../../../utils/oauth';
import rainbondUtil from '../../../utils/rainbond';

@connect(({ user, global, appControl }) => ({
  currUser: user.currentUser,
  rainbondInfo: global.rainbondInfo,
  enterprise: global.enterprise,
  appDetail: appControl.appDetail
}))
class BindingView extends Component {
  render() {
    const { currUser, enterprise } = this.props;

    if (!currUser) {
      return null;
    }
    const isOauth = rainbondUtil.OauthEnterpriseEnable(enterprise);
    const oauthServices =
      currUser.oauth_services &&
      currUser.oauth_services.length > 0 &&
      currUser.oauth_services;
    const oauthList = (enterprise && isOauth && oauthServices) || [];

    return (
      <Fragment>
        <List
          itemLayout="horizontal"
          dataSource={oauthList}
          renderItem={(item) => {
            const {
              service_name: serviceName,
              is_authenticated: isAuthenticated,
              oauth_user_name: oauthUserName,
              is_expired: isExpired,
              oauth_type: oauthType
            } = item;
            const authURL = oauthUtil.getAuthredictURL(item);
            let certificationText = '';
            if (isAuthenticated) {
              certificationText = '已认证';
            } else if (isExpired) {
              certificationText = '已过期重新认证';
            }

            return (
              <List.Item
                actions={[
                  <span>
                    <a
                      href={isAuthenticated ? 'javascript:;' : authURL}
                      style={{ color: isAuthenticated ? 'green' : '#1890ff' }}
                      target={isAuthenticated ? 'inherit' : '_blank'}
                    >
                      {certificationText || '去认证'}
                    </a>
                  </span>
                ]}
              >
                <List.Item.Meta
                  avatar={oauthUtil.getIcon(item, '48px')}
                  title={serviceName}
                  description={
                    <div>
                      当前{certificationText || '未认证'}
                      {oauthUserName || oauthType}账号
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Fragment>
    );
  }
}

export default BindingView;
