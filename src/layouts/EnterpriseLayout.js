/* eslint-disable no-unused-expressions */
/* eslint-disable no-shadow */
/* eslint-disable prefer-destructuring */
/* eslint-disable react/sort-comp */
import { Layout, Alert, Icon } from 'antd';
import classNames from 'classnames';
import { connect } from 'dva';
import { Redirect, routerRedux, Link } from 'dva/router';
import { enquireScreen } from 'enquire-js';
import deepEqual from 'lodash.isequal';
import memoizeOne from 'memoize-one';
import pathToRegexp from 'path-to-regexp';
import PropTypes from 'prop-types';
import { stringify } from 'querystring';
import React, { Fragment, PureComponent } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { formatMessage } from '@/utils/intl';
import { ContainerQuery } from 'react-container-query';
import ReactDOM from "react-dom"
import DocumentTitle from 'react-document-title';
import logo from '../../public/logo.png';
import { getMenuData } from '../common/enterpriseMenu';
import AuthCompany from '../components/AuthCompany';
import GlobalHeader from '../components/GlobalHeader';
import GlobalRouter from '../components/GlobalRouter';
import PageLoading from '../components/PageLoading';
import ServiceOrder from '../components/ServiceOrder';
import Authorized from '../utils/Authorized';
import globalUtil from '../utils/global';
import rainbondUtil from '../utils/rainbond';
import userUtil from '../utils/user';
import MemoryTip from './MemoryTip';
import Context from './MenuContext';
import Shell from "../components/Shell"
import styles from './EnterpriseLayout.less'
import pluginUtile from '../utils/pulginUtils'
import CustomFooter from "./CustomFooter"
const { Content } = Layout;

const getBreadcrumbNameMap = memoizeOne(meun => {
  const routerMap = {};
  const mergeMeunAndRouter = meunData => {
    meunData.forEach(meunItem => {
      if (meunItem.children) {
        mergeMeunAndRouter(meunItem.children);
      }
      routerMap[meunItem.path] = meunItem;
    });
  };
  mergeMeunAndRouter(meun);
  return routerMap;
}, deepEqual);

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

class EnterpriseLayout extends PureComponent {
  static childContextTypes = {
    location: PropTypes.object,
    breadcrumbNameMap: PropTypes.object,
    currRegion: PropTypes.string,
    currTeam: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.breadcrumbNameMap = getBreadcrumbNameMap(
      getMenuData(this.props.groups)
    );
    this.state = {
      isMobile,
      enterpriseList: [],
      enterpriseInfo: false,
      ready: false,
      alertInfo: [],
      offLineDisNew: [
        {
          key: 'welcome',
          value: true
        },
        { key: 'applicationInfo', value: true },
        { key: 'installApp', value: true }
      ],
      showMenu: true,
      pluginList: {},
      key: true,
      showEnterprisePlugin: false
    };
  }

