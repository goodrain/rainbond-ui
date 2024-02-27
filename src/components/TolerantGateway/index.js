import React, { Component } from 'react';
import {
    Tabs,
    Card
} from 'antd';
import HttpTable from '../HttpTable';
import TcpTable from '../TcpTable';
import styles from './index.less'

const TabPane = Tabs.TabPane;
class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }
    callback = (key) => {

    }
    render() {
        const { operationPermissions, appID } = this.props
        const { tabKeys, open } = this.state
        return (
            <div className={styles.cardContainer}>
                <Tabs
                    activeKey={tabKeys}
                    onChange={this.callback}
                    type="card"
                >
                    <TabPane tab={'网关监测'} key="monitor">
                        <GatewayMonitor operationPermissions={operationPermissions} open={open} appID={appID} />
                    </TabPane>
                    <TabPane tab={formatMessage({id:'teamNewGateway.NewGateway.index.management'})} key="route">
                        <GatewayRoute operationPermissions={operationPermissions} open={open} appID={appID}  onTabChange={this.callback}/>
                    </TabPane>
                    <TabPane tab={formatMessage({id:'teamNewGateway.NewGateway.index.Services'})} key="service">
                        <GatewayService operationPermissions={operationPermissions} appID={appID} open={open}/>
                    </TabPane>
                    <TabPane tab={formatMessage({id:'teamNewGateway.NewGateway.index.certificate'})} key="certificate">
                        <GatewayCertificate operationPermissions={operationPermissions} appID={appID} />
                    </TabPane>
                </Tabs>
            </div>
        );
    }
}

export default Index;
