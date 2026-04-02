import React, { PureComponent } from 'react';
import { Form, Icon, Input, Radio, Switch, Tooltip } from 'antd';
import { formatMessage } from '@/utils/intl';

const RadioGroup = Radio.Group;
const DEFAULT_PYTHON_MIRROR_SOURCE = 'https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple';

const renderLabelWithTip = (label, tip) => (
  <span>
    {label}
    <Tooltip title={tip}>
      <Icon type="question-circle-o" style={{ marginLeft: 8, color: '#8d9bad' }} />
    </Tooltip>
  </span>
);

const getPythonVersions = (policy = {}) => policy?.python?.cpython?.visible_versions || [];

const getPythonDefaultVersion = (policy = {}, currentValue = '') => {
  if (currentValue) {
    return currentValue;
  }
  return policy?.python?.cpython?.default_version || '';
};

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

const getPackageManager = envs =>
  firstNonEmptyEnv(envs, ['BUILD_PYTHON_PACKAGE_MANAGER']) || 'pip';

class PythonCNBConfig extends PureComponent {
  render() {
    const formItemLayout = {
      labelCol: { xs: { span: 24 }, sm: { span: 4 } },
      wrapperCol: { xs: { span: 24 }, sm: { span: 20 } }
    };
    const { envs = {}, form, cnbVersionPolicy } = this.props;
    const { getFieldDecorator } = form;
    const versions = getPythonVersions(cnbVersionPolicy);
    const packageManager = getPackageManager(envs);

    return (
      <div>
        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.GoConfig.Disable' }),
            formatMessage({ id: 'componentOverview.body.PythonCNBConfig.disable_cache_tip' })
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
            formatMessage({ id: 'componentOverview.body.PythonConfig.Python' }),
            formatMessage({ id: 'componentOverview.body.PythonCNBConfig.python_version_tip' })
          )}
        >
          {getFieldDecorator('BP_CPYTHON_VERSION', {
            initialValue: getPythonDefaultVersion(
              cnbVersionPolicy,
              firstNonEmptyEnv(envs, ['BP_CPYTHON_VERSION', 'BUILD_RUNTIMES', 'RUNTIMES'])
            )
          })(
            <RadioGroup>
              {versions.map(item => (
                <Radio key={item} value={item}>{item}</Radio>
              ))}
            </RadioGroup>
          )}
        </Form.Item>

        {(packageManager === 'pip' || packageManager === 'pipenv') && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.PythonCNBConfig.mirror_source' }),
              formatMessage({ id: 'componentOverview.body.PythonCNBConfig.mirror_source_tip' })
            )}
          >
            {getFieldDecorator('PIP_INDEX_URL', {
              initialValue: firstNonEmptyEnv(envs, ['PIP_INDEX_URL', 'BUILD_PIP_INDEX_URL']) || DEFAULT_PYTHON_MIRROR_SOURCE
            })(<Input placeholder={DEFAULT_PYTHON_MIRROR_SOURCE} />)}
          </Form.Item>
        )}

        {(packageManager === 'pip' || packageManager === 'pipenv') && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.PythonCNBConfig.trusted_host' }),
              formatMessage({ id: 'componentOverview.body.PythonCNBConfig.trusted_host_tip' })
            )}
          >
            {getFieldDecorator('PIP_TRUSTED_HOST', {
              initialValue: firstNonEmptyEnv(envs, ['PIP_TRUSTED_HOST', 'BUILD_PIP_TRUSTED_HOST'])
            })(<Input placeholder="pypi.example.com" />)}
          </Form.Item>
        )}

        {packageManager === 'poetry' && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.PythonCNBConfig.poetry_source_name' }),
              formatMessage({ id: 'componentOverview.body.PythonCNBConfig.poetry_source_name_tip' })
            )}
          >
            {getFieldDecorator('BUILD_POETRY_SOURCE_NAME', {
              initialValue: firstNonEmptyEnv(envs, ['BUILD_POETRY_SOURCE_NAME']) || 'private'
            })(<Input placeholder="private" />)}
          </Form.Item>
        )}

        {packageManager === 'poetry' && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.PythonCNBConfig.poetry_source_url' }),
              formatMessage({ id: 'componentOverview.body.PythonCNBConfig.poetry_source_url_tip' })
            )}
          >
            {getFieldDecorator('BUILD_POETRY_SOURCE_URL', {
              initialValue: firstNonEmptyEnv(envs, ['BUILD_POETRY_SOURCE_URL'])
            })(<Input placeholder="https://pypi.example.com/simple" />)}
          </Form.Item>
        )}

        {packageManager === 'conda' && (
          <Form.Item
            {...formItemLayout}
            label={renderLabelWithTip(
              formatMessage({ id: 'componentOverview.body.PythonCNBConfig.conda_channel_url' }),
              formatMessage({ id: 'componentOverview.body.PythonCNBConfig.conda_channel_url_tip' })
            )}
          >
            {getFieldDecorator('BUILD_CONDA_CHANNEL_URL', {
              initialValue: firstNonEmptyEnv(envs, ['BUILD_CONDA_CHANNEL_URL'])
            })(<Input placeholder="https://repo.example.com/conda" />)}
          </Form.Item>
        )}

        <Form.Item
          {...formItemLayout}
          label={renderLabelWithTip(
            formatMessage({ id: 'componentOverview.body.PythonCNBConfig.start_command' }),
            formatMessage({ id: 'componentOverview.body.PythonCNBConfig.start_command_tip' })
          )}
        >
          {getFieldDecorator('BUILD_PROCFILE', {
            initialValue: firstNonEmptyEnv(envs, ['BUILD_PROCFILE'])
          })(<Input placeholder={formatMessage({ id: 'componentOverview.body.PythonCNBConfig.start_command_placeholder' })} />)}
        </Form.Item>
      </div>
    );
  }
}

export default PythonCNBConfig;
