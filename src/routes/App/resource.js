import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { routerRedux } from 'dva/router';
import globalUtil from '../../utils/global';
import httpResponseUtil from '../../utils/httpResponse';
import ChangeBuildSource from "./setting/edit-buildsource";
import MarketAppDetailShow from "../../components/MarketAppDetailShow";
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
import { languageObj } from '../../utils/utils';
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
    Tooltip,
    Checkbox
} from "antd";
import styles from './resource.less'
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const TabPane = Tabs.TabPane;
const { TextArea } = Input;
const FormItem = Form.Item;
import AutoDeploy from "./setting/auto-deploy";

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
    getDefaultRuntime = () => {
        return "-1"
    }
    render() {
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
                    span: 21,
                },
            },
        };
        const { getFieldDecorator, getFieldValue } = this.props.form;
        const { userRunTimeInfo } = this.props;
        // if (!this.isShowRuntime())
        //     return null;
        return (
            <Card title="node版本支持" style={{
                marginBottom: 16
            }}>
                <Form.Item {...formItemLayout} label="版本">
                    {getFieldDecorator('service_runtimes', {
                        initialValue: userRunTimeInfo.runtimes,
                        rules: [
                            {
                                required: true,
                                message: '请选择'
                            }
                        ]
                    })(
                        <RadioGroup disabled className={styles.ant_radio_disabled}>
                            <Radio value="5.12.0">5.12.0</Radio>
                            <Radio value="6.14.4">6.14.4</Radio>
                            <Radio value="7.10.1">7.10.1</Radio>
                            <Radio value="8.12.0">8.12.0</Radio>
                            <Radio value="9.11.2">9.11.2</Radio>
                            {/* <Tooltip title="将使用源码定义的版本">
                                <Radio value="-1">未设置</Radio>
                            </Tooltip> */}
                        </RadioGroup>
                    )}
                </Form.Item>
                {/* <Form.Item {...formItemLayout} label="运行命令">
                    {getFieldDecorator('service_server', {
                        initialValue: userRunTimeInfo.procfile || '',
                        rules: [
                            {
                                required: true,
                                message: '请输入'
                            }
                        ]
                    })(<TextArea placeholder="例如：node demo.js" />)}
                </Form.Item> */}
                {/* <Row>
                    <Col span="5"></Col>
                    <Col span="19">
                        <Button onClick={this.handleSubmit} type={'primary'}>确认修改</Button>
                    </Col>
                </Row> */}
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
        // if (this.isShowRuntime()) {
        //     this.onChange({
        //         service_runtimes: this.getDefaultRuntime()
        //     })
        // }
    }
    onChange = (value) => {
        this
            .props
            .dispatch({ type: 'createApp/saveRuntimeInfo', payload: value })
    }
    getDefaultRuntime = () => {
        return '1.11.2';
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
                    span: 21,
                },
            },
        };
        const { getFieldDecorator, getFieldValue } = this.props.form;

        const { userRunTimeInfo } = this.props;
        // if (!this.isShowRuntime())
        //     return null;
        return (
            <Card title="Golang版本支持" style={{
                marginBottom: 16
            }}>

                <Form.Item {...formItemLayout} label="版本">
                    {getFieldDecorator('service_runtimes', {
                        initialValue: userRunTimeInfo.runtimes || this.getDefaultRuntime(),
                        rules: [
                            {
                                required: true,
                                message: '请选择'
                            }
                        ]
                    })(
                        <RadioGroup disabled className={styles.ant_radio_disabled}>
                            <Radio value="1.9.7">1.9.7</Radio>
                            <Radio value="1.8.7">1.8.7</Radio>
                            <Radio value="1.11.2">1.11.2(默认)</Radio>
                            <Radio value="1.11">1.11</Radio>
                            <Radio value="1.11.1">1.11.1</Radio>
                            <Radio value="1.10.5">1.10.5</Radio>
                            <Radio value="1.10.4">1.10.4</Radio>
                            {/* <Tooltip title="将使用源码定义的版本">
                                <Radio value="-1">未设置</Radio>
                            </Tooltip> */}
                        </RadioGroup>
                    )}
                </Form.Item>
                {/* <Row>
                    <Col span="5"></Col>
                    <Col span="19">
                        <Button onClick={this.handleSubmit} type={'primary'}>确认修改</Button>
                    </Col>
                </Row> */}

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
                    span: 21,
                },
            },
        };
        const { getFieldDecorator, getFieldValue } = this.props.form;
        const { userRunTimeInfo } = this.props;
        // if (!this.isShowRuntime()) {
        //     return null;
        // }

        return (
            <Card title="Python版本支持">
                <Form.Item {...formItemLayout} label="版本">
                    {getFieldDecorator('service_runtimes', {
                        initialValue: userRunTimeInfo.runtimes || this.getDefaultRuntime(),
                        rules: [
                            {
                                required: true,
                                message: '请选择'
                            }
                        ]
                    })(
                        <RadioGroup disabled className={styles.ant_radio_disabled}>
                            <Radio value='2.7.15'>2.7.15(默认)</Radio>
                            <Radio value='3.6.6'>3.6.6</Radio>
                            <Radio value='3.7.1'>3.7.1</Radio>
                            {/* <Tooltip title="将使用源码定义的版本">
                                <Radio value="-1">未设置</Radio>
                            </Tooltip> */}
                        </RadioGroup>
                    )}
                </Form.Item>
                {/* <Row>
                    <Col span="5"></Col>
                    <Col span="19">
                        <Button onClick={this.handleSubmit} type={'primary'}>确认修改</Button>
                    </Col>
                </Row> */}
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
        this.state = {
            NO_CACHE: false,
            DEBUG: false,
            BUILD_DEBUG_INFO: false,
            BUILD_ENABLE_ORACLEJDK: false,
            JDKType: props.form.getFieldValue('RUNTIMES'),
            languageType: this.props.language,
            BUILD_ONLINE: false,
            NODE_MODULES_CACHE: false,
            NODE_VERBOSE: false
        }
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
        let subObject = {};
        const { NO_CACHE, DEBUG, BUILD_DEBUG_INFO, BUILD_ENABLE_ORACLEJDK, BUILD_ONLINE, NODE_MODULES_CACHE, NODE_VERBOSE } = this.state;



        form.validateFields((err, fieldsValue) => {
            // if (err) return;
            const { BUILD_PROCFILE,
                RUNTIMES, OpenJDK,
                JDK,
                BUILD_ORACLEJDK_URL,
                Maven,
                WebappRunner,
                Python,
                Node,
                PHP,
                Golang,
                web,
                BUILD_MAVEN_MIRROR_DISABLE,
                BUILD_MAVEN_MIRROR_OF,
                BUILD_MAVEN_MIRROR_URL,
                BUILD_MAVEN_CUSTOM_OPTS,
                BUILD_MAVEN_CUSTOM_GOALS,
                BUILD_MAVEN_SETTINGS_URL,
                BUILD_MAVEN_JAVA_OPTS,
                BUILD_WEBSERVER_URL,
                NODE_ENV,
                NPM_CONFIG_LOGLEVEL
            } = fieldsValue

            NO_CACHE ? subObject.NO_CACHE = true : ""
            DEBUG ? subObject.DEBUG = true : ""
            BUILD_DEBUG_INFO ? subObject.BUILD_DEBUG_INFO = true : ""
            BUILD_PROCFILE ? subObject.BUILD_PROCFILE = BUILD_PROCFILE : ""
            RUNTIMES ? subObject.RUNTIMES = RUNTIMES : ""
            OpenJDK ? subObject.OpenJDK = OpenJDK : ""
            JDK ? subObject.JDK = JDK : ""
            BUILD_ENABLE_ORACLEJDK ? subObject.BUILD_ENABLE_ORACLEJDK = BUILD_ENABLE_ORACLEJDK : ""
            BUILD_ENABLE_ORACLEJDK && BUILD_ORACLEJDK_URL ? subObject.BUILD_ORACLEJDK_URL = BUILD_ORACLEJDK_URL : ""
            Maven ? subObject.Maven = Maven : ""
            WebappRunner ? subObject.WebappRunner = WebappRunner : ""
            Python ? subObject.Python = Python : ""
            Node ? subObject.Node = Node : ""
            PHP ? subObject.PHP = PHP : ""
            Golang ? subObject.Golang = Golang : ""
            web ? subObject.web = web : ""
            BUILD_MAVEN_MIRROR_DISABLE && BUILD_MAVEN_MIRROR_DISABLE.length > 0 ? subObject.BUILD_MAVEN_MIRROR_DISABLE = true : ""
            BUILD_MAVEN_MIRROR_OF ? subObject.BUILD_MAVEN_MIRROR_OF = BUILD_MAVEN_MIRROR_OF : ""
            BUILD_MAVEN_MIRROR_URL ? subObject.BUILD_MAVEN_MIRROR_URL = BUILD_MAVEN_MIRROR_URL : ""
            BUILD_MAVEN_CUSTOM_OPTS ? subObject.BUILD_MAVEN_CUSTOM_OPTS = BUILD_MAVEN_CUSTOM_OPTS : ""
            BUILD_MAVEN_CUSTOM_GOALS ? subObject.BUILD_MAVEN_CUSTOM_GOALS = BUILD_MAVEN_CUSTOM_GOALS : ""
            BUILD_MAVEN_SETTINGS_URL ? subObject.BUILD_MAVEN_SETTINGS_URL = BUILD_MAVEN_SETTINGS_URL : ""
            BUILD_MAVEN_JAVA_OPTS ? subObject.BUILD_MAVEN_JAVA_OPTS = BUILD_MAVEN_JAVA_OPTS : ""
            BUILD_ONLINE ? subObject.BUILD_ONLINE = true : ""
            BUILD_WEBSERVER_URL ? subObject.BUILD_WEBSERVER_URL = BUILD_WEBSERVER_URL : ""
            NODE_MODULES_CACHE ? subObject.NODE_MODULES_CACHE = true : ""
            NODE_VERBOSE ? subObject.NODE_VERBOSE = true : ""
            NODE_ENV ? subObject.NODE_ENV = NODE_ENV : ""
            NPM_CONFIG_LOGLEVEL ? subObject.NPM_CONFIG_LOGLEVEL = NPM_CONFIG_LOGLEVEL : ""


            this.props.onSubmit && this.props.onSubmit(subObject)
        });
    }

   
    handleDisabledName = (name) => {
        this.setState({
            [name]: true
        })
    }

    handleRadio = (name) => {
        this.setState({
            [name]: !this.state[name]
        })
    }
    onRadioChange = (e) => {
    }


    onRadioGroupChange = (e) => {

        //    const {getFieldValue}= this.props.form
        //    let jak= this.props.form.getFieldValue('RUNTIMES')
        //    console.log("jak",jak)
        // console.log('radio checked', e.target.value);
        this.setState({
            JDKType: e.target.value,
        });
    }
    render() {
        const runtimeInfo = this.props.runtimeInfo || {};
        const language = this.props.language;
        const formItemLayout = {
            labelCol: {
                xs: {
                    span: 4,
                },
                sm: {
                    span: 4,
                },
            },
            wrapperCol: {
                xs: {
                    span: 20,
                },
                sm: {
                    span: 20,
                },
            },
        };

        // if (!this.isShowJdk() && !this.isShowService()) {
        //     return null;
        // }

        const { getFieldDecorator, getFieldValue } = this.props.form;
        const { userRunTimeInfo } = this.props;
        const { JDKType, languageType } = this.state;
        return (
            <Card title="构建运行环境设置">

                <Form.Item {...formItemLayout} label="全局">
                    {getFieldDecorator('global', {
                        initialValue: ""
                    })(
                        <div>
                            <Radio onClick={() => { this.handleRadio("NO_CACHE") }} checked={this.state.NO_CACHE} >缓存</Radio>
                            <Radio onClick={() => { this.handleRadio("DEBUG") }} checked={this.state.DEBUG} >DEBUG</Radio>
                            <Radio onClick={() => { this.handleRadio("BUILD_DEBUG_INFO") }} checked={this.state.BUILD_DEBUG_INFO} >显示RUNTIME资源信息</Radio>
                        </div>
                    )}
                </Form.Item>



                <Form.Item {...formItemLayout} label="启动命令">
                    {getFieldDecorator('BUILD_PROCFILE', {
                        initialValue: ""
                    })(
                        <TextArea placeholder="示例：web: java $JAVA_OPTS -jar ./webapp-runner.jar --port $PORT target/*.war" ></TextArea>
                    )}
                </Form.Item>

                {languageType=="java-jar"||languageType=="java-war"||languageType=="java-maven" && <Form.Item {...formItemLayout} label="选择JDK版本">
                    {getFieldDecorator('RUNTIMES', {
                        initialValue: ""
                    })(
                        <RadioGroup className={styles.ant_radio_disabled} onChange={this.onRadioGroupChange}>
                            <Radio value='OpenJDK'>OpenJDK</Radio>
                            <Radio value='Jdk'>JDK</Radio>
                            <Radio value=''>取消</Radio>
                        </RadioGroup>
                    )}
                </Form.Item>}


                {JDKType == "OpenJDK" && <Form.Item {...formItemLayout} label="OpenJDK支持">
                    {getFieldDecorator('OpenJDK', {
                        initialValue: "",
                    })(
                        <RadioGroup >
                            <Radio value='1.8'>openjdk 1.8.0_74(默认)</Radio>
                            <Radio value='1.6'>openjdk 1.6.0_27</Radio>
                            <Radio value='1.7'>openjdk 1.7.0_95</Radio>
                            <Radio value='1.9'>openjdk 1.9-latest</Radio>
                            <Radio value='10'>openjdk 10.0.2</Radio>
                            <Radio value='11'>openjdk 11.0.1</Radio>
                        </RadioGroup>
                    )}
                </Form.Item>
                }

                {JDKType == "Jdk" && <Form.Item {...formItemLayout} label="OracleJDK">
                    {getFieldDecorator('BUILD_ENABLE_ORACLEJDK', {
                        initialValue: "",
                    })(<div>
                        <Radio onClick={() => { this.handleRadio("BUILD_ENABLE_ORACLEJDK") }} checked={this.state.BUILD_ENABLE_ORACLEJDK} >启用</Radio>
                        <div>ORACLEJDK下载路径</div>
                        <Form.Item {...formItemLayout} label="">
                            {getFieldDecorator('BUILD_ORACLEJDK_URL', {
                                initialValue: "",
                            })(
                                <TextArea placeholder="" disabled={this.state.BUILD_ENABLE_ORACLEJDK ? false : true}></TextArea>
                            )}
                        </Form.Item>
                    </div>
                    )}
                </Form.Item>
                }

                {languageType == "maven" && <Form.Item {...formItemLayout} label="Maven支持">
                    {getFieldDecorator('Maven', {
                        initialValue: "",
                    })(
                        <RadioGroup className={styles.ant_radio_disabled}>
                            <Radio value="3.3.1" selected="selected">3.3.1(默认)</Radio>
                            <Radio value="3.0.5">3.0.5</Radio>
                            <Radio value="3.1.1">3.1.1</Radio>
                            <Radio value="3.2.5">3.2.5</Radio>
                            <Radio value="3.3.9">3.3.9</Radio>
                            <Radio value="">空</Radio>
                        </RadioGroup>
                    )}
                </Form.Item>}



                {languageType == "webapp-runner" && <Form.Item {...formItemLayout} label="Webapp-runner支持">
                    {getFieldDecorator('WebappRunner', {
                        initialValue: "",
                    })(
                        <RadioGroup className={styles.ant_radio_disabled}>
                            <Radio value="webapp-runner-8.5.38.0" selected="selected">webapp-runner-8.5.38.0(默认)</Radio>
                            <Radio value="webapp-runner-9.0.16.0">webapp-runner-9.0.16.0</Radio>
                            <Radio value="webapp-runner-8.0.52.0">webapp-runner-8.0.52.0</Radio>
                            <Radio value="webapp-runner-7.0.91.0">webapp-runner-7.0.91.0</Radio>
                            <Radio value="">空</Radio>
                        </RadioGroup>
                    )}
                </Form.Item>}

                {languageType == "python" && <Form.Item {...formItemLayout} label="Python支持">
                    {getFieldDecorator('Python', {
                        initialValue: "",
                    })(
                        <RadioGroup className={styles.ant_radio_disabled}>
                            <Radio value="python-3.6.6" selected="selected">python-3.6.6(默认)</Radio>
                            <Radio value="python-2.7.15">python-2.7.15(默认)</Radio>
                            <Radio value="python-2.7.9">python-2.7.9</Radio>
                            <Radio value="python-2.7.10">python-2.7.10</Radio>
                            <Radio value="python-2.7.13">python-2.7.13</Radio>
                            <Radio value="python-2.7.14 ">python-2.7.14</Radio>
                            <Radio value="python-3.4.3">python-3.4.3</Radio>
                            <Radio value="python-3.5.3">python-3.5.3</Radio>
                            <Radio value="python-2.7.13">python-2.7.13</Radio>
                            <Radio value="python-3.7.0">python-3.7.0</Radio>
                            <Radio value="">空</Radio>
                        </RadioGroup>
                    )}
                </Form.Item>}

                {languageType == "nodejs" && <Form.Item {...formItemLayout} label="Node支持">
                    {getFieldDecorator('Node', {
                        initialValue: ""
                    })(
                        <RadioGroup className={styles.ant_radio_disabled}>
                            <Radio value="8.12.0" selected="selected">8.12.0(默认)</Radio>
                            <Radio value="4.9.1">4.9.1</Radio>
                            <Radio value="5.12.0">5.12.0</Radio>
                            <Radio value="6.14.4">6.14.4</Radio>
                            <Radio value="7.10.1">7.10.1</Radio>
                            <Radio value="9.11.2">9.11.2</Radio>
                            <Radio value="10.13.0">10.13.0</Radio>
                            <Radio value="11.1.0">11.1.0</Radio>
                            <Radio value="">空</Radio>
                        </RadioGroup>
                    )}
                </Form.Item>}

                {languageType == "php" && <Form.Item {...formItemLayout} label="PHP支持">
                    {getFieldDecorator('PHP', {
                        initialValue: ""
                    })(
                        <RadioGroup className={styles.ant_radio_disabled}>
                            <Radio value="5.6" selected="selected">5.6.35(默认)</Radio>
                            <Radio value="5.5">5.5.38</Radio>
                            <Radio value="7.0">7.0.29</Radio>
                            <Radio value="7.1">7.1.16</Radio>
                            <Radio value="HHVM3.5.1">HHVM3.5.1</Radio>
                            <Radio value="">空</Radio>
                        </RadioGroup>
                    )}
                </Form.Item>}

                {languageType == "go" && <Form.Item {...formItemLayout} label="Golang支持">
                    {getFieldDecorator('Golang', {
                        initialValue: "",
                    })(
                        <RadioGroup className={styles.ant_radio_disabled}>
                            <Radio value="go1.11.2" selected="selected">go1.11.2(默认)</Radio>
                            <Radio value="go1.9.7">go1.9.7</Radio>
                            <Radio value="go1.8.7">go1.8.7</Radio>
                            <Radio value="go1.10.4">go1.10.4</Radio>
                            <Radio value="go1.10.5">go1.10.5</Radio>
                            <Radio value="">空</Radio>
                        </RadioGroup>
                    )}
                </Form.Item>}

                {
                    languageType == "nodejs" || languageType == "static" && <Form.Item {...formItemLayout} label="web服务器支持">
                        {getFieldDecorator('web', {
                            initialValue: "",
                        })(
                            <RadioGroup className={styles.ant_radio_disabled}>
                                <Radio value="nginx" selected="selected">nginx(默认)</Radio>
                                {languageType == "static" && <Radio value="apache">apache</Radio>}
                                <Radio value="">空</Radio>
                            </RadioGroup>
                        )}
                    </Form.Item>
                }
                {languageType == "java-maven" && <Form.Item {...formItemLayout} label="构建参数支持">
                    {getFieldDecorator('BUILD_MAVEN_MIRROR_DISABLE', {
                        initialValue: "",
                    })(
                        <Checkbox.Group style={{ width: '100%' }} onChange={this.handleDisabled} >
                            <Row style={{ marginTop: "10px" }}>
                                <Col span={8} >
                                    <Checkbox value="BUILD_MAVEN_MIRROR_DISABLE">禁用Maven mirror功能</Checkbox>
                                </Col>
                                <Col span={8} >
                                    <div>Maven Mirror</div>
                                    <Form.Item {...formItemLayout} label="">
                                        {getFieldDecorator('BUILD_MAVEN_MIRROR_OF', {
                                            initialValue: "",
                                        })(
                                            <TextArea placeholder="示例：*"></TextArea>
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col span={8} >
                                    <div>Maven Mirror</div>
                                    <Form.Item {...formItemLayout} label="">
                                        {getFieldDecorator('BUILD_MAVEN_MIRROR_URL', {
                                            initialValue: "",
                                        })(
                                            <TextArea placeholder="示例：maven.goodrain.me" ></TextArea>
                                        )}
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={8} >
                                    <div>Maven构建参数</div>
                                    <Form.Item {...formItemLayout} label="">
                                        {getFieldDecorator('BUILD_MAVEN_CUSTOM_OPTS', {
                                            initialValue: "",
                                        })(
                                            <TextArea placeholder="示例：-DskipTests" ></TextArea>
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col span={8} >
                                    <div>Maven构建全局参数</div>
                                    <Form.Item {...formItemLayout} label="">
                                        {getFieldDecorator('BUILD_MAVEN_CUSTOM_GOALS', {
                                            initialValue: "",
                                        })(
                                            <TextArea placeholder="示例：clean dependency:list install" ></TextArea>
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col span={8} >
                                    <div>Maven配置地址</div>
                                    <Form.Item {...formItemLayout} label="">
                                        {getFieldDecorator('BUILD_MAVEN_SETTINGS_URL', {
                                            initialValue: "",
                                        })(
                                            <TextArea placeholder="示例：-Xmx1024m" ></TextArea>
                                        )}
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row>
                                <Col span={8}>
                                    <div>BUILD_MAVEN_JAVA_OPTS</div>
                                    <Form.Item {...formItemLayout} label="">
                                        {getFieldDecorator('BUILD_MAVEN_JAVA_OPTS', {
                                            initialValue: "",
                                        })(
                                            <TextArea placeholder="示例：-Xmx1024m" ></TextArea>
                                        )}
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Checkbox.Group>
                    )}
                </Form.Item>}

                {languageType == "java-war" && <Form.Item {...formItemLayout} label="构建参数支持">
                    {getFieldDecorator('BUILD_WEBSERVER_URL', {
                        initialValue: "",
                    })(
                        <TextArea placeholder=""></TextArea>
                    )}
                    <Radio onClick={() => { this.handleRadio("BUILD_ONLINE") }} checked={this.state.BUILD_ONLINE}>启用公网webapp-runner源</Radio>
                </Form.Item>}

                {languageType == "python" && <Form.Item {...formItemLayout} label="构建参数支持">
                    <div>pypi加速</div>
                    {getFieldDecorator('BUILD_PIP_INDEX_URL', {
                        initialValue: "https://pypi.tuna.tsinghua.edu.cn/simple",
                    })(
                        <TextArea placeholder="https://pypi.tuna.tsinghua.edu.cn/simple"></TextArea>
                    )}
                </Form.Item>}



                {languageType == "nodejs" && <Form.Item {...formItemLayout} label="构建参数支持">
                    <Row>
                        <Col span={12}>
                            <Radio onClick={() => { this.handleRadio("NODE_MODULES_CACHE") }} checked={this.state.NODE_MODULES_CACHE}>node模块cache</Radio>
                        </Col>
                        <Col span={12}>
                            <Radio onClick={() => { this.handleRadio("NODE_VERBOSE") }} checked={this.state.NODE_VERBOSE}>NODE_VERBOSE</Radio>
                        </Col>
                        <Col span={12} >
                            <div>Maven Mirror</div>
                            <Form.Item {...formItemLayout} label="">
                                {getFieldDecorator('NODE_ENV', {
                                    initialValue: "",
                                })(
                                    <TextArea placeholder="示例：production "></TextArea>
                                )}
                            </Form.Item>
                        </Col>
                        <Col span={12} >
                            <div>NPM_CONFIG_LOGLEVEL</div>
                            <Form.Item {...formItemLayout} label="">
                                {getFieldDecorator('NPM_CONFIG_LOGLEVEL', {
                                    initialValue: "",
                                })(
                                    <TextArea placeholder="示例：error"></TextArea>
                                )}
                            </Form.Item>
                        </Col>
                    </Row>
                </Form.Item>}



                <Row>
                    <Col span="5"></Col>
                    <Col span="19">
                        <Button onClick={this.handleSubmit} type={'primary'}>确认修改</Button>
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
        return '-1';
    }
    getDefaultService = () => {
        return '-1'
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
                    span: 21,
                },
            },
        };

        // if (runtimeInfo.runtimes && runtimeInfo.procfile && runtimeInfo.dependencies) {
        //     return null;
        // }

        if (!this.state.versions.length) return null;

        return (
            <Fragment>
                <Card title="PHP版本支持" style={{
                    marginBottom: 16
                }}>
                    {/* {(!runtimeInfo.runtimes) */}
                    <Form.Item {...formItemLayout} label="版本">
                        {getFieldDecorator('service_runtimes', {
                            initialValue: userRunTimeInfo.runtimes || this.state.default_version,
                            rules: [
                                {
                                    required: true,
                                    message: '请选择应用类型'
                                }
                            ]
                        })(
                            <RadioGroup disabled className={styles.ant_radio_disabled}>
                                {
                                    this.state.versions.map((item) => {
                                        return <Radio value={item}>{item}</Radio>
                                    })
                                }
                            </RadioGroup>
                        )}
                    </Form.Item>
                    {/* //     : null
                    // } */}

                    {/* {(!runtimeInfo.procfile) */}
                    <Form.Item {...formItemLayout} label="web服务器">
                        {getFieldDecorator('service_server', {
                            initialValue: userRunTimeInfo.procfile,
                            rules: [
                                {
                                    required: true,
                                    message: '请选择'
                                }
                            ]
                        })(
                            <RadioGroup disabled className={styles.ant_radio_disabled}>
                                <Radio value="apache">apache</Radio>
                                <Radio value="nginx">nginx</Radio>
                            </RadioGroup>
                        )}
                    </Form.Item>
                    {/* : null
                     } */}

                    {/* {(!runtimeInfo.dependencies) */}
                    <Form.Item {...formItemLayout} label="PHP扩展">
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
                    {/* //     : null
                    // } */}

                    {/* <Row>
                        <Col span="5"></Col>
                        <Col span="19">
                            <Button onClick={this.handleSubmit} type={'primary'}>确认修改</Button>
                        </Col>
                    </Row> */}
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
            showMarketAppDetail: false,
            showApp: {},
        };
    }
    componentDidMount() {
        this.getRuntimeInfo();
        this.loadBuildSourceInfo();
    }
    handleEditRuntime = (build_env_dict = {}) => {
        // this
        //     .props
        //     .dispatch({
        //         type: 'appControl/editRuntimeInfo',
        //         payload: {
        //             team_name: globalUtil.getCurrTeamName(),
        //             app_alias: this.props.appDetail.service.service_alias,
        //             ...val
        //         },
        //         callback: (data) => { }
        //     })

        this.props.dispatch({
            type: 'appControl/editRuntimeBuildInfo',
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appDetail.service.service_alias,
                build_env_dict
            },
            callback: (res) => {
            }
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
        // this
        //     .props
        //     .dispatch({
        //         type: 'appControl/getRuntimeInfo',
        //         payload: {
        //             team_name: globalUtil.getCurrTeamName(),
        //             app_alias: this.props.appDetail.service.service_alias
        //         },
        //         callback: (data) => {
        //             this.setState({ runtimeInfo: data.bean })
        //         }
        //     })

        this.props.dispatch({
            type: 'appControl/getRuntimeBuildInfo',
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
                this.setState({ buildSource: data.bean });
            },
        });
    };
    hideMarketAppDetail = () => {
        this.setState({
            showApp: {},
            showMarketAppDetail: false
        });
    }
    render() {
        const language = appUtil.getLanguage(this.props.appDetail);
        const runtimeInfo = this.state.runtimeInfo;
        const visible = this.props.visible;
        if (!this.state.runtimeInfo || !this.state.buildSource)
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
                    span: 21,
                },
            },
        };
        const versionLanguage = this.state.buildSource.language;
        // const languageType = versionLanguage == 'Java-jar' || versionLanguage == 'Java-war' || versionLanguage == 'Java-maven' ? "Java" : versionLanguage;
        const languageType = versionLanguage ? versionLanguage : "";
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
                                    {this.state.buildSource.cmd || ''}
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
                                    {languageType != "static" ? <a target="blank" href={languageObj[`${languageType}`]}>{languageType}</a> : <a href="javascript:void(0);">{languageType}</a>}
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
                {this.state.buildSource && (
                    <AutoDeploy app={this.props.appDetail} service_source={appUtil.getCreateTypeCNByBuildSource(this.state.buildSource)} />
                )}
                {(language === 'php')
                    ? <PHP
                        appDetail={this.props.appDetail}
                        onSubmit={this.handleEditRuntime}
                        runtimeInfo={runtimeInfo.check_dependency || {}}
                        userRunTimeInfo={runtimeInfo.user_dependency || {}}
                        selected_dependency={runtimeInfo.selected_dependency || []}
                    />
                    : null
                }
                {appUtil.isJava(this.props.appDetail)
                    ? <JAVA
                        appDetail={this.props.appDetail}
                        onSubmit={(val) => { this.handleEditRuntime(val) }}
                        language={language}
                        userRunTimeInfo={runtimeInfo.user_dependency || {}}
                        runtimeInfo={runtimeInfo.check_dependency || {}} />
                    : null
                }

                {(language === 'python')
                    ? <Python
                        appDetail={this.props.appDetail}
                        onSubmit={this.handleEditRuntime}
                        userRunTimeInfo={runtimeInfo.user_dependency || {}}
                        runtimeInfo={runtimeInfo.check_dependency || {}} />
                    : null
                }

                {(language === 'go')
                    ? <Golang
                        appDetail={this.props.appDetail}
                        onSubmit={this.handleEditRuntime}
                        userRunTimeInfo={runtimeInfo.user_dependency || {}}
                        runtimeInfo={runtimeInfo.check_dependency || {}} />
                    : null
                }

                {(language === 'nodejs')
                    ? <Nodejs
                        appDetail={this.props.appDetail}
                        onSubmit={this.handleEditRuntime}
                        userRunTimeInfo={runtimeInfo.user_dependency || {}}
                        runtimeInfo={runtimeInfo.check_dependency || {}} />
                    : null
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
                {this.state.showMarketAppDetail && (
                    <MarketAppDetailShow
                        onOk={this.hideMarketAppDetail}
                        onCancel={this.hideMarketAppDetail}
                        app={this.state.showApp}
                    />
                )}

            </Fragment>
        );
    }
}
