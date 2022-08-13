import { Button, Card, Col, Form, Modal, Row } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import Dockerinput from '../Dockerinput';
import GoConfig from './golang';
import JavaJarConfig from './java-jar';
import JavaJDKConfig from './java-jdk';
import JavaMavenConfig from './java-maven';
import JavaWarConfig from './java-war';
import NetCoreConfig from './netcore';
import NodeJSConfig from './nodejs';
import PHPConfig from './php';
import PythonConfig from './python';
import StaticConfig from './static';

const { confirm } = Modal;

@connect(
  ({ user, appControl }) => ({
    currUser: user.currentUser,
    appDetail: appControl.appDetail
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
class CodeBuildConfig extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      NO_CACHE: !!this.props.runtimeInfo.NO_CACHE,
      BUILD_MAVEN_MIRROR_DISABLE: !!this.props.runtimeInfo
        .BUILD_MAVEN_MIRROR_DISABLE,
      DEBUG: false,
      BUILD_DEBUG_INFO: false,
      BUILD_ENABLE_ORACLEJDK: !!this.props.runtimeInfo.BUILD_ENABLE_ORACLEJDK,
      JDKType:
        props.runtimeInfo && props.runtimeInfo.BUILD_RUNTIMES
          ? 'OpenJDK'
          : props.runtimeInfo && props.runtimeInfo.BUILD_ENABLE_ORACLEJDK
          ? 'Jdk'
          : props.form.getFieldValue('RUNTIMES')
          ? props.form.getFieldValue('RUNTIMES')
          : 'OpenJDK',
      languageType: this.props.language,
      BUILD_ONLINE: false,
      NODE_MODULES_CACHE: false,
      NODE_VERBOSE: false,
      arr: [],
      setObj: props.runtimeInfo ? props.runtimeInfo : ''
    };
  }

  componentDidMount() {
    this.handleRuntimeInfo(this.props);
    this.setArr(this.props);
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

  onSetObj = value => {
    const obj = {};
    value.map(item => {
      obj[`BUILD_ARG_${item.key}`] = item.value;
    });
    this.setState({ setObj: obj });
  };
  setArr = props => {
    const { runtimeInfo, language } = props;
    if (language === 'dockerfile' && runtimeInfo !== '') {
      const arr = [];
      for (const i in runtimeInfo) {
        let keyName = `${i}`;
        if (keyName.startsWith('BUILD_ARG_')) {
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

  handleSubmit = () => {
    const { form, onSubmit } = this.props;
    const { validateFields } = form;
    const { languageType, setObj } = this.state;
    validateFields((err, fieldsValue) => {
      if (err) return;
      const {
        BUILD_NO_CACHE,
        BUILD_MAVEN_MIRROR_DISABLE,
        JDK_TYPE
      } = fieldsValue;
      // not disable cache is not set BUILD_NO_CACHE
      if (!BUILD_NO_CACHE) {
        delete fieldsValue.BUILD_NO_CACHE;
      }
      if (!BUILD_MAVEN_MIRROR_DISABLE) {
        delete fieldsValue.BUILD_MAVEN_MIRROR_DISABLE;
      }
      if (JDK_TYPE && JDK_TYPE === 'Jdk') {
        fieldsValue.BUILD_ENABLE_ORACLEJDK = true;
      }
      if (languageType && languageType === 'dockerfile' && onSubmit) {
        onSubmit(setObj);
      } else if (onSubmit) {
        onSubmit(fieldsValue);
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

  showConfirm = () => {
    // eslint-disable-next-line no-underscore-dangle
    const _th = this;
    const { form } = this.props;
    const { validateFields } = form;
    validateFields(err => {
      if (err) return;
      confirm({
        title: '确认修改吗?',
        content: '',
        onOk() {
          _th.handleSubmit();
        },
        onCancel() {}
      });
    });
  };

  validCustomJDK = (rule, value, callback) => {
    const runtime = this.props.form.getFieldValue('RUNTIMES');
    if (runtime === 'Jdk') {
      if (!value) {
        callback('自定义JDK下载地址不能为空');
      }
    }
    callback();
  };

  render() {
    const runtimeInfo = this.props.runtimeInfo || '';
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 6
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 18
        }
      }
    };
    const { getFieldDecorator } = this.props.form;
    const { languageType, arr } = this.state;
    return (
      <Card title="源码构建参数设置">
        {(languageType === 'java-maven' || languageType === 'Java-maven') && (
          <JavaMavenConfig envs={runtimeInfo} form={this.props.form} />
        )}
        {(languageType === 'java-jar' || languageType === 'Java-jar') && (
          <div>
            <JavaJarConfig envs={runtimeInfo} form={this.props.form} />
          </div>
        )}
        {(languageType === 'java-war' || languageType === 'Java-war') && (
          <div>
            <JavaWarConfig envs={runtimeInfo} form={this.props.form} />
          </div>
        )}
        {(languageType === 'Golang' ||
          languageType === 'go' ||
          languageType === 'Go' ||
          languageType === 'golang') && (
          <GoConfig envs={runtimeInfo} form={this.props.form} />
        )}
        {(languageType === 'Gradle' ||
          languageType === 'gradle' ||
          languageType === 'java-gradle' ||
          languageType === 'Java-gradle' ||
          languageType === 'JAVAGradle') && (
          <JavaJDKConfig envs={runtimeInfo} form={this.props.form} />
        )}
        {(languageType === 'python' || languageType === 'Python') && (
          <PythonConfig envs={runtimeInfo} form={this.props.form} />
        )}
        {(languageType === 'php' || languageType === 'PHP') && (
          <PHPConfig envs={runtimeInfo} form={this.props.form} />
        )}
        {languageType === 'static' && (
          <StaticConfig envs={runtimeInfo} form={this.props.form} />
        )}
        {(languageType === 'nodejsstatic' ||
          languageType === 'NodeJSStatic' ||
          languageType === 'nodejs' ||
          languageType === 'Node' ||
          languageType === 'node' ||
          languageType === 'Node.js') && (
          <NodeJSConfig
            languageType={languageType}
            envs={runtimeInfo}
            form={this.props.form}
          />
        )}
        {(languageType === '.NetCore' ||
          languageType === 'netCore' ||
          languageType === 'netcore') && (
          <NetCoreConfig
            languageType={languageType}
            envs={runtimeInfo}
            form={this.props.form}
          />
        )}
        {languageType === 'dockerfile' && (
          <div>
            <Form.Item {...formItemLayout} label="ARG参数">
              {getFieldDecorator('set_dockerfile', { initialValue: [] })(
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
            <Button onClick={this.showConfirm} type="primary">
              确认修改
            </Button>
          </Col>
        </Row>
      </Card>
    );
  }
}

export default CodeBuildConfig;
