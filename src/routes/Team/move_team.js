import React, { PureComponent } from 'react';

import { Modal, Form, Input } from 'antd';

const FormItem = Form.Item;
@Form.create()
export default class MoveTeam extends PureComponent {
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
    const initValue = this.props.teamAlias;
    return (
      <Modal title="修改团队名称" visible onOk={this.handleSubmit} onCancel={this.onCancel}>
        <Form onSubmit={this.handleSubmit}>
          <FormItem label="">
            {getFieldDecorator('new_team_alias', {
              initialValue: initValue || '',
              rules: [
                {
                  required: true,
                  message: '不能为空!',
                },
              ],
            })(<Input placeholder="请输入新的团队名称" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
