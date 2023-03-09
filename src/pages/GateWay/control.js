import React, { Component } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import DefaultGateway from '../../components/defaultGateway';
import GatewayApi from '../../components/GatewayApi'
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
      tabKeys: 'default',
      isGateway: true
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
    const { isGateway } = this.state
    if(isGateway){
    this.setState({ tabKeys: key, open: false });
    }else{
      this.setState({ tabKey: key, open: false });
    }
  };
  handlePermissions = type => {
    const { currentTeamPermissionsInfo } = this.props;
    return roleUtil.querySpecifiedPermissionsInfo(
      currentTeamPermissionsInfo,
      type
    );
  };
  renderContent = () => {
    const { appID } = this.props.match.params;
    const { open, tabKey, operationPermissions, tabKeys, isGateway } = this.state;
    if(isGateway){
      if (tabKeys === 'default') {
        return (
          <DefaultGateway operationPermissions={operationPermissions} open={open} tabKey={tabKey}/>
        );
      }
      return <GatewayApi operationPermissions={operationPermissions}/>;
    }else{
      if (tabKey === 'http') {
        return (
          <HttpTable operationPermissions={operationPermissions} open={open} />
        );
      }
      return <TcpTable operationPermissions={operationPermissions} />;
    }

  };

  render() {
    const { currentEnterprise, currentTeam, currentRegionName } = this.props;
    const { isGateway } = this.state;
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
        tabActiveKey={isGateway ? this.state.tabKeys : this.state.tabKey}
        breadcrumbList={breadcrumbList}
        tabList={isGateway ? [
          {
            key: 'default',
            tab: formatMessage({id:'teamGateway.control.table.default'}),
          },
          {
            key: 'GatewayApi',
            tab: formatMessage({id:'teamGateway.control.table.GatewayApi'}),
          },
        ] : 
        [
          {
            key: 'http',
            tab: 'HTTP',
          },
          {
            key: 'tcp',
            tab: 'TCP/UDP',
          },
        ]
      }
        onTabChange={this.handleTabChange}
      >
        {this.renderContent()}
      </PageHeaderLayout>
    );
  }
}

export default Control;
