import React, { PureComponent } from 'react';
import { Spin } from 'antd';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import globalUtil from '@/utils/global';
import roleUtil from '@/utils/newRole';
import { connect } from 'dva';
import Components from './components/components';
import Gateway from './components/gateway';
import styles from './index.less';

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
              />
            )}
          </>
        )}
      </div>
    );
  }
}

export default SlidePanel;
