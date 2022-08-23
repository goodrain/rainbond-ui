import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import HttpTable from '../../components/HttpTable';
import TcpTable from '../../components/TcpTable';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import {
  createApp,
  createEnterprise,
  createTeam
} from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/role';

/* eslint react/no-array-index-key: 0 */

@connect(({ teamControl, enterprise }) => ({
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo
}))
export default class AppGatewayList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      appDetail: {},
      tabKey:
        props.match &&
        props.match.params &&
        props.match.params.types &&
        props.match.params.types
          ? props.match.params.types
          : 'http',
      open:
        this.props.match &&
        this.props.match.params &&
        this.props.match.params.types &&
        this.props.match.params.types
          ? this.props.match.params.types
          : false,
      operationPermissions: this.handlePermissions('queryControlInfo')
    };
  }
  componentWillMount() {
    const { dispatch } = this.props;
    const {
      operationPermissions: { isAccess }
    } = this.state;

    if (!isAccess) {
      globalUtil.withoutPermission(dispatch);
    }
  }

  componentDidMount() {
    this.fetchAppDetail();
  }

  getGroupId = () => {
    const { params } = this.props.match;
    return params.appID;
  };
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };
  fetchAppDetail = () => {
    const { dispatch, match } = this.props;
    const { teamName, regionName, appID } = match.params;
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
            appDetail: res.bean
          });
        }
      },
      handleError: res => {
        if (res && res.code === 404) {
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps`
            )
          );
        }
      }
    });
  };
  handleTabChange = key => {
    this.setState({ tabKey: key, open: false });
  };

  renderContent = () => {
    const { appID } = this.props.match.params;
    const { open, tabKey, operationPermissions } = this.state;
    if (tabKey === 'http') {
      return (
        <HttpTable
          operationPermissions={operationPermissions}
          appID={appID}
          open={open}
        />
      );
    }
    return (
      <TcpTable operationPermissions={operationPermissions} appID={appID} />
    );
  };

  render() {
    const { currentTeam, currentEnterprise, currentRegionName } = this.props;
    const { appDetail } = this.state;
    let breadcrumbList = [];
    breadcrumbList = createApp(
      createTeam(
        createEnterprise(breadcrumbList, currentEnterprise),
        currentTeam,
        currentRegionName
      ),
      currentTeam,
      currentRegionName,
      { appName: appDetail.group_name, appID: appDetail.group_id }
    );
    return (
      <PageHeaderLayout
        breadcrumbList={breadcrumbList}
        title={formatMessage({id: 'appGateway.title'})}
        content={formatMessage({id: 'appGateway.desc'})}
        tabList={[
          {
            key: 'http',
            tab: 'HTTP'
          },
          {
            key: 'tcp',
            tab: 'TCP/UDP'
          }
        ]}
        onTabChange={this.handleTabChange}
      >
        {this.renderContent()}
      </PageHeaderLayout>
    );
  }
}
