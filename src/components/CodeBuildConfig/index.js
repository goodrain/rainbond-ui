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
import JavaCNBConfig from './java-cnb';
import NetCoreConfig from './netcore';
import NodeJSConfig from './nodejs';
import NodeJSCNBConfig from './nodejs-cnb';
import PHPCNBConfig from './php-cnb';
import PHPConfig from './php';
import PythonCNBConfig from './python-cnb';
import PythonConfig from './python';
import StaticConfig from './static';
import GolangCNBConfig from './golang-cnb';
import DotnetCNBConfig from './dotnet-cnb';
import {
  getExplicitBuildStrategy,
  getLangVersionQueryList,
  getLangVersionBuildStrategy,
  isCNBBuildConfig,
  isCnbLanguageType,
  isNodeJSLanguage,
  normalizeBuildLanguage
} from './buildStrategy';
import buildEnvHelpers from './buildEnvHelpers';

const { mergeRuntimeBuildEnvs } = buildEnvHelpers;

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
    this.loadBuildSources(this.props);
  }

  componentWillReceiveProps(nextProps) {
    const arr = this.getBuildSourceQueryList(nextProps);
    if (
      nextProps.runtimeInfo !== this.props.runtimeInfo ||
      nextProps.language !== this.state.languageType ||
      nextProps.buildSource !== this.props.buildSource
    ) {
      this.setState({
        buildSourceLoading: true
      }, () => {
        this.loadBuildSources(nextProps, arr);
        this.handleRuntimeInfo(nextProps);
        this.setArr(nextProps);
      })
    }
  }

  getBuildSourceQueryList = props => {
    const arr = globalUtil.getBuildSource(props.language);
    return getLangVersionQueryList(arr, {
      languageType: props.language,
      runtimeInfo: props.runtimeInfo,
      buildSource: props.buildSource,
      appDetail: props.appDetail,
      isCreate: props.isCreate
    });
  };

  loadBuildSources = (props, buildSources) => {
    const arr = buildSources || this.getBuildSourceQueryList(props);
    if (!arr || arr.length === 0) {
      this.setState({ buildSourceLoading: false });
      return;
    }
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
  };
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
            lang: item,
            build_strategy: getLangVersionBuildStrategy(item, {
              languageType: this.state.languageType || this.props.language,
              runtimeInfo: this.props.runtimeInfo,
              buildSource: this.props.buildSource,
              appDetail: this.props.appDetail,
              isCreate: this.props.isCreate
            })
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
        const { JDK_TYPE } = fieldsValue;
        if (JDK_TYPE && JDK_TYPE === 'Jdk') {
          fieldsValue.BUILD_ENABLE_ORACLEJDK = true;
        }
        if (languageType && (languageType.toLowerCase().includes('dockerfile')) && onSubmit) {
          Promise.resolve(onSubmit(setObj)).then(() => resolve(true)).catch(() => resolve(false));
        } else if (onSubmit) {
          // 合并已有构建环境变量，防止全量更新时丢失未在表单中的变量（如 BUILD_PACKAGE_TOOL）
          const existingEnvs = this.props.runtimeInfo || {};
          const mergedValues = mergeRuntimeBuildEnvs(existingEnvs, fieldsValue);
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
    const normalizedLanguageType = normalizeBuildLanguage(languageType);
    // 支持复合语言（如 "dockerfile,Node.js"）—— 只要包含 dockerfile 就视为 dockerfile 构建
    const isDockerfile = normalizedLanguageType.includes('dockerfile');
    const cnbVersionPolicy = runtimeInfo?.cnb_version_policy || this.props.buildSource?.cnb_version_policy || {};
    const explicitBuildStrategy = getExplicitBuildStrategy({
      runtimeInfo,
      buildSource: this.props.buildSource,
      appDetail: this.props.appDetail
    });
    const isCNB = isCNBBuildConfig({
      languageType,
      runtimeInfo,
      buildSource: this.props.buildSource,
      appDetail: this.props.appDetail,
      isCreate: this.props.isCreate
    });
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
        {isCNB && isNodeJSLanguage(languageType) && (
          <NodeJSCNBConfig
            languageType={languageType}
            envs={runtimeInfo}
            form={this.props.form}
            cnbVersionPolicy={cnbVersionPolicy}
          />
        )}
        {isCNB && !isNodeJSLanguage(languageType) && (languageType === 'java-maven' || languageType === 'Java-maven' || languageType === 'java-jar' || languageType === 'Java-jar' || languageType === 'java-war' || languageType === 'Java-war' || languageType === 'gradle' || languageType === 'Gradle' || languageType === 'java-gradle' || languageType === 'Java-gradle' || languageType === 'JAVAGradle') && (
          <JavaCNBConfig
            languageType={languageType}
            envs={runtimeInfo}
            form={this.props.form}
            buildSourceArr={buildSourceArr}
            cnbVersionPolicy={cnbVersionPolicy}
          />
        )}
        {isCNB && !isNodeJSLanguage(languageType) && (languageType === 'python' || languageType === 'Python') && (
          <PythonCNBConfig
            envs={runtimeInfo}
            form={this.props.form}
            buildSourceArr={buildSourceArr}
            cnbVersionPolicy={cnbVersionPolicy}
          />
        )}
        {isCNB && !isNodeJSLanguage(languageType) && (languageType === 'Golang' || languageType === 'go' || languageType === 'Go' || languageType === 'golang') && (
          <GolangCNBConfig
            envs={runtimeInfo}
            form={this.props.form}
            buildSourceArr={buildSourceArr}
            cnbVersionPolicy={cnbVersionPolicy}
          />
        )}
        {isCNB && !isNodeJSLanguage(languageType) && (languageType === '.NetCore' || languageType === 'netCore' || languageType === 'netcore' || languageType === 'dotnet' || languageType === 'dotnetcore') && (
          <DotnetCNBConfig
            envs={runtimeInfo}
            form={this.props.form}
            buildSourceArr={buildSourceArr}
            cnbVersionPolicy={cnbVersionPolicy}
          />
        )}
        {isCNB && !isNodeJSLanguage(languageType) && (languageType === 'php' || languageType === 'PHP') && (
          <PHPCNBConfig
            envs={runtimeInfo}
            form={this.props.form}
            buildSourceArr={buildSourceArr}
            cnbVersionPolicy={cnbVersionPolicy}
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
