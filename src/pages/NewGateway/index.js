import React, { Component } from 'react';
import { Spin } from 'antd';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import TolerantGateway from '../../components/TolerantGateway';
import GatewayApi from '../../components/GatewayApi'
// import HttpTable from '../../components/HttpTable';
// import TcpTable from '../../components/TcpTable';
import GatewayCertificate from './GatewayCertificate';
import GatewayRoute from './GatewayRoute';
// import GatewayMonitor from './GatewayMonitor';
import GatewayService from './GatewayService';
import { createEnterprise, createTeam } from '../../utils/breadcrumb';
import roleUtil from '../../utils/newRole';
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
            tabKey: 'route',
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
            routePermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'team_route_manage'),
            argetServicesPermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'team_target_services'),
            certificatePermission: roleUtil.queryPermissionsInfo(this.props.currentTeamPermissionsInfo && this.props.currentTeamPermissionsInfo.team, 'team_certificate'),
        };
    }
    componentDidMount() {
        const {routePermission, argetServicesPermission, certificatePermission} = this.state
        this.setState({
            tabKey: routePermission.isAccess ? 'route' : argetServicesPermission.isAccess ? 'service' : certificatePermission.isAccess ? 'certificate' : 'route'
        })
        this.handleBatchGateWay();
    }
    componentWillMount() {
        this.fetchPipePipeline();
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
                if (res && res.list.length) {
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
    handleTabChange = (key, open = false) => {
        const { batchGateway, gatewayShow } = this.state
        if (batchGateway && gatewayShow) {
            this.setState({ tabKeys: key, open: open });
        } else {
            this.setState({ tabKey: key, open: open });
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
                    <TolerantGateway  open={open} tabKey={tabKey} />
                );
            }
            return <GatewayApi  />;
        } else {
            if (tabKey === 'certificate') {
                return (
                    <GatewayCertificate  open={open} permission={certificatePermission}/>
                );
            } else if (tabKey === 'route') {
                return (
                    <GatewayRoute  open={open} onTabChange={this.handleTabChange} permission={routePermission}/>
                );
            } else if (tabKey === 'service') {
                return (
                    <GatewayService  open={open} permission={argetServicesPermission}/>
                );
            }

        };
    }
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
        const {
            currentEnterprise,
            currentTeam,
            currentRegionName
        } = this.props;
        const {
            batchGateway,
            gatewayShow,
            gatewayLoading,
            batchGatewayLoading,
            routePermission,
            argetServicesPermission,
            certificatePermission
        } = this.state;
        if(!routePermission.isAccess && !argetServicesPermission.isAccess && !certificatePermission.isAccess){
            return roleUtil.noPermission()
        }
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
                    tabList={this.handleTabList(isGateway)}
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
