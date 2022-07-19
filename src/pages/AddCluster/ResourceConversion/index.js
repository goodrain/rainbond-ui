/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import {
    Button,
    Card,
    Form,
    Input,
    Row,
    Steps,
    Select,
    Collapse,
    Icon,
    Affix,
    Table,
    Col,
    Radio,
    Switch,
    Tabs,
    ConfigProvider,
    message,
    Spin,
    Tooltip
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import router from 'umi/router';
import styles from './index.less';
import globalUtil from "../../../utils/global"
import HealthAttribute from "../../../components/HealthAttribute"
import PortAttribute from '../../../components/PortAttribute'
import EnvVariable from '../../../components/EnvVariable'
import ConfigurationFiles from '../../../components/ConfigurationFiles'
import DeployAttribute from "../../../components/DeployAttribute"
import FlexAttribute from '../../../components/FlexAttribute'
import SpecialAttribute from '../../../components/SpecialAttribute'
import Kubernetes from "./component/Kubernetes"
import { object } from 'prop-types';
import { log } from 'lodash-decorators/utils';
const { Panel } = Collapse;
const { Option, OptGroup } = Select;
const { TabPane } = Tabs;
const FormItem = Form.Item;
@connect(null, null, null, { withRef: true })
export default class ImportMessage extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            module: {},//所有数据
            appnameArr: [],//app名称数组
            moduleArr: [],//组件数组内容
            minmoduleArr: {},//单个组件内容
            type: 0,
            index: '0',
            loadingswitch: true
        };
    }
    // 团队按钮点击
    handleType = (item, index) => {
        const { module, minmoduleArr, moduleArr } = this.state
        if (module.[item].convert_resource != null) {
            this.setState({
                moduleArr: module.[item].convert_resource,
                index: '0',
            })
        } else {
            this.setState({
                moduleArr: [],
                minmoduleArr: {},
                index: 'hello',
            })
        }
        this.setState({
            type: index,
        });

    }
    // tabs切换
    tabSwitch = (key) => {
        this.setState({
            index: key
        })
    }

    componentDidMount() {
        this.first()
    }
    // 进入页面发送请求获取app数据
    first() {
        const {
            dispatch,
            match: {
                params: { eid }
            },
        } = this.props;
        dispatch({
            type: 'region/fetchNameSpaceAdvancedResource',
            payload: {
                eid,
                region_id: this.props.location.query.region_id,
                namespace: this.props.location.query.namespace
            },
            callback: res => {
                console.log(res.bean);
                if (res.response_data.code === 200) {
                    const appname = Object.keys(res.bean)
                    console.log(res.bean.[appname[0]].convert_resource);
                    this.setState({
                        appnameArr: appname,
                        module: res.bean,
                        moduleArr:res.bean.[appname[0]].convert_resource,
                        loadingswitch: false
                    })

                }

            }
        })

    }
    // 确认创建
    handleBuild = () => {
        const {
            dispatch,
            match: {
                params: { eid }
            },
        } = this.props;
        dispatch({
            type: 'region/backNameSpaceAdvancedResource',
            payload: {
                eid,
                region_id: this.props.location.query.region_id,
                namespace: this.props.location.query.namespace
            },
            callback: res => {
                const teamName = res.bean && res.bean.Name
                const regionName = res.bean && res.bean.region_name
                this.props.dispatch(
                    routerRedux.replace(
                        `/team/${teamName}/region/${regionName}/index`
                    ))
            }
        })
    }
    // 取消框显示
    // showDelete = () => {
    //     this.setState({ showDelete: true })
    // }
    // 上一步
    nextStep = () => {
        const str = this.props.location.query.id
        const region_id = this.props.location.query.region_id

        this.props.dispatch(
            routerRedux.replace(
                `/enterprise/${str}/importMessage?region_id=${region_id}`
            ))
    }
    render() {
        const { type, appnameArr, moduleArr, minmoduleArr, index, loadingswitch, module } = this.state;
        const namespace = this.props.location.query.namespace
        // 假数据
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
            component_k8s_attributes_management: [
                {
                    ID: 0,
                    attribute_value: "- name: sp-tls\n  secret:\n    defaultMode: 420\n    secretName: linkerd-sp-validator-k8s-tls\n- name: policy-tls\n  secret:\n    defaultMode: 420\n    secretName: linkerd-policy-validator-k8s-tls\n- emptyDir: {}\n  name: linkerd-proxy-init-xtables-lock\n- emptyDir:\n    medium: Memory\n  name: linkerd-identity-end-entity\n",
                    component_id: "",
                    create_time: "0001-01-01T00:00:00Z",
                    name: "volumes",
                    save_type: "yaml",
                    tenant_id: "",
                },
                {
                    ID: 0,
                    attribute_value: "- mountPath: /var/run/linkerd/identity/end-entity\n  name: linkerd-identity-end-entity\n",
                    component_id: "",
                    create_time: "0001-01-01T00:00:00Z",
                    name: "volumeMounts",
                    save_type: "yaml",
                    tenant_id: "",
                },
                {
                    ID: 0,
                    attribute_value: "linkerd-destination",
                    component_id: "",
                    create_time: "0001-01-01T00:00:00Z",
                    name: "serviceAccountName",
                    save_type: "string",
                    tenant_id: "",
                },
                {
                    ID: 0,
                    attribute_value: "{\"app.kubernetes.io/name\":\"destination\",\"app.kubernetes.io/part-of\":\"Linkerd\",\"app.kubernetes.io/version\":\"stable-2.11.3\",\"linkerd.io/control-plane-component\":\"destination\",\"linkerd.io/control-plane-ns\":\"linkerd\"}",
                    component_id: "",
                    create_time: "0001-01-01T00:00:00Z",
                    name: "labels",
                    save_type: "json",
                    tenant_id: "",
                },
                {
                    ID: 0,
                    attribute_value: "{\"kubernetes.io/os\":\"linux\"}",
                    component_id: "",
                    create_time: "0001-01-01T00:00:00Z",
                    name: "nodeSelector",
                    save_type: "json",
                    tenant_id: "",
                }
            ],
            telescopic_management: {
                enable: true,
                max_replicas: 100,
                min_replicas: 1,
                cpu_or_memory: [
                    {
                        ID: 0,
                        MetricTargetType: "utilization",
                        MetricTargetValue: 50,
                        MetricsName: "cpu",
                        MetricsType: "resource_metrics",
                        RuleID: "",
                        create_time: "0001-01-01T00:00:00Z"
                    },
                    {
                        ID: 2,
                        MetricTargetType: "average_value",
                        MetricTargetValue: 60,
                        MetricsName: "gpu",
                        MetricsType: "resource_metrics",
                        RuleID: "",
                        create_time: "0001-01-01T00:00:00Z"
                    }
                ]

            }
        }]
        return (
            <div>
                <h2>团队名称：
                    {namespace && namespace.length > 0 ? namespace : "暂无团队"}
                </h2>
                <h3 className={styles.applist}>应用列表:</h3>
                <div className={styles.typeBtnWrap}>
                    <Affix offsetTop={0}>
                        <div className={styles.fixed}>

                            {
                                appnameArr.map((item, index) => {
                                    return <>
                                        {module.[item].convert_resource === null ? (<></>) : (
                                            <div key={index}
                                                className={`${styles.typeBtn}  ${type === index ? styles.active : ""}`}
                                                onClick={() => {
                                                    this.handleType(item, index);
                                                }}
                                            >
                                                <Tooltip placement="right" title={item}>
                                                    <span>{item}</span>
                                                </Tooltip>
                                                <Icon type="right" />
                                            </div>
                                        )}
                                    </>
                                })
                            }
                        </div>
                    </Affix>
                </div>

                {loadingswitch ? (
                    <div className={styles.loadingstyle}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <div id='box'>
                        <div className={styles.alltable}>
                            <Tabs
                                onChange={this.tabSwitch}
                                activeKey={this.state.index}
                                ref={(e) => { this._Tabs = e }}
                            >
                                {moduleArr && moduleArr.length > 0 && moduleArr.map((item, index) => {
                                    return <TabPane tab={item.components_name} key={`${index}`}>
                                        {/* ConfigProvider */}
                                        <ConfigProvider>
                                            {/* 部署属性 */}
                                            {
                                                <DeployAttribute
                                                    value={item.basic_management}
                                                />
                                            }
                                            {/* 端口管理 */}
                                            {
                                                <PortAttribute
                                                    value={item.port_management}
                                                />
                                            }
                                            {/* 环境变量 */}
                                            {
                                                <EnvVariable
                                                    value={item.env_management}
                                                />
                                            }
                                            {/* 配置文件 */}
                                            {
                                                <ConfigurationFiles
                                                    value={item.config_management}
                                                />
                                            }
                                            {/* 自动伸缩 */}
                                            {
                                                <FlexAttribute
                                                    value={item.telescopic_management}
                                                />
                                            }
                                            {/* 健康监测 */}
                                            {
                                                <HealthAttribute
                                                    value={item.health_check_management}
                                                />
                                            }
                                            {/* 特殊属性 */}
                                            {
                                                <SpecialAttribute value = {item.component_k8s_attributes_management}/>
                                            }
                                        </ConfigProvider>
                                    </TabPane>
                                })}
                                <TabPane tab="k8s资源" key="hello">
                                    {/* kbs资源 */}
                                    <Kubernetes />
                                </TabPane>

                            </Tabs>
                        </div>
                    </div>
                )}
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
                        style={{
                            marginRight: 8
                        }}
                        onClick={this.nextStep} type="default">上一步</Button>
                    <Button
                        style={{
                            marginRight: 8
                        }}
                        onClick={this.handleBuild}
                        type="primary">确认导入</Button>
                    {/* <Button onClick={this.showDelete} type="default">放弃导入</Button> */}
                </div>
                {/* {
                    this.state.showDelete && <ConfirmModal
                        onOk={this.handleDelete}
                        title="放弃创建"
                        subDesc="此操作不可恢复"
                        desc="确定要放弃创建此组件吗？"
                        onCancel={() => {
                            this.setState({ showDelete: false })
                        }} />
                } */}
            </div >
        );
    }
}
