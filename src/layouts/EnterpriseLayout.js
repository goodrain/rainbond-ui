import React, { Fragment, PureComponent } from "react";
import PropTypes from "prop-types";
import { Layout, Icon, message, notification } from "antd";
import DocumentTitle from "react-document-title";
import { connect } from "dva";
import { Route, Redirect, routerRedux } from "dva/router";

import memoizeOne from "memoize-one";
import deepEqual from "lodash.isequal";

import { ContainerQuery } from "react-container-query";
import classNames from "classnames";
import { enquireScreen } from "enquire-js";
import GlobalHeader from "../components/GlobalHeader";
import SiderMenu from "../components/SiderMenu";
import pathToRegexp from "path-to-regexp";
import userUtil from "../utils/user";
import globalUtil from "../utils/global";
import cookie from "../utils/cookie";
import Authorized from "../utils/Authorized";
import { getMenuData } from "../common/enterpriseMenu";
import logo from "../../public/logo.png";
import Loading from "../components/Loading";
import GlobalRouter from "../components/GlobalRouter";
import ChangePassword from "../components/ChangePassword";
import AuthCompany from "../components/AuthCompany";
import Meiqia from "./Meiqia";
import Context from "./MenuContext";

const qs = require("query-string");

const { Content } = Layout;

const getBreadcrumbNameMap = memoizeOne(meun => {
  const routerMap = {};
  const mergeMeunAndRouter = meunData => {
    meunData.forEach(meunItem => {
      if (meunItem.children) {
        mergeMeunAndRouter(meunItem.children);
      }
      // Reduce memory usage
      routerMap[meunItem.path] = meunItem;
    });
  };
  mergeMeunAndRouter(meun);
  return routerMap;
}, deepEqual);

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

class EnterpriseLayout extends PureComponent {
  static childContextTypes = {
    location: PropTypes.object,
    breadcrumbNameMap: PropTypes.object,
    currRegion: PropTypes.string,
    currTeam: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.getPageTitle = memoizeOne(this.getPageTitle);
    this.breadcrumbNameMap = getBreadcrumbNameMap(
      getMenuData(this.props.groups)
    );
    this.state = {
      isMobile,
      isInit: false,
      openRegion: false,
      createTeam: false,
      joinTeam: false,
      showChangePassword: false,
      showWelcomeCreateTeam: false,
      canCancelOpenRegion: true,
      market_info: "",
      showAuthCompany: false,
      enterpriseList: []
    };
  }

