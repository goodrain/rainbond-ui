/* eslint-disable no-underscore-dangle */
/* eslint-disable array-callback-return */
/* eslint-disable class-methods-use-this */
/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/sort-comp */
/* eslint-disable no-nested-ternary */
import { Icon, Layout, notification } from 'antd';
import classNames from 'classnames';
import { connect } from 'dva';
import { Redirect, routerRedux } from 'dva/router';
import { enquireScreen } from 'enquire-js';
import PropTypes from 'prop-types';
import { Fragment, PureComponent } from 'react';
import { ContainerQuery } from 'react-container-query';
import DocumentTitle from 'react-document-title';
import logo from '../../public/logo.png';
import { getAppMenuData } from '../common/appMenu';
import { getMenuData } from '../common/teamMenu';
import AuthCompany from '../components/AuthCompany';
import GlobalHeader from '../components/GlobalHeader';
import GlobalRouter from '../components/GlobalRouter';
import PageLoading from '../components/PageLoading';
import ServiceOrder from '../components/ServiceOrder';
import SiderMenu from '../components/SiderMenu';
import Authorized from '../utils/Authorized';
import cookie from '../utils/cookie';
import globalUtil from '../utils/global';
import rainbondUtil from '../utils/rainbond';
import roleUtil from '../utils/role';
import userUtil from '../utils/user';
import AppHeader from './components/AppHeader';
import TeamHeader from './components/TeamHeader';
import MemoryTip from './MemoryTip';
import Context from './MenuContext';

const { Content } = Layout;

const query = {
  'screen-xs': {
    maxWidth: 575
  },
  'screen-sm': {
    minWidth: 576,
    maxWidth: 767
  },
  'screen-md': {
    minWidth: 768,
    maxWidth: 991
  },
  'screen-lg': {
    minWidth: 992,
    maxWidth: 1199
  },
  'screen-xl': {
    minWidth: 1200
  }
};

let isMobile;
enquireScreen(b => {
  isMobile = b;
});

class TeamLayout extends PureComponent {
  static childContextTypes = {
    location: PropTypes.object,
    breadcrumbNameMap: PropTypes.object,
    currRegion: PropTypes.string,
    currTeam: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.state = {
      isMobile,
      enterpriseList: [],
      ready: false,
      currentTeam: false,
      currentEnterprise: false,
      currentComponent: null,
      eid: '',
      teamView: true
    };
  }

  componentWillMount() {
    this.getEnterpriseList();
  }

