import React, { PureComponent } from "react";
import { Form, Radio, Switch, Input } from "antd";
import { connect } from "dva";
import JavaJDK from "../java-jdk"
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

        <Form.Item {...formItemLayout} label="Maven版本">
          {getFieldDecorator("BUILD_RUNTIMES_MAVEN", {
            initialValue:
              (envs && envs.BUILD_RUNTIMES_MAVEN) || "3.3.1"
          })(
            <RadioGroup>
              <Radio value="3.3.1">3.3.1(默认)</Radio>
              <Radio value="3.0.5">3.0.5</Radio>
              <Radio value="3.1.1">3.1.1</Radio>
              <Radio value="3.2.5">3.2.5</Radio>
              <Radio value="3.3.9">3.3.9</Radio>
              <Radio value="3.5.4">3.5.4</Radio>
              <Radio value="3.6.2">3.6.2</Radio>
            </RadioGroup>
          )}
        </Form.Item>

        <Form.Item {...formItemLayout} label="Web服务器版本" help="仅适用于打包为War包的项目">
          {getFieldDecorator("BUILD_RUNTIMES_SERVER", {
            initialValue:
              (envs && envs.BUILD_RUNTIMES_SERVER) || "tomcat85"
          })(
            <RadioGroup>
              <Radio value="tomcat85">tomcat85(默认)</Radio>
              <Radio value="tomcat7">tomcat7</Radio>
              <Radio value="tomcat8">tomcat8</Radio>
              <Radio value="tomcat9">tomcat9</Radio>
              <Radio value="jetty7">jetty7</Radio>
              <Radio value="jetty9">jetty9</Radio>
            </RadioGroup>
          )}
        </Form.Item>

        <Form.Item {...formItemLayout} label="禁用Maven Mirror" help="禁用Mirror后不再使用goodrain.me内部maven仓库进行缓存镜像">
          {getFieldDecorator("BUILD_MAVEN_MIRROR_DISABLE", {
            initialValue: envs && envs.BUILD_MAVEN_MIRROR_DISABLE ? true : false
          })(
            <Switch defaultChecked={envs && envs.BUILD_MAVEN_MIRROR_DISABLE ? true : false} checkedChildren="开" unCheckedChildren="关" />
          )}
        </Form.Item>

        <Form.Item {...formItemLayout} label="MAVEN MIRROR OF配置">
          {getFieldDecorator("BUILD_MAVEN_MIRROR_OF", {
            initialValue:
              (envs && envs.BUILD_MAVEN_MIRROR_OF) || "central"
          })(<Input placeholder="" />)}
        </Form.Item>

        <Form.Item {...formItemLayout} label="MAVEN MIRROR_URL">
          {getFieldDecorator("BUILD_MAVEN_MIRROR_URL", {
            initialValue:
              (envs && envs.BUILD_MAVEN_MIRROR_URL) ||
              "maven.goodrain.me"
          })(<Input placeholder="" />)}
        </Form.Item>

        <Form.Item {...formItemLayout} label="Maven构建参数">
          {getFieldDecorator("BUILD_MAVEN_CUSTOM_OPTS", {
            initialValue:
              (envs && envs.BUILD_MAVEN_CUSTOM_OPTS) ||
              "-DskipTests"
          })(<Input placeholder="" />)}
        </Form.Item>

        <Form.Item {...formItemLayout} label="Maven构建命令">
          {getFieldDecorator("BUILD_MAVEN_CUSTOM_GOALS", {
            initialValue:
              (envs && envs.BUILD_MAVEN_CUSTOM_GOALS) ||
              "clean dependency:list install"
          })(<Input placeholder="" />)}
        </Form.Item>

        <Form.Item {...formItemLayout} label="MAVEN构建Java参数配置">
          {getFieldDecorator("BUILD_MAVEN_JAVA_OPTS", {
            initialValue:
              (envs && envs.BUILD_MAVEN_JAVA_OPTS) || "-Xmx1024m"
          })(<Input placeholder="" />)}
        </Form.Item>

        <Form.Item {...formItemLayout} label="启动命令">
          {getFieldDecorator("BUILD_PROCFILE", {
            initialValue: (envs && envs.BUILD_PROCFILE) || ""
          })(
            <Input placeholder="web: java $JAVA_OPTS -jar ./webapp-runner.jar --port $PORT ./*.war" />
          )}
        </Form.Item>
      </div>
    );
  }
}

export default Index;
