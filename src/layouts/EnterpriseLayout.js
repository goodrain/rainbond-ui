/* eslint-disable no-unused-expressions */
/* eslint-disable no-shadow */
/* eslint-disable prefer-destructuring */
/* eslint-disable react/sort-comp */
import { Layout, Alert } from 'antd';
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
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import { ContainerQuery } from 'react-container-query';
import ReactDOM from "react-dom"
import DocumentTitle from 'react-document-title';
import logo from '../../public/logo.png';
import { getMenuData } from '../common/enterpriseMenu';
import AuthCompany from '../components/AuthCompany';
import GlobalHeader from '../components/GlobalHeader';
import headerStype from '../components/GlobalHeader/index.less';
import GlobalRouter from '../components/GlobalRouter';
import PageLoading from '../components/PageLoading';
import ServiceOrder from '../components/ServiceOrder';
import SiderMenu from '../components/SiderMenu';
import Authorized from '../utils/Authorized';
import globalUtil from '../utils/global';
import rainbondUtil from '../utils/rainbond';
import userUtil from '../utils/user';
import MemoryTip from './MemoryTip';
import Context from './MenuContext';
import Logo from '../../public/logo.png'
import Shell from "../components/Shell"
import styles from './EnterpriseLayout.less'
import { loadRegionConfig } from '@/services/cloud';
import "animate.css"
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
      alertInfo:[],
      offLineDisNew: [
        {
          key: 'welcome',
          value: true
        },
        { key: 'applicationInfo', value: true },
        { key: 'installApp', value: true }
      ],
      showMenu:true,
      pluginList:[]
    };
  }

  componentDidMount() {
    this.getEnterpriseList();
    this.handleLoadEnterpriseClusters();
    const urlParams = new URL(window.location.href);
    if(urlParams){
      const bool = urlParams.href.includes("/shell")
      if(bool){
        this.setState({
          showMenu: false
        })
      }
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
            if (res.status_code == 200) {
              if(res?.list[0]?.region_name){
                this.handlePluginList(res.list[0].region_name)
              }
            }
        }
    });
};
  handlePluginList = (regionName) => {
    const { dispatch } = this.props
    const eid = globalUtil.getCurrEnterpriseId();
    dispatch({
        type: 'global/getPluginList',
        payload: {
            enterprise_id: eid,
            region_name: regionName,
        },
        callback: res => {
            if (res && res.list) {
                this.setState({
                    pluginList: res.list,
                })
            }
        },
        handleError: err => {
            if(err){
                this.setState({
                    pluginList: [],
                })
            }
        }
    })
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
            },
            handleError: err => {}
          });
        } else {
          const isNewbieGuide = rainbondUtil.isEnableNewbieGuide(data);
          isNewbieGuide && this.getNewbieGuideConfig(eid);
        }
      },
      handleError: err => {}
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
      let selectE = null;
      enterpriseList.map(item => {
        if (item.enterprise_id === currentUser.enterprise_id) {
          selectE = item;
        }
        return item;
      });
      if (selectE == null) {
        selectE = enterpriseList[0];
      }
      this.handlePutLog(rainbondInfo, selectE);
      this.fetchEnterpriseInfo(selectE.enterprise_id);
      this.setState({ enterpriseInfo: selectE });
      dispatch(
        routerRedux.replace(`/enterprise/${selectE.enterprise_id}/personal`)
      );
    } else {
      enterpriseList.map(item => {
        if (item.enterprise_id === eid) {
          this.fetchEnterpriseInfo(eid);
          this.handlePutLog(rainbondInfo, item);
          this.setState({ enterpriseInfo: item });
        }
        return item;
      });
    }
  };
  handlePutLog = (rainbondInfo, item) => {
    globalUtil.putLog(Object.assign(rainbondInfo, item));
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
          if(res.list.length > 0){
            this.setState({
              alertInfo: res.list
            })
          }
        }
      },handleError: err => {
        console.log(err)
      }
    });
  }
  onJumpPersonal = () => {
    const { 
      match: {
        params: {eid}
      }, 
      dispatch, 
    } = this.props
    dispatch(routerRedux.replace(`/enterprise/${eid}/personal`))
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
    const { enterpriseList, enterpriseInfo, ready, alertInfo, pluginList } = this.state;
    const autoWidth = collapsed ? 'calc(100% - 416px)' : 'calc(100% - 116px)';
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
    const customHeaderImg = () => {
      return (
        <div className={headerStype.enterprise} onClick={this.onJumpPersonal}>
           <img src={fetchLogo} alt="" />
        </div>
      );
    };
    const customHeader = () => {
      return (
        <Link
          style={{ color: '#fff', fontSize: '16px', fontWeight: 'bolder' }}
          to={`/enterprise/${eid}/personal`}
        >
          {formatMessage({ id: 'enterpriseTeamManagement.other.personal' })}
        </Link>
      )
    }
    const layout = () => {
      const { rainbondInfo } = this.props
      const isAlarm = rainbondInfo && rainbondInfo.is_alarm && rainbondInfo.is_alarm.enable
      const { showMenu } = this.state
      const urlParams = new URL(window.location.href)
      const includesAdd = urlParams.href.includes('/addCluster')
      const includesPro = urlParams.href.includes('/provider')
      const showTransition = includesAdd || includesPro
      return (
        <Layout>
          <SiderMenu
            currentEnterprise={enterpriseInfo}
            enterpriseList={enterpriseList}
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
              customHeader={customHeader}
              customHeaderImg={customHeaderImg}
            />
            <Layout style={{ flexDirection: 'row' }}>
              <GlobalRouter
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
                menuData={getMenuData(eid, currentUser, enterprise, pluginList)}
                showMenu= {showMenu}
                pathname={pathname}
                location={location}
                isMobile={this.state.isMobile}
                collapsed={collapsed}
                onCollapse={this.handleMenuCollapse}
              />
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
                  key={showTransition ? "" : this.props.location.pathname}
                >
                  <Content
                    key={eid}
                    style={{
                      height: 'calc(100vh - 64px)',
                      overflow: 'auto',
                      width: '100%'
                    }}
                    className={styles.bgc}
                  >
                    {/* 报警信息 */}
                    {isAlarm ? (
                    alertInfo.length > 0 && alertInfo.map((item) => {
                      return (
                        <div className={styles.alerts}>
                          <Alert
                            style={{ textAlign: 'left', marginTop: '4px', marginBottom: '4px', color: '#c40000', background: '#fff1f0', border: ' 1px solid red' }}
                            message={item.annotations.description || item.annotations.summary}
                            type="warning"
                            showIcon
                          />
                        </div>
                      )
                    })
                    ):
                    null
                    }
                    <div
                      style={{
                        margin: '24px 24px 0'
                      }}
                    >
                      <Authorized
                        logined
                        authority={['admin', 'user']}
                        noMatch={<Redirect to="/user/login" />}
                      >
                        {children}
                      </Authorized>
                    </div>
                  </Content>
              </CSSTransition>
             </TransitionGroup>
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
        {terminalStatus && ReactDOM.createPortal(<Shell/>,document.getElementById("root"))}
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
  terminalStatus: region.terminal_status,
  rainbondInfo: global.rainbondInfo
  // enterpriseServiceInfo: order.enterpriseServiceInfo
}))(EnterpriseLayout);
