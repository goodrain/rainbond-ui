import React, { PureComponent } from "react";
import { connect } from "dva";
import { Form, Input, Select, Modal, Switch, Button } from "antd";
import App from "../../../public/images/app.svg";
import Branches from "../../../public/images/branches.svg";
import Application from "../../../public/images/application.svg";
import Component from "../../../public/images/component.svg";
import styles from "./Index.less";

const FormItem = Form.Item;
const Option = Select.Option;
const formItemLayoutOrder = {
  labelCol: {
    span: 8
  },
  wrapperCol: {
    span: 16
  }
};

@connect(({}) => ({}))
class CreateUserForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      authorityList: [],
      tenant_name: ""
    };
  }
  /**
   * 表单
   */
  handleChange = tenant_name => {
    this.setState({ tenant_name });
  };
  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onOk && this.props.onOk(values);
      }
    });
  };
  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { onCancel, loading, oauthInfo } = this.props;
    const formItemLayout = {
      labelCol: {
        span: 8
      },
      wrapperCol: {
        span: 16
      }
    };
    const oauthType = getFieldValue("oauth_type") || "Github";
    console.log("oauthInfo", oauthInfo);
    return (
      <Modal
        visible={true}
        title="Oauth"
        onOk={this.handleSubmit}
        onCancel={onCancel}
        className={styles.thirdModal}
        footer={[
          <Button type="primary" loading={loading} onClick={this.handleSubmit}>
            确定
          </Button>
        ]}
      >
        <Form layout="horizontal" hideRequiredMark onSubmit={this.handleSubmit}>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Application} alt="" />
                OAuth类型&nbsp;:
              </div>
            }
          >
            {getFieldDecorator("oauth_type", {
              initialValue: oauthInfo
                ? oauthInfo.oauth_type.charAt(0).toUpperCase() +
                  oauthInfo.oauth_type.slice(1)
                : "Github",
              rules: [{ required: true, message: "请选择oauth_type类型" }]
            })(
              <Select placeholder="请选择要oauth_type类型">
                {["Github", "Gitlab", "Gitee", "Other"].map(item => (
                  <Option key={item} value={item}>
                    {item}
                  </Option>
                ))}
              </Select>
            )}
          </Form.Item>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Application} alt="" />
                名称&nbsp;:
              </div>
            }
          >
            {getFieldDecorator("name", {
              initialValue: oauthInfo ? oauthInfo.name : "",
              rules: [{ required: true, message: "请输入名称" }]
            })(<Input placeholder="请输入名称" />)}
            <div className={styles.conformDesc}>OAuth服务名称</div>
          </Form.Item>

          {oauthType === "Other" && (
            <Form.Item
              className={styles.clearConform}
              {...formItemLayout}
              label={
                <div className={styles.clearConformMinTitle}>
                  <img src={Component} alt="" />
                  认证地址&nbsp;:
                </div>
              }
            >
              {getFieldDecorator("auth_url", {
                initialValue: oauthInfo ? oauthInfo.auth_url : "",
                rules: [{ required: true, message: "请输入认证地址" }]
              })(<Input placeholder="请输入认证地址" />)}
              <div className={styles.conformDesc}>第三方平台认证路由</div>
            </Form.Item>
          )}
          {oauthType === "Other" && (
            <Form.Item
              className={styles.clearConform}
              {...formItemLayout}
              label={
                <div className={styles.clearConformMinTitle}>
                  <img src={Component} alt="" />
                  获取令牌地址&nbsp;:
                </div>
              }
            >
              {getFieldDecorator("access_token_url", {
                initialValue: oauthInfo ? oauthInfo.access_token_url : "",
                rules: [{ required: true, message: "请输入access_token_url" }]
              })(<Input placeholder="请输入access_token_url" />)}
              <div className={styles.conformDesc}>获取第三方用户的地址</div>
            </Form.Item>
          )}

          {oauthType === "Other" && (
            <Form.Item
              className={styles.clearConform}
              {...formItemLayout}
              label={
                <div className={styles.clearConformMinTitle}>
                  <img src={Component} alt="" />
                  API地址&nbsp;:
                </div>
              }
            >
              {getFieldDecorator("api_url", {
                initialValue: oauthInfo ? oauthInfo.api_url : "",
                rules: [{ required: true, message: "请输入api_url" }]
              })(<Input placeholder="请输入api_url" />)}
              <div className={styles.conformDesc}>获取用户信息的API地址</div>
            </Form.Item>
          )}

          {oauthType !== "Github" && oauthType !== "Other" && (
            <Form.Item
              className={styles.clearConform}
              {...formItemLayout}
              label={
                <div className={styles.clearConformMinTitle}>
                  <img src={Branches} alt="" />
                  服务地址&nbsp;:
                </div>
              }
            >
              {getFieldDecorator("home_url", {
                initialValue: oauthInfo ? oauthInfo.home_url : "",
                rules: [{ required: true, message: "请输入服务地址" }]
              })(<Input placeholder="请输入服务地址" />)}
              <div className={styles.conformDesc}>服务地址</div>
            </Form.Item>
          )}

          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Branches} alt="" />
                客户端ID&nbsp;:
              </div>
            }
          >
            {getFieldDecorator("client_id", {
              initialValue: oauthInfo ? oauthInfo.client_id : "",
              rules: [{ required: true, message: "请输入client_id" }]
            })(<Input placeholder="请输入client_id" />)}
            <div className={styles.conformDesc}>Client ID</div>
          </Form.Item>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Branches} alt="" />
                客户端密钥&nbsp;:
              </div>
            }
          >
            {getFieldDecorator("client_secret", {
              initialValue: oauthInfo ? oauthInfo.client_secret : "",
              rules: [{ required: true, message: "请输入client_secret" }]
            })(<Input placeholder="请输入client_secret" />)}
            <div className={styles.conformDesc}>Client Secret</div>
          </Form.Item>

          <Form.Item
            className={styles.clearConform}
            {...formItemLayoutOrder}
            label={
              <div className={styles.clearConformMinTitle}>
                是否打开自动登录:
              </div>
            }
          >
            <span
              className={styles.conformDesc}
              style={{ marginRight: "30px", fontSize: "12px" }}
            >
              打开自动登录后将自动跳转至第三方认证平台
            </span>

            {getFieldDecorator("is_auto_login", {
              valuePropName: "checked",
              initialValue:
                oauthInfo && oauthInfo.is_auto_login
                  ? oauthInfo.is_auto_login
                  : false,
              rules: [{ required: true, message: "是否打开自动登录" }]
            })(<Switch />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
const creatOauth = Form.create()(CreateUserForm);
export default creatOauth;
