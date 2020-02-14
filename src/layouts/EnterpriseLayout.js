import React, { Fragment, PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Layout, Icon, message, notification } from 'antd';
import DocumentTitle from 'react-document-title';
import { connect } from 'dva';
import { Route, Redirect, routerRedux } from 'dva/router';

import memoizeOne from 'memoize-one';
import deepEqual from 'lodash.isequal';

import { ContainerQuery } from 'react-container-query';
import classNames from 'classnames';
import { enquireScreen } from 'enquire-js';
import GlobalHeader from '../components/GlobalHeader';
import SiderMenu from '../components/SiderMenu';
import pathToRegexp from 'path-to-regexp';

// import NotFound from "../routes/Exception/404";
// import { getRoutes } from "../utils/utils";

import userUtil from '../utils/user';
import globalUtil from '../utils/global';
import configureGlobal from '../utils/configureGlobal';
import cookie from '../utils/cookie';
import Authorized from '../utils/Authorized';
import { getMenuData } from '../common/enterpriseMenu';
import logo from '../../public/logo.png';
import OpenRegion from '../components/OpenRegion';
import CreateTeam from '../components/CreateTeam';
import JoinTeam from '../components/JoinTeam';
import Loading from '../components/Loading';

import GlobalRouter from '../components/GlobalRouter';
import ChangePassword from '../components/ChangePassword';
import AuthCompany from '../components/AuthCompany';

import PublicLogin from '../components/Authorized/PublicLogin';

import InitTeamAndRegionData from './InitTeamAndRegionData';
import PayTip from './PayTip';
import MemoryTip from './MemoryTip';
import PayMoneyTip from './PayMoneyTip';
import Meiqia from './Meiqia';
import Context from './MenuContext';

const qs = require('query-string');

