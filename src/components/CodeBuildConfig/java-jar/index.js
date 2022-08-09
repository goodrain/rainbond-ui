import React, { PureComponent } from "react";
import { Form, Radio, Input } from "antd";
import { connect } from "dva";
import JavaJDK from "../java-jdk";
const RadioGroup = Radio.Group;

@connect(
  null,
  null,
  null,
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
        <JavaJDK form={this.props.form} envs={this.props.envs} />
        <Form.Item {...formItemLayout} label="启动命令">
          {getFieldDecorator("BUILD_PROCFILE", {
            initialValue: (envs && envs.BUILD_PROCFILE) || ""
          })(
            <Input placeholder="web: java $JAVA_OPTS -jar ./*.jar" />
          )}
        </Form.Item>
      </div>
    );
  }
}

export default Index;
