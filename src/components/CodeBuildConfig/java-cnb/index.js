/* eslint-disable camelcase */
import MavenConfiguration from '@/components/MavenConfiguration';
import handleAPIError from '@/utils/error';
import { formatMessage } from '@/utils/intl';
import globalUtil from '@/utils/global';
import { Button, Form, Icon, Input, Radio, Select, Switch, Tag, Tooltip } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';

const RadioGroup = Radio.Group;
const { Option } = Select;
const PROCFILE_HELP = '可选，留空时使用 Paketo 默认启动进程；仓库根目录存在 Procfile 时会由 Paketo 识别';
const PROCFILE_LABEL = (
  <span>
    {formatMessage({ id: 'componentOverview.body.JavaCNBConfig.start_command' })}
    <Tooltip title={PROCFILE_HELP}>
      <Icon type="question-circle-o" style={{ marginLeft: 8, color: '#8d9bad' }} />
    </Tooltip>
  </span>
);

const renderLabelWithTip = (label, tip) => (
  <span>
    {label}
    <Tooltip title={tip}>
      <Icon type="question-circle-o" style={{ marginLeft: 8, color: '#8d9bad' }} />
    </Tooltip>
  </span>
);

const getJavaRuntimePolicy = (policy = {}) => policy?.java?.jdk || {};

const getJavaVersions = (policy = {}) => getJavaRuntimePolicy(policy).visible_versions || [];

const getJavaDefaultVersion = (policy = {}, currentValue = '') => {
  if (currentValue) {
    return currentValue;
  }
  const runtimePolicy = getJavaRuntimePolicy(policy);
  return runtimePolicy.default_version || '';
};

const normalizeLanguage = languageType => (languageType || '').toLowerCase();

const isTruthy = value =>
  value === true || value === 'true' || value === '1' || value === 1;

const firstNonEmptyEnv = (envs = {}, keys = []) => {
  for (let i = 0; i < keys.length; i += 1) {
    const value = envs[keys[i]];
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
    if (value) {
      return value;
    }
  }
  return '';
};

