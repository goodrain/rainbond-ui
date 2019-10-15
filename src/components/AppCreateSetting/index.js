import React, { PureComponent, Fragment } from "react";
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
  Checkbox,
  notification
} from "antd";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import globalUtil from "../../utils/global";
import { Link } from "dva/router";
import httpResponseUtil from "../../utils/httpResponse";
import styles from "./setting.less";
import Port from "../../components/Port";
import {
  getMnt,
  addMnt,
  getRelationedApp,
  getUnRelationedApp,
  addRelationedApp,
  removeRelationedApp,
  batchAddRelationedApp
} from "../../services/app";
import EditPortAlias from "../../components/EditPortAlias";
import ConfirmModal from "../../components/ConfirmModal";
import AddPort from "../../components/AddPort";
import AddOrEditEnv from "../../components/AddOrEditEnv";
import AddOrEditVolume from "../../components/AddOrEditVolume";
import AddRelationMnt from "../../components/AddRelationMnt";
import AddRelation from "../../components/AddRelation";
import ViewRelationInfo from "../../components/ViewRelationInfo";
import appUtil from "../../utils/app";
import { volumeTypeObj } from "../../utils/utils";
import Dockerinput from "../../components/Dockerinput";

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const TabPane = Tabs.TabPane;
const { TextArea } = Input;
const confirm = Modal.confirm;
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
    //   return null;
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
            </RadioGroup>
          )}
        </Form.Item>
        {/* <Form.Item {...formItemLayout} label="运行命令">
          {getFieldDecorator('service_runtimes', {
            initialValue: '',
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

//Golang
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
    if (this.isShowRuntime()) {
      this.onChange({
        service_runtimes: this.getDefaultRuntime()
      });
    }
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
    //   return null;
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
    //   return null;
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
      arr,
      setObj
    } = this.state;
    form.validateFields((err, fieldsValue) => {
      // if (err) return;
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
        OpenJDK,
        BUILD_PIP_INDEX_URL,
        // BUILD_RUNTIMES_HHVM,
        BUILD_DOTNET_RUNTIME_VERSION,
        RUNTIMES,
        set_dockerfile
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
        BUILD_RUNTIMES ? (subObject.BUILD_RUNTIMES = BUILD_RUNTIMES) : "";
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
  onRadioChange = e => {};

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

  render() {
    const runtimeInfo = this.props.runtimeInfo || "";
    const language = this.props.language;
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
    const { JDKType, languageType, arr } = this.state;
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
        {(languageType == "nodejsstatic" || languageType == "static") && (
          <Form.Item {...formItemLayout} label="web服务器支持">
            {getFieldDecorator("BUILD_RUNTIMES_SERVER", {
              initialValue:
                (runtimeInfo && runtimeInfo.BUILD_RUNTIMES_SERVER) || "nginx"
            })(
              <RadioGroup className={styles.ant_radio_disabled}>
                <Radio value="nginx" selected="selected">
                  nginx(默认)
                </Radio>
                {languageType == "static" && (
                  <Radio value="apache">apache</Radio>
                )}
              </RadioGroup>
            )}
          </Form.Item>
        )}
        {(languageType == "nodejs" ||
          languageType == "Node" ||
          languageType == "node") && (
          <div>
            <Form.Item {...formItemLayout} label="Node版本">
              {getFieldDecorator("BUILD_RUNTIMES", {
                initialValue:
                  (runtimeInfo && runtimeInfo.BUILD_RUNTIMES) || "8.12.0"
              })(
                <RadioGroup className={styles.ant_radio_disabled}>
                  <Radio value="8.12.0" selected="selected">
                    8.12.0(默认)
                  </Radio>
                  <Radio value="4.9.1">4.9.1</Radio>
                  <Radio value="5.12.0">5.12.0</Radio>
                  <Radio value="6.14.4">6.14.4</Radio>
                  <Radio value="7.10.1">7.10.1</Radio>
                  <Radio value="9.11.2">9.11.2</Radio>
                  <Radio value="10.13.0">10.13.0</Radio>
                  <Radio value="11.1.0">11.1.0</Radio>
                </RadioGroup>
              )}
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

            {/* <Form.Item {...formItemLayout} label="web服务器支持">
                          {getFieldDecorator('BUILD_RUNTIMES_SERVER', {
                              initialValue: runtimeInfo && runtimeInfo.BUILD_RUNTIMES_SERVER || "nginx",
                          })(
                              <RadioGroup className={styles.ant_radio_disabled}>
                                  <Radio value='nginx'>nginx(默认)</Radio>
                                  <Radio value='apache'>apache</Radio>
                              </RadioGroup>
                          )}
                      </Form.Item> */}
          </div>
        )}

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
    //   return null;
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
          {/* {!runtimeInfo.runtimes */}
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
          {/* : null
          } */}

          {/* {!runtimeInfo.procfile */}
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
          {/* //   : null
          // } */}

          {/* {!runtimeInfo.dependencies */}
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
          {/* : null
          } */}

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
  ({ user, appControl, teamControl }) => ({ currUser: user.currentUser }),
  null,
  null,
  { withRef: true }
)
@Form.create()
class BaseInfo extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      memoryList: [
        {
          text: "64M",
          value: 64
        },
        {
          text: "128M",
          value: 128
        },
        {
          text: "256M",
          value: 256
        },
        {
          text: "512M",
          value: 512
        },
        {
          text: "1G",
          value: 1024
        },
        {
          text: "2G",
          value: 1024 * 2
        },
        {
          text: "4G",
          value: 1024 * 4
        },
        {
          text: "8G",
          value: 1024 * 8
        },
        {
          text: "16G",
          value: 1024 * 8
        }
      ]
    };
  }
  handleSubmit = e => {
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };
  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const radioStyle = {
      display: "block",
      height: "30px",
      lineHeight: "30px"
    };
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
    const extend_method = this.props.appDetail.service.extend_method;
    const minMemory = this.props.appDetail.service.min_memory;
    const list = this.state.memoryList;
    return (
      <Card
        title="基本信息"
        style={{
          marginBottom: 16
        }}
      >
        <Form.Item {...formItemLayout} label="组件类型">
          {getFieldDecorator("extend_method", {
            initialValue: extend_method || "stateless",
            rules: [
              {
                required: true,
                message: "请选择组件类型"
              }
            ]
          })(
            <RadioGroup>
              <Radio style={radioStyle} value="stateless">
                无状态组件（包括Web类，API类）
              </Radio>
              <Radio style={radioStyle} value={"state"}>
                有状态组件（包括DB类，集群类，消息中间件类，数据类）
              </Radio>
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="内存">
          {getFieldDecorator("min_memory", {
            initialValue: minMemory || "",
            rules: [
              {
                required: true,
                message: "请选择内存"
              }
            ]
          })(
            <RadioGroup>
              {minMemory < list[0].value ? (
                <RadioButton value={minMemory}>{minMemory}M</RadioButton>
              ) : null}
              {list.map((item, index) => {
                return (
                  <RadioButton key={index} value={item.value}>
                    {item.text}
                  </RadioButton>
                );
              })}
            </RadioGroup>
          )}
        </Form.Item>
        <Row>
          <Col span="5" />
          <Col span="19">
            <Button onClick={this.handleSubmit} type={"primary"}>
              确认修改
            </Button>
          </Col>
        </Row>
      </Card>
    );
  }
}

