import { List } from 'antd';
import { connect } from 'dva';
import React, { Component, Fragment } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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
          renderItem={item => {
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
              certificationText = `${formatMessage({id:'otherEnterprise.BindingView.Certified'})}`;
            } else if (isExpired) {
              certificationText = `${formatMessage({id:'otherEnterprise.BindingView.Expired'})}`;
            }

            return (
              <List.Item
                actions={[
                  <span
                    style={{ color: isAuthenticated ? 'green' : '#4d73b1' }}
                  >
                    {isAuthenticated
                      ? certificationText
                      : authURL && (
                          // eslint-disable-next-line react/jsx-indent
                          <a
                            rel="noreferrer"
                            href={`${authURL}&&type=certification`}
                            target="_blank"
                          >
                            {certificationText || `${formatMessage({id:'otherEnterprise.BindingView.De_certification'})}`}
                          </a>
                        )}
                  </span>
                ]}
              >
                <List.Item.Meta
                  avatar={oauthUtil.getIcon(item, '48px')}
                  title={serviceName}
                  description={
                    <div>
                      {formatMessage({id:'otherEnterprise.BindingView.now'})}{certificationText || `${formatMessage({id:'otherEnterprise.BindingView.Not_certified'})}`}
                      {oauthUserName || oauthType}{formatMessage({id:'otherEnterprise.BindingView.number'})}
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
