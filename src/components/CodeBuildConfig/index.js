import { Button, Card, Col, Form, Modal, Row } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import globalUtil from '../../utils/global'
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
      setObj: props.runtimeInfo ? props.runtimeInfo : '',
      buildSourceArr:[],
      buildSourceLoading: true
    };
  }

  componentDidMount() {
    const { isBtn = true, onRef } = this.props
    this.handleRuntimeInfo(this.props);
    this.setArr(this.props);
    if(!isBtn && onRef){
      this.props.onRef(this)
    }
    const arr = globalUtil.getBuildSource(this.state.languageType)
    if (arr && arr.length > 0) {
      const promises = arr.map(item => {
        return this.getBuildSource(item);
      });
      Promise.all(promises)
        .then(() => {
          this.setState({ buildSourceLoading: false })
        })
        .catch(error => {
          this.setState({ buildSourceLoading: false })
        });
    }
  }

  componentWillReceiveProps(nextProps) {
    const arr = globalUtil.getBuildSource(nextProps.language)
    if (
      nextProps.runtimeInfo !== this.props.runtimeInfo ||
      nextProps.language !== this.state.languageType
    ) {
      this.setState({
        buildSourceLoading: true
      }, () => {
        if (arr && arr.length > 0) {
          const promises = arr.map(item => {
            return this.getBuildSource(item);
          });
          Promise.all(promises)
            .then(() => {
              this.setState({ buildSourceLoading: false })
            })
            .catch(error => {
              this.setState({ buildSourceLoading: false })
            });
        }
        this.handleRuntimeInfo(nextProps);
        this.setArr(nextProps);
      })
    }
  }
    /**
   * getBuildSource 函数：
   * 
   * 功能：
   *   获取构建源的语言版本信息。
   *   使用 dispatch 方法发送 'teamControl/getComponentLangVersion' 类型的 action，携带当前团队、应用和语言信息。
   *   在请求成功后，如果返回的数据状态码为 200，则将数据存入 buildSourceArr 中，并更新组件的 buildSourceArr 状态。
   *   若请求失败，则清空 buildSourceArr 并抛出错误。
   * 
   * 参数：
   *   @param {string} item - 构建源的语言类型。
   * 
   * 返回值：
   *   返回一个 Promise，resolve 表示请求成功，reject 表示请求失败。
   */
    getBuildSource = (item) => {
      return new Promise((resolve, reject) => {
        const { dispatch, appDetail } = this.props;
        const { buildSourceArr } = this.state;
        dispatch({
          type: 'teamControl/getComponentLangVersion',
          payload: {
            team_name: globalUtil.getCurrTeamName(),
            app_alias: appDetail.service.service_alias,
            lang: item
          },
          callback: data => {
            if (data && data.status_code == 200) {
              buildSourceArr[item] = data.list
              this.setState({ buildSourceArr })
              resolve();
            }
          },
          handleError: res => {
            buildSourceArr[item] = []
            this.setState({ buildSourceArr })
            this.setState({ buildSourceArr })
            reject(new Error("Failed to get component language version"));
          }
        });
      })
    };
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
        title: formatMessage({id:'componentOverview.body.CodeBuildConfig.title'}),
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
        callback(<FormattedMessage id='componentOverview.body.CodeBuildConfig.callback_msg'/>);
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
    const { isBtn = true } = this.props
    const { languageType, arr, buildSourceArr, buildSourceLoading } = this.state;
    if (buildSourceLoading) { return null }
    return (
      <Card title={<FormattedMessage id='componentOverview.body.CodeBuildConfig.card_title'/>}>
        {(languageType === 'java-maven' || languageType === 'Java-maven') && (
          <JavaMavenConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr} />
        )}
        {(languageType === 'java-jar' || languageType === 'Java-jar') && (
          <div>
            <JavaJarConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr}/>
          </div>
        )}
        {(languageType === 'java-war' || languageType === 'Java-war') && (
          <div>
            <JavaWarConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr}/>
          </div>
        )}
        {(languageType === 'Golang' ||
          languageType === 'go' ||
          languageType === 'Go' ||
          languageType === 'golang') && (
          <GoConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr}/>
        )}
        {(languageType === 'Gradle' ||
          languageType === 'gradle' ||
          languageType === 'java-gradle' ||
          languageType === 'Java-gradle' ||
          languageType === 'JAVAGradle') && (
          <JavaJDKConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr}/>
        )}
        {(languageType === 'python' || languageType === 'Python') && (
          <PythonConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr}/>
        )}
        {(languageType === 'php' || languageType === 'PHP') && (
          <PHPConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr}/>
        )}
        {languageType === 'static' && (
          <StaticConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr} key={buildSourceArr}/>
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
            buildSourceArr={buildSourceArr}
          />
        )}
        {(languageType === '.NetCore' ||
          languageType === 'netCore' ||
          languageType === 'netcore') && (
          <NetCoreConfig
            languageType={languageType}
            envs={runtimeInfo}
            form={this.props.form}
            buildSourceArr={buildSourceArr}
          />
        )}
        {languageType === 'dockerfile' && (
          <div>
            <Form.Item {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.CodeBuildConfig.label'/>}>
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
        {isBtn &&
          <Row>
            <Col span="5" />
            <Col span="19">
              <Button onClick={this.showConfirm} type="primary">
                <FormattedMessage id='componentOverview.body.CodeBuildConfig.Confirm'/>
              </Button>
            </Col>
          </Row>
        }
        
      </Card>
    );
  }
}

export default CodeBuildConfig;
