/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Button, Card, Form, Input, Row, Steps, Select, Collapse, Icon, Affix, Table, Col, Radio, Switch } from 'antd';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { PureComponent } from 'react';
import router from 'umi/router';
import DAinput from '../../../components/DAinput';
import DApvcinput from '../../../components/DApvcinput.js/index'
import DAselect from '../../../components/DAseclect';
import EnvironmentVariable from "../../../components/EnvironmentVariable"
import Port from "../../../components/Port"
import appProbeUtil from '../../../utils/appProbe-util';
import userUtil from '../../../utils/user';
import globalUtil from '../../../utils/global';
import styles from './index.less';
import Jiankang from './component/health'
import Duankou from './component/port.js'
const { Panel } = Collapse;
const { Option, OptGroup } = Select;
const FormItem = Form.Item;
@Form.create()
@connect(({ user, list, loading, global, index, region }) => ({
    user: user.currentUser,
    list,
    loading: loading.models.list,
    rainbondInfo: global.rainbondInfo,
    enterprise: global.enterprise,
    isRegist: global.isRegist,
    oauthLongin: loading.effects['global/creatOauth'],
    overviewInfo: index.overviewInfo,
    baseConfiguration: region.base_configuration
}))
export default class ImportMessage extends PureComponent {
    constructor(props) {
        super(props);
        const { user } = this.props;

        this.state = {
            app: ["app1", "app2", "app3"],
            type: 'app1',
            zujian: ["组件1", "组件2", "组件3"],
            editStartHealth: null,
            showSwitch: false,
            value: '',
            modulecut: 0,
            showDelete: false,
            appvalue: {
                zujian: "组件一",
                deploydata: {
                    type: "字符",
                    number: 1,
                }
            },

        };
    }
    handleType = (item, index) => {
        this.setState({
            type: item
        });
        if (index === 1) {
            const arr = ["app2组件一", "app2组件二"]
            this.setState({
                zujian: arr
            })
        } else if (index == 2) {
            const arr = ["app3组件一"]
            this.setState({
                zujian: arr
            })
        } else {
            const arr = ["组件1", "组件2", "组件3"]
            this.setState({
                zujian: arr
            })
        }
    }
    //组件切换按钮函数 
    hander = (index, e) => {
        e.stopPropagation()
        this.setState({
            modulecut: index
        })
        if (index === 0) {
            const appvalue = {
                zujian: "组件一",
                deploydata: {
                    type: "字符",
                    number: 1,
                }
            }
            this.setState({
                appvalue: appvalue
            })

        } else if (index === 1) {
            const appvalue = {
                zujian: "组件二",
                deploydata: {
                    type: "数组",
                    number: 2,
                }
            }
            this.setState({
                appvalue: appvalue
            })
        } else {
            const appvalue = {
                deploydata: {
                    type: "对象",
                    number: 3,
                }
            }
            this.setState({
                appvalue: appvalue
            })
        }
    }
    // 部署属性函数
    onChange = (e) => {
        console.log(`radio checked:${e.target.value}`);
        if (e.target.value === "j") {
            const value = this.state.showSwitch
            this.setState({
                showSwitch: true
            })
        } else {
            const value = this.state.showSwitch
            this.setState({
                showSwitch: false
            })
        }
    }
    inputValue = (e) => {
        this.setState({
            value: e.target.value
        })
    }
    componentDidMount() {

    }
    // 特殊属性
    handleSwitchOnChange = () => { };

