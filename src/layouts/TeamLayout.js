import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { Layout, Icon, message, notification } from "antd";
import DocumentTitle from "react-document-title";
import { connect } from "dva";
import { Route, Redirect, routerRedux } from "dva/router";
import { PageLoading } from "@ant-design/pro-layout";
import memoizeOne from "memoize-one";
import SelectTeam from "../components/SelectTeam";
import SelectRegion from "../components/SelectRegion";
import SelectApp from "../components/SelectApp";
import { ContainerQuery } from "react-container-query";
import classNames from "classnames";
import { enquireScreen } from "enquire-js";
import GlobalHeader from "../components/GlobalHeader";
import SiderMenu from "../components/SiderMenu";
import userUtil from "../utils/user";
import globalUtil from "../utils/global";
import cookie from "../utils/cookie";
import Authorized from "../utils/Authorized";
import { getMenuData } from "../common/teamMenu";
import { getAppMenuData } from "../common/appMenu";
import logo from "../../public/logo.png";
import GlobalRouter from "../components/GlobalRouter";
import Context from "./MenuContext";
import headerStype from "../components/GlobalHeader/index.less";

const qs = require("query-string");

const { Content } = Layout;

const query = {
  "screen-xs": {
    maxWidth: 575
  },
  "screen-sm": {
    minWidth: 576,
    maxWidth: 767
  },
  "screen-md": {
    minWidth: 768,
    maxWidth: 991
  },
  "screen-lg": {
    minWidth: 992,
    maxWidth: 1199
  },
  "screen-xl": {
    minWidth: 1200
  }
};

let isMobile;
enquireScreen(b => {
  isMobile = b;
});

class TeamLayout extends React.PureComponent {
  static childContextTypes = {
    location: PropTypes.object,
    breadcrumbNameMap: PropTypes.object,
    currRegion: PropTypes.string,
    currTeam: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.getPageTitle = memoizeOne(this.getPageTitle);
    this.state = {
      isMobile,
      isInit: false,
      showWelcomeCreateTeam: false,
      canCancelOpenRegion: true,
      market_info: "",
      showAuthCompany: false,
      enterpriseList: [],
      ready: false,
      currentTeam: {},
      currentEnterprise: {},
      currentComponent: null,
      eid: "",
    };
  }

  componentDidMount() {
    this.getEnterpriseList();
  }

