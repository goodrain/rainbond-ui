import { Form, Icon, Input, Radio, Switch, Tooltip } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';

const RadioGroup = Radio.Group;

const renderLabelWithTip = (label, tip) => (
  <span>
    {label}
    <Tooltip title={tip}>
      <Icon type="question-circle-o" style={{ marginLeft: 8, color: '#8d9bad' }} />
    </Tooltip>
  </span>
);

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

const isTruthy = value =>
  value === true || value === 'true' || value === '1' || value === 1;

const getDotnetVersions = (policy = {}) => policy?.dotnet?.framework?.visible_versions || [];

const getDotnetDefaultVersion = (policy = {}, currentValue = '') => {
  if (currentValue) {
    return currentValue;
  }
  return policy?.dotnet?.framework?.default_version || '';
};

class DotnetCNBConfig extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      startMode: this.getStartMode(props.envs)
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.envs !== this.props.envs) {
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

  handleStartModeChange = e => {
    const mode = e.target.value;
    const { setFieldsValue } = this.props.form;
    this.setState({ startMode: mode });
    if (mode === 'default') {
      setFieldsValue({ BUILD_PROCFILE: '' });
    }
  };

  render() {
    const formItemLayout = {
      labelCol: { xs: { span: 24 }, sm: { span: 4 } },
      wrapperCol: { xs: { span: 24 }, sm: { span: 20 } }
    };
    const { envs = {}, form, cnbVersionPolicy } = this.props;
    const { getFieldDecorator } = form;
    const versions = getDotnetVersions(cnbVersionPolicy);
    const { startMode } = this.state;

    return (
      <div>
        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.GoConfig.Disable' }),
            formatMessage({ id: 'componentOverview.body.GoConfig.remove' })
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
            formatMessage({ id: 'componentOverview.body.DotNetCNBConfig.version' }),
            formatMessage({ id: 'componentOverview.body.DotNetCNBConfig.version_tip' })
          )}
        >
          {getFieldDecorator('BP_DOTNET_FRAMEWORK_VERSION', {
            initialValue: getDotnetDefaultVersion(
              cnbVersionPolicy,
              firstNonEmptyEnv(envs, ['BP_DOTNET_FRAMEWORK_VERSION'])
            )
          })(
            <RadioGroup>
              {versions.map(item => (
                <Radio key={item} value={item}>{item}</Radio>
              ))}
            </RadioGroup>
          )}
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.DotNetCNBConfig.project_path' }),
            formatMessage({ id: 'componentOverview.body.DotNetCNBConfig.project_path_tip' })
          )}
        >
          {getFieldDecorator('BP_DOTNET_PROJECT_PATH', {
            initialValue: firstNonEmptyEnv(envs, ['BP_DOTNET_PROJECT_PATH'])
          })(<Input placeholder="./src/WebApp" />)}
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.DotNetCNBConfig.publish_flags' }),
            formatMessage({ id: 'componentOverview.body.DotNetCNBConfig.publish_flags_tip' })
          )}
        >
          {getFieldDecorator('BP_DOTNET_PUBLISH_FLAGS', {
            initialValue: firstNonEmptyEnv(envs, ['BP_DOTNET_PUBLISH_FLAGS'])
          })(<Input placeholder="--verbosity=normal --self-contained=true" />)}
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.DotNetCNBConfig.nuget_config' }),
            formatMessage({ id: 'componentOverview.body.DotNetCNBConfig.nuget_config_tip' })
          )}
        >
          {getFieldDecorator('BUILD_NUGET_CONFIG_NAME', {
            initialValue: firstNonEmptyEnv(envs, ['BUILD_NUGET_CONFIG_NAME'])
          })(<Input placeholder="nuget-private" />)}
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.DotNetCNBConfig.start_mode' }),
            formatMessage({ id: 'componentOverview.body.DotNetCNBConfig.start_mode_tip' })
          )}
        >
          {getFieldDecorator('DOTNET_START_MODE', {
            initialValue: startMode
          })(
            <RadioGroup onChange={this.handleStartModeChange}>
              <Radio value="default">{formatMessage({ id: 'componentOverview.body.DotNetCNBConfig.start_mode_default' })}</Radio>
              <Radio value="custom">{formatMessage({ id: 'componentOverview.body.DotNetCNBConfig.start_mode_custom' })}</Radio>
            </RadioGroup>
          )}
        </Form.Item>

        {startMode === 'custom' && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.DotNetCNBConfig.start_command' }),
              formatMessage({ id: 'componentOverview.body.DotNetCNBConfig.start_command_tip' })
            )}
          >
            {getFieldDecorator('BUILD_PROCFILE', {
              initialValue: envs.BUILD_PROCFILE || ''
            })(<Input placeholder={formatMessage({ id: 'componentOverview.body.DotNetCNBConfig.start_command_placeholder' })} />)}
          </Form.Item>
        )}
      </div>
    );
  }
}

export default DotnetCNBConfig;
