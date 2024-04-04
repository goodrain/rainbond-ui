/* eslint-disable import/extensions */
/* eslint-disable no-nested-ternary */
import globalUtil from '@/utils/global';
import roleUtil from '@/utils/newRole';
import { Spin } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import Group from './Group';
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
      componentPermissions: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'app_overview',  `app_${this.getGroupId()}` ),
      appPermissions: roleUtil.queryTeamOrAppPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'app', `app_${this.getGroupId()}`),
    };
  }
  componentWillMount() {
  }

  getGroupId() {
    const { params } = this.props.match;
    return params.appID;
  }


  render() {
    const { groupDetail } = this.props;
    const { isAppOverview } = this.state.appPermissions
    if(!isAppOverview){
      return roleUtil.noPermission()
    }
    return (
      <Fragment>
        {JSON.stringify(groupDetail) === '{}' ? (
          <Group {...this.props} {...this.state} />
        ) : groupDetail.app_type === 'helm' ? (
          <Group {...this.props} {...this.state} />
        ) : (
          <Group {...this.props} {...this.state} />
        )}
      </Fragment>
    );
  }
}
