import { Icon } from 'antd';
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
        oauth_type: oauthType,
        client_id: clientId,
        auth_url: authUrl,
        redirect_uri: redirectUri,
        service_id: serviceId,
        authorize_url: authorizeUrl
      } = item;
      if (oauthType === 'enterprisecenter' && authorizeUrl) {
        const str = authorizeUrl;
        const agreement = `${window.location.protocol}//`;
        const content = window.location.host;
        const suffix = str.substring(
          str.indexOf('/enterprise-server'),
          str.length
        );
        const newUrl = agreement + content + suffix;
        const isRedirectUrl = newUrl.indexOf('redirect_uri=') > -1;
        const redirectbefore =
          isRedirectUrl && newUrl.substring(0, newUrl.indexOf('redirect_uri='));

        const redirectSuffix =
          isRedirectUrl &&
          newUrl.substring(newUrl.indexOf('/console'), newUrl.length);
        const url = isRedirectUrl
          ? `${`${redirectbefore}redirect_uri=${agreement}${content}`}${redirectSuffix}`
          : newUrl;
        return url;
      }

      if (authorizeUrl) {
        return authorizeUrl;
      }
      if (oauthType == 'github') {
        return `${authUrl}?client_id=${clientId}&redirect_uri=${redirectUri}?service_id=${serviceId}&scope=user%20repo%20admin:repo_hook`;
      }
      return `${authUrl}?client_id=${clientId}&redirect_uri=${redirectUri}?service_id=${serviceId}&response_type=code`;
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
    const AliyunSvg = () => (
      <svg
        t="1606461675119"
        viewBox="0 0 1639 1024"
        p-id="6641"
        width={size}
        height={size}
      >
        <path
          d="M545.497212 568.816485h545.078303V445.915798H545.497212z"
          fill="#FE6A00"
          p-id="6642"
        />
        <path
          d="M1363.642182-0.005172H1002.987313L1090.011798 123.185131l262.930101 80.539152A113.700202 113.700202 0 0 1 1432.358788 312.883717l0.025858 0.284445v394.084848a113.705374 113.705374 0 0 1-79.437575 109.164606l-262.930101 80.559839L1002.987313 1020.167758h360.654869c150.445253 0 272.409859-121.980121 272.409858-272.430546v-475.332525c0-150.445253-121.959434-272.404687-272.409858-272.404687"
          fill="#FE6A00"
          p-id="6643"
        />
        <path
          d="M272.409859-0.005172h360.654868L546.040242 123.185131 283.099798 203.719111A113.710545 113.710545 0 0 0 203.693253 312.883717v394.369293a113.710545 113.710545 0 0 0 79.411717 109.164606l262.930101 80.559839L633.069899 1020.167758H272.409859C121.959434 1020.147071 0 898.161778 0 747.711354v-475.332526C0 121.964606 121.959434 0.005172 272.409859 0.005172"
          fill="#FE6A00"
          p-id="6644"
        />
      </svg>
    );

    if (item) {
      const { oauth_type: oauthType } = item;
      const map = {
        github: GithubSvg,
        gitlab: GitlabSvg,
        gitee: GiteeSvg,
        dingtalk: NailingSvg,
        aliyun: AliyunSvg
      };
      return <Icon component={map[oauthType] || OauthSvg} />;
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
      // eslint-disable-next-line no-unused-expressions
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
