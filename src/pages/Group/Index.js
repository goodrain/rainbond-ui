/* eslint-disable import/extensions */
/* eslint-disable no-nested-ternary */
import globalUtil from '@/utils/global';
import roleUtil from '@/utils/role';
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
      operationPermissions: this.handlePermissions('queryControlInfo'),
      appPermissions: this.handlePermissions('queryAppInfo'),
      appConfigGroupPermissions: this.handlePermissions(
        'queryAppConfigGroupInfo'
      ),
      componentPermissions: this.handlePermissions('queryComponentInfo')
    };
  }
  componentWillMount() {
    const { dispatch } = this.props;
    const {
      appPermissions: { isAccess }
    } = this.state;
    if (!isAccess) {
      globalUtil.withoutPermission(dispatch);
    }
  }

  getGroupId() {
    const { params } = this.props.match;
    return params.appID;
  }

  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };

  render() {
    const { groupDetail } = this.props;
    return (
      <Fragment>
        {groupDetail && <Group {...this.props} {...this.state} /> }   
      </Fragment>
    );
  }
}
