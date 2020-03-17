import React, { PureComponent } from "react";
import { Form, Radio, Switch, Input } from "antd";
import { connect } from "dva";
const RadioGroup = Radio.Group;

@connect(null, null, null,
  { withRef: true }
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
          {getFieldDecorator("BUILD_NO_CACHE", {
            initialValue: envs && envs.BUILD_NO_CACHE ? true : false
          })(
            <Switch
              defaultChecked={envs && envs.BUILD_NO_CACHE ? true : false}
            />
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="编译环境版本">
          {getFieldDecorator("BUILD_DOTNET_SDK_VERSION", {
            initialValue:
              (envs && envs.BUILD_DOTNET_SDK_VERSION) ||
              "2.2-sdk-alpine"
          })(
            <RadioGroup>
              <Radio value="2.2-sdk-alpine" selected="selected">
                2.2-sdk-alpine(默认)
              </Radio>
              <Radio value="2.1-sdk-alpine">2.1-sdk-alpine</Radio>
            </RadioGroup>
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="运行环境版本">
          {getFieldDecorator("BUILD_DOTNET_RUNTIME_VERSION", {
            initialValue:
              (envs && envs.BUILD_DOTNET_RUNTIME_VERSION) ||
              "2.2-aspnetcore-runtime"
          })(
            <RadioGroup>
              <Radio value="2.2-aspnetcore-runtime" selected="selected">
                2.2-aspnetcore-runtime(默认)
              </Radio>
              <Radio value="2.1-aspnetcore-runtime">
                2.1-aspnetcore-runtime
              </Radio>
            </RadioGroup>
          )}
        </Form.Item>
      </div>
    );
  }
}

export default Index;