@connect(
  ({ user, appControl, teamControl }) => ({ currUser: user.currentUser }),
  null,
  null,
  { withRef: true }
)
class RenderDeploy extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      runtimeInfo: ""
    };
  }
  componentDidMount() {
    this.getRuntimeInfo();
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
  render() {
    const language = appUtil.getLanguage(this.props.appDetail);
    const runtimeInfo = this.state.runtimeInfo;
    const visible = this.props.visible;
    if (!this.state.runtimeInfo) return null;
    const appDetail = this.props.appDetail;
    return (
      <div
        style={{
          display: visible ? "block" : "none"
        }}
      >
        <BaseInfo appDetail={appDetail} onSubmit={this.handleEditInfo} />

        {language && runtimeInfo && (
          <JAVA
            appDetail={this.props.appDetail}
            onSubmit={this.handleEditRuntime}
            language={language}
            // userRunTimeInfo={runtimeInfo.user_dependency || {}}
            runtimeInfo={this.state.runtimeInfo}
          />
        )}
        {/* {(language === 'php')
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
            runtimeInfo={runtimeInfo.check_dependency || {}}
          />
          : null
        }

        {(language === 'nodejs')
          ? <Nodejs
            appDetail={this.props.appDetail}
            onSubmit={this.handleEditRuntime}
            userRunTimeInfo={runtimeInfo.user_dependency || {}}
            runtimeInfo={runtimeInfo.check_dependency || {}} />
          : null
        } */}
      </div>
    );
  }
}

