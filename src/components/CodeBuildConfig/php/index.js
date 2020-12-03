import React, { PureComponent } from 'react';
import { Form, Radio, Switch } from 'antd';
import { connect } from 'dva';
const RadioGroup = Radio.Group;

@connect(null, null, null, { withRef: true })
class Index extends PureComponent {
  render() {
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 4
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 20
        }
      }
    };
    const { envs } = this.props;
    const { getFieldDecorator } = this.props.form;
    return (
      <div>
        <Form.Item
          {...formItemLayout}
          label="禁用缓存"
          help="开启后下一次构建将移除所有缓存文件，包括编译工具和依赖库"
        >
          {getFieldDecorator('BUILD_NO_CACHE', {
            initialValue: envs && envs.BUILD_NO_CACHE ? true : false
          })(
            <Switch
              defaultChecked={envs && envs.BUILD_NO_CACHE ? true : false}
            />
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="Web服务器支持">
          {getFieldDecorator('BUILD_RUNTIMES_SERVER', {
            initialValue: (envs && envs.BUILD_RUNTIMES_SERVER) || 'apache'
          })(
            <RadioGroup>
              <Radio value="apache">apache(默认)</Radio>
              <Radio value="nginx">nginx</Radio>
            </RadioGroup>
          )}
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label="PHP版本"
          help="源码主目录composer.json文件中必须定义php版本"
        >
          {getFieldDecorator('BUILD_RUNTIMES', {
            initialValue: (envs && envs.BUILD_RUNTIMES) || ''
          })(
            <RadioGroup>
              <Radio value="5.6.35" selected="selected">
                5.6.35(默认)
              </Radio>
              <Radio value="5.5.38">5.5.38</Radio>
              <Radio value="7.0.29">7.0.29</Radio>
              <Radio value="7.1.27">7.1.27</Radio>
              <Radio value="7.2.16">7.2.16</Radio>
              <Radio value="7.3.13">7.3.13</Radio>
            </RadioGroup>
          )}
        </Form.Item>
      </div>
    );
  }
}

export default Index;
