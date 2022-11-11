import { Tabs, Card } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ColonyLog from '../../../components/EnterpriseLog';
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
        }
    }
    componentDidMount() {
        this.fetchInstanceInfo();
    }
    // 请求所有日志
    fetchInstanceInfo = () => {
        const { dispatch, region } = this.props;
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
                    this.callback(0);
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
        })

    }
    render() {
        const { region, tcpUrl } = this.props;
        const { ClusterArr, instances, enClusterArr} = this.state;
        return (
            <>
                <Card 
                    style={{
                    boxShadow: 'rgba(36, 46, 66, 0.16) 2px 4px 10px 0px',
                    borderRadius: 5,
                    margin:10
                    }}
                >
                    <Tabs defaultActiveKey="0" onChange={this.callback}  destroyInactiveTabPane>
                        {ClusterArr && ClusterArr.length > 0 && ClusterArr.map((item, index) => {
                            return <TabPane tab={item} key={index} >
                                        <ColonyLog region={region} instances={instances} RbdName={enClusterArr[index]} tcpUrl={tcpUrl}/>
                                    </TabPane>
                        })}
                    </Tabs>
                </Card>
            </>
        );
    }
}

export default Index;
