import { Icon } from 'antd';
import Gitee from '../../public/images/gitee.png';
import rainbondUtil from './rainbond';

const oauthUtil = {
  getEnableGitOauthServer(enterprise) {
    const servers = [];
    if (rainbondUtil.OauthEnterpriseEnable(enterprise)) {
      enterprise.oauth_services.value.map(item => {
        if (item.is_git && item.enable) {
          servers.push(item);
        }
      });
    }
    return servers;
  },
  getAuthredictURL(item) {
    if (item) {
      const {
        oauth_type,
        client_id,
        auth_url,
        redirect_uri,
        service_id,
        authorize_url,
      } = item;
      if (authorize_url) {
        return authorize_url;
      }
      if (oauth_type == 'github') {
        return `${auth_url}?client_id=${client_id}&redirect_uri=${redirect_uri}?service_id=${service_id}&scope=user%20repo%20admin:repo_hook`;
      }
      return `${auth_url}?client_id=${client_id}&redirect_uri=${redirect_uri}?service_id=${service_id}&response_type=code`;
    }
    return null;
  },
  getIcon(item, size = '32px') {
    if (item) {
      const { oauth_type } = item;
      switch (oauth_type) {
        case 'github':
          return (
            <Icon style={{ fontSize: size, color: '#40485B' }} type="github" />
          );
        case 'gitlab':
          return <Icon style={{ fontSize: size }} type="gitlab" />;
        case 'gitee':
          return (
            <img
              style={{
                height: size,
                width: size,
                borderRadius: '50%',
                marginRight: '5px',
              }}
              src={Gitee}
            />
          );
        default:
          return <Icon style={{ fontSize: size }} type="sync" />;
      }
    }
    return null;
  },
  getGitOauthServer(rainbondInfo, service_id, enterprise) {
    let selectServer = null;
    if (
      rainbondUtil.OauthbEnable(rainbondInfo) &&
      rainbondUtil.OauthEnterpriseEnable(enterprise)
    ) {
      enterprise.oauth_services.value.map(item => {
        if (item.is_git && item.service_id == service_id) {
          selectServer = item;
        }
      });
    }
    return selectServer;
  },
  userbondOAuth(currentUser, service_id) {
    let isBond = false;
    if (currentUser) {
      currentUser.oauth_services &&
        currentUser.oauth_services.map(item => {
          if (
            item.service_id == service_id &&
            item.is_authenticated &&
            !item.is_expired
          ) {
            isBond = true;
          }
        });
    }
    return isBond;
  },
};

export default oauthUtil;
