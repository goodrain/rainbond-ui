import { Tabs, Card } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import Plugin from './pluginTable'
import Capacity from './capacityTable'
import ScrollerX from '@/components/ScrollerX';
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
        this.setState({
            instances: key,
        })

    }
    render() {
        return (
            <ScrollerX sm={840}>
                <Card style={{ border:'none', padding:'0px'}} className={styles.pluginCard} bodyStyle={{padding:'24px 0'}}>
                    <Tabs defaultActiveKey="0" onChange={this.callback}  destroyInactiveTabPane className={styles.tabsStyle}>
                        <TabPane tab={formatMessage({id:'extensionEnterprise.tabs.plugin'})} key='0' >
                            <Plugin {...this.props}/>
                        </TabPane>
                        <TabPane tab={formatMessage({id:'extensionEnterprise.tabs.capacity'})} key='1' >
                            <Capacity {...this.props}/>
                        </TabPane>
                    </Tabs>
                </Card>
            </ScrollerX>
        );
    }
}

export default Index;
