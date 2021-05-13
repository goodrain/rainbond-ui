import { Form, Input, Modal, Select } from 'antd';
import React, { PureComponent } from 'react';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;

@Form.create()
export default class CloudBackupForm extends PureComponent {
  onOk = e => {
    e.preventDefault();
    const { onOk, form } = this.props;
    form.validateFields({ force: true }, (err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };
  render() {
    const {
      title,
      onCancel,
      data = {},
      form,
      providers,
      loading = false
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
        title={title}
        confirmLoading={loading}
        visible
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.onOk}
      >
        <Form onSubmit={this.onOk}>
          <FormItem {...formItemLayout} label="存储类型">
            {getFieldDecorator('provider', {
              initialValue: data.provider || '',
              rules: [
                {
                  required: true,
                  message: '不能为空!'
                }
              ]
            })(
              <Select getPopupContainer={triggerNode => triggerNode.parentNode}>
                {providers.map(item => {
                  return (
                    <Option key={item.key} value={item.key}>
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
            )}
          </FormItem>

          <Form.Item {...formItemLayout} label="endpoint">
            {getFieldDecorator('endpoint', {
              initialValue: data.endpoint || '',
              rules: [
                {
                  required: true,
                  message: '请输入endpoint'
                }
              ]
            })(<Input placeholder="请输入endpoint" />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label="bucket_name">
            {getFieldDecorator('bucket_name', {
              initialValue: data.bucket_name || '',
              rules: [
                {
                  required: true,
                  message: '请输入bucket_name'
                }
              ]
            })(<Input placeholder="请输入bucket_name" />)}
          </Form.Item>

          <Form.Item {...formItemLayout} name="access_key" label="Access Key">
            {getFieldDecorator('access_key', {
              initialValue: data.access_key || '',
              rules: [
                {
                  required: true,
                  message: '请提供具有足够权限的Access Key'
                }
              ]
            })(<Input placeholder="Access Key" />)}
          </Form.Item>
          <Form.Item {...formItemLayout} name="secret_key" label="Secret Key">
            {getFieldDecorator('secret_key', {
              initialValue: data.secret_key || '',
              rules: [
                {
                  required: true,
                  message: '请提供具有足够权限的Secret Key'
                }
              ]
            })(<Input type="password" placeholder="Secret Key" />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
