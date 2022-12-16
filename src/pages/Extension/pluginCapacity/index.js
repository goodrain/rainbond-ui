import { Tabs, Card } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import Plugin from './pluginTable'
import Capacity from './capacityTable'
import styles from './index.less'
const { TabPane } = Tabs;
@connect(null, null, null, { withRef: true })
class Index extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            instances: '0'
        }
    }

    //对应日志的select 选择框数组获取
    callback = (key) => {
        const { list , enClusterArr} = this.state;
        this.setState({
            instances: key,
        })

    }
    render() {
        const { region, tcpUrl } = this.props;
        const { ClusterArr, instances, enClusterArr} = this.state;
        return (
            <>
                <Card style={{ border:'none', padding:'0px'}} className={styles.pluginCard}>
                    <Tabs defaultActiveKey="0" onChange={this.callback}  destroyInactiveTabPane className={styles.tabsStyle}>
                        <TabPane tab='插件' key='0' >
                            <Plugin />
                        </TabPane>
                        <TabPane tab='能力' key='1' >
                            <Capacity />
                        </TabPane>
                    </Tabs>
                </Card>
            </>
        );
    }
}

export default Index;
