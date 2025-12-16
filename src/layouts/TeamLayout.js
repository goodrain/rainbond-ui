/* eslint-disable no-underscore-dangle */
/* eslint-disable array-callback-return */
/* eslint-disable class-methods-use-this */
/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/sort-comp */
/* eslint-disable no-nested-ternary */
import { Alert, Icon, Layout, notification, Tooltip, Modal } from 'antd';
import classNames from 'classnames';
import { connect } from 'dva';
import { Redirect, routerRedux } from 'dva/router';
import CustomFooter from "./CustomFooter"
import { enquireScreen } from 'enquire-js';
import PropTypes from 'prop-types';
import { Fragment, PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { ContainerQuery } from 'react-container-query';
import DocumentTitle from 'react-document-title';
import logo from '../../public/logo-icon.png';
import { getAppMenuData } from '../common/appMenu';
import { getHelmMenuData } from '../common/helmMenu';
import { getMenuData } from '../common/teamMenu';
import AuthCompany from '../components/AuthCompany';
import GlobalHeader from '../components/GlobalHeader';
import GlobalRouter from '../components/GlobalRouter';
import PageLoading from '../components/PageLoading';
import ServiceOrder from '../components/ServiceOrder';
import Authorized from '../utils/Authorized';
import Exception from '../pages/Exception/403';
import cookie from '../utils/cookie';
import globalUtil from '../utils/global';
import rainbondUtil from '../utils/rainbond';
import roleUtil from '../utils/newRole';
import userUtil from '../utils/user';
import AppHeader from './components/AppHeader';
import TeamHeader from './components/TeamHeader';
import CustomerServiceFloat from '../components/CustomerServiceFloat';
import MemoryTip from './MemoryTip';
import Context from './MenuContext';
import Overdue from '../pages/Overdue';
import styles from './EnterpriseLayout.less'
import PluginUtil from '../utils/pulginUtils';
const { Content } = Layout;
Modal.defaultProps.width = 480;

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
      vm_url: "",
      teamOverviewPermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'team_overview'),
      teamAppCreatePermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'team_app_create'),
      isAuthorizationLoading: true,
      licenseInfo: null,
      isLicense: false,
      isMemory: false,
      isNode: false,
      isTime: false,
      isNeedAuthz: false,
      showFooter: true,
      showHeader: true
    };
  }

  componentWillMount() {    
    this.fetchLicenses();
    this.getEnterpriseList();
    this.getNewbieGuideConfig();
    this.getUserNewbieGuideConfig();
    this.fetchUserInfo();
    // 使用 localStorage 中保存的折叠状态
    const savedCollapsed = window.localStorage.getItem('collapsed');
    if (savedCollapsed !== null) {
      this.handleMenuCollapse(savedCollapsed === 'true');
    }
    const { teamAppCreatePermission: { isAccess } } = this.state
    // 避免 SaaS 下重复调用 getUserNewbieGuideConfig
    if (isAccess) {
      this.getAppNames();
    }
  }

  componentDidMount() {
    // 首次挂载时，根据当前路由参数触发一次初始化加载
    const { teamName, regionName } = this.props.match.params || {};
    if (teamName && regionName) {
      cookie.set('team_name', teamName);
      cookie.set('region_name', regionName);
      this.load();
    }
  }
  componentWillUpdate() {
    const updata = JSON.parse(window.sessionStorage.getItem('updata'))
    if (updata) {
      window.location.reload()
      window.sessionStorage.removeItem('updata')
    }
    // 将 URL 驱动的展示状态更新挪到 componentDidUpdate 中按需更新，避免循环 setState
  }
  componentWillReceiveProps(nextProps) {
    // 1) team/region 变化时，集中触发一次 load
    const prevParams = this.props.match && this.props.match.params;
    const nextParams = nextProps.match && nextProps.match.params;
    if (
      prevParams && nextParams &&
      (prevParams.teamName !== nextParams.teamName || prevParams.regionName !== nextParams.regionName)
    ) {
      // 设置 cookie 仅在参数变化时
      cookie.set('team_name', nextParams.teamName);
      cookie.set('region_name', nextParams.regionName);
      this.load();
      // 若已有 eid 或 enterprise 可用，兜底刷新官方插件 url
      const enterpriseId = this.state.eid
        || (this.state.currentEnterprise && this.state.currentEnterprise.enterprise_id)
        || (this.props.enterprise && this.props.enterprise.enterprise_id)
        || (this.props.currentUser && this.props.currentUser.enterprise_id);
      if (enterpriseId) {
        setTimeout(() => this.fetchPipePipeline(enterpriseId), 10);
      }
    }

    // 2) appID 变化时，触发 fetchAppDetail（避免在 render 中触发）
    const newAppID = globalUtil.getAppID();
    const { appID: stateAppID } = this.state;
    if (newAppID && newAppID !== stateAppID) {
      this.setState(
        { appID: newAppID, currentApp: false },
        () => {
          this.fetchGroup();
          this.fetchAppDetail(newAppID);
        }
      );
    }

    // 3) componentID 变化时，触发组件详情加载（避免在 render 中触发）
    const prevComponentID = globalUtil.getComponentID(this.props && this.props.location);
    const nextComponentID = globalUtil.getComponentID(nextProps && nextProps.location);
    if (nextComponentID && nextComponentID !== prevComponentID) {
      this.queryComponentDeatil();
    }
  }

  componentDidUpdate(prevProps) {
    // 仅当路由变化时，根据 URL 统一计算展示状态，避免每次更新都 setState
    const prevPath = prevProps.location && prevProps.location.pathname;
    const currPath = this.props.location && this.props.location.pathname;
    if (prevPath !== currPath) {
      const href = window.location && window.location.href ? window.location.href : '';
      const webconsole = href.includes('/webconsole');
      const overview = href.includes('/overview');
      const helminstall = href.includes('/helminstall');
      const isCreate = href.includes('/create/code') || href.includes('/create/image') || href.includes('/create/yaml') || href.includes('/create/outer');
      const isPipeline = href.includes('Pipeline');

      const nextState = {
        showHeader: !webconsole,
        showFooter: !(webconsole || overview || helminstall),
        showMenu: !helminstall,
        GroupShow: !isCreate,
        marginShow: !isPipeline,
        overflow: overview ? 'hidden' : 'auto'
      };

      // 检查是否需要清空 currentComponent
      const componentID = globalUtil.getComponentID(this.props.location);
      if (!componentID && this.state.currentComponent) {
        nextState.currentComponent = null;
      }

      // 仅在状态有变化时才更新，避免无意义 setState
      const needUpdate = Object.keys(nextState).some(k => this.state[k] !== nextState[k]);
      if (needUpdate) {
        this.setState(nextState);
      }
    }
  }

  fetchLicenses = () => {
    const { dispatch, currentUser } = this.props;
    const { regionName } = this.props.match.params;
    if (dispatch) {
      dispatch({
        type: 'region/getEnterpriseLicense',
        payload: {
          enterprise_id: currentUser && currentUser.enterprise_id
        },
        callback: res => {
          if (res && res.status_code === 200) {
            const info = res.bean
            const isLicense = info.expect_cluster != -1 ? (info.actual_cluster > info.expect_cluster ? true : false) : false;
            const memory = info.expect_memory != -1 ? (info.actual_memory > info.expect_memory ? true : false) : false;
            const node = info.expect_node != -1 ? (info.actual_node > info.expect_node ? true : false) : false;
            const end = new Date(info.end_time).getTime();
            const current = new Date().getTime();
            const time = end ? (end < current ? true : false) : false

            this.setState({
              isAuthorizationLoading: false,
              licenseInfo: res.bean,
              isLicense,
              isMemory: memory,
              isNode: node,
              isTime: time,
            });
          }
        },
        handleError: (error) => {
          if (error?.response?.data?.code === 400) {
            this.setState({
              licenseInfo: null,
              isAuthorizationLoading: false,
            });
          }
        }
      });
    }
  };
  fetchGroup = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'user/fetchCurrent',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: res => {
        if (res && res.bean) {
          const team = userUtil.getTeamByTeamName(res.bean, globalUtil.getCurrTeamName());
          setTimeout(() => {
            dispatch({
              type: 'teamControl/fetchCurrentTeamPermissions',
              payload: team && team.tenant_actions
            });
          }, 10)
          const region = userUtil.hasTeamAndRegion(res.bean, globalUtil.getCurrTeamName(), globalUtil.getCurrRegionName());
          dispatch({ type: 'teamControl/fetchCurrentTeam', payload: team });
          this.setState({
            currentTeam: team,
            currentRegion: region
          });

        }
      },
    });
  };
  // 获取当前团队下的所有应用名称
  getAppNames = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'teamControl/fetchAppNames',
      payload: {
        team_name: globalUtil.getCurrTeamName()
      }
    });
  }
  GroupShow = () => {
    this.setState({
      GroupShow: true
    })
  }
  fetchPipePipeline = (eid) => {
    const { dispatch } = this.props;
    // 兜底获取 enterprise_id，避免传入 undefined
    const enterpriseId = eid
      || this.state.eid
      || (this.state.currentEnterprise && this.state.currentEnterprise.enterprise_id)
      || (this.props.enterprise && this.props.enterprise.enterprise_id)
      || (this.props.currentUser && this.props.currentUser.enterprise_id);
    if (!enterpriseId) {
      return; // 无有效 enterpriseId 时不发起请求，避免 404/undefined
    }
    dispatch({
      type: 'teamControl/fetchPluginUrl',
      payload: {
        enterprise_id: enterpriseId,
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => {
        if (res && res.list) {
          res.list.map(item => {
            if (item.name == "rainbond-vm") {
              this.setState({
                vm_url: item.urls[0]
              })
            }
          })
        }
        dispatch({
          type: 'rbdPlugin/fetchPluginList',
          payload: res.list
        })
        if (res && res.bean && res.bean.need_authz) {
          this.setState({
            isNeedAuthz: res.bean.need_authz
          })
        }
        // 仅当列表确实发生变化时才更新，避免触发下游重复计算
        if (JSON.stringify(this.state.showPipeline || []) !== JSON.stringify(res.list || [])) {
          this.setState({
            showPipeline: res.list
          })
        }
      }
    })
  }
  getNewbieGuideConfig = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchNewbieGuideConfig'
    });
  };
  getUserNewbieGuideConfig = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchUserNewbieGuideConfig'
    });
  };
  // get enterprise list
  getEnterpriseList = () => {
    const { dispatch, currentUser } = this.props;
    dispatch({
      type: 'global/fetchEnterpriseList',
      callback: res => {
        if (res && res.status_code === 200) {
          const firstEnterprise = res.list && res.list[0];
          
          // 立即设置当前企业到 redux store，确保其他组件能获取 enterprise_id
          if (firstEnterprise) {
            dispatch({ type: 'enterprise/fetchCurrentEnterprise', payload: firstEnterprise });
          }
          
          this.setState(
            {
              enterpriseList: res.list,
              // 确保 currentEnterprise 及时就绪，避免页面因为空而一直 Loading
              currentEnterprise: (this.state.currentEnterprise || firstEnterprise) || null
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
        payload: {
          team_name: teamName,
        },
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
    // 避免在此处再次触发 load，统一在参数变化生命周期中触发
    const { dispatch, currentUser, rainbondInfo } = this.props;
    const isSaas = rainbondInfo && rainbondInfo.is_saas || false;
    const { enterpriseList, teamOverviewPermission: { isAccess } } = this.state;
    const { teamName, regionName } = this.props.match.params;
    cookie.set('team_name', teamName);
    cookie.set('region_name', regionName);
    if(isSaas){
      this.fetchTeamDetails();
    }
    dispatch({
      type: 'global/getTeamOverview',
      payload: {
        team_name: teamName,
        region_name: regionName
      },
      callback: res => {
        if (res && res.status_code === 200) {
          window.sessionStorage.setItem("team_id", res.bean.team_id)
          this.setState(
            {
              eid: res.bean.eid
            }, () => {
              this.fetchPipePipeline(res.bean.eid)
            }
          );
        }
      },
      handleError: err => {
        const link = this.getLoginRole(currentUser)
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
                link
              )
            );
          } else {
            notification.warning({ message: formatMessage({ id: 'notification.warn.error' }) });
          }
        }
      }
    });
  };
  getLoginRole = (currUser) => {
    const { dispatch } = this.props;
    const { teams } = currUser
    if (teams && teams.length > 0) {
      const { team_name, region } = teams[0]
      const { team_region_name } = region[0]
      if (team_name && team_region_name) {
        return `/team/${globalUtil.getCurrTeamName() || team_name}/region/${globalUtil.getCurrRegionName() || team_region_name}/index`
      }
    } else {
      if (currUser?.is_enterprise_admin) {
        return `/enterprise/${currUser?.enterprise_id}/index`
      }
    }
  }

  // 获取团队详情
  fetchTeamDetails = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/fetchTeamDetails',
      callback: (res) => {
        if(res && res.bean){
          dispatch({
            type: 'global/syncData',
            payload: res.bean,
          })
        }
      }
    })
  }

  load = () => {
    // 组件详情按参数变化单独触发，避免 load 内部重复拉取
    const { enterpriseList, eid, teamOverviewPermission: { isAccess } } = this.state;
    const { currentUser, dispatch, enterprise } = this.props;
    const { teamName, regionName } = this.props.match.params;
    const team = userUtil.getTeamByTeamName(currentUser, teamName);
    
    // 优先从 props.enterprise 获取，如果没有则从 state.enterpriseList 或 currentUser 获取
    let currentEnterprise = enterprise;
    if (!currentEnterprise && enterpriseList && enterpriseList.length > 0) {
      currentEnterprise = enterpriseList[0];
    }
    if (!currentEnterprise && currentUser && currentUser.enterprise_id) {
      // 如果还没有 enterprise 对象，至少构造一个包含 enterprise_id 的对象
      currentEnterprise = { enterprise_id: currentUser.enterprise_id };
    }
    
    // 确保设置当前企业到 redux store
    if (currentEnterprise) {
      dispatch({ type: 'enterprise/fetchCurrentEnterprise', payload: currentEnterprise });
    }
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
    this.fetchTeamApps();
    this.fetchGroup()
    this.setState({
      currentEnterprise: this.state.currentEnterprise || (enterpriseList && enterpriseList[0]) || null,
      currentTeam: team,
      ready: true,
      GroupShow: true
    });
    this.fetchEnterpriseInfo(eid);
    enquireScreen(mobile => {
      this.setState({ isMobile: mobile });
    });
    // 连接云应用市场
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
      // 避免重复请求同一组件详情
      if (this.state.currentComponent && this.state.currentComponent.service_alias === componentID) {
        return;
      }
      this.props.dispatch({
        type: 'appControl/fetchDetail',
        payload: {
          team_name: teamName,
          app_alias: componentID,
          vm_url: this.state.vm_url
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
    // 避免重复请求：当 appID 与当前相同且已有 currentApp 时跳过
    if (this.state.currentApp && this.state.currentApp.group_id === appID) {
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
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
            )
          );
        }
      }
    });
  };
  onJumpPersonal = () => {
    const { eid } = this.state
    const { dispatch, currentUser } = this.props
    const link = this.getLoginRole(currentUser)
    dispatch(routerRedux.replace(link))
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
      eid,
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
      marginShow,
      isAuthorizationLoading,
      licenseInfo,
      isLicense,
      isMemory,
      isNode,
      isTime,
      isNeedAuthz,
      showFooter,
      showHeader,
      overflow
    } = this.state;  
    const { teamName, regionName } = this.props.match.params;
    const autoWidth = collapsed ? 'calc(100% - 416px)' : 'calc(100% - 116px)';
    const isSaas = rainbondInfo?.is_saas || false;
    if (isNeedAuthz) {
      if (!isAuthorizationLoading && !licenseInfo) {
        return <Overdue currentUser={currentUser} title={'授权码无效'} desc={'联系企业管理员，更新授权码'} />;
      }

      let overdueTitle = '';
      const overdueDesc = '联系企业管理员，更新授权码';

      if (isLicense) {
        overdueTitle = '集群超出授权限制';
      } else if (isNode) {
        overdueTitle = '节点超出授权限制';
      } else if (isTime) {
        overdueTitle = '授权时间已过期';
      } else if (isMemory) {
        overdueTitle = '内存超出授权限制';
      }

      if (overdueTitle) {
        return <Overdue currentUser={currentUser} title={overdueTitle} desc={overdueDesc} />;
      }
    }
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
      isAuthorizationLoading ||
      !currentEnterprise ||
      !currentTeam ||
      !currentTeamPermissionsInfo
    ) {
      return <PageLoading />;
    }

    // 避免在 render 中触发副作用；迁移到生命周期里处理
    // if (
    //   teamName !== currentTeam?.team_name ||
    //   regionName !== (currentRegion && currentRegion?.team_region_name)
    // ) {
    //   this.load();
    // }
    if (upDataHeader) {
      this.upData();
    }
    let appID = globalUtil.getAppID();
    cookie.set('team_name', teamName);
    cookie.set('region_name', regionName);
    const componentID = globalUtil.getComponentID();
    const BillingFunction = rainbondUtil.isEnableBillingFunction();
    // 避免在 render 中调用 setState，这些逻辑已在生命周期中处理
    if (appID && (!currentApp || !groupDetail.ID)) {
      // this.fetchAppDetail 和状态更新已在 componentWillReceiveProps 中处理
      // return <PageLoading />;
    } else if (
      currentComponent &&
      currentComponent.service_alias == componentID
    ) {
      appID = currentComponent.group_id;
      // Refresh the component information
    } else if (componentID) {
      // 避免在 render 中发起请求；改由生命周期在参数变化时触发
      // return <GlobalHeader />;
    }
    // else 分支的 setState 也移除，避免在 render 中更新状态

    const mode =
      groupDetail && groupDetail.app_type === 'helm'
        ? 'helm'
        : this.getMode(appID || componentID);
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
            changeTeam={() => { setTimeout(() => { this.fetchPipePipeline(eid) }, 10); this.fetchGroup() }}
          />
        );
      }
      if(showHeader){
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
            changeTeam={() => { setTimeout(() => { this.fetchPipePipeline(eid) }, 10); this.fetchGroup() }}
          />
        );
      }
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
        currentTeam.tenant_actions,
        showPipeline,
        currentUser,
        rainbondInfo
      );
    } else if (mode === 'helm') {
      menuData = getAppMenuData(
        teamName,
        regionName,
        appID,
        currentTeam.tenant_actions
      );
    }
    const safeEnterprise = enterprise || {};
    const fetchLogo = rainbondUtil.fetchLogo(rainbondInfo, safeEnterprise) || logo;
    const SiteTitle = rainbondUtil.fetchSiteTitle(rainbondInfo);
    const showEnterprisebase = PluginUtil.isInstallPlugin(showPipeline, 'rainbond-enterprise-base');
    const pluginsLoaded = Array.isArray(showPipeline);
    const layout = () => {
      const team = userUtil.getTeamByTeamName(currentUser, teamName);
      const hasRegion = team && team.region && team.region.length && currentRegion;
      let isRegionMaintain = false;
      if (hasRegion) {
        isRegionMaintain =
          currentRegion.region_status === '3' &&
          !userUtil.isCompanyAdmin(currentUser);
      } else {
        // return <Redirect to="/" />;
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
      const isApp = showMenu ? (mode == 'team' ? true : !componentID) : false
      return (
          <Layout key={overflow}>
            <GlobalHeader
              key={
                currentEnterprise?.enterprise_id +
                currentTeam?.team_name +
                currentRegion?.team_region_name +
                appID
              }
              eid={currentEnterprise?.enterprise_id}
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
                  showMenu={isApp}
                />
              )}
              <div style={{ width: componentID ? '100%' : collapsed ? 'calc( 100% - 56px)' : 'calc( 100% - 200px)', }}>
                {this.state.GroupShow ?
                  <TransitionGroup
                    style={{
                      position: 'relative',
                      height: 'calc(100vh - 50px)',
                      overflow: 'hidden',
                      backgroundColor: globalUtil.getPublicColor('rbd-background-color')
                    }}>
                    <CSSTransition
                      timeout={700}
                      classNames="page-zoom"
                      unmountOnExit
                      key={this.props.location.pathname}
                    >
                      <Content
                        style={{
                          height: 'calc(100vh - 50px)',
                          overflow: overflow || 'auto',
                          width: '100%'
                        }}
                      >
                        <div
                        >
                          {renderContent()}
                          {showFooter && <CustomFooter />}
                        </div>
                      </Content>
                    </CSSTransition>
                  </TransitionGroup> :
                  (
                    <Content
                      style={{
                        height: 'calc(100vh - 64px)',
                        background: globalUtil.getPublicColor("rbd-background-color"),
                        overflow: 'auto',
                        width: '100%'
                      }}
                    >
                      <div
                        style={{
                          margin: !isApp ? '0px' : '24px 24px 0'
                        }}
                      >
                        {renderContent()}
                        {showFooter && <CustomFooter />}
                      </div>
                    </Content>
                  )
                }
              </div>
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
        {showAuthCompany && !isSaas && (
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
              eid={currentEnterprise ? currentEnterprise.enterprise_id : undefined}
              orders={orders}
            />
        )}
        {pluginsLoaded ? (
          showEnterprisebase && !isSaas ? null : (
            <CustomerServiceFloat isSaas={isSaas} />
          )
        ) : null}
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
