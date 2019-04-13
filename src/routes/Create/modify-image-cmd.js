import React, { PureComponent } from "react";
import { Modal, Form, Input } from "antd";

const { TextArea } = Input;

/* 修改镜像命令 */
@Form.create()
export default class ModifyImageCmd extends PureComponent {
  handleSubmit = (e) => {
    e.preventDefault();
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };
  render() {
    const formItemLayout = {
      labelCol: {
        span: 5,
      },
      wrapperCol: {
        span: 19,
      },
    };
    const { getFieldDecorator } = this.props.form;
    const data = this.props.data || {};
    return (
      <Modal
        visible
        title="修改DockerRun命令"
        onOk={this.handleSubmit}
        onCancel={this.props.onCancel}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label="命令">
            {getFieldDecorator("docker_cmd", {
              initialValue: data.docker_cmd || "",
              rules: [
                {
                  required: true,
                  message: "请输入DockerRun命令",
                },
              ],
            })(<TextArea placeholder="例如： docker run -d -p 8080:8080 -e PWD=1qa2ws --name=tomcat_demo tomcat" />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
