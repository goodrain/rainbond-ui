import React, { PureComponent } from 'react';
import { Spin } from 'antd';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import globalUtil from '@/utils/global';
import roleUtil from '@/utils/newRole';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import deferredComponent from '../DeferredComponent';
import styles from './index.less';

const Components = deferredComponent(() => import('./components/components'));
const Gateway = deferredComponent(() => import('./components/gateway'));

@connect(({ teamControl }) => ({
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
class SlidePanel extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      type: props.type,
      pageHeader: {},
      componentPermissions: {},
      routePermission: {},
      argetServicesPermission: {},
      certificatePermission: {}
    }
  }

  componentDidMount() {
    this.getPermissionInfo();
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
    const { type, currentTeamPermissionsInfo } = this.props;
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

  handleLoadingCancel = () => {
    this.props.dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/overview`
      )
    );
    const iframe = document.querySelector('#myframe');
    iframe?.contentWindow?.postMessage({ type: 'TRIGGER_CLICK_BACKGROUND' }, '*');
  };

  render() {
    const { isVisible } = this.props;
    const {
      type,
      pageHeader,
      componentPermissions,
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
            {isVisible && type === 'components' && (
              <Components
                componentID={globalUtil.getSlidePanelComponentID()}
                pageHeader={pageHeader}
                permissions={componentPermissions}
                location={this.props.location}
                onLoadingCancel={this.handleLoadingCancel}
              />
            )}
            {isVisible && type === 'gateway' && (
              <Gateway
                pageHeader={pageHeader}
                permissions={{
                  routePermission,
                  argetServicesPermission,
                  certificatePermission
                }}
                onLoadingCancel={this.handleLoadingCancel}
              />
            )}
          </>
        )}
      </div>
    );
  }
}

export default SlidePanel;
