import React, { PureComponent } from "react";
import { Form, Radio, Switch, Input } from "antd";
import { connect } from "dva";
import JavaJDK from "../java-jdk";
const RadioGroup = Radio.Group;

@connect(null, null, null, 
  // { withRef: true }
  )
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
          span: 3
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 21
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
        <Form.Item {...formItemLayout} label="Python版本">
          {getFieldDecorator("BUILD_RUNTIMES", {
            initialValue: (envs && envs.BUILD_RUNTIMES) || "python-3.6.6"
          })(
            <RadioGroup>
              <Radio value="python-3.6.6" selected="selected">
                python-3.6.6
              </Radio>
              {/* new python version must rebuild while SSL support in ubuntu 14.04 */}
              {/* <Radio value="python-3.8.1">python-3.8.1</Radio>
              <Radio value="python-3.7.6">python-3.7.6</Radio>
              <Radio value="python-3.6.10">python-3.6.10</Radio> */}
              <Radio value="python-3.5.7">python-3.5.7</Radio>
              <Radio value="python-3.4.10">python-3.4.10</Radio>
              <Radio value="python-2.7.9">python-2.7.9</Radio>
              <Radio value="python-2.7.17">python-2.7.17</Radio>
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="Pypi源">
          {getFieldDecorator("BUILD_PIP_INDEX_URL", {
            initialValue:
              (envs && envs.BUILD_PIP_INDEX_URL) ||
              "https://pypi.tuna.tsinghua.edu.cn/simple"
          })(<Input />)}
        </Form.Item>

      </div>
    );
  }
}

export default Index;
