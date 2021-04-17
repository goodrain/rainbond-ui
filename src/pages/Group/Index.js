/* eslint-disable no-nested-ternary */
/* eslint-disable import/extensions */
/* eslint-disable no-unused-expressions */
import globalUtil from '@/utils/global';
import roleUtil from '@/utils/role';
import { Spin } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Fragment, PureComponent } from 'react';
import Group from './Group';
import Helm from './Helm';

// eslint-disable-next-line react/no-multi-comp
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
    } else {
      this.fetchAppDetail();
    }
  }
  componentWillReceiveProps(nextProps) {
    const {
      match: {
        params: { appID }
      }
    } = nextProps;
    const { appID: cldAppID } = this.state;

    if (appID !== cldAppID) {
      this.setState(
        {
          appID,
          loading: true
        },
        () => {
          this.fetchAppDetail();
        }
      );
    }
  }
  getGroupId() {
    const { params } = this.props.match;
    return params.appID;
  }

  fetchAppDetail = () => {
    const { dispatch } = this.props;
    const { teamName, regionName, appID } = this.props.match.params;
    dispatch({
      type: 'application/fetchGroupDetail',
      payload: {
        team_name: teamName,
        region_name: regionName,
        group_id: appID
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({
            currApp: res.bean,
            loading: false
          });
        }
      },
      handleError: res => {
        if (res && res.code === 404) {
          dispatch(
            routerRedux.push(`/team/${teamName}/region/${regionName}/apps`)
          );
        }
      }
    });
  };

  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };

  render() {
    const { loading, currApp } = this.state;
    const appType = currApp && currApp.app_type;
    // Group
    return (
      <Fragment>
        {loading ? (
          <Spin />
        ) : appType === 'helm' ? (
          <Helm {...this.props} {...this.state} />
        ) : (
          <Group {...this.props} {...this.state} />
        )}
      </Fragment>
    );
  }
}
