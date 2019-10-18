import React, { PureComponent } from "react";
import { connect } from "dva";
import { routerRedux, Link } from "dva/router";
import { Alert } from "antd";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import styles from "./Index.less";
import globalUtil from "../../utils/global";
import userUtil from "../../utils/user";
import rainbondUtil from "../../utils/rainbond";
import AppList from "./AppList";
import PluginList from "./PluginList";

@connect(({ user, global }) => ({
  currUser: user.currentUser,
  rainbondInfo: global.rainbondInfo
}))
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);

    const params = this.getParam();
    this.state = {
      isChecked: true,
      loading: false,
      currStep: 0,
      scope: params.type || "app"
    };
  }
  componentDidMount() {}
  getParam() {
    return this.props.match.params;
  }
  handleTakeInfo = () => {
    const { currUser } = this.props;
    this.setState(
      {
        currStep: 1
      },
      () => {
        window.open(
          `https://www.goodrain.com/spa/#/check-console/${
            currUser.enterprise_id
          }`
        );
      }
    );
  };
  handleAuthEnterprise = vals => {
    const { currUser } = this.props;
    this.props.dispatch({
      type: "global/authEnterprise",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        enterprise_id: currUser.enterprise_id,
        ...vals
      },
      callback: () => {
        this.props.dispatch({ type: "user/fetchCurrent" });
      }
    });
  };
  handleTabChange = key => {
    this.setState({ scope: key });
  };
  renderContent = () => {
    const { currUser } = this.props;
    const { loading, isChecked } = this.state;

    // 不是系统管理员
    if (
      !userUtil.isSystemAdmin(currUser) &&
      !userUtil.isCompanyAdmin(currUser)
    ) {
      this.props.dispatch(
        routerRedux.replace(
          `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/Exception/403`
        )
      );
      return null;
    }

    if (this.state.scope === "app") {
      return <AppList {...this.props} />;
    }

    // if (this.state.scope === 'plugin') {
    //   return <PluginList {...this.props} />;
    // }
  };
  render() {
    const { currUser, rainbondInfo } = this.props;
    const { loading } = this.state;

    const team_name = globalUtil.getCurrTeamName();

    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.content}>
          <div>
            将当前平台和云应用市场进行互联，同步应用，插件，数据中心等资源
          </div>
          <div>
            应用下载完成后，方可在{" "}
            <Link
              to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/market`}
            >
              从应用市场安装
            </Link>{" "}
            直接安装{" "}
          </div>
        </div>
      </div>
    );

    const tabList = [
      {
        key: "app",
        tab: "应用"
      }
      // {
      //   key: 'plugin',
      //   tab: '插件',
      // },
    ];

    return (
      <PageHeaderLayout
        tabList={tabList}
        tabActiveKey={this.state.scope}
        onTabChange={this.handleTabChange}
        content={pageHeaderContent}
      >
        <Alert
          showIcon
          message={`当前市场${rainbondUtil.appstoreImageHubEnable(
            rainbondInfo
          )}跨数据中心互联功能`}
          type="info"
        />
        {this.renderContent()}
      </PageHeaderLayout>
    );
  }
}
