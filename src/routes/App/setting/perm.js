import React, { PureComponent } from "react";
import { Form, Modal } from "antd";
import RolePermsSelect from "../../../components/RolePermsSelect";

const FormItem = Form.Item;

@Form.create()
export default class EditActions extends PureComponent {
  onCancel = () => {
    this.props.onCancel();
  };
  handleSubmit = (e) => {
    e.preventDefault();
    const { form } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit(fieldsValue);
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const { actions, value } = this.props;

    return (
      <Modal title="编辑权限" visible onOk={this.handleSubmit} maskClosable={false} onCancel={this.onCancel}>
        <Form onSubmit={this.handleSubmit}>
          <FormItem label="">
            {getFieldDecorator("perm_ids", {
              initialValue: value,
              rules: [
                {
                  required: true,
                  message: "不能为空!",
                },
              ],
            })(<RolePermsSelect showGroupName={false} hides={["团队相关"]} datas={actions} />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
