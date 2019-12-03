import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import { Card, Button } from "antd";
import rainbondUtil from "../../utils/rainbond";
import globalUtil from "../../utils/global";
// import { getGithubInfo } from "../../services/team";
import CodeGithubForm from "../../components/CodeGithubForm";
import ThirdList from "../../components/ThirdList";
import styles from "./Index.less";

@connect(({ user, groupControl, global }) => ({
  rainbondInfo: global.rainbondInfo
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      // 是否绑定了github仓库
      is_auth: false,
      // 绑定github的地址
      auth_url: "",
      // 代码分支及版本信息
      codeList: []
    };
  }
  componentDidMount() {
    const { rainbondInfo } = this.props;
    const type = this.setType();
    if (rainbondUtil.OauthbTypes(rainbondInfo, type)) {
      this.getGithubInfo(rainbondInfo, type);
    }
  }
  setType = () => {
    const { tabList, type } = this.props;
    let typs = "";
    tabList.map(item => {
      const { key, types } = item;
      if (type == key) {
        typs = types;
      }
    });
    return typs;
  };

  getGithubInfo = (rainbondInfo, type) => {
    let gitinfo = rainbondUtil.OauthbTypes(rainbondInfo, type);
    let is_auth = gitinfo ? true : false;
    this.setState({
      is_auth
    });
  };

  toAuth = () => {
    const { rainbondInfo } = this.props;
    const type = this.setType();
    let gitinfo = rainbondUtil.OauthbTypes(rainbondInfo, type);
    if (gitinfo) {
      location.href = `${gitinfo.auth_url}?response_type=code&client_id=${
        gitinfo.client_id
      }&redirect_uri=${rainbondInfo.redirect_uri}/console/oauth/redirect/${
        gitinfo.service_id
      }`;
    }
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
    const { is_auth } = this.state;
    const type = this.setType();
    return (
      <Card bordered={false} className={styles.ClearCard}>
        <div
        // style={{
        //   width:
        //     this.props.handleType && this.props.handleType === "Service"
        //       ? "auto"
        //       : "500px"
        // }}
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
                    <Button onClick={this.toAuth} type="primary">
                      点击绑定
                    </Button>,
                    false
                  )
                : !this.props.handleType && (
                    <Button
                      onClick={this.toAuth}
                      style={{
                        marginLeft: 20
                      }}
                      type="primary"
                    >
                      点击绑定
                    </Button>
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
