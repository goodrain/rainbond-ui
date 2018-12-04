import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { routerRedux } from 'dva/router';
import globalUtil from '../../utils/global';
import httpResponseUtil from '../../utils/httpResponse';
import ChangeBuildSource from "./setting/edit-buildsource";
import {
    getMnt,
    addMnt,
    getRelationedApp,
    getUnRelationedApp,
    addRelationedApp,
    removeRelationedApp,
    batchAddRelationedApp,
} from '../../services/app';
import appUtil from '../../utils/app';
import {
    Button,
    Icon,
    Card,
    Modal,
    Row,
    Col,
    Switch,
    Table,
    Radio,
    Tabs,
    Affix,
    Input,
    Form,
    Tooltip
} from "antd";
import styles from './resource.less'
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const TabPane = Tabs.TabPane;
const { TextArea } = Input;
const FormItem = Form.Item;

//node.js
@connect(({ user, appControl, teamControl }) => ({ currUser: user.currentUser }), null, null, { withRef: true })
@Form.create()
class Nodejs extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {}
    }
    componentDidMount() { }
    isShowRuntime = () => {
        const runtimeInfo = this.props.runtimeInfo || {};
        return runtimeInfo.runtimes === false;
    }
    handleSubmit = (e) => {
        const form = this.props.form;
        form.validateFields((err, fieldsValue) => {
            if (err)
                return;
            this.props.onSubmit && this
                .props
                .onSubmit({
                    ...fieldsValue
                })
        });
    }
    render() {
        // const isDisabled = this.props.language ? '' : disabled;
        const formItemLayout = {
            labelCol: {
                span: 5
            },
            wrapperCol: {
                span: 19
            }
        };
        const { getFieldDecorator, getFieldValue } = this.props.form;

        if (!this.isShowRuntime())
            return null;
        return (
            <Card title="node " style={{
                marginBottom: 16
            }}>

                <Form.Item {...formItemLayout} label="运行命令">
                    {getFieldDecorator('service_runtimes', {
                        initialValue: '',
                        rules: [
                            {
                                required: true,
                                message: '请输入'
                            }
                        ]
                    })(<TextArea placeholder="例如：node demo.js" />)}
                </Form.Item>
                <Row>
                    <Col span="5"></Col>
                    <Col span="19">
                        {console.log(this.props.language)}
                        {!this.props.language ? <Tooltip title="暂不支持修改，下个版本将支持"><Button disabled onClick={this.handleSubmit} type={'primary'}>确认修改</Button> </Tooltip> :

                            <Button onClick={this.handleSubmit} type={'primary'}>确认修改</Button>
                        }
                    </Col>
                </Row>
            </Card>
        )
    }
}

