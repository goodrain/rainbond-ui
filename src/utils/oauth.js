import Gitee from '../../public/images/gitee.png';
import rainbondUtil from './rainbond';
import { Icon } from 'antd';

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
    const handleGitlabSvg = () => (
      <svg viewBox="0 0 1024 1024" width={size} height={size}>
        <path
          d="M513.6 982.08l187.84-578.24H325.76l187.84 578.24z"
          fill="#E24329"
          p-id="4662"
        />
        <path
          d="M513.6 982.08l-187.84-578.24H62.4l451.2 578.24z"
          fill="#FC6D26"
          p-id="4663"
        />
        <path
          d="M62.4 403.84L5.44 579.52c-5.12 16 0.64 33.6 14.08 43.52l494.4 359.04L62.4 403.84z"
          fill="#FCA326"
          p-id="4664"
        />
        <path
          d="M62.4 403.84h263.36L212.48 55.36c-5.76-17.92-31.04-17.92-37.12 0L62.4 403.84z"
          fill="#E24329"
          p-id="4665"
        />
        <path
          d="M513.6 982.08l187.84-578.24h263.36l-451.2 578.24z"
          fill="#FC6D26"
          p-id="4666"
        />
        <path
          d="M965.12 403.84l56.96 175.68c5.12 16-0.64 33.6-14.08 43.52L513.6 982.08l451.52-578.24z"
          fill="#FCA326"
          p-id="4667"
        />
        <path
          d="M965.12 403.84h-263.36l113.28-348.48c5.76-17.92 31.04-17.92 37.12 0l112.96 348.48z"
          fill="#E24329"
          p-id="4668"
        />
      </svg>
    );

    const handleEnterpriseCenterSvg = () => (
      <svg viewBox="0 0 1024 1024" width={size} height={size}>
        <path
          d="M418.944 844.352c0 25.6-20.8 46.4-46.4 46.4H151.424a46.848 46.848 0 0 1-46.848-46.848V426.56c0-24.576 11.264-47.744 30.592-62.912L456.96 111.104a80 80 0 0 1 98.944 0.128l320 252.416c19.2 15.168 30.4 38.336 30.4 62.784v417.472a46.848 46.848 0 0 1-46.848 46.848H638.336a46.4 46.4 0 0 1-46.4-46.4V571.264H418.944v273.088z m426.752-14.208V417.024L506.368 149.312 165.184 417.088v413.056h193.152V557.44c0-25.792 20.992-46.848 46.848-46.848h200.512c25.856 0 46.848 20.992 46.848 46.848v272.64h193.152z"
          p-id="8482"
        />
      </svg>
    );

    if (item) {
      const { oauth_type } = item;
      switch (oauth_type) {
        case 'github':
          return (
            <Icon style={{ fontSize: size, color: '#40485B' }} type="github" />
          );
        case 'gitlab':
          return <Icon component={handleGitlabSvg} />;
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
          return <Icon component={handleEnterpriseCenterSvg} />;
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
