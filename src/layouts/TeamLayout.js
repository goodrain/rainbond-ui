import React, { Fragment } from 'react';
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
import userUtil from '../utils/user';
import globalUtil from '../utils/global';
import cookie from '../utils/cookie';
import Authorized from '../utils/Authorized';
import { getMenuData } from '../common/teamMenu';
import logo from '../../public/logo.png';
import GlobalRouter from '../components/GlobalRouter';
import Context from './MenuContext';

const qs = require('query-string');

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

class TeamLayout extends React.PureComponent {
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
      enterpriseView: false,
    };
  }

  componentDidMount() {
    this.getEnterpriseList()
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
  cancelOpenRegion = () => {
    this.setState({ openRegion: false, canCancelOpenRegion: true });
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

  getPageTitle = pathname => {
    const { rainbondInfo } = this.props;
    const title =
      (rainbondInfo &&
        rainbondInfo.title !== undefined &&
        rainbondInfo.title) ||
      'Rainbond | Serverless PaaS , A new generation of easy-to-use cloud management platforms based on kubernetes.';
    return title;
  };

  matchParamsPath = pathname => {
    const pathKey = Object.keys(this.breadcrumbNameMap).find(key =>
      pathToRegexp(key).test(pathname)
    );

    return this.breadcrumbNameMap[pathKey];
  };

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
      routerRedux.push(`/team/${key}/region/${currRegionName}/index`)
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
        `/team/${globalUtil.getCurrTeamName()}/region/${key}/index`
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

  handleInitTeamOk = () => {
    this.setState({ showWelcomeCreateTeam: false });
    this.fetchUserInfo();
  };
  handleCurrTeamNoRegion = () => {
    this.setState({ openRegion: true, canCancelOpenRegion: false });
  };
  handleOpenRegion = regions => {
    const { enterpriseList } = this.state;
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: 'teamControl/openRegion',
      payload: {
        team_name,
        region_names: regions.join(','),
      },
      callback: () => {
        notification.success({ message: '开通成功' });
        this.cancelOpenRegion();
        this.props.dispatch({
          type: 'user/fetchCurrent',
          callback: () => {
            this.props.dispatch(
              routerRedux.replace(
                `/team/${globalUtil.getCurrTeamName()}/region/${key}/index`
              )
            );
          },
        });
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

  render() {
    const {
      currentUser,
      collapsed,
      fetchingNotices,
      notices,
      children,
      location: { pathname },
      notifyCount,
      groups,
      nouse,
      rainbondInfo,
    } = this.props;
    const { enterpriseList, enterpriseView } = this.state;
    const { teamName, regionName } = this.props.match.params
    if (!teamName || !regionName){
      return <Redirect to={`/`} />;
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
      const team = userUtil.getTeamByTeamName(currentUser, teamName);
      const hasRegion = team && team.region && team.region.length;
      let region = null;
      let isRegionMaintain = false;
      if (hasRegion) {
        region = userUtil.hasTeamAndRegion(currentUser, teamName, regionName) || {};
        isRegionMaintain = region.region_status === '3' && !userUtil.isSystemAdmin(currentUser);
      }else{
        return <Redirect to={`/`} />;
      }
      const renderContent = () => {
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
          <div>
            <Authorized
              logined
              authority={['admin', 'user']}
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
              onTeamClick={this.handleTeamClick}
              onRegionClick={this.handleRegionClick}
              onNoticeVisibleChange={this.handleNoticeVisibleChange}
              currTeam={teamName}
              currRegion={regionName}
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
              <ContainerQuery key={teamName+regionName} query={query}>
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
  fetchingNotices: loading.effects['global/fetchNotices'],
  notices: global.notices,
  rainbondInfo: global.rainbondInfo,
  payTip: global.payTip,
  memoryTip: global.memoryTip,
  noMoneyTip: global.noMoneyTip,
  showAuthCompany: global.showAuthCompany,
  overviewInfo: index.overviewInfo,
  nouse: global.nouse,
}))(TeamLayout);
