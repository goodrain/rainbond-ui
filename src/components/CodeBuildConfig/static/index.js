import React, { PureComponent } from "react";
import { Form, Radio, Switch, Input } from "antd";
import { connect } from "dva";
import JavaJDK from "../java-jdk";
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
        <Form.Item {...formItemLayout} label="Web服务器">
          {getFieldDecorator("BUILD_RUNTIMES_SERVER", {
            initialValue: (envs && envs.BUILD_RUNTIMES_SERVER) || "nginx"
          })(
            <RadioGroup >
              <Radio value="nginx" selected="selected">
                nginx(默认)
              </Radio>
              <Radio value="apache">apache</Radio>
            </RadioGroup>
          )}
        </Form.Item>
      </div>
    );
  }
}

export default Index;