//存储管理
@connect(
  ({ user, appControl }) => ({ currUser: user.currentUser }),
  null,
  null,
  { withRef: true }
)
class Mnt extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      showAddVar: null,
      showAddRelation: false,
      selfPathList: [],
      mntList: [],
      toDeleteMnt: null,
      toDeleteVolume: null,
      volumes: []
    };
  }

  componentDidMount() {
    const { dispatch } = this.props;
    this.loadMntList();
    this.fetchVolumes();
  }
  fetchVolumes = () => {
    this.props.dispatch({
      type: "appControl/fetchVolumes",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias
      },
      callback: data => {
        if (data) {
          this.setState({
            volumes: data.list || []
          });
        }
      }
    });
  };
  loadMntList = () => {
    getMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appDetail.service.service_alias,
      page: 1,
      page_size: 1000
    }).then(data => {
      if (data) {
        this.setState({
          mntList: data.list || []
        });
      }
    });
  };
  handleAddVar = () => {
    this.setState({
      showAddVar: {
        new: true
      }
    });
  };
  handleCancelAddVar = () => {
    this.setState({ showAddVar: null });
  };
  handleSubmitAddVar = vals => {
    this.props.dispatch({
      type: "appControl/addVolume",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        ...vals
      },
      callback: () => {
        this.fetchVolumes();
        this.handleCancelAddVar();
      }
    });
  };
  showAddRelation = () => {
    this.setState({ showAddRelation: true });
  };
  handleCancelAddRelation = () => {
    this.setState({ showAddRelation: false });
  };
  handleSubmitAddMnt = mnts => {
    addMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appDetail.service.service_alias,
      body: mnts
    }).then(data => {
      if (data) {
        this.handleCancelAddRelation();
        this.loadMntList();
      }
    });
  };
  onDeleteMnt = mnt => {
    this.setState({ toDeleteMnt: mnt });
  };
  onDeleteVolume = data => {
    this.setState({ toDeleteVolume: data });
  };
  onCancelDeleteVolume = () => {
    this.setState({ toDeleteVolume: null });
  };
  handleDeleteVolume = () => {
    this.props.dispatch({
      type: "appControl/deleteVolume",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        volume_id: this.state.toDeleteVolume.ID
      },
      callback: () => {
        this.onCancelDeleteVolume();
        this.fetchVolumes();
      }
    });
  };
  handleDeleteMnt = () => {
    this.props.dispatch({
      type: "appControl/deleteMnt",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        dep_vol_id: this.state.toDeleteMnt.dep_vol_id
      },
      callback: () => {
        this.cancelDeleteMnt();
        this.loadMntList();
      }
    });
  };
  cancelDeleteMnt = () => {
    this.setState({ toDeleteMnt: null });
  };
  render() {
    const { mntList } = this.state;
    const { volumes } = this.state;
    const columns = [
      {
        title: "存储名称",
        dataIndex: "volume_name"
      },
      {
        title: "挂载路径",
        dataIndex: "volume_path"
      },
      {
        title: "存储类型",
        dataIndex: "volume_type"
      },
      {
        title: "操作",
        dataIndex: "action",
        render: (val, data) => {
          return (
            <a
              onClick={() => {
                this.onDeleteVolume(data);
              }}
              href="javascript:;"
            >
              删除
            </a>
          );
        }
      }
    ];
    return (
      <Fragment>
        <Card
          style={{
            marginBottom: 16
          }}
          title={"存储设置"}
        >
          <Table pagination={false} dataSource={volumes} columns={columns} />
          <div
            style={{
              marginTop: 10,
              textAlign: "right"
            }}
          >
            <Button onClick={this.handleAddVar}>
              <Icon type="plus" />
              添加存储
            </Button>
          </div>
        </Card>
        <Card
          style={{
            marginBottom: 16
          }}
          title={"共享存储"}
        >
          <Table
            pagination={false}
            columns={[
              {
                title: "本地挂载路径",
                dataIndex: "local_vol_path",
                key: "1",
                width: "20%",
                render: (data, index) => (
                  <Tooltip title={data}>
                    <span
                      style={{
                        wordBreak: "break-all",
                        wordWrap: "break-word"
                      }}
                    >
                      {data}
                    </span>
                  </Tooltip>
                )
              },
              {
                title: "目标存储名称",
                dataIndex: "dep_vol_name",
                key: "2",
                width: "15%",
                render: (data, index) => (
                  <Tooltip title={data}>
                    <span
                      style={{
                        wordBreak: "break-all",
                        wordWrap: "break-word"
                      }}
                    >
                      {data}
                    </span>
                  </Tooltip>
                )
              },
              {
                title: "目标挂载路径",
                dataIndex: "dep_vol_path",
                key: "3",
                width: "15%",
                render: (data, index) => (
                  <Tooltip title={data}>
                    <span
                      style={{
                        wordBreak: "break-all",
                        wordWrap: "break-word"
                      }}
                    >
                      {data}
                    </span>
                  </Tooltip>
                )
              },
              {
                title: "目标存储类型",
                dataIndex: "dep_vol_type",
                key: "4",
                width: "10%",
                render: (text, record) => {
                  return <span>{volumeTypeObj[text]}</span>;
                }
              },
              {
                title: "目标所属组件",
                dataIndex: "dep_app_name",
                key: "5",
                width: "10%",
                render: (v, data) => {
                  return (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${
                        data.dep_app_alias
                      }/overview`}
                    >
                      {v}
                    </Link>
                  );
                }
              },
              {
                title: "目标组件所属应用",
                dataIndex: "dep_app_group",
                key: "6",
                width: "15%",
                render: (v, data) => {
                  return (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${
                        data.dep_group_id
                      }`}
                    >
                      {v}
                    </Link>
                  );
                }
              },
              {
                title: "操作",
                dataIndex: "action",
                key: "7",
                width: "15%",
                render: (val, data) => {
                  return (
                    <a
                      onClick={() => {
                        this.onDeleteMnt(data);
                      }}
                      href="javascript:;"
                    >
                      取消挂载
                    </a>
                  );
                }
              }
            ]}
            dataSource={mntList}
          />
          <div
            style={{
              marginTop: 10,
              textAlign: "right"
            }}
          >
            <Button onClick={this.showAddRelation}>
              <Icon type="plus" />
              挂载共享存储
            </Button>
          </div>
        </Card>
        {this.state.showAddVar && (
          <AddOrEditVolume
            appBaseInfo={this.props.appDetail.service}
            onCancel={this.handleCancelAddVar}
            onSubmit={this.handleSubmitAddVar}
            data={this.state.showAddVar}
          />
        )}
        {this.state.showAddRelation && (
          <AddRelationMnt
            appAlias={this.props.appDetail.service.service_alias}
            onCancel={this.handleCancelAddRelation}
            onSubmit={this.handleSubmitAddMnt}
          />
        )}
        {this.state.toDeleteMnt && (
          <ConfirmModal
            title="取消挂载"
            desc="确定要取消此挂载目录吗?"
            onCancel={this.cancelDeleteMnt}
            onOk={this.handleDeleteMnt}
          />
        )}
        {this.state.toDeleteVolume && (
          <ConfirmModal
            title="删除存储目录"
            desc="确定要删除此存储目录吗?"
            onCancel={this.onCancelDeleteVolume}
            onOk={this.handleDeleteVolume}
          />
        )}
      </Fragment>
    );
  }
}

