import { Form, Input, Radio, Switch } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';

const RadioGroup = Radio.Group;

@connect(null, null, null, { withRef: true })
class Index extends PureComponent {
  constructor(props) {
    super(props);
  }

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
            initialValue: !!(envs && envs.BUILD_NO_CACHE)
          })(<Switch defaultChecked={!!(envs && envs.BUILD_NO_CACHE)} />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="Golang版本">
          {getFieldDecorator('BUILD_GOVERSION', {
            initialValue: (envs && envs.BUILD_GOVERSION) || 'go1.12'
          })(
            <RadioGroup>
              <Radio value="go1.16.2">go1.16</Radio>
              <Radio value="go1.15.10">go1.15</Radio>
              <Radio value="go1.14.15">go1.14</Radio>
              <Radio value="go1.13.15">go1.13</Radio>
              <Radio value="go1.12">go1.12(默认)</Radio>
              <Radio value="go1.11">go1.11</Radio>
              <Radio value="go1.10">go1.10</Radio>
              <Radio value="go1.9">go1.9</Radio>
              <Radio value="go1.8">go1.8</Radio>
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label="GOPROXY"
          help="仅在GoModules编译模式下生效"
        >
          {getFieldDecorator('BUILD_GOPROXY', {
            initialValue: (envs && envs.BUILD_GOPROXY) || 'https://goproxy.io',
            rules: [{ type: 'url', message: '输入数据不是合法的URL' }]
          })(<Input />)}
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label="构建模块"
          help="未指定情况下默认构建所有模块"
        >
          {getFieldDecorator('BUILD_GO_INSTALL_PACKAGE_SPEC', {
            initialValue: (envs && envs.BUILD_GO_INSTALL_PACKAGE_SPEC) || ''
          })(<Input placeholder="" />)}
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label="启动命令"
          help="构建的二进制都将置于bin目录下，启动命令示例: bin/xxx-server "
        >
          {getFieldDecorator('BUILD_PROCFILE', {
            initialValue: (envs && envs.BUILD_PROCFILE) || ''
          })(<Input placeholder="" />)}
        </Form.Item>
      </div>
    );
  }
}

export default Index;