@connect(
  ({ enterprise }) => ({
    currentEnterprise: enterprise.currentEnterprise
  }),
  null,
  null,
  { withRef: true }
)
class JavaCNBConfig extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      mavenVisible: false,
      MavenList: [],
      activeMaven: '',
      startMode: this.getStartMode(props.envs)
    };
  }

  componentDidMount() {
    if (this.isMavenLanguage(this.props.languageType)) {
      this.fetchMavensettings();
    }
  }

  componentDidUpdate(prevProps) {
    if (!this.isMavenLanguage(prevProps.languageType) && this.isMavenLanguage(this.props.languageType)) {
      this.fetchMavensettings();
    }
    if (prevProps.languageType !== this.props.languageType || prevProps.envs !== this.props.envs) {
      const nextStartMode = this.getStartMode(this.props.envs);
      if (nextStartMode !== this.state.startMode) {
        this.setState({ startMode: nextStartMode });
      }
    }
  }

  getStartMode = envs => {
    const procfile = firstNonEmptyEnv(envs, ['BUILD_PROCFILE']);
    return procfile ? 'custom' : 'default';
  };

  onCancel = MavenName => {
    this.fetchMavensettings();
    const { setFieldsValue } = this.props.form;
    setFieldsValue({
      BUILD_MAVEN_SETTING_NAME: MavenName || ''
    });
    this.setState({
      mavenVisible: false
    });
  };

  fetchMavensettings = () => {
    const { dispatch, currentEnterprise } = this.props;
    if (!dispatch || !currentEnterprise || !currentEnterprise.enterprise_id) {
      return;
    }
    dispatch({
      type: 'appControl/fetchMavensettings',
      payload: {
        region_name: globalUtil.getCurrRegionName(),
        enterprise_id: currentEnterprise.enterprise_id,
        onlyname: true
      },
      callback: res => {
        if (res && res.status_code === 200) {
          this.setState({ MavenList: res.list || [] });
        }
      },
      handleError: err => {
        handleAPIError(err);
      }
    });
  };

  handleMavenConfiguration = () => {
    const { getFieldValue } = this.props.form;
    this.setState({
      activeMaven: getFieldValue('BUILD_MAVEN_SETTING_NAME'),
      mavenVisible: true
    });
  };

  handleStartModeChange = e => {
    const mode = e.target.value;
    const { setFieldsValue } = this.props.form;
    this.setState({ startMode: mode });
    if (mode === 'default') {
      setFieldsValue({ BUILD_PROCFILE: '' });
    }
  };

  isMavenLanguage = languageType => normalizeLanguage(languageType) === 'java-maven';

  isWarLanguage = languageType => normalizeLanguage(languageType) === 'java-war';

  isJarLanguage = languageType => normalizeLanguage(languageType) === 'java-jar';

  isGradleLanguage = languageType => {
    const value = normalizeLanguage(languageType);
    return value === 'gradle' || value === 'javagradle' || value === 'java-gradle';
  };

  getStartCommandSourceText = (envs, currentProcfile) => {
    const source = firstNonEmptyEnv(envs, ['start_command_source', 'START_COMMAND_SOURCE']);
    if (source === 'procfile') {
      return formatMessage({ id: 'componentOverview.body.JavaCNBConfig.source_procfile' });
    }
    if (typeof currentProcfile === 'string' && currentProcfile.trim() !== '') {
      return formatMessage({ id: 'componentOverview.body.JavaCNBConfig.source_user' });
    }
    return formatMessage({ id: 'componentOverview.body.JavaCNBConfig.source_default' });
  };

  render() {
    const formItemLayout = {
      labelCol: { xs: { span: 24 }, sm: { span: 4 } },
      wrapperCol: { xs: { span: 24 }, sm: { span: 20 } }
    };
    const { envs = {}, form, cnbVersionPolicy, languageType } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const { mavenVisible, MavenList, activeMaven, startMode } = this.state;
    const isMaven = this.isMavenLanguage(languageType);
    const isWar = this.isWarLanguage(languageType);
    const isJar = this.isJarLanguage(languageType);
    const isGradle = this.isGradleLanguage(languageType);
    const javaVersions = getJavaVersions(cnbVersionPolicy);
    const defaultJavaVersion = getJavaDefaultVersion(
      cnbVersionPolicy,
      firstNonEmptyEnv(envs, ['BP_JVM_VERSION', 'BUILD_RUNTIMES', 'RUNTIMES'])
    );
    const mavenList = MavenList || [];
    let defaultMavenSettingName = '';
    if (mavenList.length && envs.BUILD_MAVEN_SETTING_NAME) {
      mavenList.forEach(item => {
        if (item.name === envs.BUILD_MAVEN_SETTING_NAME) {
          defaultMavenSettingName = envs.BUILD_MAVEN_SETTING_NAME;
        }
      });
    }
    if (mavenList.length && !defaultMavenSettingName) {
      const defaultMaven = mavenList.find(item => item.is_default);
      defaultMavenSettingName = defaultMaven ? defaultMaven.name : mavenList[0].name;
    }
    const procfileValue = getFieldValue('BUILD_PROCFILE');
    const currentProcfile = typeof procfileValue === 'string' ? procfileValue : (envs.BUILD_PROCFILE || '');
    const startSourceText = this.getStartCommandSourceText(envs, currentProcfile);

    return (
      <div>
        {mavenVisible && (
          <MavenConfiguration
            activeMaven={activeMaven}
            onCancel={this.onCancel}
          />
        )}
        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.GoConfig.Disable' }),
            formatMessage({ id: 'componentOverview.body.JavaCNBConfig.disable_cache_tip' })
          )}
        >
          {getFieldDecorator('BUILD_NO_CACHE', {
            valuePropName: 'checked',
            initialValue: isTruthy(envs.BUILD_NO_CACHE)
          })(<Switch />)}
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.JavaJDKConfig.edition' }),
            formatMessage({ id: 'componentOverview.body.JavaCNBConfig.jvm_version_tip' })
          )}
        >
          {getFieldDecorator('BP_JVM_VERSION', {
            initialValue: defaultJavaVersion
          })(
            <RadioGroup>
              {javaVersions.map(item => (
                <Radio key={item} value={item}>
                  {item}
                </Radio>
              ))}
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.JavaCNBConfig.jvm_type' }),
            formatMessage({ id: 'componentOverview.body.JavaCNBConfig.jvm_type_tip' })
          )}
        >
          {getFieldDecorator('BP_JVM_TYPE', {
            initialValue: firstNonEmptyEnv(envs, ['BP_JVM_TYPE']) || 'JRE'
          })(
            <RadioGroup>
              <Radio value="JRE">JRE</Radio>
              <Radio value="JDK">JDK</Radio>
            </RadioGroup>
          )}
        </Form.Item>
        {isWar &&
          getFieldDecorator('BP_JAVA_APP_SERVER', {
            initialValue: firstNonEmptyEnv(envs, ['BP_JAVA_APP_SERVER']) || 'tomcat'
          })(<Input type="hidden" />)}
        {isMaven && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.JavaMavenConfig.configure' }),
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.maven_settings_tip' })
            )}
          >
            {getFieldDecorator('BUILD_MAVEN_SETTING_NAME', {
              initialValue: defaultMavenSettingName,
              rules: mavenList.length > 0 ? [
                {
                  required: true,
                  message: formatMessage({ id: 'componentOverview.body.JavaMavenConfig.choice' })
                }
              ] : []
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                placeholder={formatMessage({ id: 'componentOverview.body.JavaMavenConfig.choice' })}
                style={{ width: '300px', marginRight: '20px' }}
              >
                {mavenList.map(item => {
                  const { is_default = false, name } = item;
                  return (
                    <Option key={name}>
                      {is_default ? `默认(${name})` : name}
                    </Option>
                  );
                })}
              </Select>
            )}
            <Button onClick={this.handleMavenConfiguration} type="primary">
              {formatMessage({ id: 'componentOverview.body.JavaMavenConfig.Administration' })}
            </Button>
          </Form.Item>
        )}
        {isMaven && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.JavaMavenConfig.Build_command' }),
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.maven_build_cmd_tip' })
            )}
          >
            {getFieldDecorator('BP_MAVEN_BUILD_ARGUMENTS', {
              initialValue: firstNonEmptyEnv(envs, ['BP_MAVEN_BUILD_ARGUMENTS', 'BUILD_MAVEN_CUSTOM_GOALS']) || 'clean package',
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'componentOverview.body.JavaMavenConfig.input_parameters' })
                }
              ]
            })(<Input placeholder={formatMessage({ id: 'componentOverview.body.JavaMavenConfig.input_parameters' })} />)}
          </Form.Item>
        )}
        {isMaven && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.JavaMavenConfig.parameter' }),
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.maven_extra_args_tip' })
            )}
          >
            {getFieldDecorator('BP_MAVEN_ADDITIONAL_BUILD_ARGUMENTS', {
              initialValue: firstNonEmptyEnv(envs, ['BP_MAVEN_ADDITIONAL_BUILD_ARGUMENTS', 'BUILD_MAVEN_CUSTOM_OPTS'])
            })(<Input placeholder={formatMessage({ id: 'componentOverview.body.JavaMavenConfig.parameters' })} />)}
          </Form.Item>
        )}
        {isMaven && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.JavaMavenConfig.configuration' }),
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.maven_java_opts_tip' })
            )}
          >
            {getFieldDecorator('BUILD_MAVEN_JAVA_OPTS', {
              initialValue: firstNonEmptyEnv(envs, ['BUILD_MAVEN_JAVA_OPTS'])
            })(<Input placeholder={formatMessage({ id: 'componentOverview.body.JavaMavenConfig.input_configuration' })} />)}
          </Form.Item>
        )}
        {isMaven && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.mvn_module' }),
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.maven_module_tip' })
            )}
          >
            {getFieldDecorator('BP_MAVEN_BUILT_MODULE', {
              initialValue: firstNonEmptyEnv(envs, ['BP_MAVEN_BUILT_MODULE', 'BUILD_MAVEN_BUILT_MODULE'])
            })(<Input placeholder="service-a" />)}
          </Form.Item>
        )}
        {isMaven && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.mvn_artifact' }),
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.maven_artifact_tip' })
            )}
          >
            {getFieldDecorator('BP_MAVEN_BUILT_ARTIFACT', {
              initialValue: firstNonEmptyEnv(envs, ['BP_MAVEN_BUILT_ARTIFACT', 'BUILD_MAVEN_BUILT_ARTIFACT'])
            })(<Input placeholder="service-a/target/app.jar" />)}
          </Form.Item>
        )}
        {isGradle && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.gradle_build_cmd' }),
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.gradle_build_cmd_tip' })
            )}
          >
            {getFieldDecorator('BP_GRADLE_BUILD_ARGUMENTS', {
              initialValue: firstNonEmptyEnv(envs, ['BP_GRADLE_BUILD_ARGUMENTS', 'BUILD_GRADLE_BUILD_ARGUMENTS']) || 'build -x test'
            })(<Input placeholder="build -x test" />)}
          </Form.Item>
        )}
        {isGradle && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.gradle_extra_args' }),
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.gradle_extra_args_tip' })
            )}
          >
            {getFieldDecorator('BP_GRADLE_ADDITIONAL_BUILD_ARGUMENTS', {
              initialValue: firstNonEmptyEnv(envs, ['BP_GRADLE_ADDITIONAL_BUILD_ARGUMENTS', 'BUILD_GRADLE_ADDITIONAL_BUILD_ARGUMENTS'])
            })(<Input placeholder="--info --stacktrace" />)}
          </Form.Item>
        )}
        {isGradle && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.gradle_module' }),
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.gradle_module_tip' })
            )}
          >
            {getFieldDecorator('BP_GRADLE_BUILT_MODULE', {
              initialValue: firstNonEmptyEnv(envs, ['BP_GRADLE_BUILT_MODULE', 'BUILD_GRADLE_BUILT_MODULE'])
            })(<Input placeholder="service-a" />)}
          </Form.Item>
        )}
        {isGradle && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.gradle_artifact' }),
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.gradle_artifact_tip' })
            )}
          >
            {getFieldDecorator('BP_GRADLE_BUILT_ARTIFACT', {
              initialValue: firstNonEmptyEnv(envs, ['BP_GRADLE_BUILT_ARTIFACT', 'BUILD_GRADLE_BUILT_ARTIFACT'])
            })(<Input placeholder="service-a/build/libs/app.jar" />)}
          </Form.Item>
        )}
        {isJar && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.executable_jar' }),
              formatMessage({ id: 'componentOverview.body.JavaCNBConfig.executable_jar_tip' })
            )}
          >
            {getFieldDecorator('BP_EXECUTABLE_JAR_LOCATION', {
              initialValue: firstNonEmptyEnv(envs, ['BP_EXECUTABLE_JAR_LOCATION'])
            })(<Input placeholder="target/app.jar" />)}
          </Form.Item>
        )}
        <Form.Item {...formItemLayout} label={formatMessage({ id: 'componentOverview.body.JavaCNBConfig.start_mode' })}>
          <RadioGroup value={startMode} onChange={this.handleStartModeChange}>
            <Radio value="default">{formatMessage({ id: 'componentOverview.body.JavaCNBConfig.start_mode_default' })}</Radio>
            <Radio value="custom">{formatMessage({ id: 'componentOverview.body.JavaCNBConfig.start_mode_custom' })}</Radio>
          </RadioGroup>
        </Form.Item>
        {startMode === 'custom' && (
          <Form.Item
            {...formItemLayout}
            label={PROCFILE_LABEL}
          >
            {getFieldDecorator('BUILD_PROCFILE', {
              initialValue: envs.BUILD_PROCFILE || ''
            })(
              <Input placeholder={formatMessage({ id: 'componentOverview.body.JavaCNBConfig.start_command_placeholder' })} />
            )}
          </Form.Item>
        )}
      </div>
    );
  }
}

export default JavaCNBConfig;