//golang
@connect(({ user, appControl, teamControl }) => ({ currUser: user.currentUser }), null, null, { withRef: true })
@Form.create()
class Golang extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {}
    }
    componentDidMount() {
        if (this.isShowRuntime()) {
            this.onChange({
                service_runtimes: this.getDefaultRuntime()
            })
        }
    }
    onChange = (value) => {
        this
            .props
            .dispatch({ type: 'createApp/saveRuntimeInfo', payload: value })
    }
    getDefaultRuntime = () => {
        return '2.0.0';
    }
    isShowRuntime = () => {
        const runtimeInfo = this.props.runtimeInfo || {};
        return runtimeInfo.runtimes === false;
    }
    handleSubmit = (e) => {
        const form = this.props.form;
        form.validateFields((err, fieldsValue) => {
            if (err)
                return;
            this.props.onSubmit && this
                .props
                .onSubmit({
                    ...fieldsValue
                })
        });
    }
    render() {
        const formItemLayout = {
            labelCol: {
                span: 5
            },
            wrapperCol: {
                span: 19
            }
        };
        const { getFieldDecorator, getFieldValue } = this.props.form;

        if (!this.isShowRuntime())
            return null;
        return (
            <Card title="Golang" style={{
                marginBottom: 16
            }}>

                <Form.Item {...formItemLayout} label="版本设置">
                    {getFieldDecorator('service_runtimes', {
                        initialValue: this.getDefaultRuntime(),
                        rules: [
                            {
                                required: true,
                                message: '请选择'
                            }
                        ]
                    })(
                        <RadioGroup>
                            <Radio value="1.9.7">1.9.7</Radio>
                            <Radio value="1.8.7">1.8.7</Radio>
                            <Radio value="1.11.2">1.11.2</Radio>
                            <Radio value="1.11">1.11</Radio>
                            <Radio value="2.1.6">1.11.1</Radio>
                            <Radio value="1.10.5">1.10.5</Radio>
                            <Radio value="1.10.4">1.10.4</Radio>
                        </RadioGroup>
                    )}
                </Form.Item>
                <Row>
                    <Col span="5"></Col>
                    <Col span="19">
                        {/* <Button onClick={this.handleSubmit} type={'primary'}>确认修改</Button> */}
                        {!this.props.language ? <Tooltip title="暂不支持修改，下个版本将支持"><Button disabled onClick={this.handleSubmit} type={'primary'}>确认修改</Button> </Tooltip> :

                            <Button onClick={this.handleSubmit} type={'primary'}>确认修改</Button>
                        }
                    </Col>
                </Row>

            </Card>
        )
    }
}

//python
@connect(({ user, appControl, teamControl }) => ({ currUser: user.currentUser, appDetail: appControl.appDetail }), null, null, { withRef: true })
@Form.create()
class Python extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {}
    }
    componentDidMount() { }
    onChange = (value) => {
        this
            .props
            .dispatch({ type: 'createApp/saveRuntimeInfo', payload: value })
    }
    getDefaultRuntime = () => {
        return '2.7.15';
    }
    isShowRuntime = () => {
        const runtimeInfo = this.props.runtimeInfo || {};
        return runtimeInfo.runtimes === false;
    }
    handleSubmit = (e) => {
        const form = this.props.form;
        form.validateFields((err, fieldsValue) => {
            if (err)
                return;
            this.props.onSubmit && this
                .props
                .onSubmit({
                    ...fieldsValue
                })
        });
    }
    render() {
        const formItemLayout = {
            labelCol: {
                span: 5
            },
            wrapperCol: {
                span: 19
            }
        };
        const { getFieldDecorator, getFieldValue } = this.props.form;

        // if (!this.isShowRuntime()) {
        //     return null;
        // }

        return (
            <Card title="Python设置">
                <Form.Item {...formItemLayout} label="版本设置">
                    {getFieldDecorator('service_runtimes', {
                        initialValue: this.getDefaultRuntime(),
                        rules: [
                            {
                                required: true,
                                message: '请选择'
                            }
                        ]
                    })(
                        <RadioGroup>
                            <Radio value='2.7.15'>2.7.15(默认)</Radio>
                            <Radio value='3.6.6'>3.6.6</Radio>
                            <Radio value='3.7.1'>3.7.1</Radio>
                        </RadioGroup>
                    )}
                </Form.Item>
                <Row>
                    <Col span="5"></Col>
                    <Col span="19">
                        {/* <Button onClick={this.handleSubmit} type={'primary'}>确认修改</Button> */}
                        {!this.props.language ? <Tooltip title="暂不支持修改，下个版本将支持"><Button disabled onClick={this.handleSubmit} type={'primary'}>确认修改</Button> </Tooltip> :

                            <Button onClick={this.handleSubmit} type={'primary'}>确认修改</Button>
                        }
                    </Col>
                </Row>
            </Card>
        )
    }
}