  // get enterprise list
  getEnterpriseList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/fetchEnterpriseList",
      callback: res => {
        if (res && res._code === 200) {
          this.setState(
            {
              enterpriseList: res.list
            },
            () => {
              this.getTeamOverview();
            }
          );
        }
      }
    });
  };
  getTeamOverview = () => {
    const { teamName, regionName } = this.props.match.params;
    this.props.dispatch({
      type: "global/getTeamOverview",
      payload: {
        team_name: teamName
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState(
            {
              eid: res.bean.eid
            },
            () => {
              this.load();
            }
          );
        }
      }
    });
  }
  load = () => {
    const { enterpriseList, eid } = this.state;
    const { currentUser, dispatch } = this.props;
    const { teamName, regionName } = this.props.match.params;
    const team = userUtil.getTeamByTeamName(currentUser, teamName);
    dispatch({type: "teamControl/fetchCurrentTeam", payload: team});
    const region = userUtil.hasTeamAndRegion(currentUser, teamName, regionName);
    enterpriseList.map(item => {
      if (eid == item.enterprise_id) {
        dispatch({type: "enterprise/fetchCurrentEnterprise", payload: item});
        this.setState({
          currentEnterprise: item,
          currentTeam: team,
          currentRegion: region,
          ready: true
        });
      }
    });
    enquireScreen(mobile => {
      this.setState({ isMobile: mobile });
    });
    this.setState({ showAuthCompany: this.props.showAuthCompany });
    const query = qs.parse(this.props.location.search);
    if (query && query.market_info) {
      this.setState({ market_info: query.market_info });
      this.setState({ showAuthCompany: true });
    }
    this.queryComponentDeatil();
  };

  queryComponentDeatil = () => {
    const { teamName } = this.props.match.params;
    const componentID = globalUtil.getComponentID();
    if (componentID) {
      this.props.dispatch({
        type: "appControl/fetchDetail",
        payload: {
          team_name: teamName,
          app_alias: componentID,
        },
        callback: appDetail => {
          this.setState({currentComponent: appDetail})
        }
      })
    }
  }

  getChildContext = () => {
    const { location } = this.props;
    return { location, breadcrumbNameMap: this.breadcrumbNameMap };
  };

  getPageTitle = pathname => {
    const { rainbondInfo } = this.props;
    const title =
      (rainbondInfo &&
        rainbondInfo.title !== undefined &&
        rainbondInfo.title) ||
      "Rainbond | Serverless PaaS , A new generation of easy-to-use cloud management platforms based on kubernetes.";
    return title;
  };

  handleMenuCollapse = collapsed => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/changeLayoutCollapsed",
      payload: collapsed
    });
  };

  getContext() {
    const { location } = this.props;
    return {
      location,
      breadcrumbNameMap: this.breadcrumbNameMap
    };
  }
  getMode(appID) {
    if (appID) {
      return "app";
    }
    return "team";
  }

  render() {
    const {
      currentUser,
      collapsed,
      children,
      location: { pathname },
      nouse,
      rainbondInfo
    } = this.props;
    const {
      enterpriseList,
      ready,
      currentEnterprise,
      currentTeam,
      currentRegion,
      currentComponent
    } = this.state;
    const { teamName, regionName } = this.props.match.params;

    // Parameters of the abnormal
    if (!teamName || !regionName) {
      return <Redirect to={`/`} />;
    }

    // The necessary data is loaded
    if (!ready) {
      return <PageLoading />;
    }

    if (teamName != currentTeam.team_name) {
      this.load();
    }
    let appID = globalUtil.getAppID();
    if (currentComponent) {
      appID = currentComponent.service.group_id;
    }
    const componentID = globalUtil.getComponentID();
    const mode = this.getMode(appID || componentID);
    const customHeader = () => {
      return (
        <div>
          <SelectTeam
            className={headerStype.select}
            teamName={teamName}
            currentEnterprise={currentEnterprise}
            currentTeam={currentTeam}
            currentRegion={currentRegion}
          />
          <SelectRegion
            className={headerStype.select}
            regionName={regionName}
            currentEnterprise={currentEnterprise}
            currentTeam={currentTeam}
            currentRegion={currentRegion}
          />
          {mode == "app" &&
            <SelectApp
              className={headerStype.select}
              teamName={teamName}
              currentEnterprise={currentEnterprise}
              currentTeam={currentTeam}
              currentRegion={currentRegion}
              currentAppID={appID}
            />}
        </div>
      );
    };
    let menuData = getMenuData(teamName, regionName);
    if (mode == "app") {
      menuData = getAppMenuData(teamName, regionName, appID);
    }
    const layout = () => {
      const team = userUtil.getTeamByTeamName(currentUser, teamName);
      const hasRegion =
        team && team.region && team.region.length && currentRegion;
      let isRegionMaintain = false;
      if (hasRegion) {
        isRegionMaintain =
          currentRegion.region_status === "3" &&
          !userUtil.isSystemAdmin(currentUser);
      } else {
        return <Redirect to={`/`} />;
      }
      const renderContent = () => {
        // 数据中心维护中
        if (isRegionMaintain || nouse) {
          return (
            <div style={{ textAlign: "center", padding: "200px 0" }}>
              <Icon
                style={{ fontSize: 40, marginBottom: 32, color: "red" }}
                type="warning"
              />
              <h1
                style={{
                  fontSize: 40,
                  color: "rgba(0, 0, 0, 0.65)",
                  marginBottom: 20
                }}
              >
                {nouse ? "当前授权已过期" : "数据中心维护中"}
              </h1>
              <p
                style={{
                  fontSize: 20
                }}
              >
                {nouse ? "请联系 010-64666786 获取更多商业服务。" : "请稍后访问当前数据中心"}
              </p>
            </div>
          );
        }

        return (
          <div>
            <Authorized
              logined
              authority={["admin", "user"]}
              noMatch={<Redirect to="/user/login" />}
            >
              {children}
            </Authorized>
          </div>
        );
      };
      return (
        <Layout>
          <SiderMenu
            enterpriseList={enterpriseList}
            currentUser={currentUser}
            logo={
              (rainbondInfo &&
                rainbondInfo.logo !== undefined &&
                rainbondInfo.logo) ||
              logo
            }
            Authorized={Authorized}
            collapsed={collapsed}
            location={location}
            isMobile={this.state.isMobile}
            onCollapse={this.handleMenuCollapse}
          />
          <GlobalRouter
            enterpriseList={enterpriseList}
            title={
              rainbondInfo &&
              rainbondInfo.title !== undefined &&
              rainbondInfo.title
            }
            currentUser={currentUser}
            Authorized={Authorized}
            collapsed={collapsed}
            location={location}
            isMobile={this.state.isMobile}
            onCollapse={this.handleMenuCollapse}
            menuData={menuData}
            completeMenuData={menuData}
          />
          <Layout>
            <GlobalHeader
              key={
                currentEnterprise.enterprise_id +
                currentTeam.team_name +
                currentRegion.team_region_name + 
                appID
              }
              logo={logo}
              isPubCloud={
                rainbondInfo &&
                rainbondInfo.is_public !== undefined &&
                rainbondInfo.is_public
              }
              currentUser={currentUser}
              collapsed={collapsed}
              isMobile={this.state.isMobile}
              customHeader={customHeader}
            />
            <Content
              style={{
                margin: "24px 24px 0",
                height: "100%"
              }}
            >
              {renderContent()}
            </Content>
          </Layout>
        </Layout>
      );
    };
    return (
      <Fragment>
        <DocumentTitle title={this.getPageTitle(pathname)}>
          <ContainerQuery key={teamName + regionName} query={query}>
            {params =>
              <Context.Provider value={this.getContext()}>
                <div className={classNames(params)}>
                  {layout()}
                </div>
              </Context.Provider>}
          </ContainerQuery>
        </DocumentTitle>
      </Fragment>
    );
  }
}

export default connect(({ user, global, index, loading }) => ({
  currentUser: user.currentUser,
  notifyCount: user.notifyCount,
  collapsed: global.collapsed,
  groups: global.groups,
  fetchingNotices: loading.effects["global/fetchNotices"],
  notices: global.notices,
  rainbondInfo: global.rainbondInfo,
  payTip: global.payTip,
  memoryTip: global.memoryTip,
  noMoneyTip: global.noMoneyTip,
  showAuthCompany: global.showAuthCompany,
  overviewInfo: index.overviewInfo,
  nouse: global.nouse
}))(TeamLayout);
