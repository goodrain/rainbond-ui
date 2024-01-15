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
    Tooltip,
    Empty
} from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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
import Kubernetes from "../../../components/KubernetesAttribute"
import CustomFooter from "../../../layouts/CustomFooter";
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
            tabKey: '0',
            loadingSwitch: true,
            kubernetes: [],
            importLoading: false
        };
    }
    // 团队按钮点击
    handleType = (item, index) => {
        const { module, minmoduleArr, moduleArr, kubernetes } = this.state
        this.setState({
            kubernetes: [],
            moduleArr: [],
        })
        if (module[item].convert_resource != null && module[item].kubernetes_resources != null) {
            this.setState({
                moduleArr: module[item].convert_resource,
                kubernetes: module[item].kubernetes_resources,
                tabKey: '0',
            })
        } else if (module[item].convert_resource != null && module[item].kubernetes_resources == null) {
            this.setState({
                moduleArr: module[item].convert_resource,
                k8sArr: module[item].kubernetes_resources,
                tabKey: '0',
            })
        }
        else if (module[item].kubernetes_resources != null && module[item].convert_resource == null) {
            this.setState({
                kubernetes: module[item].kubernetes_resources,
                tabKey: 'k8s',
            })
        }
        else {
            this.setState({
                moduleArr: [],
                minmoduleArr: {},
                tabKey: 'k8s',
            })
        }
        this.setState({
            type: index,
        });

    }
    // tabs切换
    tabSwitch = (key) => {
        this.setState({
            tabKey: key
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
                if (res && res.response_data && res.response_data.code === 200) {
                    const appname = Object.keys(res.bean)
                    this.setState({
                        appnameArr: appname,
                        module: res.bean,
                        moduleArr: res.bean[appname[0]].convert_resource,
                        kubernetes: res.bean[appname[0]].kubernetes_resources,
                        loadingSwitch: false
                    })
                    const { moduleArr } = this.state
                    if (moduleArr == null) {
                        this.setState({
                            tabKey: 'k8s',
                        })
                    } else {
                        this.setState({
                            tabKey: '0',
                        })
                    }
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
        this.setState({
            importLoading: true,
        })
        dispatch({
            type: 'region/backNameSpaceAdvancedResource',
            payload: {
                eid,
                region_id: this.props.location.query.region_id,
                namespace: this.props.location.query.namespace
            },
            callback: res => {
                this.setState({
                    importLoading: false,
                })
                const teamName = res.bean && res.bean.Name
                const regionName = res.bean && res.bean.region_name
                this.props.dispatch(
                    routerRedux.push(
                        `/team/${teamName}/region/${regionName}/index`
                    ))
            }
        })
    }
    nextStep = () => {
        const {
            dispatch,
            match: {
                params: { eid }
            },
        } = this.props;
        const region_id = this.props.location.query.region_id

        this.props.dispatch(
            routerRedux.push(
                `/enterprise/${eid}/importMessage?region_id=${region_id}`
            ))
    }
    render() {
        const { type, appnameArr, moduleArr, minmoduleArr, tabKey, loadingSwitch, module, kubernetes, importLoading } = this.state;
        const namespace = this.props.location.query.namespace
        return (
            <div>
                <Spin spinning={this.state.importLoading} size="large" tip="Loading...">
                    <h2>{formatMessage({id:'enterpriseColony.import.recognition.title'})}
                        {namespace && namespace.length > 0 ? namespace : formatMessage({id:'enterpriseColony.import.recognition.null'})}
                    </h2>
                    <h3 className={styles.applist}>{formatMessage({id:'enterpriseColony.import.recognition.app.title'})}</h3>

                    {(namespace && namespace.length > 0) ? (
                        <>
                            <div className={styles.typeBtnWrap}>
                                <Affix offsetTop={0}>
                                    <div className={styles.fixed}>

                                        {
                                            appnameArr.map((item, index) => {
                                                return <>
                                                    {(module[item].convert_resource === null && module[item].kubernetes_resources === null) ? (<></>) : (
                                                        <div key={index}
                                                            className={`${styles.typeBtn}  ${type === index ? styles.active : ""}`}
                                                            onClick={() => {
                                                                this.handleType(item, index);
                                                            }}
                                                        >
                                                            <Tooltip placement="right" title={item === "unclassified" ? formatMessage({id:'enterpriseColony.import.app.title'}) : item}>
                                                                <span>{item === "unclassified" ? formatMessage({id:'enterpriseColony.import.app.title'}) : item}</span>
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

                            {loadingSwitch ? (
                                <div className={styles.loadingstyle}>
                                    <Spin size="large" />
                                </div>
                            ) : (
                                <div id='box'>
                                    <div className={styles.alltable}>
                                        <Tabs
                                            onChange={this.tabSwitch}
                                            activeKey={this.state.tabKey}
                                            ref={(e) => { this._Tabs = e }
                                            }
                                        >
                                            {moduleArr && moduleArr.length > 0 && moduleArr.map((item, num) => {
                                                return <TabPane tab={item.components_name} key={`${num}`}>
                                                    {/* ConfigProvider */}
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
                                                        <SpecialAttribute value={item.component_k8s_attributes_management} />
                                                    }
                                                </TabPane>
                                            })}
                                            {kubernetes && kubernetes.length > 0 &&
                                                <TabPane tab={formatMessage({id:'enterpriseColony.import.recognition.tabs'})} key="k8s">
                                                    <Kubernetes
                                                        value={kubernetes}
                                                    />
                                                </TabPane>
                                            }
                                        </Tabs>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: '200px' }} />
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
                            onClick={this.nextStep}
                            type="default"
                        >
                            {formatMessage({id:'button.last_step'})}
                        </Button>
                        <Button
                            style={{
                                marginRight: 8
                            }}
                            onClick={this.handleBuild}
                            type="primary"
                        >
                            {formatMessage({id:'button.import'})}
                        </Button>
                    </div>
                </Spin>
                <CustomFooter/>
            </div >
        );
    }
}
