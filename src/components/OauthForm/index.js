import React, { PureComponent } from "react";
import { connect } from "dva";
import TenantSelect from "../../components/TenantSelect";
import { Form, Input, Select, Modal, Switch, Button } from "antd";
import App from "../../../public/images/app.svg";
import Branches from "../../../public/images/branches.svg";
import Application from "../../../public/images/application.svg";
import Component from "../../../public/images/component.svg";
import Unlock from "../../../public/images/unlock.svg";
import styles from "./Index.less";

const FormItem = Form.Item;
const Option = Select.Option;
const formItemLayoutOrder = {
  labelCol: {
    span: 18
  },
  wrapperCol: {
    span: 6
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
  handleSelect = selectedTeam => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/requestAuthority",
      payload: {
        selectedTeam
      },
      callback: data => {
        if (data) {
          this.setState({
            authorityList: data.list
          });
        }
      }
    });
  };
  checkAccount = (rule, value, callback) => {
    if (value.length < 8) {
      callback("密码长度至少为8位");
    } else {
      callback();
    }
  };
  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onOk && this.props.onOk(values);
      }
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const { onOk, onCancel } = this.props;
    const { authorityList } = this.state;
    const data = ["sdafasd"];
    const formItemLayout = {
      labelCol: {
        span: 6
      },
      wrapperCol: {
        span: 18
      }
    };
    return (
      <Modal
        visible={true}
        title="Oauth"
        onOk={this.handleSubmit}
        onCancel={onCancel}
        className={styles.thirdModal}
        footer={[
          <Button type="primary" onClick={this.handleSubmit}>
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
                名称&nbsp;:
              </div>
            }
          >
            {getFieldDecorator("name", {
              rules: [{ required: true, message: "请输入名称" }]
            })(<Input placeholder="请输入名称" />)}
          </Form.Item>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Component} alt="" />
                认证地址:&nbsp;:
              </div>
            }
          >
            {getFieldDecorator("endpoint", {
              initialValue: "",
              rules: [{ required: true, message: "请输入认证地址" }]
            })(<Input placeholder="请输入认证地址" />)}
          </Form.Item>

          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Branches} alt="" />
                client_id&nbsp;:
              </div>
            }
          >
            {getFieldDecorator("client_id", {
              initialValue: "master",
              rules: [{ required: true, message: "请输入client_id" }]
            })(<Input placeholder="请输入client_id" />)}
          </Form.Item>
          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Branches} alt="" />
                client_secret&nbsp;:
              </div>
            }
          >
            {getFieldDecorator("client_secret", {
              initialValue: "master",
              rules: [{ required: true, message: "请输入client_secret" }]
            })(<Input placeholder="请输入client_secret" />)}
          </Form.Item>

          <Form.Item
            className={styles.clearConform}
            {...formItemLayout}
            label={
              <div className={styles.clearConformMinTitle}>
                <img src={Application} alt="" />
                oauth_type&nbsp;:
              </div>
            }
          >
            {getFieldDecorator("oauth_type", {
              initialValue: "github",
              rules: [{ required: true, message: "请选择oauth_type类型" }]
            })(
              <Select placeholder="请选择要oauth_type类型">
                {["github", "gitlab", "gitte", "other"].map(item => (
                  <Option key={item} value={item}>
                    {item}
                  </Option>
                ))}
              </Select>
            )}
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
            {getFieldDecorator("is_auto_login", {
              valuePropName: "checked",
              initialValue: false,
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