  // get enterprise list
  getEnterpriseList = () => {
    const { dispatch, currentUser } = this.props;

    dispatch({
      type: 'global/fetchEnterpriseList',
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              enterpriseList: res.list
            },
            () => {
              if (currentUser) {
                return this.getTeamOverview(currentUser.user_id);
              }
              // 获取最新的用户信息
              this.fetchUserInfo();
            }
          );
        }
      }
    });
  };
  upData = () => {
    this.fetchUserInfo();
  };

  fetchUserInfo = () => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.props.match.params;
    if (teamName && regionName) {
      dispatch({
        type: 'user/fetchCurrent',
        callback: res => {
          if (res && res.status_code === 200) {
            this.getTeamOverview(res.bean && res.bean.user_id);
          }
        }
      });
    }
    return null;
  };

  getTeamOverview = () => {
    const { dispatch } = this.props;
    const { enterpriseList } = this.state;
    const { teamName, regionName } = this.props.match.params;
    cookie.set('team_name', teamName);
    cookie.set('region_name', regionName);
    dispatch({
      type: 'global/getTeamOverview',
      payload: {
        team_name: teamName,
        region_name: regionName
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState(
            {
              eid: res.bean.eid
            },
            () => {
              this.load();
            }
          );
        }
      },
      handleError: err => {
        if (err && err.data && err.data.code) {
          const errtext =
            err.data.code === 10411
              ? '当前集群不可用'
              : err.data.code === 10412
              ? '当前集群不存在'
              : false;
          if (errtext && enterpriseList.length > 0) {
            notification.warning({ message: errtext });
            dispatch(
              routerRedux.replace(
                `/enterprise/${enterpriseList[0].enterprise_id}/index`
              )
            );
          } else {
            notification.warning({ message: '请求错误' });
          }
        }
      }
    });
  };

  loadPermissions = (ID, teamName, regionName) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/fetchTeamUserPermissions',
      payload: { user_id: ID, team_name: teamName },
      callback: res => {
        if (res && res.status_code === 200) {
          const results = roleUtil.queryTeamUserPermissionsInfo(
            res.bean,
            'teamBasicInfo',
            'describe'
          );
          this.setState({ teamView: results });
          if (!results) {
            dispatch(
              routerRedux.replace(
                `/team/${teamName}/region/${regionName}/exception/403`
              )
            );
          }
        }
      }
    });
  };

  load = () => {
    const { enterpriseList, eid } = this.state;
    const { currentUser, dispatch } = this.props;
    const { teamName, regionName } = this.props.match.params;
    const team = userUtil.getTeamByTeamName(currentUser, teamName);
    dispatch({
      type: 'teamControl/fetchFeatures',
      payload: { team_name: teamName, region_name: regionName }
    });
    dispatch({ type: 'teamControl/fetchCurrentTeam', payload: team });
    dispatch({
      type: 'teamControl/fetchCurrentTeamPermissions',
      payload: team && team.tenant_actions
    });

    dispatch({
      type: 'teamControl/fetchCurrentRegionName',
      payload: { currentRegionName: regionName }
    });
    dispatch({
      type: 'region/fetchProtocols',
      payload: { team_name: teamName, region_name: regionName }
    });
    const region = userUtil.hasTeamAndRegion(currentUser, teamName, regionName);
    enterpriseList.map(item => {
      if (eid === item.enterprise_id) {
        dispatch({ type: 'enterprise/fetchCurrentEnterprise', payload: item });
        this.setState({
          currentEnterprise: item,
          currentTeam: team,
          currentRegion: region,
          ready: true
        });
      }
    });
    this.fetchEnterpriseInfo(eid);
    this.fetchTeamApps();
    enquireScreen(mobile => {
      this.setState({ isMobile: mobile });
    });
    // 连接云应用市场
    this.queryComponentDeatil();
    this.handleUpDataHeader();
  };
  handleUpDataHeader = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/IsUpDataHeader',
      payload: { isUpData: false }
    });
  };
  queryComponentDeatil = () => {
    const { teamName } = this.props.match.params;
    const componentID = globalUtil.getComponentID();
    if (componentID) {
      this.props.dispatch({
        type: 'appControl/fetchDetail',
        payload: {
          team_name: teamName,
          app_alias: componentID
        },
        callback: appDetail => {
          this.setState({ currentComponent: appDetail.service });
        },
        handleError: data => {
          if (data.status) {
            if (data.status === 404) {
              this.props.dispatch(
                routerRedux.push(
                  `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/exception/404`
                )
              );
            }
          }
        }
      });
    }
  };

  fetchTeamApps = () => {
    const { teamName, regionName } = this.props.match.params;
    this.props.dispatch({
      type: 'global/fetchGroups',
      payload: {
        team_name: teamName,
        region_name: regionName
      }
    });
  };

  fetchEnterpriseInfo = eid => {
    if (!eid) {
      return null;
    }
    // this.fetchEnterpriseService(eid);
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseInfo',
      payload: {
        enterprise_id: eid
      }
    });
  };

  fetchEnterpriseService = eid => {
    const { dispatch } = this.props;
    dispatch({
      type: 'order/fetchEnterpriseService',
      payload: {
        enterprise_id: eid
      }
    });
  };

  getChildContext = () => {
    const { location } = this.props;
    return { location, breadcrumbNameMap: this.breadcrumbNameMap };
  };

  handleMenuCollapse = collapsed => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/changeLayoutCollapsed',
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
      return 'app';
    }
    return 'team';
  }

  render() {
    const {
      memoryTip,
      currentUser,
      // enterpriseServiceInfo,
      collapsed,
      children,
      location,
      location: { pathname },
      nouse,
      rainbondInfo,
      enterprise,
      orders,
      upDataHeader,
      showAuthCompany,
      currentTeamPermissionsInfo
    } = this.props;
    const {
      enterpriseList,
      ready,
      currentEnterprise,
      currentTeam,
      currentRegion,
      currentComponent,
      teamView
    } = this.state;

    const { teamName, regionName } = this.props.match.params;
    const autoWidth = collapsed ? 'calc(100% - 416px)' : 'calc(100% - 116px)';
    // Parameters of the abnormal
    if (!teamName || !regionName) {
      return <Redirect to="/" />;
    }
    // The necessary data is loaded
    if (
      !ready ||
      !currentEnterprise ||
      !currentTeam ||
      !currentTeamPermissionsInfo
    ) {
      return <PageLoading />;
    }
    if (
      teamName !== currentTeam.team_name ||
      regionName !== (currentRegion && currentRegion.team_region_name)
    ) {
      this.load();
    }
    if (upDataHeader) {
      this.upData();
    }
    cookie.set('team_name', teamName);
    cookie.set('region_name', regionName);
    const componentID = globalUtil.getComponentID();
    const BillingFunction = rainbondUtil.isEnableBillingFunction();
    let appID = globalUtil.getAppID();
    // currentComponent is exit and id is current componentID
    if (currentComponent && currentComponent.service_alias == componentID) {
      appID = currentComponent.group_id;
      // Refresh the component information
    } else if (componentID) {
      this.queryComponentDeatil();
      return <PageLoading />;
    } else {
      this.setState({ currentComponent: null });
    }

    const mode = this.getMode(appID || componentID);
    // const nobleIcon = (
    //   <Tooltip
    //     title={
    //       enterpriseServiceInfo.type === "vip"
    //         ? "尊贵的付费企业用户"
    //         : "免费用户"
    //     }
    //   >
    //     {globalUtil.fetchSvg(enterpriseServiceInfo.type)}
    //   </Tooltip>
    // );

    const customHeader = () => {
      if (mode == 'team') {
        return (
          <TeamHeader
            nobleIcon={BillingFunction}
            teamName={teamName}
            currentEnterprise={currentEnterprise}
            currentTeam={currentTeam}
            currentRegion={currentRegion}
            regionName={regionName}
            upDataHeader={upDataHeader}
          />
        );
      }
      return (
        <AppHeader
          teamName={teamName}
          currentEnterprise={currentEnterprise}
          currentTeam={currentTeam}
          currentRegion={currentRegion}
          regionName={regionName}
          appID={appID}
          nobleIcon={BillingFunction}
          currentComponent={currentComponent}
          componentID={componentID}
          upDataHeader={upDataHeader}
        />
      );
    };
    let menuData = getMenuData(
      teamName,
      regionName,
      currentTeam.tenant_actions
    );
    if (mode === 'app') {
      menuData = getAppMenuData(
        teamName,
        regionName,
        appID,
        currentTeam.tenant_actions
      );
    }
    const fetchLogo = rainbondUtil.fetchLogo(rainbondInfo, enterprise) || logo;
    const layout = () => {
      const team = userUtil.getTeamByTeamName(currentUser, teamName);
      const hasRegion =
        team && team.region && team.region.length && currentRegion;
      let isRegionMaintain = false;
      if (hasRegion) {
        isRegionMaintain =
          currentRegion.region_status === '3' &&
          !userUtil.isCompanyAdmin(currentUser);
      } else {
        return <Redirect to="/" />;
      }
      const renderContent = () => {
        // 集群维护中
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
                  marginBottom: 20
                }}
              >
                {nouse ? '当前授权已过期' : '集群维护中'}
              </h1>
              <p
                style={{
                  fontSize: 20
                }}
              >
                {nouse
                  ? '请联系 010-64666786 获取更多商业服务。'
                  : '请稍后访问当前集群'}
              </p>
            </div>
          );
        }

        return (
          <div style={{ height: '100%' }}>
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
            currentEnterprise={currentEnterprise}
            currentTeam={currentTeam}
            currentUser={currentUser}
            logo={fetchLogo}
            Authorized={Authorized}
            collapsed={collapsed}
            location={location}
            isMobile={this.state.isMobile}
            onCollapse={this.handleMenuCollapse}
          />
          <Layout>
            <GlobalHeader
              key={
                currentEnterprise.enterprise_id +
                currentTeam.team_name +
                currentRegion.team_region_name +
                appID
              }
              eid={currentEnterprise.enterprise_id}
              logo={fetchLogo}
              isPubCloud={
                rainbondInfo &&
                rainbondInfo.is_public &&
                rainbondInfo.is_public.enable
              }
              currentUser={currentUser}
              collapsed={collapsed}
              onCollapse={this.handleMenuCollapse}
              isMobile={this.state.isMobile}
              customHeader={teamView && customHeader}
            />
            <Layout style={{ flexDirection: 'row' }}>
              {teamView && (
                <GlobalRouter
                  currentEnterprise={currentEnterprise}
                  enterpriseList={enterpriseList}
                  title={
                    rainbondInfo &&
                    rainbondInfo.title &&
                    rainbondInfo.title.enable &&
                    rainbondInfo.title.value
                  }
                  currentUser={currentUser}
                  Authorized={Authorized}
                  collapsed={collapsed}
                  location={location}
                  isMobile={this.state.isMobile}
                  onCollapse={this.handleMenuCollapse}
                  menuData={menuData}
                  pathname={pathname}
                  showMenu={!componentID}
                />
              )}
              <Content
                style={{
                  height: 'calc(100vh - 64px)',
                  overflow: 'auto',
                  width: autoWidth
                }}
              >
                <div
                  style={{
                    margin: '24px 24px 0'
                  }}
                >
                  {renderContent()}
                </div>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      );
    };
    const SiteTitle = rainbondUtil.fetchSiteTitle(rainbondInfo);

    return (
      <Fragment>
        <DocumentTitle title={SiteTitle}>
          <ContainerQuery key={teamName + regionName} query={query}>
            {params => (
              <Context.Provider value={this.getContext()}>
                <div className={classNames(params)}>{layout()}</div>
              </Context.Provider>
            )}
          </ContainerQuery>
        </DocumentTitle>
        {/* 企业尚未认证 */}
        {showAuthCompany && (
          <AuthCompany
            eid={this.state.eid}
            marketName={showAuthCompany}
            currStep={0}
          />
        )}
        {memoryTip && <MemoryTip memoryTip={memoryTip} />}

        {orders && BillingFunction && (
          <ServiceOrder
            // enterpriseServiceInfo={enterpriseServiceInfo}
            eid={currentEnterprise && currentEnterprise.enterprise_id}
            orders={orders}
          />
        )}
      </Fragment>
    );
  }
}

export default connect(({ user, global, index, loading, teamControl }) => ({
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
  enterprise: global.enterprise,
  orders: global.orders,
  // enterpriseServiceInfo: order.enterpriseServiceInfo,
  upDataHeader: global.upDataHeader,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))(TeamLayout);