  componentDidMount() {
    // 使用 localStorage 中保存的折叠状态
    const savedCollapsed = window.localStorage.getItem('collapsed');
    if (savedCollapsed !== null) {
      this.handleMenuCollapse(savedCollapsed === 'true');
    }
    this.getEnterpriseList();
    this.handleLoadEnterpriseClusters();
    if (window.location.href.includes('/shell')) {
      this.setState({ showMenu: false });
    }
  }
  handleLoadEnterpriseClusters = () => {
    const { dispatch } = this.props;
    const eid = globalUtil.getCurrEnterpriseId();
    dispatch({
      type: 'region/fetchEnterpriseClusters',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res.status_code === 200 && res?.list) {
          this.setState({ clusterList: res.list });
          const promises = res.list.map(item => this.handlePluginList(item.region_name));
          Promise.all(promises)
            .then(() => this.setState({ key: false }))
            .catch(() => this.setState({ key: false }));
        }
      }
    });
  };
  handlePluginList = (regionName) => {
    return new Promise((resolve, reject) => {
      const { dispatch } = this.props;
      const eid = globalUtil.getCurrEnterpriseId();
      dispatch({
        type: 'global/getPluginList',
        payload: {
          enterprise_id: eid,
          region_name: regionName,
        },
        callback: res => {
          if (res && res.list) {
            dispatch({
              type: 'rbdPlugin/fetchPluginList',
              payload: res.list
            });
            const showEnterprisePlugin = pluginUtile.isInstallEnterprisePlugin(res.list);
            window.localStorage.setItem('showEnterprisePlugin', showEnterprisePlugin || 'false');
            if (showEnterprisePlugin) {
              this.setState({ showEnterprisePlugin });
            }
            this.setState(prevState => ({
              pluginList: { ...prevState.pluginList, [regionName]: res.list }
            }));
            resolve();
          }
        },
        handleError: err => {
          if (err) {
            this.setState({ pluginList: {} });
            reject(new Error('Failed to get component language version'));
          }
        }
      });
    });
  }

  // 获取平台公共信息(判断用户是否是离线)
  handleGetEnterpeiseMsg = (data, eid) => {
    const { dispatch } = this.props;
    const { offLineDisNew } = this.state;
    dispatch({
      type: 'global/fetchRainbondInfo',
      callback: res => {
        // 判断是否是离线的状态
        if (
          res &&
          res.is_offline !== 'false' &&
          (res.is_offline || res.is_offline === 'true')
        ) {
          dispatch({
            type: 'global/putNewbieGuideConfig',
            payload: {
              arr: [...offLineDisNew]
            },
            callback: res => {
              if (res) {
                const isNewbieGuide = rainbondUtil.isEnableNewbieGuide(data);
                dispatch({
                  type: 'global/fetchNewbieGuideConfig',
                  callback: res => {
                    if (
                      res &&
                      res.list &&
                      res.list.length === 3 &&
                      isNewbieGuide
                    ) {
                      dispatch(routerRedux.push(`/enterprise/${eid}/clusters`));
                    }
                  }
                });
              }
            }
          });
        } else {
          const isNewbieGuide = rainbondUtil.isEnableNewbieGuide(data);
          if (isNewbieGuide) {
            this.getNewbieGuideConfig(eid);
          }
        }
      }
    });
  };
  // get enterprise list
  getEnterpriseList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseList',
      callback: res => {
        if (res && res.status_code === 200) {
          const ready = !!(res.list && res.list.length > 0);
          this.setState(
            {
              enterpriseList: res.list,
              ready
            },
            () => {
              if (ready) {
                this.redirectEnterpriseView();
                this.load();
                this.getAlertInfo()
              } else {
                this.handleJumpLogin();
              }
            }
          );
        } else {
          this.handleJumpLogin();
        }
      },
      handleError: () => {
        this.handleJumpLogin();
      }
    });
  };

  loadClusters = eid => {
    const { dispatch, currentUser } = this.props;
    dispatch({
      type: 'region/fetchEnterpriseClusters',
      payload: {
        enterprise_id: eid,
        check_status: 'no'
      },
      callback: res => {
        const adminer = userUtil.isCompanyAdmin(currentUser);
        if (res && res.list && res.list.length === 0 && adminer) {
          dispatch(
            routerRedux.push(`/enterprise/${eid}/shared/local?init=true`)
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
  };

  getChildContext = () => {
    const { location } = this.props;
    return { location, breadcrumbNameMap: this.breadcrumbNameMap };
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
  handleJumpLogin = () => {
    const { dispatch } = this.props;
    dispatch(routerRedux.push('/user/login'));
  };
  redirectEnterpriseView = () => {
    const {
      dispatch,
      currentUser,
      rainbondInfo,
      match: {
        params: { eid }
      }
    } = this.props;
    const { enterpriseList } = this.state;
    if ((!eid || eid === 'auto') && enterpriseList.length > 0) {
      const selectE = enterpriseList.find(item => item.enterprise_id === currentUser.enterprise_id) || enterpriseList[0];
      this.handlePutLog(rainbondInfo, selectE);
      this.fetchEnterpriseInfo(selectE.enterprise_id);
      this.setState({ enterpriseInfo: selectE });
      const link = this.getLoginRole(currentUser);
      dispatch(routerRedux.replace(link));
    } else {
      const matchedEnterprise = enterpriseList.find(item => item.enterprise_id === eid);
      if (matchedEnterprise) {
        this.fetchEnterpriseInfo(eid);
        this.handlePutLog(rainbondInfo, matchedEnterprise);
        this.setState({ enterpriseInfo: matchedEnterprise });
      }
    }
  };
  handlePutLog = (rainbondInfo, item) => {
    globalUtil.putLog({ ...rainbondInfo, ...item });
  };
  getNewbieGuideConfig = eid => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchNewbieGuideConfig',
      callback: res => {
        const isNext = rainbondUtil.handleNewbie(res && res.list, 'welcome');
        if (isNext) {
          this.loadClusters(eid);
        }
      }
    });
  };
  fetchEnterpriseInfo = eid => {
    if (!eid) {
      return null;
    }
    const { dispatch } = this.props;
    // this.fetchEnterpriseService(eid);
    dispatch({
      type: 'global/fetchEnterpriseInfo',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.bean) {
          // 获取平台信息
          this.handleGetEnterpeiseMsg(res.bean, eid);
        }
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
  getAlertInfo = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;
    dispatch({
      type: 'global/getRainbondAlert',
      payload: {
        enterprise_id: eid
      },
      callback: res => {
        if (res && res.bean) {
          //获取平台报警信息
          if (res.list.length > 0) {
            this.setState({
              alertInfo: res.list
            })
          }
        }
      }, handleError: err => {
        console.log(err)
      }
    });
  }
  onJumpPersonal = () => {
    const { dispatch, currentUser } = this.props;
    dispatch(routerRedux.replace(this.getLoginRole(currentUser)));
  }
  getLoginRole = (currUser) => {
    const { teams } = currUser;
    if (teams && teams.length > 0) {
      const { team_name, region } = teams[0];
      const { team_region_name } = region[0];
      if (team_name && team_region_name) {
        return `/team/${team_name}/region/${team_region_name}/index`;
      }
    } else if (currUser?.is_enterprise_admin) {
      return `/enterprise/${currUser?.enterprise_id}/index`;
    }
    return null;
  }
  render() {
    const {
      memoryTip,
      currentUser,
      collapsed,
      location,
      location: { pathname },
      match: {
        params: { eid }
      },
      orders,
      children,
      rainbondInfo,
      enterprise,
      showAuthCompany,
      terminalStatus
    } = this.props;
    const { enterpriseList, enterpriseInfo, ready, alertInfo, pluginList, clusterList } = this.state;
    const BillingFunction = rainbondUtil.isEnableBillingFunction();
    const queryString = stringify({
      redirect: window.location.href
    });
    if (!ready || !enterpriseInfo) {
      return <PageLoading />;
    }
    if (!currentUser || !rainbondInfo || enterpriseList.length === 0) {
      return <Redirect to={`/user/login?${queryString}`} />;
    }
    const fetchLogo = rainbondUtil.fetchLogo(rainbondInfo, enterprise) || logo;
    const layout = () => {
      const isAlarm = rainbondInfo?.is_alarm?.enable;
      const { showMenu, key } = this.state;
      const currentHref = window.location.href;
      const showTransition = currentHref.includes('/addCluster') || currentHref.includes('/provider');
      return (
        <Layout>
          <Layout>
            <GlobalHeader
              eid={eid}
              logo={fetchLogo}
              isPubCloud={
                rainbondInfo &&
                rainbondInfo.is_public &&
                rainbondInfo.is_public.enable
              }
              is_enterprise={true}
              currentUser={currentUser}
              collapsed={collapsed}
              onCollapse={this.handleMenuCollapse}
              isMobile={this.state.isMobile}
            />
            <Layout style={{ flexDirection: 'row' }}>
              <GlobalRouter
                key={key}
                currentEnterprise={enterpriseInfo}
                enterpriseList={enterpriseList}
                title={
                  rainbondInfo &&
                  rainbondInfo.title &&
                  rainbondInfo.title.enable &&
                  rainbondInfo.title.value
                }
                currentUser={currentUser}
                Authorized={Authorized}
                menuData={getMenuData(eid, currentUser, enterprise, pluginList, clusterList)}
                showMenu={showMenu}
                pathname={pathname}
                location={location}
                isMobile={this.state.isMobile}
                collapsed={collapsed}
                onCollapse={this.handleMenuCollapse}
              />
              <div style={{ width: showMenu ? collapsed ? 'calc( 100% - 56px)' : 'calc( 100% - 200px)' : '100%', }}>
                <TransitionGroup
                  style={{
                    position: 'relative',
                    height: 'calc(100vh - 50px)',
                    overflow: 'hidden',
                    width: "100%"
                  }}>
                  <CSSTransition
                    timeout={700}
                    classNames="page-zoom"
                    unmountOnExit
                    key={showTransition ? '' : this.props.location.pathname}
                  >
                    <Content
                      key={eid}
                      style={{
                        height: 'calc(100vh - 50px)',
                        overflow: 'auto',
                        width: '100%'
                      }}
                      className={styles.bgc}
                    >
                      {/* 报警信息 */}
                      {isAlarm && alertInfo.length > 0 && alertInfo.map((item, index) => (
                        <div key={item.fingerprint || index} className={styles.alerts}>
                          <Alert
                            style={{ textAlign: 'left', marginTop: '4px', marginBottom: '4px', color: '#c40000', background: '#fff1f0', border: '1px solid red' }}
                            message={item.annotations.description || item.annotations.summary}
                            type="warning"
                            showIcon
                          />
                        </div>
                      ))}
                      <div>
                        <Authorized
                          logined
                          authority={['admin', 'user']}
                          noMatch={<Redirect to="/user/login" />}
                        >
                          {children}
                          {showMenu && <CustomFooter />}
                        </Authorized>
                      </div>
                    </Content>
                  </CSSTransition>
                </TransitionGroup>
              </div>
            </Layout>
          </Layout>
        </Layout>
      );
    };
    const SiteTitle = rainbondUtil.fetchSiteTitle(rainbondInfo);

    return (
      <Fragment>
        <DocumentTitle title={SiteTitle}>
          <ContainerQuery query={query}>
            {params => (
              <Context.Provider value={this.getContext()}>
                <div className={classNames(params)}>{layout()}</div>
              </Context.Provider>
            )}
          </ContainerQuery>
        </DocumentTitle>


        {/* 企业尚未认证 */}
        {showAuthCompany && (
          <AuthCompany eid={eid} marketName={showAuthCompany} currStep={0} />
        )}
        {memoryTip && <MemoryTip memoryTip={memoryTip} />}

        {orders && BillingFunction && (
          <ServiceOrder
            // enterpriseServiceInfo={enterpriseServiceInfo}
            eid={eid}
            orders={orders}
          />
        )}
        {terminalStatus && ReactDOM.createPortal(<Shell />, document.getElementById("root"))}
      </Fragment>
    );
  }
}
export default connect(({ user, global, index, loading, region }) => ({
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
  orders: global.orders,
  overviewInfo: index.overviewInfo,
  nouse: global.nouse,
  enterprise: global.enterprise,
  terminalStatus: region.terminal_status
}))(EnterpriseLayout);
