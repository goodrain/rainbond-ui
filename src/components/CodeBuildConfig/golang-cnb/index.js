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

const getGoVersions = (policy = {}) => policy?.golang?.go?.visible_versions || [];

const getGoDefaultVersion = (policy = {}, currentValue = '') => {
  if (currentValue) {
    return currentValue;
  }
  return policy?.golang?.go?.default_version || '';
};

class GolangCNBConfig extends PureComponent {
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
    const versions = getGoVersions(cnbVersionPolicy);
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
            formatMessage({ id: 'componentOverview.body.GoCNBConfig.version' }),
            formatMessage({ id: 'componentOverview.body.GoCNBConfig.version_tip' })
          )}
        >
          {getFieldDecorator('BP_GO_VERSION', {
            initialValue: getGoDefaultVersion(
              cnbVersionPolicy,
              firstNonEmptyEnv(envs, ['BP_GO_VERSION', 'BUILD_GOVERSION', 'GOVERSION'])
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
            formatMessage({ id: 'componentOverview.body.GoCNBConfig.goproxy' }),
            formatMessage({ id: 'componentOverview.body.GoCNBConfig.goproxy_tip' })
          )}
        >
          {getFieldDecorator('GOPROXY', {
            initialValue: firstNonEmptyEnv(envs, ['GOPROXY', 'BUILD_GOPROXY']) || 'https://goproxy.cn'
          })(<Input placeholder="https://goproxy.cn" />)}
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.GoCNBConfig.goprivate' }),
            formatMessage({ id: 'componentOverview.body.GoCNBConfig.goprivate_tip' })
          )}
        >
          {getFieldDecorator('GOPRIVATE', {
            initialValue: firstNonEmptyEnv(envs, ['GOPRIVATE', 'BUILD_GOPRIVATE'])
          })(<Input placeholder="github.com/acme/*" />)}
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.GoCNBConfig.targets' }),
            formatMessage({ id: 'componentOverview.body.GoCNBConfig.targets_tip' })
          )}
        >
          {getFieldDecorator('BP_GO_TARGETS', {
            initialValue: firstNonEmptyEnv(envs, ['BP_GO_TARGETS', 'BUILD_GO_INSTALL_PACKAGE_SPEC'])
          })(<Input placeholder="./cmd/api:./cmd/worker" />)}
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.GoCNBConfig.build_flags' }),
            formatMessage({ id: 'componentOverview.body.GoCNBConfig.build_flags_tip' })
          )}
        >
          {getFieldDecorator('BP_GO_BUILD_FLAGS', {
            initialValue: firstNonEmptyEnv(envs, ['BP_GO_BUILD_FLAGS', 'BUILD_GO_BUILD_FLAGS'])
          })(<Input placeholder="-buildmode=default -tags=paketo" />)}
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.GoCNBConfig.ldflags' }),
            formatMessage({ id: 'componentOverview.body.GoCNBConfig.ldflags_tip' })
          )}
        >
          {getFieldDecorator('BP_GO_BUILD_LDFLAGS', {
            initialValue: firstNonEmptyEnv(envs, ['BP_GO_BUILD_LDFLAGS', 'BUILD_GO_BUILD_LDFLAGS'])
          })(<Input placeholder="-s -w -X main.version=1.0.0" />)}
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.GoCNBConfig.start_mode' }),
            formatMessage({ id: 'componentOverview.body.GoCNBConfig.start_mode_tip' })
          )}
        >
          {getFieldDecorator('GO_START_MODE', {
            initialValue: startMode
          })(
            <RadioGroup onChange={this.handleStartModeChange}>
              <Radio value="default">{formatMessage({ id: 'componentOverview.body.GoCNBConfig.start_mode_default' })}</Radio>
              <Radio value="custom">{formatMessage({ id: 'componentOverview.body.GoCNBConfig.start_mode_custom' })}</Radio>
            </RadioGroup>
          )}
        </Form.Item>

        {startMode === 'custom' && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.GoCNBConfig.start_command' }),
              formatMessage({ id: 'componentOverview.body.GoCNBConfig.start_command_tip' })
            )}
          >
            {getFieldDecorator('BUILD_PROCFILE', {
              initialValue: envs.BUILD_PROCFILE || ''
            })(<Input placeholder={formatMessage({ id: 'componentOverview.body.GoCNBConfig.start_command_placeholder' })} />)}
          </Form.Item>
        )}
      </div>
    );
  }
}

export default GolangCNBConfig;
