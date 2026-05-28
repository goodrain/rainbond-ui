import React, { Component } from 'react'
import { Button, Tooltip, Dropdown, Menu, Icon } from 'antd'
import SlidePanel from '../../components/SlidePanel'
import GuideCarousel from '@/components/GuideCarousel'
import globalUtil from '@/utils/global'
import { connect } from 'dva';
import { Redirect, routerRedux } from 'dva/router';
import AppShape from './AppShape'
import PageHeaderSvg from '@/utils/pageHeaderSvg'
import AppHeader from '@/components/SlidePanel/components/app'
import roleUtil from '@/utils/newRole'
import rainbondUtil from '@/utils/rainbond'
import { formatMessage } from '@/utils/intl'
import styles from './Overview.less'

// 提取组件列表为独立组件
const ComponentList = ({ apps, onComponentClick }) => (
  <Menu className={styles.componentMenu}>
    {apps.map(app => (
      <Menu.Item
        key={app.service_alias}
        onClick={() => onComponentClick(app.service_alias)}
      >
        {app.service_cname}
      </Menu.Item>
    ))}
  </Menu>
);


@connect(({ teamControl, global }) => ({
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
  collapsed: global.collapsed,
  novices: global.novices,
}))

export default class Overview extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isVisible: false,
      isDev: process.env.NODE_ENV === 'development',  // 直接在初始化时判断环境
      components: [],
      apps: [],
      showIcons: false,
      appPermissions: {},
      componentPermissions: {},
      addComponentOrAppDetail: '',
      type: 'AppShape',
      isExiting: false,
      refresh: false,
      tableDataLoading: false,
      guideVisible: false,
      guideAutoOpened: false
    }
  }

  componentWillMount() {
    this.loadComponents();
  }

  componentDidMount() {
    this.getPermissionInfo();
    this.handleUrlParams();
    this.addPopStateListener();
    this.tryOpenGuideOnFirstVisit();
  }

  componentWillUnmount() {
    this.removePopStateListener();
  }

  componentDidUpdate(prevProps) {
    // 通过比较location变化来处理参数更新
    if (this.props.location !== prevProps.location) {
      this.handleUrlParams();
    }
    if (
      this.props.currentTeamPermissionsInfo !== prevProps.currentTeamPermissionsInfo
    ) {
      this.getPermissionInfo();
    }
    if (this.props.novices !== prevProps.novices) {
      this.tryOpenGuideOnFirstVisit();
    }
  }

  // 提取路由监听相关方法
  addPopStateListener = () => {
    window.addEventListener('popstate', this.handleUrlParams);
  }

  removePopStateListener = () => {
    window.removeEventListener('popstate', this.handleUrlParams);
  }

  tryOpenGuideOnFirstVisit = () => {
    const { novices } = this.props;
    const { guideAutoOpened } = this.state;
    if (!guideAutoOpened && rainbondUtil.handleNewbie(novices, 'applicationInfo')) {
      this.setState({
        guideVisible: true,
        guideAutoOpened: true
      });
    }
  }

  // 获取app的组件
  loadComponents = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'application/fetchApps',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        region_name: globalUtil.getCurrRegionName(),
        group_id: globalUtil.getAppID(),
        page: 1,
        page_size: 10000,
      },
      callback: data => {
        if (data && data.status_code === 200) {
          this.setState({
            apps: data.list || [],
            tableDataLoading: true
          });
        }
      }
    });
  };

  // 获取URL参数
  handleUrlParams = () => {
    // 获取URL参数
    const componentID = globalUtil.getSlidePanelComponentID()
    const type = globalUtil.getSlidePanelType()
    const refresh = globalUtil.getRefresh()
    // 更新状态x    
    this.setState({
      componentID,
      type,
      isVisible: (componentID !== '' || type !== '') && true,
      refresh
    });
  };

  toggleVisibility = () => {
    this.setState(prevState => ({
      isVisible: !prevState.isVisible
    }))
  }

  handleAppOverview = () => {
    const { dispatch } = this.props;
    const type = globalUtil.getSlidePanelType()
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}` + (type !== 'app' ? `?type=app` : '')
      ))
  }

  handleComponentOverview = (k8s_service_name) => {
    const { dispatch } = this.props;
    this.setState({
      addComponentOrAppDetail: '',
      type: 'AppShape'
    })
    const app = this.state.apps.find(app => app.service_alias === k8s_service_name);
    if (app?.status === "creating" && app.service_source !== 'kubeblocks') {
      dispatch(
        routerRedux.push(
          `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-check/${k8s_service_name}`
        )
      )
    } else {
      dispatch(
        routerRedux.push(
          `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/overview` + `?type=components&componentID=${k8s_service_name}&tab=overview`
        ))
    }

  }
  changeType = (type) => {
    this.setState({
      type
    })
  }
  getPermissionInfo() {
    const { currentTeamPermissionsInfo } = this.props;

    const newState = {};
    newState.appPermissions = roleUtil.queryTeamOrAppPermissionsInfo(
      currentTeamPermissionsInfo?.team,
      'app',
      `app_${globalUtil.getAppID()}`
    );
    newState.componentPermissions = roleUtil.queryPermissionsInfo(
      currentTeamPermissionsInfo?.team,
      'app_overview',
      `app_${globalUtil.getAppID()}`
    );
    this.setState(newState);
  }
  handleAddComponentOrAppDetail = (type) => {
    this.setState({
      addComponentOrAppDetail: type,
      type: 'AppShape'
    })
  }

  openGuide = () => {
    this.setState({
      guideVisible: true,
      guideAutoOpened: true
    });
  }

  closeGuide = () => {
    const { dispatch, novices } = this.props;
    const shouldPersistGuide = rainbondUtil.handleNewbie(
      novices,
      'applicationInfo'
    );
    this.setState({
      guideVisible: false,
      guideAutoOpened: true
    });
    if (shouldPersistGuide) {
      dispatch({
        type: 'global/putNewbieGuideConfig',
        payload: {
          arr: [{ key: 'applicationInfo', value: true }]
        }
      });
    }
  }

  getGuideContent = () => {
    const leftClickIcon = (
      <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <path d="M213.333333 571.093333v118.144A249.429333 249.429333 0 0 0 462.762667 938.666667h105.045333a249.429333 249.429333 0 0 0 249.429333-249.429334v-118.186666H213.333333z" fill="#71767E" />
        <path d="M462.762667 354.474667V262.570667a59.093333 59.093333 0 1 1 118.186666 0v91.904a59.093333 59.093333 0 1 1-118.186666 0z" fill="#71767E" />
        <path d="M213.333333 544.853333h295.381334v-105.984q-26.965333-3.84-47.189334-24.064-25.002667-25.002667-25.002666-60.330666V262.570667q0-35.370667 25.002666-60.330667 20.224-20.224 47.189334-24.106667V85.333333h-45.952A249.429333 249.429333 0 0 0 213.333333 334.762667v210.048z" fill="#597AFF" />
        <path d="M534.997333 544.853333h282.24V334.72A249.429333 249.429333 0 0 0 567.808 85.333333h-32.853333v92.8q27.008 3.84 47.232 24.106667 25.002667 24.96 25.002666 60.330667v91.904q0 35.328-25.002666 60.330666-20.224 20.224-47.189334 24.064v105.941334z" fill="#71767E" />
      </svg>
    );
    const rightClickIcon = (
      <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <path d="M213.333333 571.093333v118.144A249.429333 249.429333 0 0 0 462.762667 938.666667h105.045333a249.429333 249.429333 0 0 0 249.429333-249.429334v-118.186666H213.333333z" fill="#71767E" />
        <path d="M462.762667 354.474667V262.570667a59.093333 59.093333 0 1 1 118.186666 0v91.904a59.093333 59.093333 0 1 1-118.186666 0z" fill="#71767E" />
        <path d="M213.333333 544.853333h295.381334v-105.984q-26.965333-3.84-47.189334-24.064-25.002667-25.002667-25.002666-60.330666V262.570667q0-35.370667 25.002666-60.330667 20.224-20.224 47.189334-24.106667V85.333333h-45.952A249.429333 249.429333 0 0 0 213.333333 334.762667v210.048z" fill="#71767E" />
        <path d="M534.997333 544.853333h282.24V334.72A249.429333 249.429333 0 0 0 567.808 85.333333h-32.853333v92.8q27.008 3.84 47.232 24.106667 25.002667 24.96 25.002666 60.330667v91.904q0 35.328-25.002666 60.330666-20.224 20.224-47.189334 24.064v105.941334z" fill="#597AFF" />
      </svg>
    );
    const runningIcon = <img src="/images/running.svg" alt="组件" />;
    const gatewayIcon = <img src="/images/yun.svg" alt="网关" />;

    return {
      groups: [
        {
          key: 'details',
          title: formatMessage({ id: 'guideCarousel.appOverview.components.title' }),
          titleIcon: runningIcon,
          centerIcon: runningIcon,
          layout: 'line',
          titleHint: (
            <>
              {formatMessage({ id: 'guideCarousel.appOverview.components.titleHint.prefix' })}
              <strong style={{ color: "#fff" }}>
                {formatMessage({ id: 'guideCarousel.appOverview.components.titleHint.highlight' })}
              </strong>
              {formatMessage({ id: 'guideCarousel.appOverview.components.titleHint.suffix' })}
            </>
          ),
          leftAction: {
            subTitle: formatMessage({ id: 'guideCarousel.appOverview.components.leftClick.title' }),
            subTitleIcon: leftClickIcon
          },
          rightAction: {
            subTitle: formatMessage({ id: 'guideCarousel.appOverview.components.rightClick.title' }),
            subTitleIcon: rightClickIcon
          }
        },
        {
          key: 'overview',
          title: formatMessage({ id: 'guideCarousel.appOverview.gateway.title' }),
          titleIcon: gatewayIcon,
          centerIcon: gatewayIcon,
          layout: 'line',
          titleHint: (
            <>
              {formatMessage({ id: 'guideCarousel.appOverview.gateway.titleHint.prefix' })}
              <strong style={{ color: "#fff" }}>
                {formatMessage({ id: 'guideCarousel.appOverview.gateway.titleHint.highlight' })}
              </strong>
              {formatMessage({ id: 'guideCarousel.appOverview.gateway.titleHint.suffix' })}
            </>
          ),
          leftAction: {
            subTitle: formatMessage({ id: 'guideCarousel.appOverview.gateway.leftClick.title' }),
            subTitleIcon: leftClickIcon
          },
          rightAction: {
            subTitle: formatMessage({ id: 'guideCarousel.appOverview.gateway.rightClick.title' }),
            subTitleIcon: rightClickIcon
          }
        }
      ]
    };
  }
  // 渲染头部图标区域
  renderAppHeader = () => {
    const { appPermissions, componentPermissions, isVisible } = this.state;


    return (
      <div className={`${styles.headerWrapper} ${!isVisible ? styles.headerShow : styles.headerHide}`}>
        <AppHeader
          addComponentOrAppDetail={this.state.addComponentOrAppDetail}
          handleAddComponentOrAppDetail={this.handleAddComponentOrAppDetail}
          permissions={{
            componentPermissions,
            appPermissions
          }}
        />
      </div>
    )
  }


  render() {
    const { isDev, isVisible, componentID, type, apps, addComponentOrAppDetail, isExiting, refresh, tableDataLoading, guideVisible } = this.state;
    const { collapsed } = this.props;
    const guideContent = this.getGuideContent();
    const svg = (
      <svg t="1742983760513" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3443" width="24" height="24">
        <path d="M815.8 318.8L705.9 209c-19.5-19.5-19.5-51.2 0-70.7l59.7-59.7c19.5-19.5 51.2-19.5 70.7 0l109.8 109.8c19.5 19.5 19.5 51.2 0 70.7l-59.7 59.7c-19.5 19.6-51.1 19.6-70.6 0zM751.2 453.4c18.8-18.8 23.5-44.5 10.5-57.4L628.1 262.3c-12.9-12.9-38.6-8.2-57.4 10.5L81.3 749.2c-9.4 9.4-15.3 21.4-16.5 33.5l0.2 133.8c-2.4 25.2 17.4 45 42.6 42.6l133.8 1.1c12.1-1.2 24.2-7.1 33.5-16.5l476.3-490.3zM908.9 831.7H559.8c-13.4 0-26.2 5.3-35.6 14.8-17.1 17.2-45.3 46.3-68.8 70.7-15.2 15.8-4 42.1 17.9 42.1h435.3c28 0 50.9-22.9 50.9-50.9v-26.3c-0.2-27.7-22.8-50.4-50.6-50.4z" p-id="3444" fill="#8383ac">
        </path>
      </svg>
    )
    return (
      <div className={`${styles.container} ${collapsed ? styles.collapsed : ''}`} key={refresh}>
        <button
          type="button"
          className={styles.guideEntryButton}
          onClick={this.openGuide}
        >
          <span className={styles.guideEntryIcon}>
            <Icon type="bulb" />
          </span>
        </button>
        {this.renderAppHeader()}
        {isDev ? (
          <>
            {tableDataLoading &&
              <ComponentList
                apps={apps}
                onComponentClick={this.handleComponentOverview}
              />
            }
          </>
        ) : (
          <>
            {tableDataLoading &&
              <AppShape
                iframeHeight={'calc(100vh - 120px)'}
                group_id={globalUtil.getAppID()}
                apps={apps}
              />
            }

          </>
        )}
        <SlidePanel
          isVisible={isVisible}
          componentID={componentID}
          type={type}
          location={this.props.location}
        />
        <GuideCarousel
          visible={guideVisible}
          title={guideContent.title}
          description={guideContent.description}
          groups={guideContent.groups}
          onClose={this.closeGuide}
        />
      </div>
    );
  }
}
