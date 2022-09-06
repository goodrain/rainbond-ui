import React, { PureComponent } from "react";
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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
      <Modal  title={<FormattedMessage id="componentOverview.body.EditActions.edit"/>}visible onOk={this.handleSubmit} maskClosable={false} onCancel={this.onCancel}>
        <Form onSubmit={this.handleSubmit}>
          <FormItem label="">
            {getFieldDecorator("perm_ids", {
              initialValue: value,
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.EditActions.not_yet'})
                },
              ],
            })(<RolePermsSelect showGroupName={false} hides={[`${formatMessage({id:'componentOverview.body.EditActions.not_yet'})}`]} datas={actions} />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
