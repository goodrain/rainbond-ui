import React, { PureComponent } from "react";
import { Form, Radio, Switch, Input } from "antd";
import { connect } from "dva";
const RadioGroup = Radio.Group;

@connect()
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
        <Form.Item {...formItemLayout} label="禁用缓存" help="开启后下一次构建将移除所有缓存文件，包括编译工具和依赖库">
          {getFieldDecorator("BUILD_NO_CACHE", {
            initialValue: envs && envs.BUILD_NO_CACHE ? true : false
          })(<Switch defaultChecked={envs && envs.BUILD_NO_CACHE ? true : false} checkedChildren="开" unCheckedChildren="关" />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="Golang版本">
          {getFieldDecorator("BUILD_GOVERSION", {
            initialValue: (envs && envs.BUILD_GOVERSION) || "go1.12"
          })(
            <RadioGroup>
              <Radio value="go1.12">go1.12(默认)</Radio>
              <Radio value="go1.11">go1.11</Radio>
              <Radio value="go1.13">go1.13</Radio>
              <Radio value="go1.10">go1.10</Radio>
              <Radio value="go1.9">go1.9</Radio>
              <Radio value="go1.8">go1.8</Radio>
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="GOPROXY" help="仅在GoModules编译模式下生效">
          {getFieldDecorator("BUILD_GOPROXY", {
            initialValue: envs && envs.BUILD_GOPROXY || "https://goproxy.io",
            rules: [
                { type: "url", message: "输入数据不是合法的URL" }
            ]
          })(<Input />)}
        </Form.Item>
      </div>
    );
  }
}

export default Index;
