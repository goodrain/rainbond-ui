/* eslint-disable import/extensions */
/* eslint-disable no-nested-ternary */
import globalUtil from '@/utils/global';
import roleUtil from '@/utils/newRole';
import { Spin } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import Group from './Group';
import ScrollerX from '@/components/ScrollerX';
import Helm from './Helm';

@connect(
  ({ teamControl, application }) => ({
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
    groupDetail: application.groupDetail || {}
  }),
  null,
  null,
  {
    pure: false
  }
)
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      currApp: {},
      loading: true,
      appID: this.getGroupId(),
    };
  }
  componentWillMount() {
  }

  getGroupId() {
    const { params } = this.props.match;
    return params.appID;
  }


  render() {
    const { groupDetail, currentTeamPermissionsInfo } = this.props;
    const { appID } = this.state;
    const appPermissions = roleUtil.queryTeamOrAppPermissionsInfo(
      currentTeamPermissionsInfo && currentTeamPermissionsInfo.team,
      'app',
      `app_${appID}`
    );
    const componentPermissions = roleUtil.queryPermissionsInfo(
      currentTeamPermissionsInfo && currentTeamPermissionsInfo.team,
      'app_overview',
      `app_${appID}`
    );
    const { isAppOverview } = appPermissions;
    if(!isAppOverview){
      return roleUtil.noPermission()
    }
    return (
      <ScrollerX sm={1040}>
        {JSON.stringify(groupDetail) === '{}' ? (
          <Group {...this.props} {...this.state} appPermissions={appPermissions} componentPermissions={componentPermissions} />
        ) : groupDetail.app_type === 'helm' ? (
          <Group {...this.props} {...this.state} appPermissions={appPermissions} componentPermissions={componentPermissions} />
        ) : (
          <Group {...this.props} {...this.state} appPermissions={appPermissions} componentPermissions={componentPermissions} />
        )}
      </ScrollerX>
    );
  }
}
