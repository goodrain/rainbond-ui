import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import { Card } from "antd";
import rainbondUtil from "../../utils/rainbond";
import globalUtil from "../../utils/global";
import oauthUtil from "../../utils/oauth";
import ThirdList from "../../components/ThirdList";
import styles from "./index.less";

@connect(({ user, groupControl, global }) => ({
  rainbondInfo: global.rainbondInfo,
  currentUser: user.currentUser,
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      // 是否绑定了github仓库
      is_auth: false,
      // oauth url
      auth_url: "",
      // 代码分支及版本信息
      codeList: []
    };
  }
  componentDidMount() {
    const { rainbondInfo, type } = this.props;
    const git_type = this.setType();
    let gitinfo = oauthUtil.getGitOauthServer(rainbondInfo, type);
    if (gitinfo) {
      this.setState({"auth_url":oauthUtil.getAuthredictURL(gitinfo)})
    }
    if (rainbondUtil.OauthbTypes(rainbondInfo, git_type)) {
      this.getGitRepostoryInfo(rainbondInfo, type);
    }
  }
  componentWillUpdate(props) {
    this.props = props
    const { rainbondInfo, type } = props;
    const git_type = this.setType();
    let gitinfo = oauthUtil.getGitOauthServer(rainbondInfo, type);
    if (gitinfo) {
      this.setState({"auth_url":oauthUtil.getAuthredictURL(gitinfo)})
    }
    if (rainbondUtil.OauthbTypes(rainbondInfo, git_type)) {
      this.getGitRepostoryInfo(rainbondInfo, type);
    }
  }
  setType = () => {
    const { tabList, type, gitType } = this.props;
    if (gitType) {
        return gitType
    }
    let typs = "";
    tabList && tabList.map(item => {
      const { key, types } = item;
      if (type == key) {
        typs = types;
      }
    });
    return typs;
  };

  getGitRepostoryInfo = (rainbondInfo, key) => {
    let gitinfo = oauthUtil.getGitOauthServer(rainbondInfo, key);
    const { currentUser } = this.props
    this.setState({is_auth: gitinfo && oauthUtil.userbondOAuth(currentUser, key)});
  };

  handleSubmit = value => {
    const type = this.setType();
    const teamName = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "global/createSourceCode",
      payload: {
        team_name: teamName,
        code_from: type,
        ...value
      },
      callback: data => {
        const appAlias = data && data.bean.service_alias;
        this.props.handleType && this.props.handleType === "Service"
          ? this.props.handleServiceGetData(appAlias)
          : this.props.dispatch(
              routerRedux.push(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-check/${appAlias}`
              )
            );
      }
    });
  };

  handleSubmit = value => {
    const type = this.setType();
    const { type: service_id } = this.props;
    const teamName = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "createApp/createThirtAppByCode",
      payload: {
        service_id,
        code_version: value.code_version,
        git_url: value.project_url,
        group_id: value.group_id,
        server_type: "git",
        service_cname: value.service_cname,
        is_oauth: true, // 是否为oauth创建
        git_project_id: value.project_id,
        team_name: teamName,
        open_webhook: true, // 是否开启webhook
        full_name: value.project_full_name
      },
      callback: data => {
        const appAlias = data && data.bean.service_alias;
        this.props.dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-check/${appAlias}`
          )
        );
      }
    });
  };

  render() {
    const { is_auth, auth_url } = this.state;
    const type = this.setType();
    return (
      <Card bordered={false} className={styles.ClearCard}>
        <div
        >
          {!is_auth ? (
            <div
              style={{
                textAlign: "center",
                padding: "100px 0",
                fontSize: 14
              }}
            >
              尚未绑定{type}账号
              {this.props.handleType &&
              this.props.handleType === "Service" &&
              this.props.ButtonGroupState
                ? this.props.handleServiceBotton(
                    <a href={auth_url} target="_blank" type="primary">
                      去认证
                    </a>,
                    false
                  )
                : !this.props.handleType && (
                    <a 
                      href={auth_url}
                      target="_blank" 
                      style={{
                        marginLeft: 20
                      }}
                      type="primary"
                    >
                      去认证
                    </a>
                  )}
            </div>
          ) : (
            <ThirdList onSubmit={this.handleSubmit} {...this.props} />
          )}
        </div>
      </Card>
    );
  }
}
