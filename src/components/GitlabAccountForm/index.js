import React, { PureComponent } from "react";
import { connect } from "dva";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Icon,
  Menu,
  Dropdown,
  notification,
  Select,
  Input
} from "antd";
import globalUtil from "../../utils/global";
const { Option } = Select;

@connect(({ loading }) => ({
  gitlabRegisterLoading: loading.effects["user/gitlabRegister"]
}))
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  handleSubmit = e => {
    e.preventDefault();
    const form = this.props.form;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };
  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const data = this.props.data || {};
    const { gitlabRegisterLoading } = this.props;
    const formItemLayout = {
      labelCol: {
        span: 5
      },
      wrapperCol: {
        span: 19
      }
    };
    return (
      <Form layout="horizontal" hideRequiredMark>
        <Form.Item {...formItemLayout} label="Gitlab密码">
          {getFieldDecorator("password", {
            initialValue: data.password || "",
            rules: [{ required: true, message: "请输入密码" }]
          })(<Input type="password" placeholder="同云帮登录密码" />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="邮箱">
          {getFieldDecorator("email", {
            initialValue: data.email || "",
            rules: [
              { required: true, type: "email", message: "邮箱格式不正确" }
            ]
          })(<Input readOnly={!!data.email} placeholder="请输入邮箱" />)}
        </Form.Item>
        <Form.Item
          wrapperCol={{
            xs: { span: 24, offset: 0 },
            sm: {
              span: formItemLayout.wrapperCol.span,
              offset: formItemLayout.labelCol.span
            }
          }}
          label=""
        >
          {this.props.handleType &&
          this.props.handleType === "Service" &&
          this.props.ButtonGroupState
            ? this.props.handleServiceBotton(
                <Button
                  onClick={this.handleSubmit}
                  type="primary"
                  loading={gitlabRegisterLoading}
                >
                  确认提交
                </Button>,
                false
              )
            : !this.props.handleType && (
                <Button
                  onClick={this.handleSubmit}
                  type="primary"
                  loading={gitlabRegisterLoading}
                >
                  确认提交
                </Button>
              )}
        </Form.Item>
      </Form>
    );
  }
}
