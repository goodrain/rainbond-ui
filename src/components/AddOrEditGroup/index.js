import React, { PureComponent } from 'react';
import { Form, Button, Input, Modal } from 'antd';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;

@Form.create()
export default class EditGroupName extends PureComponent {
  onOk = e => {
    e.preventDefault();
    const { form, onOk } = this.props;
    form.validateFields({ force: true }, (err, vals) => {
      if (!err && onOk) {
        onOk(vals);
      }
    });
  };
  render() {
    const {
      title,
      onCancel,
      form,
      group_name: groupName,
      group_note: groupNote
    } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    return (
      <Modal
        title={title || '新建应用'}
        visible
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.onOk}
      >
        <Form onSubmit={this.onOk}>
          <FormItem {...formItemLayout} label="应用名称">
            {getFieldDecorator('group_name', {
              initialValue: groupName || '',
              rules: [{ required: true, message: '请填写应用名称' }]
            })(<Input placeholder="请填写应用名称" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="应用备注">
            {getFieldDecorator('group_note', {
              initialValue: groupNote || ''
            })(<Input.TextArea placeholder="请填写应用备注信息" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
