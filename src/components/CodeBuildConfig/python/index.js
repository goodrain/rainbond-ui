import { Form, Input, Radio, Switch } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';

const RadioGroup = Radio.Group;

@connect(
  null,
  null,
  null,
  { withRef: true }
)
class Index extends PureComponent {
  render() {
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 4,
        },
      },
      wrapperCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 20,
        },
      },
    };
    const { envs } = this.props;
    const { getFieldDecorator } = this.props.form;
    return (
      <div>
        <Form.Item
          {...formItemLayout}
          label={<FormattedMessage id="componentOverview.body.GoConfig.Disable"/>}
          help={<FormattedMessage id="componentOverview.body.GoConfig.remove"/>}
        >
          {getFieldDecorator('BUILD_NO_CACHE', {
            initialValue: !!(envs && envs.BUILD_NO_CACHE),
          })(<Switch defaultChecked={!!(envs && envs.BUILD_NO_CACHE)} />)}
        </Form.Item>
        <Form.Item {...formItemLayout}   label={<FormattedMessage id="componentOverview.body.PythonConfig.Python"/>}>
          {getFieldDecorator('BUILD_RUNTIMES', {
            initialValue: (envs && envs.BUILD_RUNTIMES) || 'python-3.6.6',
          })(
            <RadioGroup>
              <Radio value="python-3.6.6" selected="selected">
                python-3.6.6
              </Radio>
              <Radio value="python-3.6.10">python-3.6.10</Radio>
              <Radio value="python-3.5.7">python-3.5.7</Radio>
              <Radio value="python-3.4.9">python-3.4.9</Radio>
              <Radio value="python-2.7.9">python-2.7.9</Radio>
              <Radio value="python-2.7.17">python-2.7.17</Radio>
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout}   label={<FormattedMessage id="componentOverview.body.PythonConfig.Pypi"/>} >
          {getFieldDecorator('BUILD_PIP_INDEX_URL', {
            initialValue:
              (envs && envs.BUILD_PIP_INDEX_URL) ||
              'https://pypi.tuna.tsinghua.edu.cn/simple',
          })(<Input />)}
        </Form.Item>
      </div>
    );
  }
}

export default Index;
