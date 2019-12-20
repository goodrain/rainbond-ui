import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import globalUtil from "../../utils/global";
import ChangeBuildSource from "./setting/edit-buildsource";
import MarketAppDetailShow from "../../components/MarketAppDetailShow";
import appUtil from "../../utils/app";
import Dockerinput from "../../components/Dockerinput";
import { languageObj } from "../../utils/utils";
import rainbondUtil from "../../utils/rainbond";
import {
  Button,
  Icon,
  Card,
  Modal,
  Row,
  Col,
  Table,
  Radio,
  Tabs,
  Input,
  Form,
  Spin,
  Select,
  notification
} from "antd";
import styles from "./resource.less";
const RadioGroup = Radio.Group;
const TabPane = Tabs.TabPane;
const FormItem = Form.Item;
const confirm = Modal.confirm;
const { Option, OptGroup } = Select;

import AutoDeploy from "./setting/auto-deploy";

//node.js
@connect(
  ({ user, appControl, teamControl }) => ({ currUser: user.currentUser }),
  null,
  null,
  { withRef: true }
)
@Form.create()
class Nodejs extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {}
  isShowRuntime = () => {
    const runtimeInfo = this.props.runtimeInfo || {};
    return runtimeInfo.runtimes === false;
  };
  handleSubmit = e => {
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit &&
        this.props.onSubmit({
          ...fieldsValue
        });
    });
  };
  getDefaultRuntime = () => {
    return "-1";
  };
  render() {
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 3
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 21
        }
      }
    };
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { userRunTimeInfo } = this.props;
    // if (!this.isShowRuntime())
    //     return null;
    return (
      <Card
        title="node版本支持"
        style={{
          marginBottom: 16
        }}
      >
        <Form.Item {...formItemLayout} label="版本">
          {getFieldDecorator("service_runtimes", {
            initialValue: userRunTimeInfo.runtimes,
            rules: [
              {
                required: true,
                message: "请选择"
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
    );
  }
}

//golang
@connect(
  ({ user, appControl, teamControl }) => ({ currUser: user.currentUser }),
  null,
  null,
  { withRef: true }
)
@Form.create()
class Golang extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {
    // if (this.isShowRuntime()) {
    //     this.onChange({
    //         service_runtimes: this.getDefaultRuntime()
    //     })
    // }
  }
  onChange = value => {
    this.props.dispatch({ type: "createApp/saveRuntimeInfo", payload: value });
  };
  getDefaultRuntime = () => {
    return "1.11.2";
  };
  isShowRuntime = () => {
    const runtimeInfo = this.props.runtimeInfo || {};
    return runtimeInfo.runtimes === false;
  };
  handleSubmit = e => {
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit &&
        this.props.onSubmit({
          ...fieldsValue
        });
    });
  };
  render() {
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 3
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 21
        }
      }
    };
    const { getFieldDecorator, getFieldValue } = this.props.form;

    const { userRunTimeInfo } = this.props;
    // if (!this.isShowRuntime())
    //     return null;
    return (
      <Card
        title="Golang版本支持"
        style={{
          marginBottom: 16
        }}
      >
        <Form.Item {...formItemLayout} label="版本">
          {getFieldDecorator("service_runtimes", {
            initialValue: userRunTimeInfo.runtimes || this.getDefaultRuntime(),
            rules: [
              {
                required: true,
                message: "请选择"
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
    );
  }
}

//python
@connect(
  ({ user, appControl, teamControl }) => ({
    currUser: user.currentUser,
    appDetail: appControl.appDetail
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
class Python extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {}
  onChange = value => {
    this.props.dispatch({ type: "createApp/saveRuntimeInfo", payload: value });
  };
  getDefaultRuntime = () => {
    return "2.7.15";
  };
  isShowRuntime = () => {
    const runtimeInfo = this.props.runtimeInfo || {};
    return runtimeInfo.runtimes === false;
  };
  handleSubmit = e => {
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit &&
        this.props.onSubmit({
          ...fieldsValue
        });
    });
  };
  render() {
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 3
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 21
        }
      }
    };
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { userRunTimeInfo } = this.props;
    // if (!this.isShowRuntime()) {
    //     return null;
    // }

    return (
      <Card title="Python版本支持">
        <Form.Item {...formItemLayout} label="版本">
          {getFieldDecorator("service_runtimes", {
            initialValue: userRunTimeInfo.runtimes || this.getDefaultRuntime(),
            rules: [
              {
                required: true,
                message: "请选择"
              }
            ]
          })(
            <RadioGroup disabled className={styles.ant_radio_disabled}>
              <Radio value="2.7.15">2.7.15(默认)</Radio>
              <Radio value="3.6.6">3.6.6</Radio>
              <Radio value="3.7.1">3.7.1</Radio>
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
    );
  }
}

//java
@connect(
  ({ user, appControl, teamControl }) => ({
    currUser: user.currentUser,
    appDetail: appControl.appDetail
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
class JAVA extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      NO_CACHE: this.props.runtimeInfo.NO_CACHE ? true : false,
      BUILD_MAVEN_MIRROR_DISABLE: this.props.runtimeInfo
        .BUILD_MAVEN_MIRROR_DISABLE
        ? true
        : false,
      DEBUG: false,
      BUILD_DEBUG_INFO: false,
      BUILD_ENABLE_ORACLEJDK: this.props.runtimeInfo.BUILD_ENABLE_ORACLEJDK
        ? true
        : false,
      JDKType:
        props.runtimeInfo && props.runtimeInfo.BUILD_RUNTIMES
          ? "OpenJDK"
          : props.runtimeInfo && props.runtimeInfo.BUILD_ENABLE_ORACLEJDK
          ? "Jdk"
          : props.form.getFieldValue("RUNTIMES")
          ? props.form.getFieldValue("RUNTIMES")
          : "OpenJDK",
      nodeBuildType:
        props.runtimeInfo &&
        (props.runtimeInfo.BUILD_NPM_BUILD_CMD ||
          props.runtimeInfo.BUILD_YARN_BUILD_CMD)
          ? props.runtimeInfo.BUILD_NPM_BUILD_CMD === "npm run build" ||
            props.runtimeInfo.BUILD_NPM_BUILD_CMD === "yarn run build" ||
            props.runtimeInfo.BUILD_YARN_BUILD_CMD === "npm run build" ||
            props.runtimeInfo.BUILD_YARN_BUILD_CMD === "yarn run build"
            ? props.runtimeInfo.BUILD_NPM_BUILD_CMD ||
              props.runtimeInfo.BUILD_YARN_BUILD_CMD
            : "custom"
          : "",
      nodeType: props.runtimeInfo && props.runtimeInfo.BUILD_RUNTIMES,
      webType: props.runtimeInfo && props.runtimeInfo.BUILD_RUNTIMES_SERVER,
      languageType: this.props.language,
      BUILD_ONLINE: false,
      NODE_MODULES_CACHE: false,
      NODE_VERBOSE: false,
      arr: [],
      setObj: props.runtimeInfo ? props.runtimeInfo : ""
    };
  }
  componentWillReceiveProps(nextProps) {
    if (
      nextProps.runtimeInfo !== this.props.runtimeInfo ||
      nextProps.languageType !== this.state.languageType
    ) {
      this.handleRuntimeInfo(nextProps);
      this.setArr(nextProps);
    }
  }
  shouldComponentUpdate() {
    return true;
  }
  componentDidMount() {
    this.handleRuntimeInfo(this.props);
    this.setArr(this.props);
  }

  setArr = props => {
    const { runtimeInfo, language } = props;
    if (language == "dockerfile" && runtimeInfo != "") {
      let arr = [];
      for (let i in runtimeInfo) {
        let keyName = i + "";
        if (keyName.startsWith("BUILD_ARG_")) {
          keyName = keyName.substr(10, i.length);
        }
        arr.push({ key: keyName, value: runtimeInfo[i] });
      }
      this.setState({
        arr
      });
    }
  };
  handleRuntimeInfo = props => {
    this.setState({
      languageType: props.language
    });
  };

  handleSubmit = e => {
    const form = this.props.form;
    const { runtimeInfo } = this.props;
    const { languageType } = this.state;
    let subObject = {};
    const {
      NO_CACHE,
      BUILD_ENABLE_ORACLEJDK,
      BUILD_MAVEN_MIRROR_DISABLE,
      DEBUG,
      BUILD_DEBUG_INFO,
      BUILD_ONLINE,
      NODE_MODULES_CACHE,
      NODE_VERBOSE,
      setObj
    } = this.state;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      const {
        BUILD_RUNTIMES,
        BUILD_ORACLEJDK_URL,
        BUILD_RUNTIMES_MAVEN,
        BUILD_RUNTIMES_SERVER,
        BUILD_DOTNET_SDK_VERSION,
        BUILD_MAVEN_MIRROR_OF,
        BUILD_MAVEN_MIRROR_URL,
        BUILD_MAVEN_CUSTOM_OPTS,
        BUILD_MAVEN_CUSTOM_GOALS,
        BUILD_MAVEN_JAVA_OPTS,
        BUILD_PROCFILE,
        BUILD_NODE_URL,
        OpenJDK,
        BUILD_PIP_INDEX_URL,
        // BUILD_RUNTIMES_HHVM,
        BUILD_DOTNET_RUNTIME_VERSION,
        RUNTIMES,
        BUILD_NPM_REGISTRY,
        BUILD_NODE_ENV,
        BUILD_NPM_BUILD_CMD,
        BUILD_YARN_BUILD_CMD,
        BUILD_YARN_URL,
        BUILD_NGINX_TARBALL_URL
      } = fieldsValue;

      NO_CACHE ? (subObject.NO_CACHE = true) : "";
      BUILD_MAVEN_MIRROR_DISABLE
        ? (subObject.BUILD_MAVEN_MIRROR_DISABLE = true)
        : "";

      if (
        languageType == "java-maven" ||
        languageType == "Java-maven" ||
        languageType == "java-jar" ||
        languageType == "Java-jar" ||
        languageType == "java-war" ||
        languageType == "Java-war" ||
        languageType == "Gradle" ||
        languageType == "gradle" ||
        languageType == "java-gradle" ||
        languageType == "Java-gradle" ||
        languageType == "JAVAGradle"
      ) {
        if (RUNTIMES == "Jdk" && BUILD_ORACLEJDK_URL) {
          subObject.BUILD_ORACLEJDK_URL = BUILD_ORACLEJDK_URL;
          subObject.BUILD_ENABLE_ORACLEJDK = true;
        } else if (BUILD_RUNTIMES) {
          subObject.BUILD_RUNTIMES = BUILD_RUNTIMES;
        }
      } else {
        subObject.BUILD_NODE_ENV = BUILD_NODE_ENV;
        BUILD_RUNTIMES ? (subObject.BUILD_RUNTIMES = BUILD_RUNTIMES) : "";
        BUILD_NODE_URL && BUILD_RUNTIMES && BUILD_RUNTIMES === "custom"
          ? (subObject.BUILD_NODE_URL = BUILD_NODE_URL)
          : "";
        BUILD_NGINX_TARBALL_URL &&
        BUILD_RUNTIMES_SERVER &&
        BUILD_RUNTIMES_SERVER === "custom"
          ? (subObject.BUILD_NGINX_TARBALL_URL = BUILD_NGINX_TARBALL_URL)
          : "";
        BUILD_YARN_URL ? (subObject.BUILD_YARN_URL = BUILD_YARN_URL) : "";

        if (BUILD_NPM_REGISTRY) {
          subObject.BUILD_NPM_REGISTRY = BUILD_NPM_REGISTRY;
          subObject.BUILD_YARN_REGISTRY = BUILD_NPM_REGISTRY;
        }
        if (
          BUILD_NPM_BUILD_CMD &&
          BUILD_NPM_BUILD_CMD === "custom" &&
          BUILD_YARN_BUILD_CMD
        ) {
          subObject.BUILD_NPM_BUILD_CMD = BUILD_YARN_BUILD_CMD;
          subObject.BUILD_YARN_BUILD_CMD = BUILD_YARN_BUILD_CMD;
        } else if (BUILD_NPM_BUILD_CMD && BUILD_NPM_BUILD_CMD !== "custom") {
          subObject.BUILD_NPM_BUILD_CMD = BUILD_NPM_BUILD_CMD;
          subObject.BUILD_YARN_BUILD_CMD = BUILD_NPM_BUILD_CMD;
        }
      }

      BUILD_RUNTIMES_MAVEN
        ? (subObject.BUILD_RUNTIMES_MAVEN = BUILD_RUNTIMES_MAVEN)
        : "";
      BUILD_RUNTIMES_SERVER
        ? (subObject.BUILD_RUNTIMES_SERVER = BUILD_RUNTIMES_SERVER)
        : "";

      BUILD_DOTNET_SDK_VERSION
        ? (subObject.BUILD_DOTNET_SDK_VERSION = BUILD_DOTNET_SDK_VERSION)
        : "";
      BUILD_MAVEN_MIRROR_OF
        ? (subObject.BUILD_MAVEN_MIRROR_OF = BUILD_MAVEN_MIRROR_OF)
        : "";
      BUILD_MAVEN_MIRROR_URL
        ? (subObject.BUILD_MAVEN_MIRROR_URL = BUILD_MAVEN_MIRROR_URL)
        : "";
      BUILD_MAVEN_CUSTOM_OPTS
        ? (subObject.BUILD_MAVEN_CUSTOM_OPTS = BUILD_MAVEN_CUSTOM_OPTS)
        : "";
      BUILD_MAVEN_CUSTOM_GOALS
        ? (subObject.BUILD_MAVEN_CUSTOM_GOALS = BUILD_MAVEN_CUSTOM_GOALS)
        : "";
      BUILD_MAVEN_JAVA_OPTS
        ? (subObject.BUILD_MAVEN_JAVA_OPTS = BUILD_MAVEN_JAVA_OPTS)
        : "";
      BUILD_PROCFILE ? (subObject.BUILD_PROCFILE = BUILD_PROCFILE) : "";
      OpenJDK ? (subObject.OpenJDK = OpenJDK) : "";
      BUILD_PIP_INDEX_URL
        ? (subObject.BUILD_PIP_INDEX_URL = BUILD_PIP_INDEX_URL)
        : "";
      // BUILD_RUNTIMES_HHVM ? subObject.BUILD_RUNTIMES_HHVM = BUILD_RUNTIMES_HHVM : ""
      BUILD_DOTNET_RUNTIME_VERSION
        ? (subObject.BUILD_DOTNET_RUNTIME_VERSION = BUILD_DOTNET_RUNTIME_VERSION)
        : "";

      if (languageType && languageType == "dockerfile") {
        this.props.onSubmit &&
          this.props.onSubmit(setObj ? setObj : runtimeInfo);
      } else {
        this.props.onSubmit && this.props.onSubmit(subObject);
      }
    });
  };

  handleDisabledName = name => {
    this.setState({
      [name]: true
    });
  };

  handleRadio = name => {
    this.setState({
      [name]: !this.state[name]
    });
  };

  onRadioNodeBuildTypeChange = e => {
    this.setState({
      nodeBuildType: e.target.value
    });
  };

  onRadioNodeTypeChange = e => {
    this.setState({
      nodeType: e.target.value
    });
  };
  onRadioWebTypeChange = e => {
    this.setState({
      webType: e.target.value
    });
  };

  onRadioGroupChange = e => {
    this.setState({
      JDKType: e.target.value
    });
  };

  showConfirm = () => {
    const _th = this;
    confirm({
      title: "确认修改吗?",
      content: "",
      onOk() {
        _th.handleSubmit();
      },
      onCancel() {
        console.log("Cancel");
      }
    });
  };

  onSetObj = value => {
    let obj = {};
    value.map(item => {
      obj["BUILD_ARG_" + item.key] = item.value;
    });
    this.setState({ setObj: obj });
  };

  validCustomJDK = (rule, value, callback) => {
    const runtime = this.props.form.getFieldValue("RUNTIMES");
    if (runtime == "Jdk") {
      if (!value) {
        callback("自定义JDK下载地址不能为空");
      }
    }
    callback();
  };

  validCustomNodeBuild = (rule, value, callback) => {
    const runtime = this.props.form.getFieldValue("BUILD_NPM_BUILD_CMD");
    if (runtime == "custom") {
      if (!value) {
        callback("自定义指定静态文件构建命令不能为空");
      }
    }
    callback();
  };

  render() {
    const runtimeInfo = this.props.runtimeInfo || "";
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 6
        },
        sm: {
          span: 6
        }
      },
      wrapperCol: {
        xs: {
          span: 18
        },
        sm: {
          span: 18
        }
      }
    };
    const { getFieldDecorator } = this.props.form;
    const {
      JDKType,
      nodeBuildType,
      languageType,
      arr,
      nodeType,
      webType
    } = this.state;
    const jdkShow = () => {
      return (
        <div>
          <Form.Item {...formItemLayout} label="选择JDK版本">
            {getFieldDecorator("RUNTIMES", {
              initialValue:
                runtimeInfo && runtimeInfo.BUILD_RUNTIMES
                  ? "OpenJDK"
                  : runtimeInfo && runtimeInfo.BUILD_ENABLE_ORACLEJDK
                  ? "Jdk"
                  : "OpenJDK"
            })(
              <RadioGroup
                className={styles.ant_radio_disabled}
                onChange={this.onRadioGroupChange}
              >
                <Radio value="OpenJDK">内置OpenJDK</Radio>
                <Radio value="Jdk">自定义JDK</Radio>
              </RadioGroup>
            )}
          </Form.Item>

          {JDKType == "OpenJDK" && (
            <Form.Item {...formItemLayout} label="OpenJDK版本">
              {getFieldDecorator("BUILD_RUNTIMES", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_RUNTIMES) || "1.8"
              })(
                <RadioGroup>
                  <Radio value="1.8">1.8(默认)</Radio>
                  <Radio value="1.6">1.6</Radio>
                  <Radio value="1.7">1.7</Radio>
                  <Radio value="1.9">1.9</Radio>
                  <Radio value="10">10</Radio>
                  <Radio value="11">11</Radio>
                </RadioGroup>
              )}
            </Form.Item>
          )}

          {JDKType == "Jdk" && (
            <Form.Item {...formItemLayout} label="自定义JDK下载路径">
              {getFieldDecorator("BUILD_ORACLEJDK_URL", {
                initialValue: runtimeInfo && runtimeInfo.BUILD_ORACLEJDK_URL,
                rules: [{ validator: this.validCustomJDK }]
              })(<Input placeholder="请提供自定义JDK的下载路径" />)}
            </Form.Item>
          )}
        </div>
      );
    };
    const nodeShow = () => {
      return (
        <dir>
          <Form.Item {...formItemLayout} label="开启清除构建缓存">
            {getFieldDecorator("NO_CACHE", {
              initialValue: ""
            })(
              <Radio
                onClick={() => {
                  this.handleRadio("NO_CACHE");
                }}
                checked={this.state.NO_CACHE}
              />
            )}
          </Form.Item>

          {languageType == "nodejsstatic" ||
            (languageType == "static" && (
              <Form.Item {...formItemLayout} label="web服务器支持">
                {getFieldDecorator("BUILD_RUNTIMES_SERVER", {
                  initialValue:
                    (runtimeInfo && runtimeInfo.BUILD_RUNTIMES_SERVER) ||
                    "nginx"
                })(
                  <RadioGroup
                    className={styles.ant_radio_disabled}
                    onChange={this.onRadioWebTypeChange}
                  >
                    <Radio value="nginx" selected="selected">
                      nginx(默认)
                    </Radio>
                    <Radio value="custom">自定义地址</Radio>
                  </RadioGroup>
                )}
              </Form.Item>
            ))}

          {webType === "custom" &&
            (languageType == "nodejsstatic" || languageType == "static") && (
              <Form.Item {...formItemLayout} label="nginx安装地址">
                {getFieldDecorator("BUILD_NGINX_TARBALL_URL", {
                  initialValue:
                    "http://lang.goodrain.me/static/r6d/nginx/nginx-${version}.tar.gz"
                })(<Input placeholder="请输入nginx安装地址" />)}
              </Form.Item>
            )}

          <Form.Item {...formItemLayout} label="Node版本">
            {getFieldDecorator("BUILD_RUNTIMES", {
              initialValue:
                (runtimeInfo && runtimeInfo.BUILD_RUNTIMES) || "8.12.0"
            })(
              <RadioGroup
                className={styles.ant_radio_disabled}
                onChange={this.onRadioNodeTypeChange}
              >
                <Radio value="8.12.0" selected="selected">
                  8.12.0
                </Radio>
                <Radio value="4.9.1">4.9.1</Radio>
                <Radio value="5.12.0">5.12.0</Radio>
                <Radio value="6.14.4">6.14.4</Radio>
                <Radio value="7.10.1">7.10.1</Radio>
                <Radio value="9.11.2">9.11.2</Radio>
                <Radio value="10.13.0">10.13.0</Radio>
                <Radio value="11.1.0">11.1.0</Radio>
                <Radio value="custom">自定义地址</Radio>
              </RadioGroup>
            )}
          </Form.Item>

          {nodeType == "custom" && (
            <Form.Item {...formItemLayout} label="Node安装地址">
              {getFieldDecorator("BUILD_NODE_URL", {
                initialValue:
                  "http://lang.goodrain.me/nodejs/node/release/linux-x64/node-v$number-linux-x64.tar.gz"
              })(<Input placeholder="请输入node安装地址" />)}
            </Form.Item>
          )}
          <Form.Item {...formItemLayout} label="Yarn安装地址">
            {getFieldDecorator("BUILD_YARN_URL", {
              initialValue:
                "http://lang.goodrain.me/nodejs/yarn/release/yarn-v$number.tar.gz"
            })(<Input placeholder="请输入yarn安装地址" />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label="BUILD_NODE_ENV">
            {getFieldDecorator("BUILD_NODE_ENV", {
              initialValue:
                (runtimeInfo && runtimeInfo.BUILD_NODE_ENV) || "production"
            })(<Input placeholder="production" />)}
          </Form.Item>

          <Form.Item {...formItemLayout} label="NPM MIRROR_URL">
            {getFieldDecorator("BUILD_NPM_REGISTRY", {
              initialValue:
                (runtimeInfo &&
                  (runtimeInfo.BUILD_NPM_REGISTRY ||
                    runtimeInfo.BUILD_YARN_REGISTRY)) ||
                "https://registry.npm.taobao.org"
            })(<Input placeholder="https://registry.npm.taobao.org" />)}
          </Form.Item>

          <Form.Item {...formItemLayout} label="指定静态文件构建命令">
            {getFieldDecorator("BUILD_NPM_BUILD_CMD", {
              initialValue:
                runtimeInfo &&
                (runtimeInfo.BUILD_NPM_BUILD_CMD ||
                  runtimeInfo.BUILD_YARN_BUILD_CMD)
                  ? runtimeInfo.BUILD_NPM_BUILD_CMD === "npm run build" ||
                    runtimeInfo.BUILD_NPM_BUILD_CMD === "yarn run build" ||
                    runtimeInfo.BUILD_YARN_BUILD_CMD === "npm run build" ||
                    runtimeInfo.BUILD_YARN_BUILD_CMD === "yarn run build"
                    ? runtimeInfo.BUILD_NPM_BUILD_CMD ||
                      runtimeInfo.BUILD_YARN_BUILD_CMD
                    : "custom"
                  : ""
            })(
              <RadioGroup
                className={styles.ant_radio_disabled}
                onChange={this.onRadioNodeBuildTypeChange}
              >
                <Radio value="npm run build">npm run build</Radio>
                <Radio value="yarn run build">yarn run build</Radio>
                <Radio value="custom">自定义构建命令</Radio>
              </RadioGroup>
            )}
          </Form.Item>
          {nodeBuildType == "custom" && (
            <Form.Item {...formItemLayout} label="自定义构建命令">
              {getFieldDecorator("BUILD_YARN_BUILD_CMD", {
                initialValue:
                  runtimeInfo &&
                  (runtimeInfo.BUILD_NPM_BUILD_CMD ||
                    runtimeInfo.BUILD_YARN_BUILD_CMD),
                rules: [{ validator: this.validCustomNodeBuild }]
              })(<Input placeholder="自定义构建命令" />)}
            </Form.Item>
          )}

          <Form.Item {...formItemLayout} label="启动命令">
            {getFieldDecorator("BUILD_PROCFILE", {
              initialValue:
                (runtimeInfo && runtimeInfo.BUILD_PROCFILE) ||
                (languageType == "nodejsstatic" || languageType == "static"
                  ? "web: sh boot.sh"
                  : "web: npm start")
            })(
              <Input
                placeholder={
                  languageType == "nodejsstatic" || languageType == "static"
                    ? "web: sh boot.sh"
                    : "web: npm start"
                }
              />
            )}
          </Form.Item>
        </dir>
      );
    };
    return (
      <Card title="构建运行环境设置">
        {(languageType == "java-maven" || languageType == "Java-maven") && (
          <div>
            <Form.Item {...formItemLayout} label="开启清除构建缓存">
              {getFieldDecorator("NO_CACHE", {
                initialValue: ""
              })(
                <Radio
                  onClick={() => {
                    this.handleRadio("NO_CACHE");
                  }}
                  checked={this.state.NO_CACHE}
                />
              )}
            </Form.Item>
            {/* JDK SETTING */}
            {jdkShow()}

            <Form.Item {...formItemLayout} label="Maven版本">
              {getFieldDecorator("BUILD_RUNTIMES_MAVEN", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_RUNTIMES_MAVEN) || "3.3.1"
              })(
                <RadioGroup>
                  <Radio value="3.3.1">3.3.1(默认)</Radio>
                  <Radio value="3.0.5">3.0.5</Radio>
                  <Radio value="3.1.1">3.1.1</Radio>
                  <Radio value="3.2.5">3.2.5</Radio>
                  <Radio value="3.3.9">3.3.9</Radio>
                </RadioGroup>
              )}
            </Form.Item>

            <Form.Item {...formItemLayout} label="web服务器支持">
              {getFieldDecorator("BUILD_RUNTIMES_SERVER", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_RUNTIMES_SERVER) ||
                  "tomcat85"
              })(
                <RadioGroup className={styles.ant_radio_disabled}>
                  <Radio value="tomcat85">tomcat85(默认)</Radio>
                  <Radio value="tomcat7">tomcat7</Radio>
                  <Radio value="tomcat8">tomcat8</Radio>
                  <Radio value="tomcat9">tomcat9</Radio>
                  <Radio value="jetty7">jetty7</Radio>
                  <Radio value="jetty9">jetty9</Radio>
                </RadioGroup>
              )}
            </Form.Item>

            <Form.Item {...formItemLayout} label="禁用Maven Mirror">
              {getFieldDecorator("BUILD_MAVEN_MIRROR_DISABLE", {
                initialValue: ""
              })(
                <Radio
                  onClick={() => {
                    this.handleRadio("BUILD_MAVEN_MIRROR_DISABLE");
                  }}
                  checked={this.state.BUILD_MAVEN_MIRROR_DISABLE}
                />
              )}
            </Form.Item>

            <Form.Item {...formItemLayout} label="MAVEN MIRROR OF配置">
              {getFieldDecorator("BUILD_MAVEN_MIRROR_OF", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_MAVEN_MIRROR_OF) ||
                  "central"
              })(<Input placeholder="" />)}
            </Form.Item>

            <Form.Item {...formItemLayout} label="MAVEN MIRROR_URL">
              {getFieldDecorator("BUILD_MAVEN_MIRROR_URL", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_MAVEN_MIRROR_URL) ||
                  "maven.goodrain.me"
              })(<Input placeholder="" />)}
            </Form.Item>

            <Form.Item {...formItemLayout} label="Maven构建参数">
              {getFieldDecorator("BUILD_MAVEN_CUSTOM_OPTS", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_MAVEN_CUSTOM_OPTS) ||
                  "-DskipTests"
              })(<Input placeholder="" />)}
            </Form.Item>

            <Form.Item {...formItemLayout} label="Maven构建命令">
              {getFieldDecorator("BUILD_MAVEN_CUSTOM_GOALS", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_MAVEN_CUSTOM_GOALS) ||
                  "clean dependency:list install"
              })(<Input placeholder="" />)}
            </Form.Item>

            <Form.Item {...formItemLayout} label="MAVEN构建Java参数配置">
              {getFieldDecorator("BUILD_MAVEN_JAVA_OPTS", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_MAVEN_JAVA_OPTS) ||
                  "-Xmx1024m"
              })(<Input placeholder="" />)}
            </Form.Item>

            <Form.Item {...formItemLayout} label="启动命令">
              {getFieldDecorator("BUILD_PROCFILE", {
                initialValue: (runtimeInfo && runtimeInfo.BUILD_PROCFILE) || ""
              })(
                <Input placeholder="web: java $JAVA_OPTS -jar ./webapp-runner.jar --port $PORT ./*.war" />
              )}
            </Form.Item>
          </div>
        )}
        {(languageType == "java-jar" || languageType == "Java-jar") && (
          <div>
            <Form.Item {...formItemLayout} label="开启清除构建缓存">
              {getFieldDecorator("NO_CACHE", {
                initialValue: ""
              })(
                <Radio
                  onClick={() => {
                    this.handleRadio("NO_CACHE");
                  }}
                  checked={this.state.NO_CACHE}
                />
              )}
            </Form.Item>
            {/* JDK SETTING */}
            {jdkShow()}

            <Form.Item {...formItemLayout} label="启动命令">
              {getFieldDecorator("BUILD_PROCFILE", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_PROCFILE) ||
                  "web: java -Dserver.port=$PORT $JAVA_OPTS -jar ./*.jar"
              })(<Input placeholder="" />)}
            </Form.Item>
          </div>
        )}
        {(languageType == "java-war" || languageType == "Java-war") && (
          <div>
            <Form.Item {...formItemLayout} label="开启清除构建缓存">
              {getFieldDecorator("NO_CACHE", {
                initialValue: ""
              })(
                <Radio
                  onClick={() => {
                    this.handleRadio("NO_CACHE");
                  }}
                  checked={this.state.NO_CACHE}
                />
              )}
            </Form.Item>
            {/* JDK SETTING */}
            {jdkShow()}

            <Form.Item {...formItemLayout} label="web服务器支持">
              {getFieldDecorator("BUILD_RUNTIMES_SERVER", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_RUNTIMES_SERVER) ||
                  "tomcat85"
              })(
                <RadioGroup className={styles.ant_radio_disabled}>
                  <Radio value="tomcat85">tomcat85(默认)</Radio>
                  <Radio value="tomcat7">tomcat7</Radio>
                  <Radio value="tomcat8">tomcat8</Radio>
                  <Radio value="tomcat9">tomcat9</Radio>
                  <Radio value="jetty7">jetty7</Radio>
                  <Radio value="jetty9">jetty9</Radio>
                </RadioGroup>
              )}
            </Form.Item>
            <Form.Item {...formItemLayout} label="启动命令">
              {getFieldDecorator("BUILD_PROCFILE", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_PROCFILE) ||
                  "web: java $JAVA_OPTS -jar ./webapp-runner.jar --port $PORT ./*.war"
              })(<Input placeholder="" />)}
            </Form.Item>
          </div>
        )}
        {(languageType == "Golang" ||
          languageType == "go" ||
          languageType == "golang") && (
          <Form.Item {...formItemLayout} label="Golang版本">
            {getFieldDecorator("BUILD_RUNTIMES", {
              initialValue:
                (runtimeInfo && runtimeInfo.BUILD_RUNTIMES) || "go1.11.2"
            })(
              <RadioGroup className={styles.ant_radio_disabled}>
                <Radio value="go1.11.2" selected="selected">
                  go1.11.2(默认)
                </Radio>
                <Radio value="go1.9.7">go1.9.7</Radio>
                <Radio value="go1.8.7">go1.8.7</Radio>
                <Radio value="go1.11">go1.11</Radio>
                <Radio value="go1.11.1">go1.11.1</Radio>
                <Radio value="go1.10.5">go1.10.5</Radio>
                <Radio value="go1.10.4">go1.10.4</Radio>
              </RadioGroup>
            )}
          </Form.Item>
        )}
        {(languageType == "Gradle" ||
          languageType == "gradle" ||
          languageType == "java-gradle" ||
          languageType == "Java-gradle" ||
          languageType == "JAVAGradle") && (
          <div>
            {/* JDK SETTING */}
            {jdkShow()}
          </div>
        )}
        {(languageType == "python" || languageType == "Python") && (
          <div>
            <Form.Item {...formItemLayout} label="Python支持">
              {getFieldDecorator("BUILD_RUNTIMES", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_RUNTIMES) || "python-3.6.6"
              })(
                <RadioGroup className={styles.ant_radio_disabled}>
                  <Radio value="python-3.6.6" selected="selected">
                    python-3.6.6
                  </Radio>
                  <Radio value="python-3.6.1">python-3.6.1</Radio>
                  <Radio value="python-3.6.2">python-3.6.2</Radio>
                  <Radio value="python-3.6.3">python-3.6.3</Radio>
                  <Radio value="python-3.6.4">python-3.6.4</Radio>
                  <Radio value="python-3.6.5">python-3.6.5</Radio>
                  <Radio value="python-2.7.9">python-2.7.9</Radio>
                  <Radio value="python-2.7.10">python-2.7.10</Radio>
                  <Radio value="python-2.7.13">python-2.7.13</Radio>
                  <Radio value="python-2.7.14 ">python-2.7.14</Radio>
                </RadioGroup>
              )}
            </Form.Item>
            <Form.Item {...formItemLayout} label="Pypi源">
              {getFieldDecorator("BUILD_PIP_INDEX_URL", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_PIP_INDEX_URL) ||
                  "https://pypi.tuna.tsinghua.edu.cn/simple"
              })(<Input />)}
            </Form.Item>
            <Form.Item {...formItemLayout} label="开启清除构建缓存">
              {getFieldDecorator("NO_CACHE", {
                initialValue: ""
              })(
                <Radio
                  onClick={() => {
                    this.handleRadio("NO_CACHE");
                  }}
                  checked={this.state.NO_CACHE}
                />
              )}
            </Form.Item>
          </div>
        )}
        {(languageType == "php" || languageType == "PHP") && (
          <div>
            <Form.Item {...formItemLayout} label="web服务器支持">
              {getFieldDecorator("BUILD_RUNTIMES_SERVER", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_RUNTIMES_SERVER) || "apache"
              })(
                <RadioGroup className={styles.ant_radio_disabled}>
                  <Radio value="apache">apache(默认)</Radio>
                  <Radio value="nginx">nginx</Radio>
                </RadioGroup>
              )}
            </Form.Item>
            <Form.Item {...formItemLayout} label="PHP版本">
              {getFieldDecorator("BUILD_RUNTIMES", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_RUNTIMES) || "5.6.35"
              })(
                <RadioGroup className={styles.ant_radio_disabled}>
                  <Radio value="5.6.35" selected="selected">
                    5.6.35(默认)
                  </Radio>
                  <Radio value="5.5.38">5.5.38</Radio>
                  <Radio value="7.0.29">7.0.29</Radio>
                  <Radio value="7.1.16">7.1.16</Radio>
                </RadioGroup>
              )}
            </Form.Item>
            {/* <Form.Item {...formItemLayout} label="HHVM版本">
                        {getFieldDecorator('BUILD_RUNTIMES_HHVM', {
                            initialValue: runtimeInfo && runtimeInfo.BUILD_RUNTIMES_HHVM || "3.5.1",
                        })(
                            <RadioGroup className={styles.ant_radio_disabled}>
                                <Radio value="3.5.1" selected="selected">3.5.1(默认)</Radio>
                            </RadioGroup>
                        )}
                    </Form.Item> */}
            <Form.Item {...formItemLayout} label="开启清除构建缓存">
              {getFieldDecorator("NO_CACHE", {
                initialValue: ""
              })(
                <Radio
                  onClick={() => {
                    this.handleRadio("NO_CACHE");
                  }}
                  checked={this.state.NO_CACHE}
                />
              )}
            </Form.Item>
          </div>
        )}
        {(languageType == "nodejsstatic" || languageType == "static") &&
          nodeShow()}
        {(languageType == "nodejs" ||
          languageType == "Node" ||
          languageType == "node") &&
          nodeShow()}
        {(languageType == "NetCore" ||
          languageType == "netCore" ||
          languageType == "netcore") && (
          <div>
            <Form.Item {...formItemLayout} label="编译环境版本">
              {getFieldDecorator("BUILD_DOTNET_SDK_VERSION", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_DOTNET_SDK_VERSION) ||
                  "2.2-sdk-alpine"
              })(
                <RadioGroup className={styles.ant_radio_disabled}>
                  <Radio value="2.2-sdk-alpine" selected="selected">
                    2.2-sdk-alpine(默认)
                  </Radio>
                  <Radio value="2.1-sdk-alpine">2.1-sdk-alpine</Radio>
                </RadioGroup>
              )}
            </Form.Item>
            <Form.Item {...formItemLayout} label="运行环境版本">
              {getFieldDecorator("BUILD_DOTNET_RUNTIME_VERSION", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_DOTNET_RUNTIME_VERSION) ||
                  "2.2-aspnetcore-runtime"
              })(
                <RadioGroup className={styles.ant_radio_disabled}>
                  <Radio value="2.2-aspnetcore-runtime" selected="selected">
                    2.2-aspnetcore-runtime(默认)
                  </Radio>
                  <Radio value="2.1-aspnetcore-runtime">
                    2.1-aspnetcore-runtime
                  </Radio>
                </RadioGroup>
              )}
            </Form.Item>
          </div>
        )}
        {languageType == "dockerfile" && (
          <div>
            <Form.Item {...formItemLayout} label="ARG参数">
              {getFieldDecorator("set_dockerfile", { initialValue: [] })(
                <Dockerinput
                  onChange={value => {
                    this.onSetObj(value);
                  }}
                  editInfo={arr}
                />
              )}
            </Form.Item>
          </div>
        )}
        <Row>
          <Col span="5" />
          <Col span="19">
            <Button onClick={this.showConfirm} type={"primary"}>
              确认修改
            </Button>
          </Col>
        </Row>
      </Card>
    );
  }
}

