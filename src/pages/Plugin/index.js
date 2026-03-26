import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import roleUtil from '../../utils/newRole';
import globalUtil from '../../utils/global';
import Manage from './manage';

@connect(({ teamControl, enterprise }) => ({
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
class Index extends PureComponent {
  componentDidMount() {
    this.redirectToTeamPluginTabIfNeeded();
  }

  componentDidUpdate(prevProps) {
    const prevPluginId = prevProps.match && prevProps.match.params && prevProps.match.params.pluginId;
    const nextPluginId = this.props.match && this.props.match.params && this.props.match.params.pluginId;
    const permissionsChanged =
      prevProps.currentTeamPermissionsInfo !== this.props.currentTeamPermissionsInfo;
    if (prevPluginId !== nextPluginId || permissionsChanged) {
      this.redirectToTeamPluginTabIfNeeded();
    }
  }

  getOperationPermissions = () => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.queryPermissionsInfo(
      currentTeamPermissionsInfo && currentTeamPermissionsInfo.team,
      'team_plugin_manage'
    );
  };

  redirectToTeamPluginTabIfNeeded = () => {
    const { match, dispatch } = this.props;
    const { isAccess } = this.getOperationPermissions();
    const { pluginId } = match.params;

    if (!isAccess || pluginId) {
      return;
    }

    dispatch(
      routerRedux.replace(globalUtil.getTeamPluginTabPath())
    );
  };

  render() {
    const { match } = this.props;
    const { pluginId } = match.params;
    const operationPermissions = this.getOperationPermissions();
    const { isAccess } = operationPermissions;

    // 检查权限
    if (!isAccess) {
      return roleUtil.noPermission();
    }

    if (!pluginId) {
      return null;
    }

    return <Manage {...this.props} operationPermissions={operationPermissions} />;
  }
}

export default Index;
