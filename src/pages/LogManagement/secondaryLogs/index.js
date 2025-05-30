import { Tabs, Card } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ScrollerX from '@/components/ScrollerX';
import ColonyLog from '../../../components/EnterpriseLog';
import styles from '../index.less'
const { TabPane } = Tabs;
@connect(null, null, null, { withRef: true })
class Index extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            ClusterArr: [`${formatMessage({id:'LogEnterprise.getway'})}`, `${formatMessage({id:'LogEnterprise.api'})}`, `${formatMessage({id:'LogEnterprise.chaos'})}`, `${formatMessage({id:'LogEnterprise.worker'})}`],
            enClusterArr: ["rbd-gateway", "rbd-api", "rbd-chaos", "rbd-worker"],
            list: [],
            instances: [],
            logs:[],
            wsurl: null,
            regionActiveKey: '0'
        }
    }
    componentDidMount() {
        const { regionActiveKey } = this.props;
        const { enClusterArr } = this.state;
        const index = enClusterArr.findIndex(item => item === regionActiveKey);
        this.setState({
            regionActiveKey: index !== -1 ? `${index}` : '0'
        },()=>{
            this.fetchInstanceInfo();
            this.fetchUpClusters();
        })
    }
    // 获取编辑集群信息 获取当前集群的websocket通信地址
    fetchUpClusters = () => {
        const { dispatch, eid, regionId } = this.props;
        dispatch({
          type: 'region/fetchEnterpriseCluster',
          payload: {
            region_id: regionId,
            enterprise_id: eid
          },
          callback: res => {
            if (res && res.status_code === 200) {
             this.setState({
                wsurl: res.bean.wsurl
             })
            }
          }
        });
    };
    
    // 请求所有日志
    fetchInstanceInfo = () => {
        const { dispatch, region } = this.props;
        const { regionActiveKey } = this.state;
        dispatch({
            type: 'region/fetchClusterLogInfo',
            payload: {
                region_name: region,
            },
            callback: res => {
                let list = [];
                if (res && res.bean) {
                    const new_pods = (res.bean.list && res.bean.list.length && res.bean.list) || [];
                    list = [...new_pods];
                }
                this.setState({
                    list: list
                }, () => {                    
                    this.callback(regionActiveKey);
                });
            }
        });
    };
    //对应日志的select 选择框数组获取
    callback = (key) => {
        const { list , enClusterArr} = this.state;
        const arr = []
        list.filter((item) => {
            if (item.rbd_name.indexOf(enClusterArr[key]) != -1) {
                return arr.push(item)
            }
        })
        this.setState({
            instances: arr,
            regionActiveKey: key
        })

    }
    render() {
        const { region, tcpUrl } = this.props;
        const { ClusterArr, instances, enClusterArr, wsurl} = this.state;
        return (
            <ScrollerX sm={840}>
                <Card style={{ padding:'24px 0px'}} bodyStyle={{padding: 0}}>
                    <Tabs tabPosition='left' activeKey={this.state.regionActiveKey} onChange={this.callback}  destroyInactiveTabPane className={styles.tabsStyle}>
                        {ClusterArr && ClusterArr.length > 0 && (wsurl != null) && ClusterArr.map((item, index) => {
                            return <TabPane tab={item} key={index} >
                                        <ColonyLog region={region} instances={instances} RbdName={enClusterArr[index]} tcpUrl={wsurl} key={instances && instances.length>0 && instances[0].pod_name}/>
                                    </TabPane>
                        })}
                    </Tabs>
                </Card>
            </ScrollerX>
        );
    }
}

export default Index;