//php
@connect(
  ({ user, appControl, teamControl }) => ({
    currUser: user.currentUser,
    appDetail: appControl.appDetail
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
class PHP extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      enablePlugs: [
        {
          name: "Bzip2",
          version: "1.0.6, 6-Sept-2010",
          url: "http://docs.php.net/bzip2"
        },
        {
          name: "cURL",
          version: "7.35.0",
          url: "http://docs.php.net/curl"
        },
        {
          name: "FPM",
          version: "",
          url: "http://docs.php.net/fpm"
        },
        {
          name: "mcrypt",
          version: "2.5.8",
          url: "http://docs.php.net/mcrypt"
        },
        {
          name: "MySQL(PDO)",
          version: "mysqlnd 5.0.11-dev - 20120503",
          url: "http://docs.php.net/pdo_mysql"
        },
        {
          name: "MySQLi",
          version: "mysqlnd 5.0.11-dev - 20120503",
          url: "http://docs.php.net/mysqli"
        },
        {
          name: "OPcache",
          version: "Mosa",
          url: "http://docs.php.net/opcache"
        },
        {
          name: "OpenSSL",
          version: "Mosa",
          url: "http://docs.php.net/pgsql"
        },
        {
          name: "PostgreSQL(PDO)",
          version: "9.3.6",
          url: "http://docs.php.net/pdo_pgsql"
        },
        {
          name: "Readline",
          version: "6.3",
          url: "http://docs.php.net/readline"
        },
        {
          name: "Sockets",
          version: "",
          url: "http://docs.php.net/sockets"
        },
        {
          name: "Zip",
          version: "1.12.5",
          url: "http://docs.php.net/zip"
        },
        {
          name: "Zlib",
          version: "1.2.8",
          url: "http://docs.php.net/zlib"
        }
      ],
      unablePlugs: [],
      //扩展
      dependencies: [],
      selected_dependency: this.props.selected_dependency || [],
      service_dependency: (this.props.selected_dependency || []).join(","),
      versions: [],
      default_version: ""
    };
  }
  componentDidMount() {
    this.getPhpConfig();
    const runtimeInfo = this.props.runtimeInfo || {};
    if (runtimeInfo.runtimes === false) {
      this.onChange({
        service_runtimes: this.getDefaultRuntime()
      });
    }

    if (runtimeInfo.procfile === false) {
      this.onChange({
        service_runtimes: this.getDefaultService()
      });
    }
  }
  getPhpConfig = () => {
    this.props.dispatch({
      type: "appControl/getPhpConfig",
      callback: data => {
        if (data) {
          this.setState({
            versions: data.bean.versions,
            default_version: data.bean.default_version,
            unablePlugs: data.bean.extends
          });
        }
      }
    });
  };
  onChange = value => {
    this.props.dispatch({ type: "createApp/saveRuntimeInfo", payload: value });
  };
  getDefaultRuntime = () => {
    return "-1";
  };
  getDefaultService = () => {
    return "-1";
  };
  handleSubmit = e => {
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit &&
        this.props.onSubmit({
          ...fieldsValue,
          service_dependency: this.state.service_dependency
        });
    });
  };

  render() {
    const radioStyle = {
      display: "block",
      height: "30px",
      lineHeight: "30px"
    };

    const rowSelection = {
      selectedRowKeys: this.state.selected_dependency,
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState({
          service_dependency: selectedRowKeys.join(","),
          selected_dependency: selectedRowKeys
        });
      }
    };

    const { getFieldDecorator, getFieldValue } = this.props.form;

    const runtimeInfo = this.props.runtimeInfo || {};
    const userRunTimeInfo = this.props.userRunTimeInfo;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 3
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 21
        }
      }
    };

    // if (runtimeInfo.runtimes && runtimeInfo.procfile && runtimeInfo.dependencies) {
    //     return null;
    // }

    if (!this.state.versions.length) return null;

    return (
      <Fragment>
        <Card
          title="PHP版本支持"
          style={{
            marginBottom: 16
          }}
        >
          {/* {(!runtimeInfo.runtimes) */}
          <Form.Item {...formItemLayout} label="版本">
            {getFieldDecorator("service_runtimes", {
              initialValue:
                userRunTimeInfo.runtimes || this.state.default_version,
              rules: [
                {
                  required: true,
                  message: "请选择应用类型"
                }
              ]
            })(
              <RadioGroup disabled className={styles.ant_radio_disabled}>
                {this.state.versions.map(item => {
                  return <Radio value={item}>{item}</Radio>;
                })}
              </RadioGroup>
            )}
          </Form.Item>
          {/* //     : null
                    // } */}

          {/* {(!runtimeInfo.procfile) */}
          <Form.Item {...formItemLayout} label="web服务器">
            {getFieldDecorator("service_server", {
              initialValue: userRunTimeInfo.procfile,
              rules: [
                {
                  required: true,
                  message: "请选择"
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
                      title: "名称",
                      dataIndex: "name",
                      render: (v, data) => {
                        return (
                          <a target="_blank" href={data.url}>
                            {v}
                          </a>
                        );
                      }
                    },
                    {
                      title: "版本",
                      dataIndex: "version"
                    }
                  ]}
                  pagination={false}
                  dataSource={this.state.enablePlugs}
                />
              </TabPane>
              <TabPane tab="未启用扩展" key="2">
                <Table
                  rowKey="value"
                  columns={[
                    {
                      title: "名称",
                      dataIndex: "name",
                      render: (v, data) => {
                        return (
                          <a target="_blank" href={data.url}>
                            {v}
                          </a>
                        );
                      }
                    },
                    {
                      title: "版本",
                      dataIndex: "version"
                    },
                    {
                      title: "操作",
                      dataIndex: "action"
                    }
                  ]}
                  rowSelection={rowSelection}
                  pagination={false}
                  dataSource={this.state.unablePlugs}
                />
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
    );
  }
}
@connect(
  ({ user, appControl, global }) => ({
    currUser: user.currentUser,
    createWay: appControl.createWay,
    rainbondInfo: global.rainbondInfo
  }),
  { withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      runtimeInfo: "",
      changeBuildSource: false,
      editOauth: false,
      buildSource: null,
      showMarketAppDetail: false,
      showApp: {},
      create_status: "",
      languageBox: false,
      service_info: "",
      error_infos: "",
      thirdInfo: false,
      tags: [],
      tagsLoading: true,
      tabType: "branches",
      fullList: [],
      tabList: [],
      OauthLoading: true
    };
  }
  componentDidMount() {
    const { rainbondInfo } = this.props;
    let tabList = [];
    if (rainbondUtil.OauthbEnable(rainbondInfo)) {
      rainbondInfo.oauth_services.value.map(item => {
        const { oauth_type, service_id } = item;
        tabList.push({
          type: oauth_type,
          id: service_id + ""
        });
      });
      this.setState({
        tabList
      });
    }

    this.getRuntimeInfo();
    this.loadBuildSourceInfo();
  }
  handleEditRuntime = build_env_dict => {
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
      type: "appControl/editRuntimeBuildInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        build_env_dict
      },
      callback: res => {
        if (res && res._code == 200) {
          notification.success({ message: "修改成功." });
          this.getRuntimeInfo();
        }
      }
    });
  };
  handleEditInfo = (val = {}) => {
    this.props.dispatch({
      type: "appControl/editAppCreateInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        ...val
      },
      callback: data => {
        if (data) {
          this.props.updateDetail();
        }
      }
    });
  };
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
      type: "appControl/getRuntimeBuildInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias
      },
      callback: data => {
        if (data) {
          this.setState({ runtimeInfo: data.bean ? data.bean : {} });
        }
      }
    });
  };
  changeBuildSource = () => {
    this.setState({ changeBuildSource: true });
  };
  hideBuildSource = () => {
    this.setState({ changeBuildSource: false });
  };

  changeEditOauth = () => {
    this.handleCodeWarehouseType(this.props);
    this.handleProvinceChange();
    this.setState({ editOauth: true });
  };
  hideEditOauth = () => {
    this.setState({ editOauth: false });
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
        service_alias: this.props.appDetail.service.service_alias
      },
      callback: data => {
        if (data) {
          let bean = data.bean;
          this.setState({ buildSource: bean }, () => {
            if (
              bean &&
              bean.code_from &&
              bean.code_from.indexOf("oauth") > -1
            ) {
              this.loadThirdInfo();
            }
          });
        }
      }
    });
  };

  loadThirdInfo = () => {
    const { dispatch } = this.props;
    const { buildSource } = this.state;

    dispatch({
      type: "global/codeThirdInfo",
      payload: {
        full_name: buildSource.full_name,
        oauth_service_id: buildSource.oauth_service_id
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            thirdInfo: res.bean
          });
        }
      }
    });
  };
  getParams() {
    return {
      group_id: this.props.match.params.groupId,
      compose_id: this.props.match.params.composeId
    };
  }
  handleToDetect = () => {
    this.setState({ languageBox: true });

    // getStatus({
    //     team_name: globalUtil.getCurrTeamName(),
    //     app_alias: this.props.appDetail.service.service_alias,
    // }).then((res) => {
    //     if (res._code == 200) {
    //         this.setState({
    //             check_uuid: res.bean && res.bean.check_uuid
    //         }, () => {
    //         })
    //     }
    // })
  };
  handlelanguageBox = () => {
    this.setState({ languageBox: false, create_status: "" });
  };
  handleDetectGetLanguage = () => {
    const { dispatch } = this.props;
    const _th = this;
    dispatch({
      type: "appControl/getLanguage",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: this.props.appDetail.service.service_alias,
        check_uuid: this.state.check_uuid
      },
      callback: res => {
        if (res) {
          if (res._code == 200) {
            if (
              res.bean &&
              res.bean.check_status != "success" &&
              res.bean.check_status != "failure"
            ) {
              setTimeout(function() {
                _th.handleDetectGetLanguage();
              }, 3000);
            } else {
              this.loadBuildSourceInfo();
              this.setState({
                create_status: res.bean && res.bean.check_status,
                service_info: res.bean && res.bean.service_info,
                error_infos: res.bean && res.bean.error_infos
              });
            }
          }
        }
      }
    });
  };

  handleDetectPutLanguage = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "appControl/putLanguage",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: this.props.appDetail.service.service_alias
      },
      callback: res => {
        if (res) {
          this.setState(
            {
              create_status: res.bean && res.bean.create_status,
              check_uuid: res.bean && res.bean.check_uuid
            },
            () => {
              if (this.state.create_status == "failure") {
                return;
              } else {
                this.handleDetectGetLanguage();
              }
            }
          );
        }
      }
    });
  };

  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false
    });
  };

  //获取类型
  handleCodeWarehouseType = props => {
    const { dispatch, type } = props;
    const { tabType, buildSource } = this.state;
    const oauth_service_id = this.props.form.getFieldValue("oauth_service_id");
    const project_full_name = this.props.form.getFieldValue("full_name");

    dispatch({
      type: "global/codeWarehouseType",
      payload: {
        type: tabType,
        full_name: project_full_name
          ? project_full_name
          : buildSource.full_name,
        oauth_service_id: oauth_service_id
          ? oauth_service_id
          : buildSource.oauth_service_id
      },
      callback: res => {
        if (res && res._code === 200) {
          this.setState({
            tags: res.bean[tabType],
            tagsLoading: false,
            OauthLoading: false
          });
        }
      }
    });
  };

  onTabChange = tabType => {
    this.setState({ tabType, tagsLoading: true }, () => {
      this.handleCodeWarehouseType(this.props);
    });
  };

  handleProvinceChange = id => {
    //获取代码仓库信息
    const { dispatch, form } = this.props;
    const { setFieldsValue } = this.props.form;
    const { tabList } = this.state;
    const oauth_service_id = this.props.form.getFieldValue("oauth_service_id");
    this.setState({ OauthLoading: true });

    dispatch({
      type: "global/codeWarehouseInfo",
      payload: {
        page: 1,
        oauth_service_id: id
          ? id
          : oauth_service_id
          ? oauth_service_id
          : tabList.length > 0
          ? tabList[0].id
          : ""
      },
      callback: res => {
        if (res && res.bean) {
          setFieldsValue({
            full_name: res.bean.repositories[0].project_full_name
          });
          setFieldsValue({
            git_url: res.bean.repositories[0].project_url
          });

          this.setState(
            {
              fullList: res.bean.repositories
            },
            () => {
              this.handleCodeWarehouseType(this.props);
            }
          );
        }
      }
    });
  };

  handleProjectChange = project_full_name => {
    this.setState({ OauthLoading: true });
    const { form } = this.props;
    const { setFieldsValue } = this.props.form;
    const { fullList } = this.state;

    fullList.map(item => {
      if (item.project_full_name === project_full_name) {
        setFieldsValue(
          {
            git_url: item.project_url
          },
          () => {
            this.setState({ OauthLoading: false });
          }
        );
      }
    });
  };

  handleSubmitOauth = () => {
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;

      this.props.dispatch({
        type: "appControl/putAppBuidSource",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          service_alias: this.props.appAlias,
          is_oauth: true,
          oauth_service_id: fieldsValue.oauth_service_id,
          full_name: fieldsValue.full_name,
          git_url: fieldsValue.git_url,
          code_version: fieldsValue.code_version,
          service_source: "source_code"
        },
        callback: () => {
          notification.success({ message: "修改成功，下次构建部署时生效" });
          this.loadBuildSourceInfo();
          this.hideEditOauth();
        }
      });
    });
  };

  render() {
    const language = appUtil.getLanguage(this.props.appDetail);
    const runtimeInfo = this.state.runtimeInfo;
    const visible = this.props.visible;
    // if (!this.state.runtimeInfo || !this.state.buildSource)
    //     return null;
    const appDetail = this.props.appDetail;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 3
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 21
        }
      }
    };

    const formOauthLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 5
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 19
        }
      }
    };

    const languageType = versionLanguage ? versionLanguage : "";
    const {
      thirdInfo,
      buildSource,
      tags,
      tagsLoading,
      fullList,
      tabList
    } = this.state;
    const { rainbondInfo, form } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const versionLanguage = buildSource ? buildSource.language : "";

    return (
      <Fragment>
        {buildSource && (
          <Card
            title="构建源"
            style={{
              marginBottom: 24
            }}
            extra={[
              appUtil.isOauthByBuildSource(buildSource) ? (
                <a onClick={this.changeEditOauth} href="javascript:;">
                  编辑
                </a>
              ) : (
                !appUtil.isMarketAppByBuildSource(buildSource) && (
                  <a onClick={this.changeBuildSource} href="javascript:;">
                    更改
                  </a>
                )
              )
            ]}
          >
            <div>
              <FormItem
                style={{
                  marginBottom: 0
                }}
                {...formItemLayout}
                label="创建方式"
              >
                {appUtil.isOauthByBuildSource(buildSource)
                  ? thirdInfo.service_type
                  : appUtil.getCreateTypeCNByBuildSource(buildSource)}
              </FormItem>
            </div>

            {appUtil.isImageAppByBuildSource(buildSource) ? (
              <div>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label="镜像名称"
                >
                  {buildSource.image}
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label="版本"
                >
                  {buildSource.version}
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label="启动命令"
                >
                  {buildSource.cmd || ""}
                </FormItem>
              </div>
            ) : (
              ""
            )}
            {appUtil.isMarketAppByBuildSource(buildSource) ? (
              <Fragment>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label="云市应用名称"
                >
                  {buildSource.group_key ? (
                    <a
                      href="javascript:;"
                      onClick={() => {
                        this.setState({
                          showApp: {
                            details: buildSource.details,
                            group_name: buildSource.rain_app_name,
                            group_key: buildSource.group_key
                          },
                          showMarketAppDetail: true
                        });
                      }}
                    >
                      {buildSource.rain_app_name}
                    </a>
                  ) : (
                    "无法找到源应用，可能已删除"
                  )}
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label="版本"
                >
                  {buildSource.version}
                </FormItem>
              </Fragment>
            ) : (
              ""
            )}

            {appUtil.isOauthByBuildSource(buildSource) && (
              <FormItem
                style={{
                  marginBottom: 0
                }}
                {...formItemLayout}
                label="项目名称"
              >
                <a href={buildSource.git_url} target="_blank">
                  {buildSource.full_name}
                </a>
              </FormItem>
            )}

            {appUtil.isCodeAppByBuildSource(buildSource) ? (
              <Fragment>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label="仓库地址"
                >
                  <a href={buildSource.git_url} target="_blank">
                    {buildSource.git_url}
                  </a>
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0
                  }}
                  {...formItemLayout}
                  label="代码版本"
                >
                  {buildSource.code_version}
                </FormItem>

                {!appUtil.isOauthByBuildSource(buildSource) && (
                  <FormItem
                    style={{
                      marginBottom: 0
                    }}
                    {...formItemLayout}
                    className={styles.ant_form_item}
                    label="语言"
                  >
                    {languageType != "static" ? (
                      <a target="blank" href={languageObj[`${languageType}`]}>
                        {languageType}
                      </a>
                    ) : (
                      <a href="javascript:void(0);">{languageType}</a>
                    )}
                    <Button
                      size="small"
                      type={"primary"}
                      onClick={this.handleToDetect}
                    >
                      重新检测
                    </Button>
                  </FormItem>
                )}
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

        {buildSource && (
          <AutoDeploy
            app={this.props.appDetail}
            service_source={appUtil.getCreateTypeCNByBuildSource(buildSource)}
          />
        )}

        {this.state.languageBox && (
          <Modal
            visible={this.state.languageBox}
            onCancel={this.handlelanguageBox}
            title="重新检测"
            footer={
              !this.state.create_status
                ? [
                    <Button key="back" onClick={this.handlelanguageBox}>
                      关闭
                    </Button>,
                    <Button
                      key="submit"
                      type="primary"
                      onClick={this.handleDetectPutLanguage}
                    >
                      检测
                    </Button>
                  ]
                : this.state.create_status == "success"
                ? [
                    <Button key="back" onClick={this.handlelanguageBox}>
                      关闭
                    </Button>,
                    <Button
                      key="submit"
                      type="primary"
                      onClick={this.handlelanguageBox}
                    >
                      确认
                    </Button>
                  ]
                : [<Button key="back">关闭</Button>]
            }
          >
            <div>
              {this.state.create_status == "checking" ||
              this.state.create_status == "complete" ? (
                <div>
                  <p style={{ textAlign: "center" }}>
                    <Spin />
                  </p>
                  <p style={{ textAlign: "center", fontSize: "14px" }}>
                    检测中，请稍后(请勿关闭弹窗)
                  </p>
                </div>
              ) : (
                ""
              )}
              {this.state.create_status == "failure" ? (
                <div>
                  <p
                    style={{
                      textAlign: "center",
                      color: "#28cb75",
                      fontSize: "36px"
                    }}
                  >
                    <Icon
                      style={{
                        color: "#f5222d",
                        marginRight: 8
                      }}
                      type="close-circle-o"
                    />
                  </p>
                  {this.state.error_infos &&
                    this.state.error_infos.map(item => {
                      return (
                        <div>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: `<span>${item.error_info ||
                                ""} ${item.solve_advice || ""}</span>`
                            }}
                          />
                        </div>
                      );
                      // <p style={{ textAlign: 'center', fontSize: '14px' }}>{item.key}:{item.value} </p>
                    })}
                </div>
              ) : (
                ""
              )}
              {this.state.create_status == "success" ? (
                <div>
                  <p
                    style={{
                      textAlign: "center",
                      color: "#28cb75",
                      fontSize: "36px"
                    }}
                  >
                    <Icon type="check-circle-o" />
                  </p>

                  {this.state.service_info &&
                    this.state.service_info.map(item => {
                      return (
                        <p style={{ textAlign: "center", fontSize: "14px" }}>
                          {item.key}:{item.value}{" "}
                        </p>
                      );
                    })}
                </div>
              ) : (
                ""
              )}
              {this.state.create_status == "failed" ? (
                <div>
                  <p
                    style={{
                      textAlign: "center",
                      color: "999",
                      fontSize: "36px"
                    }}
                  >
                    <Icon type="close-circle-o" />
                  </p>
                  <p style={{ textAlign: "center", fontSize: "14px" }}>
                    检测失败，请重新检测
                  </p>
                </div>
              ) : (
                ""
              )}

              {!this.state.create_status && (
                <div>
                  <p style={{ textAlign: "center", fontSize: "14px" }}>
                    确定要重新检测吗?
                  </p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {language && runtimeInfo && (
          <JAVA
            appDetail={this.props.appDetail}
            onSubmit={this.handleEditRuntime}
            language={language}
            // userRunTimeInfo={runtimeInfo.user_dependency || {}}
            runtimeInfo={this.state.runtimeInfo}
          />
        )}

        {this.state.changeBuildSource && (
          <ChangeBuildSource
            onOk={this.onChangeBuildSource}
            buildSource={buildSource}
            appAlias={this.props.appDetail.service.service_alias}
            title="更改组件构建源"
            onCancel={this.hideBuildSource}
          />
        )}

        {this.state.editOauth && (
          <Modal
            visible={this.state.editOauth}
            onCancel={this.hideEditOauth}
            onOk={this.handleSubmitOauth}
            loading={this.state.OauthLoading}
            title="编辑"
          >
            <Spin spinning={this.state.OauthLoading}>
              <Form onSubmit={this.handleSubmitOauth}>
                <FormItem {...formOauthLayout} label="创建方式">
                  {getFieldDecorator("oauth_service_id", {
                    initialValue: thirdInfo ? thirdInfo.service_id + "" : "",
                    rules: [{ required: true, message: "请选择创建方式" }]
                  })(
                    <Select
                      onChange={this.handleProvinceChange}
                      placeholder="请选择要创建方式"
                    >
                      {tabList.length > 0 &&
                        tabList.map(item => (
                          <Option key={item.id} value={item.id}>
                            {item.type}
                          </Option>
                        ))}
                    </Select>
                  )}
                </FormItem>

                <FormItem {...formOauthLayout} label="项目名称">
                  {getFieldDecorator("full_name", {
                    initialValue: buildSource
                      ? buildSource.full_name
                      : fullList.length > 0 && fullList[0].project_full_name,
                    rules: [{ required: true, message: "请选择项目" }]
                  })(
                    <Select
                      onChange={this.handleProjectChange}
                      placeholder="请选择项目"
                    >
                      {fullList.length > 0 &&
                        fullList.map(item => (
                          <Option
                            key={item.project_url}
                            value={item.project_full_name}
                          >
                            {item.project_full_name}
                          </Option>
                        ))}
                    </Select>
                  )}
                </FormItem>

                <FormItem {...formOauthLayout} label="仓库地址">
                  {getFieldDecorator("git_url", {
                    initialValue: buildSource
                      ? buildSource.git_url
                      : fullList.length > 0 && fullList[0].git_url,
                    rules: [{ required: true, message: "请选择创建方式" }]
                  })(<Input placeholder="请输入配置组名" disabled={true} />)}
                </FormItem>

                <Form.Item
                  className={styles.clearConform}
                  {...formOauthLayout}
                  label="代码版本"
                >
                  {getFieldDecorator("code_version", {
                    initialValue: buildSource ? buildSource.code_version : "",
                    rules: [{ required: true, message: "请输入代码版本" }]
                  })(
                    <Select placeholder="请输入代码版本">
                      <OptGroup
                        label={
                          <Tabs
                            defaultActiveKey="branches"
                            onChange={this.onTabChange}
                            className={styles.selectTabs}
                          >
                            <TabPane tab="分支" key="branches" />
                            <TabPane tab="Tags" key="tags" />
                          </Tabs>
                        }
                      >
                        {tags.length > 0 ? (
                          tags.map(item => {
                            return (
                              <Option key={item} value={item}>
                                {item}
                              </Option>
                            );
                          })
                        ) : (
                          <Option value={"loading"}>
                            <Spin spinning={tagsLoading} />
                          </Option>
                        )}
                      </OptGroup>
                    </Select>
                  )}
                </Form.Item>
              </Form>
            </Spin>{" "}
          </Modal>
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