const { Content } = Layout;
// const { AuthorizedRoute } = Authorized;
const { check } = Authorized;

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
  'screen-xs': {
    maxWidth: 575,
  },
  'screen-sm': {
    minWidth: 576,
    maxWidth: 767,
  },
  'screen-md': {
    minWidth: 768,
    maxWidth: 991,
  },
  'screen-lg': {
    minWidth: 992,
    maxWidth: 1199,
  },
  'screen-xl': {
    minWidth: 1200,
  },
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
    currTeam: PropTypes.string,
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
      market_info: '',
      showAuthCompany: false,
      enterpriseList: [],
      enterpriseView: true,
      enterTrue: true,
    };
  }

  componentDidMount() {
    this.initRaindbondInfo();
  }

  initRaindbondInfo = () => {
    // 初始化 获取RainbondInfo信息
    this.props.dispatch({
      type: 'global/fetchRainbondInfo',
      callback: info => {
        if (info) {
          globalUtil.putLog(info);
          this.getEnterpriseList();
        }
      },
    });
  };

  // 获取企业列表
  getEnterpriseList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseList',
      callback: res => {
        if (res && res._code === 200) {
          this.setState(
            {
              enterpriseList: res.list,
            },
            () => {
              this.load();
            }
          );
        }
      },
    });
  };

  load = () => {
    enquireScreen(mobile => {
      this.setState({ isMobile: mobile });
    });
    this.fetchUserInfo();
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
      type: 'teamControl/createTeam',
      payload: values,
      callback: () => {
        notification.success({ message: '添加成功' });
        this.cancelCreateTeam();
        this.props.dispatch({ type: 'user/fetchCurrent' });
      },
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
      type: 'global/joinTeam',
      payload: values,
      callback: () => {
        notification.success({ message: '申请成功，请等待审核' });
        this.cancelJoinTeam();
      },
    });
  };
  getChildContext = () => {
    const { location } = this.props;
    return { location, breadcrumbNameMap: this.breadcrumbNameMap };
  };

  fetchUserInfo = () => {
    // 获取用户信息、保存团队和数据中心信息
    this.props.dispatch({
      type: 'user/fetchCurrent',
      callback: res => {
        const load = document.querySelector('#load');
        if (load) {
          load.style.display = 'none';
        }
      },
      handleError: res => {
        // if (res && (res.status === 403 || res.status === 404)) {
        //   cookie.remove('token');
        //   cookie.remove('token', { domain: '' });
        //   cookie.remove('newbie_guide');
        //   cookie.remove('platform_url');
        //   location.reload();
        // }
      },
    });
  };

  getPageTitle = pathname => {
    const { rainbondInfo } = this.props;
    const title =
      (rainbondInfo &&
        rainbondInfo.title !== undefined &&
        rainbondInfo.title) ||
      'Rainbond | Serverless PaaS , A new generation of easy-to-use cloud management platforms based on kubernetes.';
    // const currRouterData = this.matchParamsPath(pathname);
    // if (!currRouterData) {
    //   return `${currRouterData} - ${title}`;
    // }
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
      type: 'global/changeLayoutCollapsed',
      payload: collapsed,
    });
  };
  handleNoticeClear = type => {
    message.success(`清空了${type}`);
    const { dispatch } = this.props;
    dispatch({ type: 'global/clearNotices', payload: type });
  };
  handleMenuClick = ({ key }) => {
    const { dispatch } = this.props;

    if (key === 'cpw') {
      this.showChangePass();
    }
    if (key === 'logout') {
      cookie.remove('token', { domain: '' });
      cookie.remove('team', { domain: '' });
      cookie.remove('region_name', { domain: '' });
      dispatch({ type: 'user/logout' });
    }
  };
  handleNoticeVisibleChange = visible => {
    const { dispatch } = this.props;
    if (visible) {
      dispatch({ type: 'global/fetchNotices' });
    }
  };
  handleTeamClick = ({ key }) => {
    if (key === 'createTeam') {
      this.onCreateTeam();
      return;
    }
    if (key === 'joinTeam') {
      this.onJoinTeam();
      return;
    }

    cookie.set('team', key);
    const currentUser = this.props.currentUser;
    let currRegionName = globalUtil.getCurrRegionName();
    const currTeam = userUtil.getTeamByTeamName(currentUser, key);

    if (currTeam) {
      const regions = currTeam.region || [];
      if (!regions.length) {
        notification.warning({ message: '该团队下无可用数据中心!' });
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
      routerRedux.push(
        `/enterprise/${enterpriseList[0].enterprise_id}/index`
        // `/team/${key}/region/${currRegionName}/enterprise`
      )
    );
    // location.reload();
  };

  handleRegionClick = ({ key }) => {
    if (key === 'openRegion') {
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
      type: 'user/changePass',
      payload: {
        ...vals,
      },
      callback: () => {
        notification.success({ message: '修改成功，请重新登录' });
      },
    });
  };

  getContext() {
    const { location } = this.props;
    return {
      location,
      breadcrumbNameMap: this.breadcrumbNameMap,
    };
  }


    // 判断是否是企业视图
    isEnterpriseView = () => {
      const {
        dispatch,
      } = this.props;
      const {enterpriseList,enterTrue,enterpriseView} =this.state

      const eid = globalUtil.getCurrEnterpriseId();
      if (enterpriseView && enterTrue&& !eid) {
        dispatch(
          routerRedux.replace(
            `/enterprise/${enterpriseList[0].enterprise_id}/index`
          )
        );
        this.setState({
          enterTrue:false
        })
        return false;
      }
      return false;
    };

  render() {
    const {
      currentUser,
      collapsed,
      fetchingNotices,
      notices,
      // routerData,
      // match,
      // location,
      children,
      location: { pathname },
      notifyCount,
      currTeam,
      currRegion,
      groups,
      nouse,
      rainbondInfo,
    } = this.props;
    const { enterpriseList, enterpriseView, enterTrue } = this.state;

    const currRouterData = this.matchParamsPath(pathname);

    const token = cookie.get('token');

    if (!rainbondInfo && !token) {
      this.props.dispatch(routerRedux.push('/user/login'));
      return null;
    }


    if (!currentUser || !rainbondInfo || enterpriseList.length === 0) return null;

    if (this.isEnterpriseView()) {
      return null;
    }

    /**
     * 根据菜单取得重定向地址.
     */
    const redirectData = [];
    const getRedirect = item => {
      if (item && item.children) {
        if (item.children[0] && item.children[0].path) {
          redirectData.push({
            from: `/${item.path}`,
            to: `/${item.children[0].path}`,
          });
          item.children.forEach(children => {
            getRedirect(children);
          });
        }
      }
    };
    getMenuData().forEach(getRedirect);

    const layout = () => {
      const team = userUtil.getTeamByTeamName(
        currentUser,
        globalUtil.getCurrTeamName()
      );
      const hasRegion = !!(team && team.region && team.region.length);
      let region = null;
      let isRegionMaintain = false;
      if (hasRegion) {
        region =
          userUtil.hasTeamAndRegion(currentUser, currTeam, currRegion) || {};

        isRegionMaintain =
          region.region_status === '3' && !userUtil.isSystemAdmin(currentUser);
      }

      const renderContent = () => {
        const { children } = this.props;

        // 数据中心维护中
        if (isRegionMaintain || nouse) {
          return (
            <div style={{ textAlign: 'center', padding: '200px 0' }}>
              <Icon
                style={{ fontSize: 40, marginBottom: 32, color: 'red' }}
                type="warning"
              />
              <h1
                style={{
                  fontSize: 40,
                  color: 'rgba(0, 0, 0, 0.65)',
                  marginBottom: 20,
                }}
              >
                {nouse ? '当前授权已过期' : '数据中心维护中'}
              </h1>
              <p
                style={{
                  fontSize: 20,
                }}
              >
                {nouse
                  ? '请联系 010-64666786 获取更多商业服务。'
                  : '请稍后访问当前数据中心'}
              </p>
            </div>
          );
        }

        return (
          <Authorized
            logined
            // authority={children.props.route.authority}
            authority={['admin', 'user']}
            noMatch={<Redirect to="/user/login" />}
          >
            {children}
          </Authorized>
        );
      };
      return (
        <Layout>
          {/* {!isRegionMaintain && hasRegion && ( */}
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
          {/* )} */}
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
              onTeamClick={this.handleTeamClick}
              onRegionClick={this.handleRegionClick}
              onNoticeVisibleChange={this.handleNoticeVisibleChange}
              currTeam={currTeam}
              currRegion={currRegion}
            />
            <Content
              style={{
                margin: '24px 24px 0',
                height: '100%',
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
            <ContainerQuery query={query}>
              {params => (
                <Context.Provider value={this.getContext()}>
                  <div className={classNames(params)}>{layout()}</div>
                </Context.Provider>
              )}
            </ContainerQuery>
        </DocumentTitle>

        {/* 创建团队 */}
        {/* {this.state.createTeam && (
          <CreateTeam
            onOk={this.handleCreateTeam}
            onCancel={this.cancelCreateTeam}
          />
        )} */}

        {/* 加入团队 */}
        {/* {this.state.joinTeam && (
          <JoinTeam onOk={this.handleJoinTeam} onCancel={this.cancelJoinTeam} />
        )} */}
        {/* 修改密码 */}
        {this.state.showChangePassword && (
          <ChangePassword
            onOk={this.handleChangePass}
            onCancel={this.cancelChangePass}
          />
        )}

        <Loading />

        {rainbondInfo &&
          rainbondInfo.is_public !== undefined &&
          rainbondInfo.is_public && <Meiqia />}
        {/* 企业尚未认证 */}
        {(this.props.showAuthCompany || this.state.showAuthCompany) && (
          <AuthCompany
            market_info={this.state.market_info}
            onOk={() => {
              this.setState({ showAuthCompany: false });
              const jumpPath = this.props.location.pathname;
              const query = this.props.location.search.replace(
                `market_info=${this.state.market_info}`,
                ''
              );
              this.setState({ market_info: '' });
              this.props.dispatch(routerRedux.replace(jumpPath + query));
            }}
          />
        )}
      </Fragment>
    );
  }
}
export default connect(({ user, global, index, loading }) => ({
  currentUser: user.currentUser,
  notifyCount: user.notifyCount,
  collapsed: global.collapsed,
  groups: global.groups,
  fetchingNotices: loading.effects['global/fetchNotices'],
  notices: global.notices,
  currTeam: globalUtil.getCurrTeamName(),
  currRegion: globalUtil.getCurrRegionName(),
  rainbondInfo: global.rainbondInfo,
  payTip: global.payTip,
  memoryTip: global.memoryTip,
  noMoneyTip: global.noMoneyTip,
  showAuthCompany: global.showAuthCompany,
  overviewInfo: index.overviewInfo,
  nouse: global.nouse,
}))(EnterpriseLayout);