    // 确认创建
    handleBuild = () => {
        // const team_name = globalUtil.getCurrTeamName();
        // const params = this.getParams();
        // this
        //     .props
        //     .dispatch({
        //         type: 'application/buildCompose',
        //         payload: {
        //             team_name: globalUtil.getCurrTeamName(),
        //             ...params
        //         },
        //         callback: () => {
        //             this
        //                 .props
        //                 .dispatch({
        //                     type: 'global/fetchGroups',
        //                     payload: {
        //                     team_name: team_name
        //                     }
        //                 });

        //         }
        //     })
        this
            .props
            .dispatch(routerRedux.replace(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`))

    }
    handleDelete = () => {
        const params = this.getParams();
        this
            .props
            .dispatch({
                type: 'application/deleteCompose',
                payload: {
                    team_name: globalUtil.getCurrTeamName(),
                    ...params
                },
                callback: () => {
                    this
                        .props
                        .dispatch({
                            type: 'global/fetchGroups',
                            payload: {
                                team_name: globalUtil.getCurrTeamName()
                            }
                        });
                    this
                        .props
                        .dispatch(routerRedux.replace(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`))
                }
            })
    }
    showDelete = () => {
        this.setState({ showDelete: true })
    }

    render() {
        const { zujian } = this.state;
        const { type } = this.state;
        const { appvalue } = this.state
        console.log(appvalue);
        // 端口检测数据
        const appDetail = {
            event_websocket_url: "ws://47.104.161.96:6060/event_log",
            is_third: false,
            service: {
                ID: 3,
                build_upgrade: true,
                category: "app_publish",
                check_event_id: "66e2facffda04f479bdffd4a24461191",
                check_uuid: "d7495f1d-b861-48bb-a08e-62206ce7c58b",
                cmd: "",
                code_from: "image_manual",
                code_version: null,
                container_gpu: 0,
                create_status: "checked",
                create_time: "2022-06-27 16:22:23",
                creater: 1,
                deploy_version: "",
                desc: "docker run application",
                docker_cmd: "nginx:1.11",
                env: ",",
                expired_time: null,
                extend_method: "stateless_multiple",
                git_full_name: null,
                git_project_id: 0,
                git_url: null,
                group_id: 1,
                group_name: "默认应用",
                host_path: "/grdata/tenant/11b7480ac2054d89bd4ad6852de6d8e6/service/4bc1a895f55a2e24178bfe9e90a718dd",
                image: "nginx:1.11",
                inner_port: 0,
                is_code_upload: false,
                is_service: false,
                is_upgrate: false,
                is_web_service: false,
                k8s_component_name: "nginx",
                language: "",
                min_cpu: 0,
                min_memory: 512,
                min_node: 1,
                namespace: "11b7480ac2054d89bd4ad6852de6d8e6",
                oauth_service_id: null,
                open_webhooks: false,
                port_type: "multi_outer",
                protocol: "",
                secret: null,
                server_type: "git",
                service_alias: "grf59432",
            }
        }
        // 健康检测数据
        const startProbe = {
            ID: 1,
            cmd: "",
            failure_threshold: 3,
            http_header: "",
            initial_delay_second: 2,
            is_used: true,
            mode: "readiness",
            path: "",
            period_second: 3,
            port: 80,
            probe_id: "2406c2e9a97948458f4bff8f8aebbae3",
            scheme: "tcp",
            service_id: "4bc1a895f55a2e24178bfe9e90a718dd",
            success_threshold: 1,
            timeout_second: 20,
        }
        // 自动伸缩数据
        const columns = [
            {
                title: '最小实例',
                dataIndex: 'minexample',
                key: 'minexample',
                align: 'center'
                //   render
            },
            {
                title: '最大实例',
                dataIndex: 'minexample',
                key: 'maxexample',
                align: 'center'
            },
            {
                title: 'CPU使用',
                dataIndex: 'cupuse',
                key: 'cupuse',
                align: 'center'
            },
            {
                title: '内存使用',
                dataIndex: 'ramuse',
                key: 'ramuse',
                align: 'center'
            },
        ];
        const data = [
            {
                key: '1',
                minexample: 1,
                minexample: 3,
                cupuse: 50,
                ramuse: 7,
            },
        ];
        //   部署属性数据
        const deploydata = {
            ramnum:
                [
                    { value: "a", msg: "不限制" },
                    { value: "b", msg: "64M" },
                    { value: "c", msg: "128M" },
                    { value: "d", msg: "512M" },
                    { value: "e", msg: "1G" },
                    { value: "f", msg: "2G" },
                    { value: "g", msg: "4G" },
                    { value: "h", msg: "8G" },
                    { value: "i", msg: "16G" },
                    { value: "j", msg: "其他" },
                ]
        }
        // 特殊属性值
        const {
            form: { getFieldDecorator }
        } = this.props;
        const formItemLayout = {
            labelCol: {
                xs: {
                    span: 4
                },
                sm: {
                    span: 4
                }
            },
            wrapperCol: {
                xs: {
                    span: 6
                },
                sm: {
                    span: 6
                }
            }
        };
        const formItemLayouts = {
            labelCol: {
                xs: {
                    span: 4
                },
                sm: {
                    span: 4
                }
            },
            wrapperCol: {
                xs: {
                    span: 14
                },
                sm: {
                    span: 14
                }
            }
        };
        return (
            <div>
                <h2>团队名称</h2>
                <h3 className={styles.applist}>应用列表：</h3>
                <div className={styles.typeBtnWrap}>
                    <Affix offsetTop={0}>
                        <div className={styles.fixed}>
                            {
                                this.state.app.map((item, index) => {
                                    return <span key={index}
                                        className={`${styles.typeBtn}  ${type === item ? styles.active : ""}`}
                                        onClick={() => {
                                            this.handleType(item, index);
                                        }}
                                    >
                                        {item}
                                        <Icon type="right" />
                                    </span>
                                })
                            }
                        </div>
                    </Affix>
                </div>
                <div id='box'>
                    {/* APP1 */}
                    <div className={styles.alltable}>

                        <div className={styles.buttonbox}>
                            {zujian.map((item, index) => {
                                return <button
                                    key={index}
                                    className={this.state.modulecut === index ? styles.checkoutbutton : styles.zujianbutton}
                                    onClick={(e) => this.hander(index, e)
                                    }>{item}</button>
                            })}
                        </div>
                        {/* 部署属性 */}
                        <Card
                            title="部署属性"
                            className={styles.cardstyle}
                            style={{
                                marginBottom: 16,
                            }}>
                            <Row>
                                <h3>组件类型：<span>{appvalue.deploydata.type}</span></h3>
                            </Row>
                            <Row>
                                <h3 className={styles.deploydatanum}>实例数：<span>{appvalue.deploydata.number}</span></h3>
                            </Row>
                            <Row >
                                <div className={styles.ramstyle}>
                                    <h3 >内存：
                                        <Radio.Group onChange={this.onChange} defaultValue="d">
                                            {
                                                deploydata.ramnum.map((item, index) => {
                                                    return <Radio.Button key={index} value={item.value}>{item.msg}</Radio.Button>
                                                })
                                            }
                                        </Radio.Group>
                                    </h3>
                                    {this.state.showSwitch ? (<div style={{ marginBottom: 16 }}>
                                        <Input
                                            addonAfter={"m"}
                                            placeholder={"请输入"}
                                            onChange={this.inputValue}
                                            value={this.state.value}
                                        />
                                    </div>) : ""}
                                </div>
                            </Row>
                            <Row>
                                <div className={styles.cpustyle}>
                                    <h3>CPU: </h3>
                                    <div style={{ marginBottom: 16 }}>
                                        <Input
                                            addonAfter={"m"}
                                            placeholder={"请输入"}
                                        />
                                    </div>
                                </div>
                            </Row>
                        </Card>
                        {/* 端口管理 */}

                        <Duankou
                            appDetail={appDetail}
                        >
                        </Duankou>

                        {/* 环境变量 */}
                        <div>
                            <EnvironmentVariable
                                title="环境变量"
                                type="Inner"
                                appAlias={appDetail.service.service_alias}
                            />
                        </div>
                        {/* 自动伸缩 */}
                        <Card
                            title="自动伸缩"
                            style={{
                                marginBottom: 16,
                            }}>
                            <Table
                                columns={columns}
                                dataSource={data}
                                pagination={false}
                            />
                        </Card>
                        {/* 健康监测 */}
                        <Jiankang
                            startProbe={startProbe}
                        >
                        </Jiankang>
                        {/* 特殊属性 */}
                        <Card title="特殊属性" style={{ marginBottom: '24px' }}>
                            <Form>
                                <FormItem label="NodeSelector" {...formItemLayout}>
                                    {getFieldDecorator('NodeSelector', {
                                        rules: [{ required: false, message: '请输入NodeSelector' }]
                                    })(<DAinput />)}
                                </FormItem>
                                <FormItem label="label" {...formItemLayout}>
                                    {getFieldDecorator('label', {
                                        rules: [{ required: false, message: '请输入label' }]
                                    })(<DAinput />)}
                                </FormItem>
                                <FormItem label="Tolerations" {...formItemLayouts}>
                                    {getFieldDecorator('Tolerations', {
                                        rules: [{ required: false, message: '请输入label' }]
                                    })(<DAselect />)}
                                </FormItem>
                                <FormItem label="secret" {...formItemLayout}>
                                    {getFieldDecorator('secret', {
                                        rules: [{ required: false, message: '请输入secret' }]
                                    })(<DAinput />)}
                                </FormItem>
                                <FormItem label="pvc" {...formItemLayouts}>
                                    {getFieldDecorator('Pvc', {
                                        rules: [{ required: false, message: '请输入Pvc' }]
                                    })(<DApvcinput />)}
                                </FormItem>
                                <FormItem
                                    label="ServiceAccountName"
                                    labelCol={{
                                        xs: {
                                            span: 4
                                        },
                                        sm: {
                                            span: 4
                                        }
                                    }}
                                    wrapperCol={{
                                        xs: {
                                            span: 2
                                        },
                                        sm: {
                                            span: 2
                                        }
                                    }}
                                >
                                    {getFieldDecorator('ServiceAccountName', {
                                        rules: [{ required: false, message: '请输入ServiceAccountName' }]
                                    })(
                                        <Select placeholder="请选择" style={{ width: 157 }}>
                                            <Option value="male">Male</Option>
                                            <Option value="female">Female</Option>
                                            <Option value="other">Other</Option>
                                        </Select>
                                    )}
                                </FormItem>
                                <FormItem
                                    label="Privileged"
                                    labelCol={{
                                        xs: {
                                            span: 4
                                        },
                                        sm: {
                                            span: 4
                                        }
                                    }}
                                    wrapperCol={{
                                        xs: {
                                            span: 2
                                        },
                                        sm: {
                                            span: 2
                                        }
                                    }}
                                >
                                    {getFieldDecorator('privileged', {
                                        rules: [{}]
                                    })(
                                        <Switch defaultChecked onChange={this.handleSwitchOnChange} />
                                    )}
                                </FormItem>
                            </Form>
                        </Card>
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
                        style={{
                            marginRight: 8
                        }}
                        onClick={this.handleBuild}
                        type="primary">确认创建</Button>
                    <Button onClick={this.showDelete} type="default">放弃创建</Button>
                </div>
                {this.state.showDelete && <ConfirmModal
                    onOk={this.handleDelete}
                    title="放弃创建"
                    subDesc="此操作不可恢复"
                    desc="确定要放弃创建此组件吗？"
                    onCancel={() => {
                        this.setState({ showDelete: false })
                    }} />}
            </div>
        );
    }
}
