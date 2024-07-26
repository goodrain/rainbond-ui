import React, { Component } from 'react';
import { connect } from 'dva';
import {
    Tabs,
    Card
} from 'antd';
import roleUtil from '@/utils/newRole';
import HttpTable from '../HttpTable';
import TcpTable from '../TcpTable';
import styles from './index.less'
import app from '@/locales/en-US/app';

const TabPane = Tabs.TabPane;
@connect(({ teamControl }) => ({
    currentTeamPermissionsInfo: teamControl.currentTeamPermissionsInfo,
}))
class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            routePermission: {},
            argetServicesPermission: {},
            certificatePermission: {},
        }
    }
    componentDidMount() {
        const { currentTeamPermissionsInfo,appID } = this.props
        this.setState({
            routePermission: roleUtil.queryPermissionsInfo(currentTeamPermissionsInfo && currentTeamPermissionsInfo.team, appID ?'app_route_manage' : 'team_route_manage', appID ?`app_${appID}`:''),
            argetServicesPermission: roleUtil.queryPermissionsInfo(currentTeamPermissionsInfo && currentTeamPermissionsInfo.team, appID ?'app_target_services':'team_target_services', appID ?`app_${appID}`:''),
            certificatePermission: roleUtil.queryPermissionsInfo(currentTeamPermissionsInfo && currentTeamPermissionsInfo.team, appID ?'app_certificate':'team_certificate', appID ?`app_${appID}`:''),
        })
    }
    callback = (key) => {

    }
    render() {
        const {
            appID,
            routePermission,
            argetServicesPermission,
            certificatePermission
        } = this.props
        const { tabKeys, open } = this.state
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
