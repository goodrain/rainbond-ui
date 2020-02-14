import React, { PureComponent } from "react";
import { Form, Radio, Switch, Input } from "antd";
import { connect } from "dva";
const RadioGroup = Radio.Group;

@connect()
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
        JDKType:
        props.envs && props.envs.BUILD_RUNTIMES
          ? "OpenJDK"
          : props.envs && props.envs.BUILD_ENABLE_ORACLEJDK
          ? "Jdk"
          : props.form.getFieldValue("JDK_TYPE")
          ? props.form.getFieldValue("JDK_TYPE")
          : "OpenJDK",
    }
  }

  onRadioGroupChange = e => {
    this.setState({
      JDKType: e.target.value
    });
  };

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
    const { JDKType } = this.state
    return (
        <div>
        <Form.Item {...formItemLayout} label="禁用缓存" help="开启后下一次构建将移除所有缓存文件，包括编译工具和依赖库">
          {getFieldDecorator("BUILD_NO_CACHE", {
            initialValue: envs && envs.BUILD_NO_CACHE ? true : false
          })(<Switch defaultChecked={envs && envs.BUILD_NO_CACHE ? true : false} checkedChildren="开" unCheckedChildren="关" />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="JDK类型" help="默认提供OpenJDK,若需要其他JDK,请选用自定义JDK">
          {getFieldDecorator("JDK_TYPE", {
            initialValue:
              envs && envs.BUILD_RUNTIMES
                ? "OpenJDK"
                : envs && envs.BUILD_ENABLE_ORACLEJDK
                ? "Jdk"
                : "OpenJDK"
          })(
            <RadioGroup
              onChange={this.onRadioGroupChange}
            >
              <Radio value="OpenJDK">内置OpenJDK</Radio>
              <Radio value="Jdk">自定义JDK</Radio>
            </RadioGroup>
          )}
        </Form.Item>

        {JDKType == "OpenJDK" && (
          <Form.Item {...formItemLayout} label="OpenJDK版本">
            {getFieldDecorator("BUILD_RUNTIMES", {
              initialValue:
                (envs && envs.BUILD_RUNTIMES) || "1.8"
            })(
              <RadioGroup>
                <Radio value="1.8">1.8(默认)</Radio>
                <Radio value="1.6">1.6</Radio>
                <Radio value="1.7">1.7</Radio>
                <Radio value="1.9">1.9</Radio>
                <Radio value="10">10</Radio>
                <Radio value="11">11</Radio>
                <Radio value="12">12</Radio>
                <Radio value="13">13</Radio>
              </RadioGroup>
            )}
          </Form.Item>
        )}

        {JDKType == "Jdk" && (
          <Form.Item {...formItemLayout} label="自定义JDK下载路径">
            {getFieldDecorator("BUILD_ORACLEJDK_URL", {
              initialValue: envs && envs.BUILD_ORACLEJDK_URL,
              rules: [{ validator: this.validCustomJDK }]
            })(<Input placeholder="请提供自定义JDK的下载路径" />)}
          </Form.Item>
        )}
      </div>
    );
  }
}

export default Index;
