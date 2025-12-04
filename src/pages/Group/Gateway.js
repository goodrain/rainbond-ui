import { connect } from 'dva';
import { Spin, Button } from 'antd';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import TolerantGateway from '@/components/TolerantGateway';
import GatewayApi from '../../components/GatewayApi'
// import HttpTable from '../../components/HttpTable';
// import TcpTable from '../../components/TcpTable';
// import GatewayMonitor from '../NewGateway/GatewayMonitor';
import GatewayCertificate from '../NewGateway/GatewayCertificate';
import GatewayRoute from '../NewGateway/GatewayRoute';
import GatewayService from '../NewGateway/GatewayService';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import pageheaderSvg from '@/utils/pageHeaderSvg';
import {
  createApp,
  createEnterprise,
  createTeam
} from '../../utils/breadcrumb';
import globalUtil from '../../utils/global';
import roleUtil from '../../utils/newRole';

/* eslint react/no-array-index-key: 0 */

@connect(({ teamControl, enterprise, user }) => ({
  currentTeam: teamControl.currentTeam,
  currentRegionName: teamControl.currentRegionName,
  currentEnterprise: enterprise.currentEnterprise,
  currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
  currUser: user.currentUser,
}))
export default class AppGatewayList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      appDetail: {},
      tabKey:'route',
      open:
        this.props.match &&
          this.props.match.params &&
          this.props.match.params.types &&
          this.props.match.params.types
          ? this.props.match.params.types
          : false,
      tabKeys: 'default',
      gatewayShow: false,
      batchGateway: false,
      batchGatewayLoading: false,
      gatewayLoading: false,
      routePermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'app_route_manage',`app_${this.getGroupId()}`),
      argetServicesPermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'app_target_services',`app_${this.getGroupId()}`),
      certificatePermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'app_certificate',`app_${this.getGroupId()}`),
    };
  }
  componentWillMount() {
    this.fetchPipePipeline();
    this.handleBatchGateWay();
    const {routePermission, argetServicesPermission, certificatePermission} = this.state
    this.setState({
        tabKey: routePermission.isAccess ? 'route' : argetServicesPermission.isAccess ? 'service' : certificatePermission.isAccess ? 'certificate' : 'route'
    })
  }

  componentDidMount() {
    this.fetchAppDetail();
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
        this.setState({
          gatewayLoading: true
        })
        if (res && res.list) {
          res.list.map(item => {
            if (item.name == "rainbond-gateway-base") {
              this.setState({
                gatewayShow: true,
                gatewayLoading: true
              })
            } else {
              this.setState({
                gatewayLoading: true
              })
            }
          })
        }
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
        this.setState({
          batchGatewayLoading: true
        })
        if (res && res.list) {
          if (res.list.length > 0) {
            this.setState({
              batchGateway: true,
              batchGatewayLoading: true
            })
          } else {
            this.setState({
              batchGatewayLoading: true
            })
          }
        }
      },
      handleError: data => {
        this.setState({
          batchGatewayLoading: true
        })
      }
    })
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
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
            )
          );
        }
      }
    });
  };
  handleTabChange = (key, open = false) => {
    const { batchGateway, gatewayShow } = this.state
    if (batchGateway && gatewayShow) {
      this.setState({ tabKeys: key, open: open });
    } else {
      this.setState({ tabKey: key, open: open });
    }
  };

  renderContent = () => {
    const { appID } = this.props.match.params;
    const { 
      open, 
      tabKey, 
      operationPermissions, 
      tabKeys, 
      batchGateway, 
      gatewayShow,
      routePermission, 
      argetServicesPermission, 
      certificatePermission 
     } = this.state;
    if (batchGateway && gatewayShow) {
      if (tabKeys === 'default') {
        return (
          <TolerantGateway  open={open} tabKey={tabKey} appID={appID} />
        );
      }
      return <GatewayApi  appID={appID} />;
    } else {
      if (tabKey === 'certificate') {
        return (
          <GatewayCertificate  open={open} appID={appID} permission={certificatePermission}/>
        );
      } else if (tabKey === 'route') {
        return (
          <GatewayRoute  open={open} onTabChange={this.handleTabChange} appID={appID} permission={routePermission}/>
        );
      } else if (tabKey === 'service') {
        return (
          <GatewayService  open={open} appID={appID} permission={argetServicesPermission}/>
        );
      }
    }
  };
  handleTabList = (isGateway) => {
    const { routePermission, argetServicesPermission, certificatePermission } = this.state
    let arr = []
    if (routePermission.isAccess) {
        arr.push({
            key: 'route',
            tab: formatMessage({ id: 'teamNewGateway.NewGateway.index.management' }),
        })
    }
    if (argetServicesPermission.isAccess) {
        arr.push({
            key: 'service',
            tab: formatMessage({ id: 'teamNewGateway.NewGateway.index.Services' }),
        })
    }
    if (certificatePermission.isAccess) {
        arr.push({
            key: 'certificate',
            tab: formatMessage({ id: 'teamNewGateway.NewGateway.index.certificate' }),
        })
    }
    if (isGateway) {
        return [
            {
                key: 'default',
                tab: formatMessage({ id: 'teamGateway.control.table.default' }),
            },
            {
                key: 'GatewayApi',
                tab: formatMessage({ id: 'teamGateway.control.table.GatewayApi' }),
            },
        ]
    } else {
        return arr
    }

}

  render() {
    const { currentTeam, currentEnterprise, currentRegionName } = this.props;
    const { appDetail, batchGateway, gatewayShow, gatewayLoading, batchGatewayLoading } = this.state;
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
    const isGateway = batchGateway && gatewayShow

    return (
      <>{gatewayLoading && batchGatewayLoading ? (
        <PageHeaderLayout
          breadcrumbList={breadcrumbList}
          title={formatMessage({ id: 'appGateway.title' })}
          content={formatMessage({ id: 'appGateway.desc' })}
          titleSvg={pageheaderSvg.getSvg('gatewaySvg', 18)}
          tabActiveKey={isGateway ? this.state.tabKeys : this.state.tabKey}
          tabList={this.handleTabList(isGateway)}
          onTabChange={this.handleTabChange}
          extraContent={
            <Button onClick={() => {
              const { dispatch } = this.props;
              dispatch(
                routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${globalUtil.getAppID()}/overview`)
              );
            }} icon="home">
              {formatMessage({ id: 'menu.app.dashboard' })}
            </Button>
          }
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
