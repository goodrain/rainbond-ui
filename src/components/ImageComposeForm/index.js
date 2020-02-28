import React, { PureComponent, Fragment } from "react";
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
  Input,
  Modal
} from "antd";

import globalUtil from "../../utils/global";
import CodeMirror from "react-codemirror";
require("codemirror/mode/yaml/yaml");
require("codemirror/lib/codemirror.css");
require("../../styles/codemirror.less");

const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
  }
};

@connect(
  ({ user, global, loading }) => ({
    groups: global.groups,
    createAppByCompose: loading.effects["createApp/createAppByCompose"]
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showUsernameAndPass: false
    };
  }
  onAddGroup = () => {
    this.setState({ addGroup: true });
  };
  cancelAddGroup = () => {
    this.setState({ addGroup: false });
  };
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
    const showSubmitBtn =
      this.props.showSubmitBtn === void 0 ? true : this.props.showSubmitBtn;
    const { createAppByCompose } = this.props;
    var options = {
      lineNumbers: true,
      theme: "monokai",
      mode: "yaml"
    };

    return (
      <Fragment>
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label="应用名称">
            {getFieldDecorator("group_name", {
              initialValue: data.group_name || "",
              rules: [{ required: true, message: "应用名称" }]
            })(<Input style={{ maxWidth: 300 }} placeholder="应用名称" />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label="DockerCompose配置">
            {getFieldDecorator("yaml_content", {
              initialValue: data.yaml_content || "",
              rules: [
                { required: true, message: "请输入DockerCompose配置内容" }
              ]
            })(<CodeMirror options={options} placeholder="" />)}
          </Form.Item>

          <Form.Item {...formItemLayout} label="注意">
            Rainbond将解析DockerCompose配置中的组件相关属性用来便捷创建组件，其中的动态变量不支持解析赋值
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: 20 }}>
            这是一个私有仓库?{" "}
            <a
              onClick={() => {
                this.setState({ showUsernameAndPass: true });
              }}
              href="javascript:;"
            >
              填写仓库账号密码
            </a>
          </div>
          <Form.Item
            style={{ display: this.state.showUsernameAndPass ? "" : "none" }}
            {...formItemLayout}
            label="仓库用户名"
          >
            {getFieldDecorator("user_name", {
              initialValue: data.user_name || "",
              rules: [{ required: false, message: "请输入仓库用户名" }]
            })(<Input autoComplete="off" placeholder="请输入仓库用户名" />)}
          </Form.Item>
          <Form.Item
            style={{ display: this.state.showUsernameAndPass ? "" : "none" }}
            {...formItemLayout}
            label="仓库密码"
          >
            {getFieldDecorator("password", {
              initialValue: data.password || "",
              rules: [{ required: false, message: "请输入仓库密码" }]
            })(
              <Input
                autoComplete="new-password"
                type="password"
                placeholder="请输入仓库密码"
              />
            )}
          </Form.Item>
          {showSubmitBtn ? (
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
              <Button
                onClick={this.handleSubmit}
                type="primary"
                loading={createAppByCompose}
              >
                确认创建
              </Button>
            </Form.Item>
          ) : null}
        </Form>
      </Fragment>
    );
  }
}