  componentDidMount() {
    //fetch enterprise info
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
              this.redirectEnterpriseView();
              this.load();
            }
          );
        }
      }
    });
  };

  load = () => {
    enquireScreen(mobile => {
      this.setState({ isMobile: mobile });
    });
    // 连接云应用市场
    this.setState({ showAuthCompany: this.props.showAuthCompany });
    const query = qs.parse(this.props.location.search);
    if (query && query.market_info) {
      this.setState({ market_info: query.market_info });
      this.setState({ showAuthCompany: true });
    }
  };

  onOpenRegion = () => {
    this.setState({ openRegion: true });
  };

  onCreateTeam = () => {
    this.setState({ createTeam: true });
  };
  cancelCreateTeam = () => {
    this.setState({ createTeam: false });
  };
  handleCreateTeam = values => {
    this.props.dispatch({
      type: "teamControl/createTeam",
      payload: values,
      callback: () => {
        notification.success({ message: "添加成功" });
        this.cancelCreateTeam();
        this.props.dispatch({ type: "user/fetchCurrent" });
      }
    });
  };
  onJoinTeam = () => {
    this.setState({ joinTeam: true });
  };
  cancelJoinTeam = () => {
    this.setState({ joinTeam: false });
  };
  handleJoinTeam = values => {
    this.props.dispatch({
      type: "global/joinTeam",
      payload: values,
      callback: () => {
        notification.success({ message: "申请成功，请等待审核" });
        this.cancelJoinTeam();
      }
    });
  };
  getChildContext = () => {
    const { location } = this.props;
    return { location, breadcrumbNameMap: this.breadcrumbNameMap };
  };

  fetchUserInfo = callback => {
    // get login user info
    this.props.dispatch({
      type: "user/fetchCurrent",
      callback: res => {
        const load = document.querySelector("#load");
        if (load) {
          load.style.display = "none";
        }
        if (callback) {
          callback();
        }
      },
      handleError: res => {
        if (res && (res.status === 403 || res.status === 404)) {
          cookie.remove("token");
          cookie.remove("token", { domain: "" });
          cookie.remove("newbie_guide");
          cookie.remove("platform_url");
          location.reload();
        }
      }
    });
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

  matchParamsPath = pathname => {
    const pathKey = Object.keys(this.breadcrumbNameMap).find(key => {
      return pathToRegexp(key).test(pathname);
    });
    return this.breadcrumbNameMap[pathKey];
  };

  // getBaseRedirect = () => {
  //   // According to the url parameter to redirect 这里是重定向的,重定向到 url 的 redirect 参数所示地址
  //   const urlParams = new URL(window.location.href);

  //   const redirect = urlParams.searchParams.get('redirect');
  //   const oauth = urlParams.searchParams.get('oauth');
  //   const { enterpriseList } = this.state;

  //   // Remove the parameters in the url
  //   if (oauth) {
  //     window.history.replaceState(null, 'oauth', urlParams.href);
  //   }
  //   if (redirect) {
  //     urlParams.searchParams.delete('redirect');
  //     window.history.replaceState(null, 'redirect', urlParams.href);
  //   } else {
  //     return `/enterprise${enterpriseList[0].enterprise_id}/index`;
  //   }
  //   return redirect;
  // };

  handleMenuCollapse = collapsed => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/changeLayoutCollapsed",
      payload: collapsed
    });
  };
  handleNoticeClear = type => {
    message.success(`清空了${type}`);
    const { dispatch } = this.props;
    dispatch({ type: "global/clearNotices", payload: type });
  };
  handleMenuClick = ({ key }) => {
    const { dispatch } = this.props;

    if (key === "cpw") {
      this.showChangePass();
    }
    if (key === "logout") {
      cookie.remove("token", { domain: "" });
      cookie.remove("team", { domain: "" });
      cookie.remove("region_name", { domain: "" });
      dispatch({ type: "user/logout" });
    }
  };
  handleNoticeVisibleChange = visible => {
    const { dispatch } = this.props;
    if (visible) {
      dispatch({ type: "global/fetchNotices" });
    }
  };
  handleTeamClick = ({ key }) => {
    if (key === "createTeam") {
      this.onCreateTeam();
      return;
    }
    if (key === "joinTeam") {
      this.onJoinTeam();
      return;
    }

    cookie.set("team", key);
    const currentUser = this.props.currentUser;
    let currRegionName = globalUtil.getCurrRegionName();
    const currTeam = userUtil.getTeamByTeamName(currentUser, key);

    if (currTeam) {
      const regions = currTeam.region || [];
      if (!regions.length) {
        notification.warning({ message: "该团队下无可用数据中心!" });
        return;
      }
      const selectRegion = regions.filter(
        item => item.team_region_name === currRegionName
      )[0];
      const selectRegionName = selectRegion
        ? selectRegion.team_region_name
        : regions[0].team_region_name;
      currRegionName = selectRegionName;
    }
    const { enterpriseList } = this.state;
    this.props.dispatch(
      routerRedux.push(`/enterprise/${enterpriseList[0].enterprise_id}/index`)
    );
    // location.reload();
  };

  handleRegionClick = ({ key }) => {
    if (key === "openRegion") {
      this.onOpenRegion();
      return;
    }
    const { enterpriseList } = this.state;
    this.props.dispatch(
      routerRedux.push(
        `/enterprise/${enterpriseList[0].enterprise_id}/index`
        // `/team/${globalUtil.getCurrTeamName()}/region/${key}/enterprise`
      )
    );
    // location.reload();
  };
  showChangePass = () => {
    this.setState({ showChangePassword: true });
  };
  cancelChangePass = () => {
    this.setState({ showChangePassword: false });
  };
  handleChangePass = vals => {
    this.props.dispatch({
      type: "user/changePass",
      payload: {
        ...vals
      },
      callback: () => {
        notification.success({ message: "修改成功，请重新登录" });
      }
    });
  };

  getContext() {
    const { location } = this.props;
    return {
      location,
      breadcrumbNameMap: this.breadcrumbNameMap
    };
  }

  redirectEnterpriseView = () => {
    const { dispatch, match: { params: { eid } } } = this.props;
    const { enterpriseList } = this.state;
    if (!eid) {
      if (enterpriseList.length > 0) {
        dispatch(
          routerRedux.replace(
            `/enterprise/${enterpriseList[0].enterprise_id}/index`
          )
        );
      } else {
        dispatch(routerRedux.push("/user/login"));
      }
    }
  };

  render() {
    const {
      currentUser,
      collapsed,
      fetchingNotices,
      notices,
      location: { pathname },
      match: { params: { eid } },
      notifyCount,
      groups,
      children,
      rainbondInfo
    } = this.props;
    const { enterpriseList } = this.state;

    if (!currentUser || !rainbondInfo || enterpriseList.length === 0)
      return null;

    const layout = () => {
      return (
        <Layout>
          <SiderMenu
            enterpriseList={enterpriseList}
            title={
              rainbondInfo &&
              rainbondInfo.title !== undefined &&
              rainbondInfo.title
            }
            currentUser={currentUser}
            logo={
              (rainbondInfo &&
                rainbondInfo.logo !== undefined &&
                rainbondInfo.logo) ||
              logo
            }
            Authorized={Authorized}
            menuData={getMenuData(groups)}
            completeMenuData={getMenuData(groups, true)}
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
            menuData={getMenuData(groups)}
            completeMenuData={getMenuData(groups, true)}
            collapsed={collapsed}
            location={location}
            isMobile={this.state.isMobile}
            onCollapse={this.handleMenuCollapse}
          />
          <Layout>
            <GlobalHeader
              logo={logo}
              isPubCloud={
                rainbondInfo &&
                rainbondInfo.is_public !== undefined &&
                rainbondInfo.is_public
              }
              notifyCount={notifyCount}
              currentUser={currentUser}
              fetchingNotices={fetchingNotices}
              notices={notices}
              collapsed={collapsed}
              isMobile={this.state.isMobile}
              onNoticeClear={this.handleNoticeClear}
              onCollapse={this.handleMenuCollapse}
              onMenuClick={this.handleMenuClick}
              onNoticeVisibleChange={this.handleNoticeVisibleChange}
            />
            <Content
              key={eid}
              style={{
                margin: "24px 24px 0",
                height: "100%"
              }}
            >
              <Authorized
                logined
                // authority={children.props.route.authority}
                authority={["admin", "user"]}
                noMatch={<Redirect to="/user/login" />}
              >
                {children}
              </Authorized>
            </Content>
          </Layout>
        </Layout>
      );
    };

    return (
      <Fragment>
        <DocumentTitle title={this.getPageTitle(pathname)}>
          <ContainerQuery query={query}>
            {params =>
              <Context.Provider value={this.getContext()}>
                <div className={classNames(params)}>
                  {layout()}
                </div>
              </Context.Provider>}
          </ContainerQuery>
        </DocumentTitle>
        {/* 修改密码 */}
        {this.state.showChangePassword &&
          <ChangePassword
            onOk={this.handleChangePass}
            onCancel={this.cancelChangePass}
          />}

        <Loading />

        {rainbondInfo &&
          rainbondInfo.is_public !== undefined &&
          rainbondInfo.is_public &&
          <Meiqia />}
        {/* 企业尚未认证 */}
        {(this.props.showAuthCompany || this.state.showAuthCompany) &&
          <AuthCompany
            market_info={this.state.market_info}
            onOk={() => {
              this.setState({ showAuthCompany: false });
              const jumpPath = this.props.location.pathname;
              const query = this.props.location.search.replace(
                `market_info=${this.state.market_info}`,
                ""
              );
              this.setState({ market_info: "" });
              this.props.dispatch(routerRedux.replace(jumpPath + query));
            }}
          />}
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
  currTeam: globalUtil.getCurrTeamName(),
  currRegion: globalUtil.getCurrRegionName(),
  rainbondInfo: global.rainbondInfo,
  payTip: global.payTip,
  memoryTip: global.memoryTip,
  noMoneyTip: global.noMoneyTip,
  showAuthCompany: global.showAuthCompany,
  overviewInfo: index.overviewInfo,
  nouse: global.nouse
}))(EnterpriseLayout);
