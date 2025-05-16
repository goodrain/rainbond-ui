import React, { Component } from 'react'
import { Button, Tooltip, Dropdown, Menu, Icon } from 'antd'
import SlidePanel from '../../components/SlidePanel'
import globalUtil from '@/utils/global'
import { connect } from 'dva';
import { Redirect, routerRedux } from 'dva/router';
import AppShape from './AppShape'
import PageHeaderSvg from '@/utils/pageHeaderSvg'
import AppHeader from '@/components/SlidePanel/components/app'
import EditorTopology from './EditorTopology';
import roleUtil from '@/utils/newRole'
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


@connect(({ teamControl }) => ({
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
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
      isExiting: false
    }
  }

  componentDidMount() {
    if (this.state.isDev) {
      this.loadComponents();
    }
    this.getPermissionInfo();
    this.handleUrlParams();
    this.addPopStateListener();
  }

  componentWillUnmount() {
    this.removePopStateListener();
  }

  componentDidUpdate(prevProps) {
    // 通过比较location变化来处理参数更新
    if (this.props.location !== prevProps.location) {
      this.handleUrlParams();
    }
  }

  // 提取路由监听相关方法
  addPopStateListener = () => {
    window.addEventListener('popstate', this.handleUrlParams);
  }

  removePopStateListener = () => {
    window.removeEventListener('popstate', this.handleUrlParams);
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
            tableDataLoading: false
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
    // 更新状态x    
    this.setState({
      componentID,
      type,
      isVisible: (componentID !== '' || type !== '') && true
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
    if (app.status === "creating") {
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

  handleChangeType = (newType) => {
    if (this.state.type === 'EditorTopology') {
      this.setState({ isExiting: true });
      setTimeout(() => {
        this.setState({
          isExiting: false,
          type: newType
        });
      }, 400);
    } else {
      this.setState({ type: newType });
    }
  }

  render() {
    const { isDev, isVisible, componentID, type, apps, addComponentOrAppDetail, isExiting } = this.state;
    const svg = (
      <svg t="1742983760513" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3443" width="24" height="24">
        <path d="M815.8 318.8L705.9 209c-19.5-19.5-19.5-51.2 0-70.7l59.7-59.7c19.5-19.5 51.2-19.5 70.7 0l109.8 109.8c19.5 19.5 19.5 51.2 0 70.7l-59.7 59.7c-19.5 19.6-51.1 19.6-70.6 0zM751.2 453.4c18.8-18.8 23.5-44.5 10.5-57.4L628.1 262.3c-12.9-12.9-38.6-8.2-57.4 10.5L81.3 749.2c-9.4 9.4-15.3 21.4-16.5 33.5l0.2 133.8c-2.4 25.2 17.4 45 42.6 42.6l133.8 1.1c12.1-1.2 24.2-7.1 33.5-16.5l476.3-490.3zM908.9 831.7H559.8c-13.4 0-26.2 5.3-35.6 14.8-17.1 17.2-45.3 46.3-68.8 70.7-15.2 15.8-4 42.1 17.9 42.1h435.3c28 0 50.9-22.9 50.9-50.9v-26.3c-0.2-27.7-22.8-50.4-50.6-50.4z" p-id="3444" fill="#8383ac">
        </path>
      </svg>
    )
    return (
      <div className={styles.container}>
        {this.renderAppHeader()}
        {isDev ? (
          <>
            <ComponentList
              apps={apps}
              onComponentClick={this.handleComponentOverview}
            />
          </>
        ) : (
          <>
            <AppShape
              iframeHeight={'calc(100vh - 108px)'}
              group_id={globalUtil.getAppID()}
              apps={apps}
            />
            {type == 'EditorTopology' && (
              <div
                className={`${styles.content_container} ${styles.animatedContainer} ${isExiting ? styles.exit : ''}`}
                style={{ width: '100%', height: 'calc(100vh - 60px)' }}
              >
                <EditorTopology
                  iframeHeight={'calc(100vh - 108px)'}
                  group_id={globalUtil.getAppID()}
                  changeType={types => {
                    this.changeType(types);
                  }}
                />
              </div>
            )}
          </>
        )}
        {!isVisible && addComponentOrAppDetail == '' && type != 'EditorTopology' && (
          <Tooltip title="编辑模式" placement="right">
            <div className={styles.topoBtn} onClick={() => this.changeType('EditorTopology')}>
              {svg}
            </div>
          </Tooltip>
        )}
        {type == 'EditorTopology' &&
          <Button
            onClick={() => this.handleChangeType('AppShape')}
            style={{ position: 'absolute', top: 72, right: 6, zIndex: 999 }}
            type='link'
          >
            <Icon type="close" style={{ fontSize: 20 }} />
          </Button>
        }
        <SlidePanel
          isVisible={isVisible}
          componentID={componentID}
          type={type}
        />
      </div>
    );
  }
}