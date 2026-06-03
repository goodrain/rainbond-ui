import React, { Component } from 'react'
import { connect } from 'dva';
import {
    Tabs
} from 'antd';
import { formatMessage } from '@/utils/intl';
import GatewayRouteHttp from '../../../components/GatewayRouteHttp';
import GatewayRouteTcp from '../../../components/GatewayRouteTcp';
import GatewayRouteLoadBalancer from '../../../components/GatewayRouteLoadBalancer';
import pluginUtils from '../../../utils/pulginUtils';
import globalUtil from '../../../utils/global';
const { TabPane } = Tabs;
@connect(({ rbdPlugin, user, global }) => ({
    pluginList: rbdPlugin.pluginList,
    currentUser: user.currentUser,
    rainbondInfo: global.rainbondInfo,
}))

export default class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableKey: "http",
            showTcp: false,
            existsAutomaticIssuanceCert: false
        };
    }
    componentDidMount() {
        const { pluginList } = this.props;
        const isInstall = pluginUtils.isInstallPlugin(pluginList, 'rainbond-bill');
        this.setState({
            showTcp: isInstall,
        })
        this.checkAutomaticIssuanceCert();
    }
    checkAutomaticIssuanceCert = () => {
        this.props.dispatch({
          type: 'gateWay/checkAutomaticIssuanceCert',
          payload: {
            teamName: globalUtil.getCurrTeamName(),
          },
          callback: (res) => {    
            if(res && res.status_code == 200) {
              this.setState({
                existsAutomaticIssuanceCert: res.bean.exists,
              });
            }
          }
        });
      }
    render() {
        const {
            tableKey,
            showTcp,
            existsAutomaticIssuanceCert
        } = this.state;
        const { appID, open, operationPermissions, onTabChange, permission, currentUser, rainbondInfo } = this.props;
        const isEnterpriseAdmin = !!(currentUser && currentUser.is_enterprise_admin);
        const canAccessLoadBalancer = !(rainbondInfo && rainbondInfo.is_saas) || isEnterpriseAdmin;
        const activeKey = canAccessLoadBalancer || tableKey !== 'loadbalancer' ? tableKey : 'http';
        return (
            <div>
                <Tabs onChange={(e) => { this.setState({ tableKey: e }) }} activeKey={activeKey}>
                    <TabPane tab="HTTP" key="http">
                        <GatewayRouteHttp
                            operationPermissions={operationPermissions}
                            open={open}
                            onTabChange={onTabChange}
                            type={activeKey}
                            appID={appID}
                            permission={permission}
                            existsAutomaticIssuanceCert={existsAutomaticIssuanceCert}
                        />
                    </TabPane>
                    {(isEnterpriseAdmin || !showTcp) && (
                        <TabPane tab="TCP" key="tcp">
                            <GatewayRouteTcp
                                operationPermissions={operationPermissions}
                                open={open}
                                type={activeKey}
                                appID={appID}
                                permission={permission}
                            />
                        </TabPane>
                    )}
                    {canAccessLoadBalancer && (
                        <TabPane tab="LoadBalancer" key="loadbalancer">
                            <GatewayRouteLoadBalancer
                                operationPermissions={operationPermissions}
                                open={open}
                                type={activeKey}
                                appID={appID}
                                permission={permission}
                            />
                        </TabPane>
                    )}
                </Tabs>

            </div>
        )
    }
}
