import React, { Component } from 'react'
import { connect } from 'dva';
import {
    Tabs
} from 'antd';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import GatewayRouteHttp from '../../../components/GatewayRouteHttp';
import GatewayRouteTcp from '../../../components/GatewayRouteTcp';
const { TabPane } = Tabs;

export default class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableKey: "http",
        };
    }
    componentDidMount() {
    }

    render() {
        const {
            tableKey,
        } = this.state;
        const { appID, open, operationPermissions, onTabChange, permission } = this.props;
        return (
            <div>
                <Tabs onChange={(e) => { this.setState({ tableKey: e }) }} activeKey={tableKey}>
                    <TabPane tab="HTTP" key="http">
                        <GatewayRouteHttp
                            operationPermissions={operationPermissions}
                            open={open}
                            onTabChange={onTabChange}
                            type={tableKey}
                            appID={appID}
                            permission={permission}
                        />
                    </TabPane>
                    <TabPane tab="TCP" key="tcp">
                        <GatewayRouteTcp
                            operationPermissions={operationPermissions}
                            open={open}
                            type={tableKey}
                            appID={appID}
                            permission={permission}
                        />
                    </TabPane>
                </Tabs>

            </div>
        )
    }
}
