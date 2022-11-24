import React, { Component } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import HttpTable from '../../components/HttpTable';
import TcpTable from '../../components/TcpTable';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import roleUtil from '../../utils/role';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import globalUtil from '../../utils/global';

@connect(({ user, teamControl, enterprise }) => ({
  currUser: user.currentUser,
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
}))
class Control extends Component {
  constructor(props) {
    super(props);
    this.state = {
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
      operationPermissions: this.handlePermissions('queryControlInfo'),
    };
  }
  componentWillMount() {
    const { dispatch } = this.props;
    const {
      operationPermissions: { isAccess },
    } = this.state;

    if (!isAccess) {
      globalUtil.withoutPermission(dispatch);
    }
  }
  handleTabChange = key => {
    this.setState({ tabKey: key, open: false });
  };
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };
  renderContent = () => {
    const { open, tabKey, operationPermissions } = this.state;
    if (tabKey === 'http') {
      return (
        <HttpTable operationPermissions={operationPermissions} open={open} />
      );
    }
    return <TcpTable operationPermissions={operationPermissions} />;
  };

  render() {
    const { currentEnterprise, currentTeam, currentRegionName } = this.props;
    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: formatMessage({id: 'teamGateway.strategy.manage'}) });

    return (
      <PageHeaderLayout
        title={formatMessage({id: 'teamGateway.strategy.title'})}
        titleSvg={pageheaderSvg.getSvg('gatewaySvg',18)}
        tabActiveKey={this.state.tabKey}
        breadcrumbList={breadcrumbList}
        tabList={[
          {
            key: 'http',
            tab: 'HTTP',
          },
          {
            key: 'tcp',
            tab: 'TCP/UDP',
          },
        ]}
        onTabChange={this.handleTabChange}
      >
        {this.renderContent()}
      </PageHeaderLayout>
    );
  }
}

export default Control;
