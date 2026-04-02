import React, { PureComponent } from 'react';
import { Form, Icon, Input, Radio, Switch, Tooltip } from 'antd';
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

const getPHPVersions = (policy = {}) => policy?.php?.php?.visible_versions || [];

const getPHPDefaultVersion = (policy = {}, currentValue = '') => {
  if (currentValue) {
    return currentValue;
  }
  return policy?.php?.php?.default_version || '';
};

class PHPCNBConfig extends PureComponent {
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
    const versions = getPHPVersions(cnbVersionPolicy);
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
            formatMessage({ id: 'componentOverview.body.PHPCNBConfig.version' }),
            formatMessage({ id: 'componentOverview.body.PHPCNBConfig.version_tip' })
          )}
        >
          {getFieldDecorator('BP_PHP_VERSION', {
            initialValue: getPHPDefaultVersion(
              cnbVersionPolicy,
              firstNonEmptyEnv(envs, ['BP_PHP_VERSION', 'BUILD_RUNTIMES', 'RUNTIMES'])
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
            formatMessage({ id: 'componentOverview.body.PHPCNBConfig.server' }),
            formatMessage({ id: 'componentOverview.body.PHPCNBConfig.server_tip' })
          )}
        >
          <span>nginx</span>
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.PHPCNBConfig.composer_install_options' }),
            formatMessage({ id: 'componentOverview.body.PHPCNBConfig.composer_install_options_tip' })
          )}
        >
          {getFieldDecorator('BP_COMPOSER_INSTALL_OPTIONS', {
            initialValue: firstNonEmptyEnv(envs, ['BP_COMPOSER_INSTALL_OPTIONS', 'BUILD_COMPOSER_INSTALL_OPTIONS'])
          })(<Input placeholder="--no-dev --optimize-autoloader" />)}
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.PHPCNBConfig.web_dir' }),
            formatMessage({ id: 'componentOverview.body.PHPCNBConfig.web_dir_tip' })
          )}
        >
          {getFieldDecorator('BP_PHP_WEB_DIR', {
            initialValue: firstNonEmptyEnv(envs, ['BP_PHP_WEB_DIR', 'BUILD_PHP_WEB_DIR'])
          })(<Input placeholder="public" />)}
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.PHPCNBConfig.start_mode' }),
            formatMessage({ id: 'componentOverview.body.PHPCNBConfig.start_mode_tip' })
          )}
        >
          {getFieldDecorator('PHP_START_MODE', {
            initialValue: startMode
          })(
            <RadioGroup onChange={this.handleStartModeChange}>
              <Radio value="default">{formatMessage({ id: 'componentOverview.body.PHPCNBConfig.start_mode_default' })}</Radio>
              <Radio value="custom">{formatMessage({ id: 'componentOverview.body.PHPCNBConfig.start_mode_custom' })}</Radio>
            </RadioGroup>
          )}
        </Form.Item>

        {startMode === 'custom' && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.PHPCNBConfig.start_command' }),
              formatMessage({ id: 'componentOverview.body.PHPCNBConfig.start_command_tip' })
            )}
          >
            {getFieldDecorator('BUILD_PROCFILE', {
              initialValue: envs.BUILD_PROCFILE || ''
            })(<Input placeholder={formatMessage({ id: 'componentOverview.body.PHPCNBConfig.start_command_placeholder' })} />)}
          </Form.Item>
        )}
      </div>
    );
  }
}

export default PHPCNBConfig;