@connect(
  ({ user, appControl, teamControl }) => ({}),
  null,
  null,
  { withRef: true }
)
class Relation extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      showAddRelation: false,
      linkList: [],
      relationList: [],
      viewRelationInfo: null
    };
  }
  componentDidMount() {
    this.loadRelationedApp();
  }
  loadRelationedApp = () => {
    getRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appDetail.service.service_alias
    }).then(data => {
      if (data) {
        this.setState({
          relationList: data.list || []
        });
      }
    });
  };
  showAddRelation = () => {
    this.setState({ showAddRelation: true });
  };
  handleCancelAddRelation = () => {
    this.setState({ showAddRelation: false });
  };
  handleSubmitAddRelation = ids => {
    batchAddRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appDetail.service.service_alias,
      dep_service_ids: ids
    }).then(data => {
      if (data) {
        notification.info({ message: "需要更新才能生效" });
        this.loadRelationedApp();
        this.handleCancelAddRelation();
      }
    });
  };
  handleRemoveRelationed = app => {
    removeRelationedApp({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appDetail.service.service_alias,
      dep_service_id: app.service_id
    }).then(data => {
      if (data) {
        this.loadRelationedApp();
      }
    });
  };
  onViewRelationInfo = data => {
    this.setState({ viewRelationInfo: data });
  };
  cancelViewRelationInfo = data => {
    this.setState({ viewRelationInfo: null });
  };
  render() {
    const { linkList, relationList } = this.state;
    return (
      <Card title={"组件依赖"}>
        <Table
          pagination={false}
          columns={[
            {
              title: "组件名称",
              dataIndex: "service_cname",
              render: (val, data) => {
                return (
                  <Link
                    to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${
                      data.service_alias
                    }/overview`}
                  >
                    {val}
                  </Link>
                );
              }
            },
            {
              title: "所属组",
              dataIndex: "group_name"
            },
            {
              title: "组件说明",
              dataIndex: "describe",
              render: (val, data) => {}
            },
            {
              title: "操作",
              dataIndex: "var",
              render: (val, data) => {
                return (
                  <Fragment>
                    <a
                      onClick={() => this.onViewRelationInfo(data)}
                      href="javascript:;"
                      style={{
                        marginRight: 8
                      }}
                    >
                      查看链接信息
                    </a>
                    <a
                      onClick={() => {
                        this.handleRemoveRelationed(data);
                      }}
                      href="javascript:;"
                    >
                      取消依赖
                    </a>
                  </Fragment>
                );
              }
            }
          ]}
          dataSource={relationList}
        />
        <div
          style={{
            marginTop: 10,
            textAlign: "right"
          }}
        >
          <Button onClick={this.showAddRelation}>
            <Icon type="plus" />
            添加依赖
          </Button>
        </div>
        {this.state.showAddRelation && (
          <AddRelation
            appAlias={this.props.appDetail.service.service_alias}
            onCancel={this.handleCancelAddRelation}
            onSubmit={this.handleSubmitAddRelation}
          />
        )}
        {this.state.viewRelationInfo && (
          <ViewRelationInfo
            appAlias={this.state.viewRelationInfo.service_alias}
            onCancel={this.cancelViewRelationInfo}
          />
        )}
      </Card>
    );
  }
}

//环境变量
@connect(
  ({ user, appControl, teamControl }) => ({}),
  null,
  null,
  { withRef: true }
)
class Env extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      showAddVar: false,
      showEditVar: null,
      deleteVar: null,
      innerEnvs: [],
      page: 1,
      page_size: 5,
      total: 0,
      env_name: ""
    };
  }
  componentDidMount() {
    this.fetchInnerEnvs();
  }
  fetchInnerEnvs = () => {
    const { page, page_size, env_name } = this.state;

    this.props.dispatch({
      type: "appControl/fetchInnerEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        page,
        page_size,
        env_name
      },
      callback: res => {
        if (res) {
          this.setState({
            innerEnvs: res.list || [],
            total: res.bean.total
          });
        }
      }
    });
  };
  handleAddVar = () => {
    this.setState({ showAddVar: true });
  };
  handleCancelAddVar = () => {
    this.setState({ showAddVar: false });
  };
  handleSubmitAddVar = vals => {
    this.props.dispatch({
      type: "appControl/addInnerEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        attr_name: vals.attr_name,
        attr_value: vals.attr_value,
        name: vals.name
      },
      callback: () => {
        this.handleCancelAddVar();
        this.fetchInnerEnvs();
      }
    });
  };

  onEditVar = data => {
    this.setState({ showEditVar: data });
  };
  cancelEditVar = () => {
    this.setState({ showEditVar: null });
  };
  handleEditVar = vals => {
    const { showEditVar } = this.state;
    this.props.dispatch({
      type: "appControl/editEvns",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        ID: showEditVar.ID,
        attr_value: vals.attr_value,
        name: vals.name
      },
      callback: () => {
        this.cancelEditVar();
        this.fetchInnerEnvs();
      }
    });
  };
  onDeleteVar = data => {
    this.setState({ deleteVar: data });
  };
  cancelDeleteVar = () => {
    this.setState({ deleteVar: null });
  };
  handleDeleteVar = () => {
    this.props.dispatch({
      type: "appControl/deleteEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        ID: this.state.deleteVar.ID
      },
      callback: () => {
        this.cancelDeleteVar();
        this.fetchInnerEnvs();
      }
    });
  };

  onPageChange = page => {
    this.setState(
      {
        page
      },
      () => {
        this.fetchInnerEnvs();
      }
    );
  };

  render() {
    const innerEnvs = this.state.innerEnvs;
    return (
      <Card
        title="环境变量"
        style={{
          marginBottom: 16
        }}
      >
        <Table
          columns={[
            {
              title: "变量名",
              dataIndex: "attr_name",
              key: "1",
              width: "30%",
              render: v => (
                <div
                  style={{
                    wordBreak: "break-all",
                    wordWrap: "break-word"
                  }}
                >
                  {v}
                </div>
              )
            },
            {
              title: "变量值",
              dataIndex: "attr_value",
              key: "2",
              width: "30%",
              render: v => (
                <div
                  style={{
                    wordBreak: "break-all",
                    wordWrap: "break-word"
                  }}
                >
                  {v}
                </div>
              )
            },
            {
              title: "说明",
              dataIndex: "name",
              key: "3",
              width: "25%",
              render: v => (
                <div
                  style={{
                    wordBreak: "break-all",
                    wordWrap: "break-word"
                  }}
                >
                  {v}
                </div>
              )
            },
            {
              title: "操作",
              dataIndex: "action",
              key: "4",
              width: "15%",
              render: (val, data) => {
                return (
                  <Fragment>
                    {data.is_change ? (
                      <a
                        href="javascript:;"
                        style={{
                          marginRight: 8
                        }}
                        onClick={() => {
                          this.onDeleteVar(data);
                        }}
                      >
                        删除
                      </a>
                    ) : (
                      ""
                    )}
                    {data.is_change ? (
                      <a
                        href="javascript:;"
                        onClick={() => {
                          this.onEditVar(data);
                        }}
                      >
                        修改
                      </a>
                    ) : (
                      ""
                    )}
                  </Fragment>
                );
              }
            }
          ]}
          pagination={{
            current: this.state.page,
            pageSize: this.state.page_size,
            total: this.state.total,
            onChange: this.onPageChange
          }}
          dataSource={innerEnvs}
        />
        <div
          style={{
            textAlign: "right",
            paddingTop: 20
          }}
        >
          <Button type="default" onClick={this.handleAddVar}>
            <Icon type="plus" />
            添加变量
          </Button>
        </div>
        {this.state.showAddVar && (
          <AddOrEditEnv
            onCancel={this.handleCancelAddVar}
            onSubmit={this.handleSubmitAddVar}
          />
        )}
        {this.state.showEditVar && (
          <AddOrEditEnv
            onCancel={this.cancelEditVar}
            onSubmit={this.handleEditVar}
            data={this.state.showEditVar}
          />
        )}
        {this.state.deleteVar && (
          <ConfirmModal
            onOk={this.handleDeleteVar}
            onCancel={this.cancelDeleteVar}
            title="删除变量"
            desc="确定要删除此变量吗？"
            subDesc="此操作不可恢复"
          />
        )}
      </Card>
    );
  }
}

//端口
@connect(
  ({ user, appControl, teamControl }) => ({}),
  null,
  null,
  { withRef: true }
)
class Ports extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showEditAlias: null,
      showDeleteDomain: null,
      showDeletePort: null,
      showDeleteDomain: null,
      showAddPort: false,
      ports: []
    };
  }
  componentDidMount() {
    this.fetchPorts();
  }
  fetchPorts = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "appControl/fetchPorts",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias
      },
      callback: data => {
        this.setState({
          ports: (data && data.list) || []
        });
      }
    });
  };
  handleSubmitProtocol = (protocol, port, callback) => {
    const { dispatch } = this.props;
    dispatch({
      type: "appControl/changeProtocol",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        port: port,
        protocol: protocol
      },
      callback: () => {
        this.fetchPorts();
        callback();
      }
    });
  };
  showEditAlias = port => {
    this.setState({ showEditAlias: port });
  };
  hideEditAlias = () => {
    this.setState({ showEditAlias: null });
  };
  handleEditAlias = vals => {
    this.props.dispatch({
      type: "appControl/editPortAlias",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        port: this.state.showEditAlias.container_port,
        port_alias: vals.alias
      },
      callback: () => {
        this.fetchPorts();
        this.hideEditAlias();
      }
    });
  };
  handleOpenInner = port => {
    this.props.dispatch({
      type: "appControl/openPortInner",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        port: port
      },
      callback: () => {
        this.fetchPorts();
      }
    });
  };
  onCloseInner = port => {
    this.props.dispatch({
      type: "appControl/closePortInner",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        port: port
      },
      callback: () => {
        this.fetchPorts();
      }
    });
  };
  handleOpenOuter = port => {
    this.props.dispatch({
      type: "appControl/openPortOuter",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        port: port
      },
      callback: () => {
        this.fetchPorts();
      }
    });
  };
  onCloseOuter = port => {
    this.props.dispatch({
      type: "appControl/closePortOuter",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        port: port
      },
      callback: () => {
        this.fetchPorts();
      }
    });
  };
  handleDeletePort = port => {
    this.setState({ showDeletePort: port });
  };
  cancalDeletePort = () => {
    this.setState({ showDeletePort: null });
  };
  handleSubmitDeletePort = () => {
    this.props.dispatch({
      type: "appControl/deletePort",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        port: this.state.showDeletePort
      },
      callback: () => {
        this.cancalDeletePort();
        this.fetchPorts();
      }
    });
  };
  showAddPort = () => {
    this.setState({ showAddPort: true });
  };

  onCancelAddPort = () => {
    this.setState({ showAddPort: false });
  };
  handleAddPort = val => {
    this.props.dispatch({
      type: "appControl/addPort",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appDetail.service.service_alias,
        protocol: val.protocol,
        port: val.port
      },
      callback: () => {
        this.onCancelAddPort();
        this.fetchPorts();
      }
    });
  };
  render() {
    const ports = this.state.ports || [];
    const isImageApp = appUtil.isImageApp(this.props.appDetail);
    const isDockerfile = appUtil.isDockerfile(this.props.appDetail);
    return (
      <Card
        title="端口管理"
        style={{
          marginBottom: 16
        }}
      >
        <div className={styles.ports}>
          {ports.map(port => {
            return (
              <Port
                key={port.ID}
                showOuterUrl={false}
                showDomain={false}
                port={port}
                onDelete={this.handleDeletePort}
                onEditAlias={this.showEditAlias}
                onSubmitProtocol={this.handleSubmitProtocol}
                onOpenInner={this.handleOpenInner}
                onCloseInner={this.onCloseInner}
                onOpenOuter={this.handleOpenOuter}
                onCloseOuter={this.onCloseOuter}
              />
            );
          })}
          {!ports.length ? (
            <p
              style={{
                textAlign: "center"
              }}
            >
              暂无端口
            </p>
          ) : (
            ""
          )}
        </div>
        <div
          style={{
            textAlign: "right",
            paddingTop: 20
          }}
        >
          <Button type="default" onClick={this.showAddPort}>
            <Icon type="plus" />
            添加端口
          </Button>
        </div>
        {this.state.showEditAlias && (
          <EditPortAlias
            port={this.state.showEditAlias}
            onOk={this.handleEditAlias}
            onCancel={this.hideEditAlias}
          />
        )}
        {this.state.showDeletePort && (
          <ConfirmModal
            title="端口删除"
            desc="确定要删除此端口吗？"
            subDesc="此操作不可恢复"
            onOk={this.handleSubmitDeletePort}
            onCancel={this.cancalDeletePort}
          />
        )}
        {this.state.showDeleteDomain && (
          <ConfirmModal
            title="域名解绑"
            desc="确定要解绑此域名吗？"
            subDesc={this.state.showDeleteDomain.domain}
            onOk={this.handleSubmitDeleteDomain}
            onCancel={this.cancalDeleteDomain}
          />
        )}
        {this.state.showAddPort && (
          <AddPort
            isImageApp={isImageApp}
            isDockerfile={isDockerfile}
            onCancel={this.onCancelAddPort}
            onOk={this.handleAddPort}
          />
        )}
      </Card>
    );
  }
}

class RenderProperty extends PureComponent {
  render() {
    const visible = this.props.visible;
    const appDetail = this.props.appDetail;
    return (
      <div
        style={{
          display: visible ? "block" : "none"
        }}
      >
        <Ports appDetail={appDetail} />
        <Env appDetail={appDetail} />
        <Mnt appDetail={appDetail} />
        <Relation appDetail={appDetail} />
      </div>
    );
  }
}

@connect(
  ({ user, appControl }) => ({ currUser: user.currentUser }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      //property、deploy
      type: "property"
    };
  }
  getAppAlias() {
    return this.props.match.params.appAlias;
  }
  handleType = type => {
    if (this.state.type !== type) {
      this.setState({ type: type });
    }
  };
  render() {
    const appDetail = this.props.appDetail || {};
    const type = this.state.type;

    return (
      <div>
        <div
          style={{
            overflow: "hidden"
          }}
        >
          <div className={styles.typeBtnWrap}>
            <Affix offsetTop={0}>
              <div>
                <span
                  className={
                    styles.typeBtn +
                    " " +
                    (type === "property" ? styles.active : "")
                  }
                  onClick={() => {
                    this.handleType("property");
                  }}
                >
                  基本属性
                  <Icon type="right" />
                </span>
                <span
                  className={
                    styles.typeBtn +
                    " " +
                    (type === "deploy" ? styles.active : "")
                  }
                  onClick={() => {
                    this.handleType("deploy");
                  }}
                >
                  部署属性
                  <Icon type="right" />
                </span>
              </div>
            </Affix>
          </div>

          <div
            className={styles.content}
            style={{
              overflow: "hidden",
              marginBottom: 90
            }}
          >
            <RenderDeploy
              updateDetail={this.props.updateDetail}
              appDetail={appDetail}
              visible={type === "deploy"}
            />
            <RenderProperty appDetail={appDetail} visible={type !== "deploy"} />
          </div>
        </div>
      </div>
    );
  }
}
