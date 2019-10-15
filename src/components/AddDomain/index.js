import React, { PureComponent } from "react";
import { Form, Select, Modal, Input, Alert } from "antd";
import { Link } from "dva/router";
import globalUtil from '../../utils/global';

const FormItem = Form.Item;
const Option = Select.Option;

@Form.create()
export default class AddDomain extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFields(
      {
        force: true,
      },
      (err, values) => {
        if (!err) {
          this.props.onOk && this.props.onOk(values);
        }
      },
    );
  };
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  checkKey = (rule, value, callback) => {
    const visitType = this.props.form.getFieldValue('protocol');
    if (visitType == 'http') {
      callback();
      return;
    }

    if (visitType != "http" && value) {
      callback();
      return;
    }

    callback("请选择证书!");
  };
  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 5,
        },
      },
      wrapperCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 16,
        },
      },
    };
    const protocol = getFieldValue("protocol") || "http";
    const certificates = this.props.certificates || [];

    return (
      <Modal title="绑定域名" onOk={this.handleSubmit} visible onCancel={this.handleCancel}>
        <Alert
          style={{ textAlign: "center", marginBottom: 16 }}
          message="请确保将域名cname指向到本组件的对外服务访问地址"
          type="warning"
        />
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="协议">
            {getFieldDecorator("protocol", {
              initialValue: "http",
              rules: [
                {
                  required: true,
                  message: "请添加端口",
                },
              ],
            })(<Select>
              <Option value="http">HTTP</Option>
              <Option value="https">HTTPS</Option>
              <Option value="httptohttps">HTTP转HTTPS</Option>
              <Option value="httpandhttps">HTTP与HTTPS共存</Option>
            </Select>)}
          </FormItem>
          <FormItem {...formItemLayout} label="域名">
            {getFieldDecorator("domain", {
              rules: [
                {
                  required: true,
                  message: "请添加域名",
                },
                {
                  pattern: /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                  message: "格式不正确",
                },
              ],
            })(<Input placeholder="请填写域名" />)}
          </FormItem>
          {protocol == "http" ? '' : <FormItem
            {...formItemLayout}
            label="选择证书"
          >
            {getFieldDecorator("certificate_id", {
              initialValue: "",
              rules: [
                { required: true },
                {
                  validator: this.checkKey,
                },
              ],
            })(<Select placeholder="请选择证书">
              <Option value="">请选择证书</Option>
              {certificates.map(item => <Option key={item.id} value={item.id}>{item.alias}</Option>)}
            </Select>)}
            <p>
              无可用证书？
              <a
                onClick={() => {
                  this.props.onCreateKey();
                }}
                href="javascript:;"
              >
                去新建
              </a>
            </p>
          </FormItem>}

          <div>
          如果需要设置更多路由策略参数 ：
          <Link to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/gateway/control/http/true`} style={{
                            wordBreak: "break-all",
                            wordWrap: "break-word",
                            color: "#1890ff"
                        }}>
                           点击进入访问策略设置
                        </Link>


          </div>
        </Form>
      </Modal>
    );
  }
}
