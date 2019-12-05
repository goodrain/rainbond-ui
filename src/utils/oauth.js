import Gitee from "../../public/images/gitee.png";
import rainbondUtil from "./rainbond"
import { Icon } from "antd";

const oauthUtil = {
  getEnableGitOauthServer(rainbondInfo) {
    let servers = [];
    if (rainbondUtil.OauthbEnable(rainbondInfo)) {
      rainbondInfo.oauth_services.value.map(item => {
        if (item.enable) {
          servers.push(item);
        }
      });
    }
    return servers;
  },
  getAuthredictURL(item) {
    const { oauth_type, client_id, auth_url, redirect_uri, service_id } = item;
    if (oauth_type == "github") {
      return `${auth_url}?client_id=${client_id}&redirect_uri=${redirect_uri}?service_id=${service_id}&scope=user%20repo%20admin:repo_hook`;
    }
    return `${auth_url}?client_id=${client_id}&redirect_uri=${redirect_uri}?service_id=${service_id}&response_type=code`;
  },
  getIcon(item, size = "32px") {
    const { oauth_type } = item;
    switch (oauth_type) {
      case "github":
        return <Icon style={{ "font-size": size, color: "#40485B" }} type="github" />
      case "gitlab":
        return <Icon style={{ "font-size": size }} type="gitlab" />;
      case "gitee":
        return <img
            style={{ height: size, width: size, "border-radius": "50%" }}
            src={Gitee}
          />
      default:
        return <Icon style={{ "font-size": size }} type="sync" />;
    }
  },
  getGitOauthServer(rainbondInfo, service_id) {
    let selectServer = null
    if (rainbondUtil.OauthbEnable(rainbondInfo)) {
      rainbondInfo.oauth_services.value.map(item => {
        if (item.service_id == service_id) {
          selectServer = item
        }
      });
    }
    return selectServer
  },
  userbondOAuth(currentUser, service_id) {
    let isBond =false
    currentUser.oauth_services && currentUser.oauth_services.map((item)=>{
        if (item.service_id == service_id && item.is_authenticated && !item.is_expired){
          isBond = true
        }
    })
    return isBond
  }
};

export default oauthUtil
