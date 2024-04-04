/* eslint-disable import/extensions */
/* eslint-disable prettier/prettier */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import globalUtil from '@/utils/global';
import roleUtil from '@/utils/newRole';
import ConfigurationHeader from './Header';
import ConfigurationTable from './Table';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
/* eslint react/no-array-index-key: 0 */

@connect(({ teamControl, enterprise }) => ({
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
export default class Configuration extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      appConfigGroupPermissions: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo&&this.props.currentTeamPermissionsInfo.team,"app_config_group",`app_${globalUtil.getAppID()}`)
      
    };
  }

  render() {
    const {
      currentEnterprise,
      currentTeam,
      currentRegionName,
      match
    } = this.props;
    const { appConfigGroupPermissions } = this.state;
    const { teamName, regionName, appID } = match.params;
    const parameter = {
      regionName,
      teamName,
      appID,
      appConfigGroupPermissions
    };
    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    if(!appConfigGroupPermissions.isAccess){
      return roleUtil.noPermission()
    }
    return (
      <ConfigurationHeader breadcrumbList={breadcrumbList}>
        <ConfigurationTable {...parameter} />
      </ConfigurationHeader>
    );
  }
}
