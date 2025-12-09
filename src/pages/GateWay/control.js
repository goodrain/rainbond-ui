import React, { Component } from 'react';
import { Spin } from 'antd';
import { connect } from 'dva';
import { formatMessage } from '@/utils/intl';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import TolerantGateway from '@/components/TolerantGateway';
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
      gatewayShow: false,
      batchGateway: false,
      batchGatewayLoading: false,
      gatewayLoading: false
    };
  }
  componentDidMount() {
    this.handleBatchGateWay();
  }
  componentWillMount() {
    this.fetchPipePipeline();
    const { dispatch } = this.props;
    const {
      operationPermissions: { isAccess },
    } = this.state;

    if (!isAccess) {
      globalUtil.withoutPermission(dispatch);
    }
  }
  fetchPipePipeline = (eid) => {
    const { dispatch, currUser } = this.props;
    dispatch({
      type: 'teamControl/fetchPluginUrl',
      payload: {
        enterprise_id: currUser.enterprise_id,
        region_name: globalUtil.getCurrRegionName()
      },
      callback: res => {
        if (res && res.list.length ){
          res.list.map(item => {
            if (item.name == "rainbond-gateway-base") {
              this.setState({
                gatewayShow: true,
              })
            }
          })
        }
        this.setState({
          gatewayLoading: true
        })
      },
      handleError: data => {
        this.setState({
          gatewayLoading: true
        })
      }
    })
  }
  handleBatchGateWay = () => {
    const { dispatch, currUser } = this.props
    const regionName = globalUtil.getCurrRegionName()
    dispatch({
      type: 'gateWay/getBatchGateWay',
      payload: {
        enterprise_id: currUser.enterprise_id,
        region_name: regionName
      },
      callback: res => {
        if (res && res.list) {
          this.setState({
            batchGateway: (res.list.length > 0) ? true : false,
            batchGatewayLoading: true
          })
        }
      },
      handleError: data => {
        this.setState({
          batchGatewayLoading: true
        })
      }
    })
  }
  handleTabChange = key => {
    const { batchGateway, gatewayShow } = this.state
    if (batchGateway && gatewayShow) {
      this.setState({ tabKeys: key, open: false });
    } else {
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
    const { open, tabKey, operationPermissions, tabKeys, batchGateway, gatewayShow } = this.state;
    if (batchGateway && gatewayShow) {
      if (tabKeys === 'default') {
        return (
          <TolerantGateway operationPermissions={operationPermissions} open={open} tabKey={tabKey} />
        );
      }
      return <GatewayApi operationPermissions={operationPermissions} />;
    } else {
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
    const { batchGateway, gatewayShow, gatewayLoading, batchGatewayLoading } = this.state;
    let breadcrumbList = [];
    breadcrumbList = createTeam(
      createEnterprise(breadcrumbList, currentEnterprise),
      currentTeam,
      currentRegionName
    );
    breadcrumbList.push({ title: formatMessage({ id: 'teamGateway.strategy.manage' }) });
    const isGateway = batchGateway && gatewayShow
    return (
      <>{gatewayLoading && batchGatewayLoading ? (
        <PageHeaderLayout
          title={formatMessage({ id: 'teamGateway.strategy.title' })}
          titleSvg={pageheaderSvg.getSvg('gatewaySvg', 18)}
          tabActiveKey={isGateway ? this.state.tabKeys : this.state.tabKey}
          breadcrumbList={breadcrumbList}
          tabList={isGateway ? [
            {
              key: 'default',
              tab: formatMessage({ id: 'teamGateway.control.table.default' }),
            },
            {
              key: 'GatewayApi',
              tab: formatMessage({ id: 'teamGateway.control.table.GatewayApi' }),
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
      ) : (
        <div style={{ width: 'calc( 100vw - 68px)', height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Spin size="large" />
        </div>
      )}</>

    );
  }
}

export default Control;