//java
@connect(({ user, appControl, teamControl }) => ({ currUser: user.currentUser, appDetail: appControl.appDetail }), null, null, { withRef: true })
@Form.create()
class JAVA extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {}
    }
    componentDidMount() { }
    isShowJdk = () => {
        const runtimeInfo = this.props.runtimeInfo || {};

        const language = this.props.language;
        if ((language === 'java-jar' || language === 'java-war') && runtimeInfo.runtimes === false) {
            return true;
        }

        if (language === 'java-maven') {
            return true;
        }

        return false;
    }
    isShowService = () => {
        const runtimeInfo = this.props.runtimeInfo || {};
        const language = this.props.language;
        if ((language === 'java-jar' || language === 'java-war') && runtimeInfo.procfile === false) {
            return true;
        }
        return false;
    }
    getDefaultRuntime = () => {
        return '1.8'
    }
    getDefaultService = () => {
        return 'tomcat7'
    }
    handleSubmit = (e) => {
        const form = this.props.form;
        form.validateFields((err, fieldsValue) => {
            if (err)
                return;
            this.props.onSubmit && this
                .props
                .onSubmit({
                    ...fieldsValue
                })
        });
    }
    render() {
        const runtimeInfo = this.props.runtimeInfo || {};
        const language = this.props.language;
        const formItemLayout = {
            labelCol: {
                span: 5
            },
            wrapperCol: {
                span: 19
            }
        };

        // if (!this.isShowJdk() && !this.isShowService()) {
        //     return null;
        // }

        const { getFieldDecorator, getFieldValue } = this.props.form;
        return (
            <Card title="Java设置">

                {<Form.Item {...formItemLayout} label="JDK设置">
                    {getFieldDecorator('service_runtimes', {
                        initialValue: this.getDefaultRuntime(),
                        rules: [
                            {
                                required: true,
                                message: '请选择应用类型'
                            }
                        ]
                    })(
                        <RadioGroup>
                            <Radio value='1.8' selected="selected">openjdk 1.8.0_40(默认)</Radio>
                            <Radio value='1.6'>openjdk 1.6.0_27</Radio>
                            <Radio value='1.7'>openjdk 1.7.0_79</Radio>
                        </RadioGroup>
                    )}
                </Form.Item>
                }

                {
                    <Form.Item {...formItemLayout} label="web服务器">
                        {getFieldDecorator('service_server', {
                            initialValue: this.getDefaultService(),
                            rules: [
                                {
                                    required: true,
                                    message: '请选择'
                                }
                            ]
                        })(
                            <RadioGroup>
                                <Radio value="tomcat7" selected="selected">tomcat 7（默认）</Radio>
                                <Radio value="tomcat8">tomcat 8</Radio>
                                <Radio value="jetty7">jetty 7.5</Radio>
                            </RadioGroup>
                        )}
                    </Form.Item>
                }

                <Row>
                    <Col span="5"></Col>
                    <Col span="19">
                        {/* <Button onClick={this.handleSubmit} type={'primary'}>确认修改</Button> */}
                        {!this.props.language ? <Tooltip title="暂不支持修改，下个版本将支持"><Button disabled onClick={this.handleSubmit} type={'primary'}>确认修改</Button> </Tooltip> :

                            <Button onClick={this.handleSubmit} type={'primary'}>确认修改</Button>
                        }
                    </Col>
                </Row>

            </Card>
        )
    }
}

