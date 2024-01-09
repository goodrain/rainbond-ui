import { Form, Input, Radio, Switch } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import GlobalUtils from '@/utils/global';


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
    const { envs, buildSourceArr } = this.props;
    const { getFieldDecorator } = this.props.form;
    return (
      <div>
        <Form.Item
          {...formItemLayout}
          label={<FormattedMessage id="componentOverview.body.GoConfig.Disable" />}
          help={<FormattedMessage id="componentOverview.body.GoConfig.remove" />}
        >
          {getFieldDecorator('BUILD_NO_CACHE', {
            initialValue: !!(envs && envs.BUILD_NO_CACHE),
          })(<Switch defaultChecked={!!(envs && envs.BUILD_NO_CACHE)} />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label={<FormattedMessage id="componentOverview.body.PythonConfig.Python" />}>
          {getFieldDecorator('BUILD_RUNTIMES', {
            initialValue: (envs && envs.BUILD_RUNTIMES) || globalUtil.getDefaultVsersion(buildSourceArr.golang || []),
          })(
            <RadioGroup>
              {buildSourceArr && buildSourceArr.python?.map((item, index) => {
                return (
                  <Radio key={index} value={item.version}>
                    {item.version}
                    {item.first_choice && <FormattedMessage id='componentOverview.body.GoConfig.default' />}
                  </Radio>
                );

              })}
              {/* <Radio value="python-3.9.16" selected="selected">python-3.9.16<FormattedMessage id='componentOverview.body.GoConfig.default'/></Radio>
              <Radio value="python-3.8.16">python-3.8.16</Radio>
              <Radio value="python-3.7.16">python-3.7.16</Radio>
              <Radio value="python-3.6.15">python-3.6.15</Radio>
              <Radio value="python-3.5.6">python-3.5.6</Radio>
              <Radio value="python-2.7.18">python-2.7.18</Radio> */}
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label={<FormattedMessage id="componentOverview.body.PythonConfig.Pypi" />} >
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
