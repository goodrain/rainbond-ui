import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { FormattedMessage } from 'umi';
import { routerRedux } from 'dva/router';
import VirtualMachine from './virtual-machine';
import roleUtil from '../../utils/newRole';
import globalUtil from '../../utils/global';
import { requestedVmTargetGroup, vmCreationEntryPermissions } from './vmCreationEntry';

@connect(({ teamControl, enterprise }) => ({
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}), null, null, { pure: false })
export default class Main extends PureComponent {
  render() {
    const { match = {} } = this.props;
    const groupId = requestedVmTargetGroup(this.props, globalUtil.getAppID());
    const permission = vmCreationEntryPermissions(roleUtil, this.props.currentTeamPermissionsInfo?.team, groupId);
    if (!(groupId ? permission.canCreateInApplication : permission.canCreateApplication)) return roleUtil.noPermission();
    const type = (match.params?.type || 'VirtualMachine').split('?')[0];
    if (type !== 'VirtualMachine') return <FormattedMessage id="teamAdd.create.error" />;
    return <VirtualMachine {...this.props} onCancel={() => this.props.dispatch(routerRedux.replace({
        pathname: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/wizard`,
        query: groupId ? { group_id: groupId } : {}
      }))} />;
  }
}
