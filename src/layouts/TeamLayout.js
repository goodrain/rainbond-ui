/* eslint-disable no-underscore-dangle */
/* eslint-disable array-callback-return */
/* eslint-disable class-methods-use-this */
/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/sort-comp */
/* eslint-disable no-nested-ternary */
import { Icon, Layout, notification, Alert } from 'antd';
import classNames from 'classnames';
import { connect } from 'dva';
import { Redirect, routerRedux } from 'dva/router';
import { enquireScreen } from 'enquire-js';
import PropTypes from 'prop-types';
import { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { ContainerQuery } from 'react-container-query';
import DocumentTitle from 'react-document-title';
import logo from '../../public/logo.png';
import { getAppMenuData } from '../common/appMenu';
import { getHelmMenuData } from '../common/helmMenu';
import { getMenuData } from '../common/teamMenu';
import AuthCompany from '../components/AuthCompany';
import GlobalHeader from '../components/GlobalHeader';
import GlobalRouter from '../components/GlobalRouter';
import PageLoading from '../components/PageLoading';
import ServiceOrder from '../components/ServiceOrder';
import SiderMenu from '../components/SiderMenu';
import Authorized from '../utils/Authorized';
import Exception from '../pages/Exception/403';
import cookie from '../utils/cookie';
import globalUtil from '../utils/global';
import rainbondUtil from '../utils/rainbond';
import roleUtil from '../utils/role';
import userUtil from '../utils/user';
import AppHeader from './components/AppHeader';
import TeamHeader from './components/TeamHeader';
import MemoryTip from './MemoryTip';
import Context from './MenuContext';
import Logo from '../../public/logo.png'
import styles from './EnterpriseLayout.less'
import headerStype from '../components/GlobalHeader/index.less';
import "animate.css"
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
      currentApp: false,
      currentEnterprise: false,
      currentComponent: null,
      eid: '',
      appID: globalUtil.getAppID(),
      teamView: true,
      showMenu: true,
      GroupShow: true,
      marginShow: true,
      vm_url:"",
    };
  }

  componentWillMount() {
    this.getEnterpriseList();
    this.getNewbieGuideConfig();
    this.fetchUserInfo()
  }
  componentWillUpdate() {
    const updata = JSON.parse(window.sessionStorage.getItem('updata'))
    if (updata) {
      window.location.reload()
      window.sessionStorage.removeItem('updata')
    }
    const urlParams = new URL(window.location.href);
    if (urlParams) {
      const bool = urlParams.href.includes("/helminstall");
      if (bool) {
        this.setState({
          showMenu: false
        })
      } else {
        this.setState({
          showMenu: true
        })
      }
    }
    if (urlParams) {
      const code = urlParams.href.includes("/create/code");
      const image = urlParams.href.includes("/create/image");
      const yaml = urlParams.href.includes("/create/yaml");
      const outer = urlParams.href.includes("/create/outer");
      if (code || image || yaml || outer) {
        this.setState({
          GroupShow: false
        })
      }
      const isPipeline = urlParams.href.includes("Pipeline");
      if(isPipeline){
        this.setState({
          marginShow: false
        })
      }else{
        this.setState({
          marginShow: true
        })
      }
    }
  }
  componentWillReceiveProps() {
    const appID = globalUtil.getAppID();
    const { appID: cldAppID } = this.state;
    if (appID && appID !== cldAppID) {
      this.setState(
        {
          appID,
          currentApp: false
        },
        () => {
          this.fetchAppDetail(appID);
        }
      );
    }
  }
  GroupShow = () => {
    this.setState({
      GroupShow: true
    })
  }
  fetchPipePipeline = (eid) =>{
    const { dispatch } = this.props;
    dispatch({
        type: 'teamControl/fetchPluginUrl',
        payload: {
            enterprise_id: eid,
            region_name: globalUtil.getCurrRegionName()
        },
        callback: res=>{
          if(res&&res.list){
            res.list.map(item=>{
              if(item.name == "rainbond-vm"){
                this.setState({
                  vm_url:item.urls[0]
                },()=>{
                  this.queryComponentDeatil()
                })
              }
            })
          }
          this.setState({
            showPipeline:res.list
          })
        }
    })
}
  getNewbieGuideConfig = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchNewbieGuideConfig'
    });
  };
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
        },
        handleError: () => {
          this.setState({
            teamView: false
          });
        }
      });
    }
    return null;
  };

  getTeamOverview = () => {
    this.load();
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
          window.sessionStorage.setItem("team_id",res.bean.team_id)
          this.setState(
            {
              eid: res.bean.eid
            },()=>{
              this.fetchPipePipeline(res.bean.eid)
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
              routerRedux.push(
                `/enterprise/${enterpriseList[0].enterprise_id}/personal`
              )
            );
          } else {
            notification.warning({ message: formatMessage({ id: 'notification.warn.error' }) });
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
    const enterpriseId = this.props.enterprise && this.props.enterprise.enterprise_id;
    dispatch({ type: 'enterprise/fetchCurrentEnterprise', payload: enterpriseList[0] });
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
    this.setState({
      currentEnterprise: enterpriseList[0],
      currentTeam: team,
      currentRegion: region,
      ready: true,
      GroupShow: true
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
          app_alias: componentID,
          vm_url:this.state.vm_url
        },
        callback: appDetail => {
          this.setState({ currentComponent: appDetail.service, GroupShow: false });
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
  fetchAppDetail = appID => {
    const { dispatch } = this.props;
    const { teamName, regionName } = this.props.match.params;
    if (!appID) {
      return false;
    }
    dispatch({
      type: 'application/fetchGroupDetail',
      payload: {
        team_name: teamName,
        region_name: regionName,
        group_id: appID
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            currentApp: res.bean,
            GroupShow: true
          });
        }
      },
      handleError: res => {
        this.setState({
          currentApp: false
        });
        if (res && res.status === 404) {
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps`
            )
          );
        }
      }
    });
  };
  onJumpPersonal = () => {
    const { eid } = this.state
    const { dispatch } = this.props
    dispatch(routerRedux.replace(`/enterprise/${eid}/personal`))
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
      currentTeamPermissionsInfo,
      groupDetail
    } = this.props;
    const {
      enterpriseList,
      ready,
      currentEnterprise,
      currentTeam,
      currentRegion,
      currentComponent,
      teamView,
      currentApp,
      showMenu,
      showPipeline,
      marginShow
    } = this.state;

    const { teamName, regionName } = this.props.match.params;
    const autoWidth = collapsed ? 'calc(100% - 416px)' : 'calc(100% - 116px)';
    // Parameters of the abnormal
    if (!teamName || !regionName) {
      return <Redirect to="/" />;
    }
    // The necessary data is loaded
    if (!teamView) {
      return <Exception />;
    }
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
    let appID = globalUtil.getAppID();
    cookie.set('team_name', teamName);
    cookie.set('region_name', regionName);
    const componentID = globalUtil.getComponentID();
    const BillingFunction = rainbondUtil.isEnableBillingFunction();
    if (appID && (!currentApp || !groupDetail.ID)) {
      this.fetchAppDetail(appID);
      // return <PageLoading />;
    }
    // currentComponent is exit and id is current componentID
    else if (
      currentComponent &&
      currentComponent.service_alias == componentID
    ) {
      appID = currentComponent.group_id;
      // Refresh the component information
    } else if (componentID) {
      this.queryComponentDeatil();
      return <GlobalHeader/>;
    } else {
      this.setState({ currentComponent: null });
    }
    const mode =
      groupDetail && groupDetail.app_type === 'helm'
        ? 'helm'
        : this.getMode(appID || componentID);
    const customHeaderImg = () => {
      return (
        <div className={headerStype.enterprise} onClick={this.onJumpPersonal}>
          <img src={fetchLogo} alt="" />
        </div>
      );
    };

    const customHeader = () => {
      if (mode == 'team') {
        return (
          <TeamHeader
            nobleIcon={BillingFunction && nobleIcon}
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
          handleClick={this.GroupShow}
          teamName={teamName}
          currentEnterprise={currentEnterprise}
          currentTeam={currentTeam}
          currentRegion={currentRegion}
          regionName={regionName}
          appID={appID}
          nobleIcon={BillingFunction && nobleIcon}
          currentComponent={currentComponent}
          componentID={componentID}
          upDataHeader={upDataHeader}
        />
      );
    }
    let menuData = getMenuData(
      teamName,
      regionName,
      currentTeam.tenant_actions,
      showPipeline
    );
    if (mode === 'app') {
      menuData = getAppMenuData(
        teamName,
        regionName,
        appID,
        currentTeam.tenant_actions
      );
    } else if (mode === 'helm') {
      menuData = getAppMenuData(
        teamName,
        regionName,
        appID,
        currentTeam.tenant_actions
      );
    }
    const fetchLogo = rainbondUtil.fetchLogo(rainbondInfo, enterprise) || logo;
    const SiteTitle = rainbondUtil.fetchSiteTitle(rainbondInfo);

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
              customHeaderImg={teamView && customHeaderImg}
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
                  showMenu={showMenu ? !componentID : false}
                />
              )}
              {this.state.GroupShow ?
                <TransitionGroup
                  style={{
                    height: 'calc(100vh - 64px)',
                    overflow: 'auto',
                    width: collapsed ? 'calc(100% + 416px)' : 'calc(100% + 116px)'
                  }}>

                  <CSSTransition
                    timeout={300}
                    classNames=
                    {{
                      enter: 'animate__animated',
                      enterActive: 'animate__fadeIn',
                    }}
                    unmountOnExit
                    key={this.props.location.pathname}
                  >
                    <Content
                      style={{
                        height: 'calc(100vh - 64px)',
                        overflow: 'auto',
                        width: '100%'
                      }}
                    >
                      <div
                        style={{
                          margin: marginShow ? '24px 24px 0' : "0px"
                        }}
                      >
                        {renderContent()}
                      </div>
                    </Content>
                  </CSSTransition>
                </TransitionGroup> :
                (
                  <Content
                    style={{
                      height: 'calc(100vh - 64px)',
                      overflow: 'auto',
                      width: '100%'
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
                )
              }
            </Layout>
          </Layout>
        </Layout>
      );
    };

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

export default connect(
  ({ user, global, index, loading, teamControl, application }) => ({
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
    groupDetail: application.groupDetail,
    // enterpriseServiceInfo: order.enterpriseServiceInfo,
    upDataHeader: global.upDataHeader,
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
  })
)(TeamLayout);
