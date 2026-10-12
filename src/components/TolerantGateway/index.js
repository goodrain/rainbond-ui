import React, { Component } from 'react';
import { connect } from 'dva';
import { Tabs } from 'antd';
import { formatMessage } from '@/utils/intl';
import roleUtil from '@/utils/newRole';
import GatewayCertificate from '../../pages/NewGateway/GatewayCertificate';
import GatewayRoute from '../../pages/NewGateway/GatewayRoute';
import GatewayService from '../../pages/NewGateway/GatewayService';
import styles from './index.less'

const TabPane = Tabs.TabPane;
@connect(({ teamControl }) => ({
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
}))
class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            routePermission: { isAccess: false },
            argetServicesPermission: { isAccess: false },
            certificatePermission: { isAccess: false },
            tabKeys: props.tabKey || 'route',
            open: props.open || false,
        }
    }
    componentDidMount() {
        this.syncPermissions()
    }
    componentDidUpdate(prevProps) {
        if (
            prevProps.currentTeamPermissionsInfo !== this.props.currentTeamPermissionsInfo ||
            prevProps.appID !== this.props.appID ||
            prevProps.tabKey !== this.props.tabKey ||
            prevProps.open !== this.props.open
        ) {
            this.syncPermissions()
        }
    }
    getInitialTabKey = permissions => {
        const permissionByTab = {
            route: permissions.routePermission,
            service: permissions.argetServicesPermission,
            certificate: permissions.certificatePermission,
        };
        const requestedTab = this.props.tabKey;
        if (requestedTab && permissionByTab[requestedTab] && permissionByTab[requestedTab].isAccess) {
            return requestedTab;
        }
        if (permissions.routePermission.isAccess) return 'route';
        if (permissions.argetServicesPermission.isAccess) return 'service';
        if (permissions.certificatePermission.isAccess) return 'certificate';
        return 'route';
    }
    syncPermissions = () => {
        const { currentTeamPermissionsInfo, appID } = this.props
        const teamPermissions = currentTeamPermissionsInfo && currentTeamPermissionsInfo.team;
        const appPermissionKey = appID ? `app_${appID}` : '';
        const permissions = {
            routePermission: roleUtil.queryPermissionsInfo(
                teamPermissions, appID ? 'app_route_manage' : 'team_route_manage', appPermissionKey
            ),
            argetServicesPermission: roleUtil.queryPermissionsInfo(
                teamPermissions, appID ? 'app_target_services' : 'team_target_services', appPermissionKey
            ),
            certificatePermission: roleUtil.queryPermissionsInfo(
                teamPermissions, appID ? 'app_certificate' : 'team_certificate', appPermissionKey
            ),
        };
        this.setState({
            ...permissions,
            tabKeys: this.getInitialTabKey(permissions),
            open: this.props.open || false,
        })
    }
    callback = key => {
        this.setState({ tabKeys: key })
    }
    render() {
        const { appID } = this.props
        const {
            routePermission,
            argetServicesPermission,
            certificatePermission,
            tabKeys,
            open
        } = this.state
        return (
            <div className={styles.cardContainer}>
                <Tabs
                    activeKey={tabKeys}
                    onChange={this.callback}
                    type="card"
                >
                    {routePermission.isAccess &&
                        <TabPane tab={formatMessage({ id: 'teamNewGateway.NewGateway.index.management' })} key="route">
                            <GatewayRoute permission={routePermission} open={open} appID={appID} onTabChange={this.callback} />
                        </TabPane>
                    }
                    {argetServicesPermission.isAccess &&
                        <TabPane tab={formatMessage({ id: 'teamNewGateway.NewGateway.index.Services' })} key="service">
                            <GatewayService permission={argetServicesPermission} appID={appID} open={open} />
                        </TabPane>
                    }
                    {certificatePermission.isAccess &&
                        <TabPane tab={formatMessage({ id: 'teamNewGateway.NewGateway.index.certificate' })} key="certificate">
                            <GatewayCertificate permission={certificatePermission} appID={appID} />
                        </TabPane>
                    }

                </Tabs>
            </div>
        );
    }
}

export default Index;
