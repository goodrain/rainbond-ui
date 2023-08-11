import React, { PureComponent } from "react";
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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

        <Form.Item
          {...formItemLayout}
          label={<FormattedMessage id="componentOverview.body.JavaMavenConfig.Web"/>}
          help={<FormattedMessage id="componentOverview.body.JavaMavenConfig.War"/>}

        >
          {getFieldDecorator("BUILD_RUNTIMES_SERVER", {
            initialValue: (envs && envs.BUILD_RUNTIMES_SERVER) || "tomcat85"
          })(
            <RadioGroup>
              <Radio value="tomcat85">tomcat85<FormattedMessage id='componentOverview.body.GoConfig.default'/></Radio>
              <Radio value="tomcat7">tomcat7</Radio>
              <Radio value="tomcat8">tomcat8</Radio>
              <Radio value="tomcat9">tomcat9</Radio>
              <Radio value="jetty7">jetty7</Radio>
              <Radio value="jetty9">jetty9</Radio>
            </RadioGroup>
          )}
        </Form.Item>

        <Form.Item {...formItemLayout} label={<FormattedMessage id="componentOverview.body.JavaMavenConfig.start"/>}>
          {getFieldDecorator("BUILD_PROCFILE", {
            initialValue: (envs && envs.BUILD_PROCFILE) || "web: java $JAVA_OPTS -jar ./webapp-runner.jar --port $PORT ./*.war"
          })(
            <Input placeholder="web: java $JAVA_OPTS -jar ./webapp-runner.jar --port $PORT ./*.war" />
          )}
        </Form.Item>
      </div>
    );
  }
}

export default Index;
