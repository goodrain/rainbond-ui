import React, { Component } from 'react';
import {
    Tabs,
    Card
} from 'antd';
import HttpTable from '../../components/HttpTable';
import TcpTable from '../../components/TcpTable';
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
        const { operationPermissions, open, tabKey } = this.props
        return (
            <Card style={{ padding: '0px', border: 'none' }} className={styles.pluginCard}>
                <Tabs defaultActiveKey={tabKey} onChange={this.callback} className={styles.tabsStyle}>
                    <TabPane tab="HTTP" key="http">
                        <HttpTable operationPermissions={operationPermissions} open={open} />
                    </TabPane>
                    <TabPane tab="TCP/UDP" key="tcp">
                        <TcpTable operationPermissions={operationPermissions} />
                    </TabPane>
                </Tabs>
            </Card>
        );
    }
}

export default Index;