//php
@connect(({ user, appControl, teamControl }) => ({ currUser: user.currentUser, appDetail: appControl.appDetail }), null, null, { withRef: true })
@Form.create()
class PHP extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            enablePlugs: [
                {
                    name: 'Bzip2',
                    version: '1.0.6, 6-Sept-2010',
                    url: 'http://docs.php.net/bzip2'
                }, {
                    name: 'cURL',
                    version: '7.35.0',
                    url: 'http://docs.php.net/curl'
                }, {
                    name: 'FPM',
                    version: '',
                    url: 'http://docs.php.net/fpm'
                }, {
                    name: 'mcrypt',
                    version: '2.5.8',
                    url: 'http://docs.php.net/mcrypt'
                }, {
                    name: 'MySQL(PDO)',
                    version: 'mysqlnd 5.0.11-dev - 20120503',
                    url: 'http://docs.php.net/pdo_mysql'
                }, {
                    name: 'MySQLi',
                    version: 'mysqlnd 5.0.11-dev - 20120503',
                    url: 'http://docs.php.net/mysqli'
                }, {
                    name: 'OPcache',
                    version: 'Mosa',
                    url: 'http://docs.php.net/opcache'
                }, {
                    name: 'OpenSSL',
                    version: 'Mosa',
                    url: 'http://docs.php.net/pgsql'
                }, {
                    name: 'PostgreSQL(PDO)',
                    version: '9.3.6',
                    url: 'http://docs.php.net/pdo_pgsql'
                }, {
                    name: 'Readline',
                    version: '6.3',
                    url: 'http://docs.php.net/readline'
                }, {
                    name: 'Sockets',
                    version: '',
                    url: 'http://docs.php.net/sockets'
                }, {
                    name: 'Zip',
                    version: '1.12.5',
                    url: 'http://docs.php.net/zip'
                }, {
                    name: 'Zlib',
                    version: '1.2.8',
                    url: 'http://docs.php.net/zlib'
                }
            ],
            unablePlugs: [
            ],
            //扩展
            dependencies: [],
            selected_dependency: this.props.selected_dependency || [],
            service_dependency: (this.props.selected_dependency || []).join(','),
            versions: [],
            default_version: ''
        }
    }
    componentDidMount() {
        this.getPhpConfig();
        const runtimeInfo = this.props.runtimeInfo || {};
        if (runtimeInfo.runtimes === false) {
            this.onChange({
                service_runtimes: this.getDefaultRuntime()
            })
        }

        if (runtimeInfo.procfile === false) {
            this.onChange({
                service_runtimes: this.getDefaultService()
            })
        }

    }
    getPhpConfig = () => {
        this.props.dispatch({
            type: 'appControl/getPhpConfig',
            callback: (data) => {
                this.setState({ versions: data.bean.versions, default_version: data.bean.default_version, unablePlugs: data.bean.extends })
            }
        })
    }
    onChange = (value) => {
        this
            .props
            .dispatch({ type: 'createApp/saveRuntimeInfo', payload: value })
    }
    getDefaultRuntime = () => {
        return '5.6.11';
    }
    getDefaultService = () => {
        return 'apache'
    }
    handleSubmit = (e) => {
        const form = this.props.form;
        form.validateFields((err, fieldsValue) => {
            if (err)
                return;
            this.props.onSubmit && this
                .props
                .onSubmit({
                    ...fieldsValue,
                    service_dependency: this.state.service_dependency
                })
        });
    }
    render() {
        const radioStyle = {
            display: 'block',
            height: '30px',
            lineHeight: '30px'
        };

        const rowSelection = {
            selectedRowKeys: this.state.selected_dependency,
            onChange: (selectedRowKeys, selectedRows) => {
                this.setState({
                    service_dependency: selectedRowKeys.join(','),
                    selected_dependency: selectedRowKeys
                })
            }
        };

        const { getFieldDecorator, getFieldValue } = this.props.form;

        const runtimeInfo = this.props.runtimeInfo || {};
        const userRunTimeInfo = this.props.userRunTimeInfo;
        const formItemLayout = {
            labelCol: {
                span: 5
            },
            wrapperCol: {
                span: 19
            }
        };

        if (runtimeInfo.runtimes && runtimeInfo.procfile && runtimeInfo.dependencies) {
            return null;
        }

        if (!this.state.versions.length) return null;

        return (
            <Fragment>
                <Card title="PHP设置" style={{
                    marginBottom: 16
                }}>
                    {(!runtimeInfo.runtimes)
                        ? <Form.Item {...formItemLayout} label="版本设置">
                            {getFieldDecorator('service_runtimes', {
                                initialValue: userRunTimeInfo.runtimes || this.state.default_version,
                                rules: [
                                    {
                                        required: true,
                                        message: '请选择应用类型'
                                    }
                                ]
                            })(
                                <RadioGroup>
                                    {
                                        this.state.versions.map((item) => {
                                            return <Radio value={item}>{item}</Radio>
                                        })
                                    }
                                </RadioGroup>
                            )}
                        </Form.Item>
                        : null
                    }

                    {(!runtimeInfo.procfile)
                        ? <Form.Item {...formItemLayout} label="web服务器">
                            {getFieldDecorator('service_server', {
                                initialValue: this.getDefaultService(),
                                rules: [
                                    {
                                        required: true,
                                        message: '请选择'
                                    }
                                ]
                            })(
                                <RadioGroup>
                                    <Radio value="apache">apache</Radio>
                                    <Radio value="nginx">nginx</Radio>
                                </RadioGroup>
                            )}
                        </Form.Item>
                        : null
                    }

                    {(!runtimeInfo.dependencies)
                        ? <Form.Item {...formItemLayout} label="PHP扩展">
                            <Tabs defaultActiveKey="1">
                                <TabPane tab="已启用扩展" key="1">
                                    <Table
                                        columns={[
                                            {
                                                title: '名称',
                                                dataIndex: 'name',
                                                render: (v, data) => {
                                                    return <a target="_blank" href={data.url}>{v}</a>
                                                }
                                            }, {
                                                title: '版本',
                                                dataIndex: 'version'
                                            }
                                        ]}
                                        pagination={false}
                                        dataSource={this.state.enablePlugs} />
                                </TabPane>
                                <TabPane tab="未启用扩展" key="2">
                                    <Table
                                        rowKey='value'
                                        columns={[
                                            {
                                                title: '名称',
                                                dataIndex: 'name',
                                                render: (v, data) => {
                                                    return <a target="_blank" href={data.url}>{v}</a>
                                                }
                                            }, {
                                                title: '版本',
                                                dataIndex: 'version'
                                            }, {
                                                title: "操作",
                                                dataIndex: "action",
                                            }
                                        ]}
                                        rowSelection={rowSelection}
                                        pagination={false}
                                        dataSource={this.state.unablePlugs} />
                                </TabPane>
                            </Tabs>
                        </Form.Item>
                        : null
                    }

                    <Row>
                        <Col span="5"></Col>
                        <Col span="19">
                            {/* <Button onClick={this.handleSubmit} type={'primary'}>确认修改</Button> */}
                            {!this.props.language ? <Tooltip title="暂不支持修改，下个版本将支持"><Button disabled onClick={this.handleSubmit} type={'primary'}>确认修改</Button> </Tooltip> :

                                <Button onClick={this.handleSubmit} type={'primary'}>确认修改</Button>
                            }
                        </Col>
                    </Row>
                </Card>

            </Fragment>
        )
    }
}
@connect(
    ({ user, appControl }) => ({
        currUser: user.currentUser,
        createWay: appControl.createWay
    }),
    { withRef: true }
)
export default class Index extends PureComponent {
    constructor(arg) {
        super(arg);
        this.state = {
            runtimeInfo: null,
            changeBuildSource: false,
            buildSource: null,
        };
    }
    componentDidMount() {
        this.getRuntimeInfo();
        this.loadBuildSourceInfo();
    }
    handleEditRuntime = (val = {}) => {
        this
            .props
            .dispatch({
                type: 'appControl/editRuntimeInfo',
                payload: {
                    team_name: globalUtil.getCurrTeamName(),
                    app_alias: this.props.appDetail.service.service_alias,
                    ...val
                },
                callback: (data) => { }
            })
    }
    handleEditInfo = (val = {}) => {
        this
            .props
            .dispatch({
                type: 'appControl/editAppCreateInfo',
                payload: {
                    team_name: globalUtil.getCurrTeamName(),
                    app_alias: this.props.appDetail.service.service_alias,
                    ...val
                },
                callback: (data) => {
                    if (data) {
                        this.props.updateDetail()
                    }
                }
            })
    }
    getRuntimeInfo = () => {
        this
            .props
            .dispatch({
                type: 'appControl/getRuntimeInfo',
                payload: {
                    team_name: globalUtil.getCurrTeamName(),
                    app_alias: this.props.appDetail.service.service_alias
                },
                callback: (data) => {
                    this.setState({ runtimeInfo: data.bean })
                }
            })
    }
    changeBuildSource = () => {
        this.setState({ changeBuildSource: true });
    };
    hideBuildSource = () => {
        this.setState({ changeBuildSource: false });
    };
    onChangeBuildSource = () => {
        this.hideBuildSource();
        this.loadBuildSourceInfo();
    };
    loadBuildSourceInfo = () => {
        const { dispatch } = this.props;
        const team_name = globalUtil.getCurrTeamName();
        dispatch({
            type: "appControl/getAppBuidSource",
            payload: {
                team_name,
                service_alias: this.props.appDetail.service.service_alias,
            },
            callback: (data) => {
                console.log(data)
                this.setState({ buildSource: data.bean });
            },
        });
    };
    render() {
        const language = appUtil.getLanguage(this.props.appDetail);
        const runtimeInfo = this.state.runtimeInfo;
        const visible = this.props.visible;
        if (!this.state.runtimeInfo)
            return null;
        const appDetail = this.props.appDetail;
        const formItemLayout = {
            labelCol: {
                xs: {
                    span: 24,
                },
                sm: {
                    span: 3,
                },
            },
            wrapperCol: {
                xs: {
                    span: 24,
                },
                sm: {
                    span: 16,
                },
            },
        };
        const languageObj = {
            "java-jar": "https://www.goodrain.com/docs/stable/user-manual/language-support/java.html",
            "java-war": "https://www.goodrain.com/docs/stable/user-manual/language-support/java.html",
            "java-maven": "https://www.goodrain.com/docs/stable/user-manual/language-support/java.html",
            "php": "https://www.goodrain.com/docs/stable/user-manual/language-support/php.html",
            "python": "https://www.goodrain.com/docs/stable/user-manual/language-support/python.html",
            "nodejs": "https://www.goodrain.com/docs/stable/user-manual/language-support/nodejs.html",
            "golang": "https://www.goodrain.com/docs/stable/user-manual/language-support/golang.html",

        }
        return (
            <Fragment>
                {this.state.buildSource && (
                    <Card
                        title="构建源"
                        style={{
                            marginBottom: 24,
                        }}
                        extra={
                            !appUtil.isMarketAppByBuildSource(this.state.buildSource) && (
                                <a onClick={this.changeBuildSource} href="javascript:;">
                                    更改
                                </a>
                            )
                        }
                    >
                        <div>
                            <FormItem
                                style={{
                                    marginBottom: 0,
                                }}
                                {...formItemLayout}
                                label="创建方式"
                            >
                                {appUtil.getCreateTypeCNByBuildSource(this.state.buildSource)}
                            </FormItem>
                        </div>
                        {appUtil.isImageAppByBuildSource(this.state.buildSource) ? (
                            <div>
                                <FormItem
                                    style={{
                                        marginBottom: 0,
                                    }}
                                    {...formItemLayout}
                                    label="镜像名称"
                                >
                                    {this.state.buildSource.image}
                                </FormItem>
                                <FormItem
                                    style={{
                                        marginBottom: 0,
                                    }}
                                    {...formItemLayout}
                                    label="版本"
                                >
                                    {this.state.buildSource.version}
                                </FormItem>
                                <FormItem
                                    style={{
                                        marginBottom: 0,
                                    }}
                                    {...formItemLayout}
                                    label="启动命令"
                                >
                                    {this.state.buildSource.cmd}
                                </FormItem>
                            </div>
                        ) : (
                                ""
                            )}
                        {appUtil.isMarketAppByBuildSource(this.state.buildSource) ? (
                            <Fragment>
                                <FormItem
                                    style={{
                                        marginBottom: 0,
                                    }}
                                    {...formItemLayout}
                                    label="云市应用名称"
                                >
                                    {this.state.buildSource.group_key ? (
                                        <a href="javascript:;" onClick={() => {
                                            this.setState({
                                                showApp: {
                                                    details: this.state.buildSource.details,
                                                    group_name: this.state.buildSource.rain_app_name,
                                                    group_key: this.state.buildSource.group_key,
                                                },
                                                showMarketAppDetail: true
                                            });
                                        }}>{this.state.buildSource.rain_app_name}</a>
                                    ) : ("无法找到源应用，可能已删除")}
                                </FormItem>
                                <FormItem
                                    style={{
                                        marginBottom: 0,
                                    }}
                                    {...formItemLayout}
                                    label="版本"
                                >
                                    {this.state.buildSource.version}
                                </FormItem>
                            </Fragment>
                        ) : (
                                ""
                            )}
                        {appUtil.isCodeAppByBuildSource(this.state.buildSource) ? (
                            <Fragment>
                                <FormItem
                                    style={{
                                        marginBottom: 0,
                                    }}
                                    {...formItemLayout}
                                    label="仓库地址"
                                >
                                    <a href={this.state.buildSource.git_url} target="_blank">
                                        {this.state.buildSource.git_url}
                                    </a>
                                </FormItem>
                                <FormItem
                                    style={{
                                        marginBottom: 0,
                                    }}
                                    {...formItemLayout}
                                    label="代码版本"
                                >
                                    {this.state.buildSource.code_version}
                                </FormItem>
                                <FormItem
                                    style={{
                                        marginBottom: 0,
                                    }}
                                    {...formItemLayout}
                                    className={styles.ant_form_item}
                                    label="语言"
                                >
                                    {this.state.buildSource.language != "static" ? <a target="blank" href={languageObj[`${this.state.buildSource.language}`]}>{this.state.buildSource.language}</a> : '无'}
                                </FormItem>
                            </Fragment>
                        ) : (
                                ""
                            )}
                        {/* <ChangeBranch
                  isCreateFromCustomCode={appUtil.isCreateFromCustomCode(appDetail)}
                  appAlias={this.props.appAlias}
                  isShowDeployTips={(onoffshow) => {
                    this.props.onshowDeployTips(onoffshow);
                  }}
                /> */}
                    </Card>
                )}
                {<PHP
                    appDetail={this.props.appDetail}
                    onSubmit={this.handleEditRuntime}
                    runtimeInfo={runtimeInfo.check_dependency || {}}
                    userRunTimeInfo={runtimeInfo.user_dependency || {}}
                    selected_dependency={runtimeInfo.selected_dependency || []}
                    language={language === 'php'}
                />
                }

                {
                    <JAVA
                        appDetail={this.props.appDetail}
                        onSubmit={this.handleEditRuntime}
                        language={language}
                        runtimeInfo={runtimeInfo.check_dependency || {}}
                        language={appUtil.isJava(this.props.appDetail) == 'java-war' || appUtil.isJava(this.props.appDetail) == 'java-jar' || appUtil.isJava(this.props.appDetail) == 'java-maven'}
                    />

                }

                {
                    <Python
                        appDetail={this.props.appDetail}
                        onSubmit={this.handleEditRuntime}
                        runtimeInfo={runtimeInfo.check_dependency == 'python'}
                        language={language == "Python"}
                    />

                }

                {<Golang
                    appDetail={this.props.appDetail}
                    onSubmit={this.handleEditRuntime}
                    runtimeInfo={runtimeInfo.check_dependency || {}}
                    language={language == "go"}
                />

                }

                {
                    <Nodejs
                        appDetail={this.props.appDetail}
                        onSubmit={this.handleEditRuntime}
                        runtimeInfo={runtimeInfo.check_dependency || {}}
                        language={language == 'nodejs'}
                    />
                }
                {this.state.changeBuildSource && (
                    <ChangeBuildSource
                        onOk={this.onChangeBuildSource}
                        buildSource={this.state.buildSource}
                        appAlias={this.props.appDetail.service.service_alias}
                        title="更改应用构建源"
                        onCancel={this.hideBuildSource}
                    />
                )}
            </Fragment>
        );
    }
}
