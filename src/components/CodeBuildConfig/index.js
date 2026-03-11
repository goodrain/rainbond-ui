import { Button, Card, Col, Form, Modal, Row } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import handleAPIError from '../../utils/error';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import globalUtil from '../../utils/global';
import Dockerinput from '../Dockerinput';
import GoConfig from './golang';
import JavaJarConfig from './java-jar';
import JavaJDKConfig from './java-jdk';
import JavaMavenConfig from './java-maven';
import JavaWarConfig from './java-war';
import NetCoreConfig from './netcore';
import NodeJSConfig from './nodejs';
import NodeJSCNBConfig from './nodejs-cnb';
import PHPConfig from './php';
import PythonConfig from './python';
import StaticConfig from './static';

const { confirm } = Modal;

// Node.js 语言类型集合
const NODEJS_LANGUAGE_TYPES = new Set(['nodejsstatic', 'nodejs', 'node', 'node.js']);
const isNodeJSLanguage = (type) => type && NODEJS_LANGUAGE_TYPES.has(type.toLowerCase());

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
            if (data && data.status_code === 200) {
              buildSourceArr[item] = data.list
              this.setState({ buildSourceArr })
              resolve();
            }
          },
          handleError: res => {
            buildSourceArr[item] = []
            this.setState({ buildSourceArr })
            handleAPIError(res);
            reject(new Error("Failed to get component language version"));
          }
        });
      })
    };
  onSetObj = value => {
    const obj = {};
    value.forEach(item => {
      obj[`BUILD_ARG_${item.key}`] = item.value;
    });
    this.setState({ setObj: obj });
  };
  setArr = props => {
    const { runtimeInfo, language } = props;
    if ((language || '').toLowerCase().includes('dockerfile') && runtimeInfo !== '') {
      const arr = [];
      for (const i in runtimeInfo) {
        const keyName = `${i}`;
        // Dockerfile ARG 参数以 BUILD_ARG_ 前缀存储，只显示这些
        if (keyName.startsWith('BUILD_ARG_')) {
          arr.push({ key: keyName.substr(10), value: runtimeInfo[i] });
        }
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
    return new Promise((resolve) => {
      validateFields((err, fieldsValue) => {
        if (err) { resolve(false); return; }
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
        if (languageType && (languageType.toLowerCase().includes('dockerfile')) && onSubmit) {
          Promise.resolve(onSubmit(setObj)).then(() => resolve(true)).catch(() => resolve(false));
        } else if (onSubmit) {
          // 合并已有构建环境变量，防止全量更新时丢失未在表单中的变量（如 BUILD_PACKAGE_TOOL）
          const existingEnvs = this.props.runtimeInfo || {};
          const mergedValues = { ...existingEnvs, ...fieldsValue };
          // 移除 runtime_info 对象（非环境变量，不应提交）
          delete mergedValues.runtime_info;
          Promise.resolve(onSubmit(mergedValues)).then(() => resolve(true)).catch(() => resolve(false));
        } else {
          resolve(true);
        }
      });
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
    const { languageType } = this.state;
    const normalizedLanguageType = (languageType || '').toLowerCase();
    // 支持复合语言（如 "dockerfile,Node.js"）—— 只要包含 dockerfile 就视为 dockerfile 构建
    const isDockerfile = normalizedLanguageType.includes('dockerfile');
    const isStaticLanguage = normalizedLanguageType === 'static';
    // BUILD_FRAMEWORK 是源码检测结果，非 Node 组件也可能携带该字段。
    // 仅在组件语言本身是 Node/static 时，才将其作为老数据的 CNB 兼容信号。
    const hasLegacyCNBFramework = !!runtimeInfo?.BUILD_FRAMEWORK
      && (isNodeJSLanguage(languageType) || isStaticLanguage);
    // 创建流程：BUILD_TYPE 还没写入数据库，根据语言类型判断
    // 已有组件：根据 BUILD_TYPE / CNB 参数判断
    // dockerfile 语言不走 CNB，即使 runtimeInfo 中残留 CNB 参数
    const isCNB = !isDockerfile && (
      (this.props.isCreate && (isNodeJSLanguage(languageType) || isStaticLanguage))
      || runtimeInfo?.BUILD_TYPE === 'cnb'
      || !!runtimeInfo?.CNB_FRAMEWORK
      || hasLegacyCNBFramework
    );
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
    const { arr, buildSourceArr, buildSourceLoading } = this.state;
    if (buildSourceLoading) { return null }
    return (
      <Card title={<FormattedMessage id='componentOverview.body.CodeBuildConfig.card_title'/>}>

        {/* ========== CNB 构建：由后端 runtime_info 驱动 ========== */}
        {isCNB && languageType === 'static' && (
          <StaticConfig />
        )}
        {isCNB && languageType !== 'static' && (
          <NodeJSCNBConfig
            languageType={languageType}
            envs={runtimeInfo}
            form={this.props.form}
          />
        )}

        {/* ========== Slug 构建：兼容旧组件，按语言类型分发 ========== */}
        {!isCNB && (languageType === 'java-maven' || languageType === 'Java-maven') && (
          <JavaMavenConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr} />
        )}
        {!isCNB && (languageType === 'java-jar' || languageType === 'Java-jar') && (
          <div>
            <JavaJarConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr}/>
          </div>
        )}
        {!isCNB && (languageType === 'java-war' || languageType === 'Java-war') && (
          <div>
            <JavaWarConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr}/>
          </div>
        )}
        {!isCNB && (languageType === 'Golang' ||
          languageType === 'go' ||
          languageType === 'Go' ||
          languageType === 'golang') && (
          <GoConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr}/>
        )}
        {!isCNB && (languageType === 'Gradle' ||
          languageType === 'gradle' ||
          languageType === 'java-gradle' ||
          languageType === 'Java-gradle' ||
          languageType === 'JAVAGradle') && (
          <JavaJDKConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr}/>
        )}
        {!isCNB && (languageType === 'python' || languageType === 'Python') && (
          <PythonConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr}/>
        )}
        {!isCNB && (languageType === 'php' || languageType === 'PHP') && (
          <PHPConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr}/>
        )}
        {!isCNB && languageType === 'static' && (
          <StaticConfig envs={runtimeInfo} form={this.props.form} buildSourceArr={buildSourceArr} isSlug={true} />
        )}
        {!isCNB && isNodeJSLanguage(languageType) && (
          <NodeJSConfig
            languageType={languageType}
            envs={runtimeInfo}
            form={this.props.form}
            buildSourceArr={buildSourceArr}
          />
        )}
        {!isCNB && (languageType === '.NetCore' ||
          languageType === 'netCore' ||
          languageType === 'netcore') && (
          <NetCoreConfig
            languageType={languageType}
            envs={runtimeInfo}
            form={this.props.form}
            buildSourceArr={buildSourceArr}
          />
        )}
        {isDockerfile && (
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
        {isBtn && !(isCNB && languageType === 'static') &&
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
