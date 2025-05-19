import React, { PureComponent } from 'react';
import { Button, Spin, Icon } from 'antd';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import globalUtil from '@/utils/global';
import roleUtil from '@/utils/newRole';
import NewGateway from '@/pages/NewGateway';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import Components from './components/components';
import App from './components/app';
import Gateway from './components/gateway';
import styles from './index.less';

@connect(({ teamControl, user }) => ({
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
  currentUser: user.currentUser,
}))
class SlidePanel extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      type: props.type,
      pageHeader: {},
      componentPermissions: {},
      appPermissions: {},
      routePermission: {},
      argetServicesPermission: {},
      certificatePermission: {}
    }
  }

  componentDidMount() {
    this.getPermissionInfo();
    this.fetchPipePipeline();
  }

  componentDidUpdate(prevProps) {
    if (this.props.componentID !== prevProps.componentID || this.props.type !== prevProps.type) {
      this.setState({
        isLoading: true,
        type: this.props.type
      }, () => {
        this.getPermissionInfo();
      });
    }
  }

  getPermissionInfo() {
    const { componentID, type, currentTeamPermissionsInfo } = this.props;
    const pageHeaderMap = {
      gateway: {
        titleSvg: pageheaderSvg.getSvg('gatewaySvg', 18),
      },
      components: {
        titleSvg: pageheaderSvg.getSvg('component', 18),
      }
    };

    const newState = {
      pageHeader: pageHeaderMap[type] || {},
    };

    if (type === 'gateway') {
      newState.routePermission = roleUtil.queryPermissionsInfo(
        currentTeamPermissionsInfo?.team,
        'team_route_manage'
      );
      newState.argetServicesPermission = roleUtil.queryPermissionsInfo(
        currentTeamPermissionsInfo?.team,
        'team_target_services'
      );
      newState.certificatePermission = roleUtil.queryPermissionsInfo(
        currentTeamPermissionsInfo?.team,
        'team_certificate'
      );
    } else if (type === 'components') {
      this.queryComponentDeatil();
      newState.componentPermissions = roleUtil.queryPermissionsInfo(
        currentTeamPermissionsInfo?.team,
        'app_overview',
        `app_${globalUtil.getAppID()}`
      );
    }

    this.setState(newState, () => {
      this.setState({
        isLoading: false
      });
    });
  }
  fetchPipePipeline = () => {
    const { dispatch } = this.props;
    const eid = this.props.currentUser.enterprise_id;
    dispatch({
      type: 'teamControl/fetchPluginUrl',
      payload: {
        enterprise_id: eid,
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
        this.setState({
          showPipeline: res.list
        })
      }
    })
  }
  queryComponentDeatil = () => {
    const teamName = globalUtil.getCurrTeamName();
    const componentID = globalUtil.getSlidePanelComponentID();
    if (componentID) {
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


  render() {
    const { isVisible } = this.props;
    const {
      type,
      pageHeader,
      componentPermissions,
      appPermissions,
      routePermission,
      argetServicesPermission,
      certificatePermission,
      isLoading
    } = this.state;
    return (
      <div className={`${styles.slidePanel} ${isVisible ? styles.visible : styles.hidden}`}>
        {isLoading ? (
          <Spin />
        ) : (
          <>
            {type === 'components' && (
              <Components
                componentID={globalUtil.getSlidePanelComponentID()}
                pageHeader={pageHeader}
                permissions={componentPermissions}
              />
            )}
            {type === 'gateway' && (
              <Gateway
                pageHeader={pageHeader}
                permissions={{
                  routePermission,
                  argetServicesPermission,
                  certificatePermission
                }}
              />
            )}
          </>
        )}
      </div>
    );
  }
}

export default SlidePanel;