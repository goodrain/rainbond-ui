import React, { PureComponent } from "react";
import { Modal, Form, Input } from "antd";

const formItemLayout = {
  labelCol: {
    span: 5,
  },
  wrapperCol: {
    span: 19,
  },
};

/* 修改镜像名称 */
@Form.create()
export default class ModifyImageName extends PureComponent {
  handleSubmit = (e) => {
    e.preventDefault();
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const data = this.props.data || {};
    return (
      <Modal visible title="修改镜像名称" onOk={this.handleSubmit} onCancel={this.props.onCancel}>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label="镜像地址">
            {getFieldDecorator("docker_cmd", {
              initialValue: data.docker_cmd || "",
              rules: [
                {
                  required: true,
                  message: "请输入镜像名称",
                },
              ],
            })(<Input
              style={{
                  width: "calc(100% - 100px)",
                }}
              placeholder="请输入镜像名称, 如 nginx : 1.11"
            />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
