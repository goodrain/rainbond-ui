import React, { PureComponent } from 'react';
import { Modal, Form } from 'antd';
import TeamPermissionSelect from '../../components/TeamPermissionSelect';

@Form.create()
export default class EditActions extends PureComponent {
  handleSubmit = (e) => {
    e.preventDefault();
    const { form } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit(fieldsValue);
    });
  };
  onCancel = () => {
    this.props.onCancel();
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const { actions, value } = this.props;

    return (
      <Modal title="编辑权限" visible onOk={this.handleSubmit} maskClosable={false} onCancel={this.onCancel}>
        <Form onSubmit={this.handleSubmit}>
          <FormItem label="">
            {getFieldDecorator('identity', {
              initialValue: value,
              rules: [
                {
                  required: true,
                  message: '不能为空!',
                },
              ],
            })(<TeamPermissionSelect options={actions} />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
