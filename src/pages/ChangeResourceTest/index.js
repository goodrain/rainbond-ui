/* eslint-disable no-unused-expressions */
import {
    Tabs,
    Button,
    Spin
} from 'antd';
import { object } from 'prop-types';
import React, { PureComponent, Fragment } from 'react';
import DeployAttribute from '../../components/DeployAttribute'
import PortAttribute from '../../components/PortAttribute'
import EnvVariable from '../../components/EnvVariable'
import ConfigurationFiles from "../../components/ConfigurationFiles"
import FlexAttribute from '../../components/FlexAttribute'
import HealthAttribute from "../../components/HealthAttribute"
import SpecialAttribute from '../../components/SpecialAttribute'
import Kubernetes from "./Kubernetes"
import styles from './index.less'
const { TabPane } = Tabs;
class Index extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            switch:false
        }
    }
    callback = (key) => {
        console.log(key);
    }
    handerClick = () => {
        this.setState({
            switch:!this.state.switch,
        })
    }

    render() {
        const moduleArrs = [{
            components_name: "linkerd-proxy-injector",
            basic_management: {
                command: "",
                cpu: 0,
                image: "cr.l5d.io/linkerd/proxy:stable-2.11.3",
                memory: 0,
                replicas: 1,
                resource_type: "Deployment",
            },
            config_management: null,
            env_management: [
                { env_key: 'LINKERD2_PROXY_LOG', env_value: 'warn,linkerd=info', env_explain: '' },
                { env_key: 'LINKERD2_PROXY_LOG_FORMAT', env_value: 'plain', env_explain: '' },
                { env_key: 'LINKERD2_PROXY_DESTINATION_SVC_ADDR', env_value: 'linkerd-dst-headless.linkerd.svc.cluster.local.:8086', env_explain: '' },
                { env_key: 'LINKERD2_PROXY_DESTINATION_PROFILE_NETWORKS', env_value: '10.0.0.0/8,100.64.0.0/10,172.16.0.0/12,192.168.0.0/16', env_explain: '' },
                { env_key: 'LINKERD2_PROXY_POLICY_SVC_ADDR', env_value: 'linkerd-policy.linkerd.svc.cluster.local.:8090', env_explain: '' },
                { env_key: 'LINKERD2_PROXY_POLICY_WORKLOAD', env_value: '$(_pod_ns):$(_pod_name)', env_explain: '' },
                { env_key: 'LINKERD2_PROXY_INBOUND_DEFAULT_POLICY', env_value: 'all-unauthenticated', env_explain: '' },
                { env_key: 'LINKERD2_PROXY_POLICY_CLUSTER_NETWORKS', env_value: '10.0.0.0/8,100.64.0.0/10,172.16.0.0/12,192.168.0.0/16', env_explain: '' },
                { env_key: 'LINKERD2_PROXY_INBOUND_CONNECT_TIMEOUT', env_value: '100ms', env_explain: '' },
                { env_key: 'LINKERD2_PROXY_OUTBOUND_CONNECT_TIMEOUT', env_value: '1000ms', env_explain: '' },
                { env_key: 'LINKERD2_PROXY_CONTROL_LISTEN_ADDR', env_value: '0.0.0.0:4190', env_explain: '' }
            ],
            health_check_management: {
                detection_method: "HTTP",
                status: "已启用",
                unhealthy_handle_method: "重启",
            },
            port_management: [
                { port: 4143, protocol: 'UDP', inner: false, outer: false },
                { port: 4191, protocol: 'UDP', inner: false, outer: false }
            ],
            special_management: {
                label: null,
                node_selector: null,
                toleration: null,
            },
            telescopic_management: {
                cpu_use: "",
                max_replicas: 0,
                memory_use: "",
                min_replicas: 0,
            }
        }]
        return (
            <Fragment>
                <div className={styles.all_style}>
                    <h3>应用名称：hello</h3>
                    <div className={styles.tabs_value}>
                        {this.state.switch ? (
                        <Tabs defaultActiveKey="0" onChange={this.callback}>
                            {moduleArrs && moduleArrs.length > 0 &&
                                moduleArrs.map((item, index) => {
                                    return <TabPane
                                        tab={item.components_name}
                                        key={index}
                                    >
                                        {/* 部署属性 */}
                                        <DeployAttribute value={item.basic_management} />
                                        {/* 端口属性 */}
                                        <PortAttribute value={item.port_management} />
                                        {/* 环境变量 */}
                                        <EnvVariable value={item.env_management} />
                                        {/* 配置文件 */}
                                        <ConfigurationFiles value={item.config_management} />
                                        {/* 自动伸缩 */}
                                        <FlexAttribute value={item.telescopic_management} />
                                        {/* 健康检测 */}
                                        <HealthAttribute value={item.health_check_management} />
                                        {/* 特殊属性 */}
                                        <SpecialAttribute />
                                    </TabPane>
                                })
                            }
                            <TabPane tab="k8s资源" key="hello">
                                <Kubernetes />
                            </TabPane>
                        </Tabs>
                        ):(
                            <div className={styles.loading}>
                                <Spin size="large"/>
                            </div>
                        )}
                    </div>
                </div>
                <div
                    style={{
                        background: '#fff',
                        padding: '20px',
                        textAlign: 'right',
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 2,
                        borderTop: '1px solid #e8e8e8'
                    }}>
                    <Button
                        style={{marginRight: 8}}
                        type="default">上一步</Button>
                    <Button
                        style={{marginRight: 8}}
                        type="primary">确认导入</Button>
                    <Button 
                    type="default"
                    onClick={this.handerClick}
                    >放弃导入</Button>
                </div>
            </Fragment>
        );
    }
}

export default Index;
