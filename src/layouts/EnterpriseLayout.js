import React, { Fragment, PureComponent } from "react";
import PropTypes from "prop-types";
import { Layout, Icon, message, notification } from "antd";
import DocumentTitle from "react-document-title";
import { connect } from "dva";
import { Route, Redirect, routerRedux } from "dva/router";
import { stringify } from "querystring";
import memoizeOne from "memoize-one";
import deepEqual from "lodash.isequal";

import { ContainerQuery } from "react-container-query";
import classNames from "classnames";
import { enquireScreen } from "enquire-js";
import GlobalHeader from "../components/GlobalHeader";
import SiderMenu from "../components/SiderMenu";
import pathToRegexp from "path-to-regexp";
import { PageLoading } from "@ant-design/pro-layout";
import globalUtil from "../utils/global";
import Authorized from "../utils/Authorized";
import { getMenuData } from "../common/enterpriseMenu";
import logo from "../../public/logo.png";
import Loading from "../components/Loading";
import GlobalRouter from "../components/GlobalRouter";
import AuthCompany from "../components/AuthCompany";
import Meiqia from "./Meiqia";
import Context from "./MenuContext";
import headerStype from "../components/GlobalHeader/index.less";

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
      showWelcomeCreateTeam: false,
      canCancelOpenRegion: true,
      market_info: "",
      showAuthCompany: false,
      enterpriseList: [],
      enterpriseInfo: {},
      ready: false
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
              enterpriseList: res.list,
              ready: true
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

  matchParamsPath = pathname => {
    const pathKey = Object.keys(this.breadcrumbNameMap).find(key => {
      return pathToRegexp(key).test(pathname);
    });
    return this.breadcrumbNameMap[pathKey];
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

  redirectEnterpriseView = () => {
    const { dispatch, currentUser, match: { params: { eid } } } = this.props;
    const { enterpriseList } = this.state;
    if (!eid || eid == "auto") {
      if (enterpriseList.length > 0) {
        let selectE = null;
        enterpriseList.map(item => {
          if (item.enterprise_id == currentUser.enterprise_id) {
            selectE = item;
          }
        });
        if (selectE == null) {
          selectE = enterpriseList[0];
        }
        this.setState({ enterpriseInfo: selectE });
        dispatch(
          routerRedux.replace(`/enterprise/${selectE.enterprise_id}/index`)
        );
      } else {
        dispatch(routerRedux.push("/user/login"));
      }
    } else {
      enterpriseList.map(item => {
        if (item.enterprise_id == eid) {
          this.setState({ enterpriseInfo: item });
          return;
        }
      });
    }
  };

  render() {
    const {
      currentUser,
      collapsed,
      location: { pathname },
      match: { params: { eid } },
      groups,
      children,
      rainbondInfo
    } = this.props;
    const { enterpriseList, enterpriseInfo, ready } = this.state;
    const queryString = stringify({
      redirect: window.location.href
    });
    if (!ready) {
      return <PageLoading />;
    }
    if (!currentUser || !rainbondInfo || enterpriseList.length === 0) {
      return <Redirect to={`/user/login?${queryString}`} />;
    }
    const customHeader = () => {
      return (
        <div className={headerStype.enterprise}>
          {enterpriseInfo && enterpriseInfo.enterprise_alias}
        </div>
      );
    };
    const layout = () => {
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
          <Layout>
            <GlobalHeader
              logo={logo}
              isPubCloud={
                rainbondInfo &&
                rainbondInfo.is_public !== undefined &&
                rainbondInfo.is_public
              }
              currentUser={currentUser}
              collapsed={collapsed}
              onCollapse={this.handleMenuCollapse}
              isMobile={this.state.isMobile}
              customHeader={customHeader}
            />
            <Layout style={{ flexDirection: "row" }}>
              <GlobalRouter
                enterpriseList={enterpriseList}
                title={
                  rainbondInfo &&
                  rainbondInfo.title !== undefined &&
                  rainbondInfo.title
                }
                currentUser={currentUser}
                Authorized={Authorized}
                menuData={getMenuData(eid)}
                showMenu={true}
                completeMenuData={getMenuData(eid)}
                location={location}
                isMobile={this.state.isMobile}
              />
              <Content
                key={eid}
                style={{
                  margin: "24px 24px 0",
                  height: "100%",
                  flex: "0 0 0 64px;"
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
