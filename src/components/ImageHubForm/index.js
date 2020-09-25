import { Form, Input, Modal } from 'antd';
import React, { PureComponent } from 'react';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;

@Form.create()
export default class ImageHubForm extends PureComponent {
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
    const { title, onCancel, data = {}, form, loading = false } = this.props;
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
          <Form.Item {...formItemLayout} label="仓库地址">
            <Input.Group compact>
              {getFieldDecorator('hub_url', {
                initialValue: data.hub_url || '',
                rules: [
                  {
                    required: true,
                    message: '请输入仓库地址'
                  }
                ]
              })(<Input placeholder="请输入仓库地址" />)}
            </Input.Group>
          </Form.Item>
          <Form.Item {...formItemLayout} label="命名空间">
            {getFieldDecorator('namespace', {
              initialValue: data.namespace || '',
              rules: [
                {
                  required: false,
                  message: '请输入命名空间'
                },
                {
                  pattern: /^[a-zA-Z][\da-zA-Z]*$/,
                  message: '只能是数字和字母 并且字母开头'
                }
              ]
            })(<Input placeholder="请输入命名空间" />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label="用户名">
            {getFieldDecorator('hub_user', {
              initialValue: data.hub_user || '',
              rules: [
                {
                  required: false,
                  message: '请输入用户名'
                }
              ]
            })(<Input placeholder="请输入用户名" />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label="密码">
            {getFieldDecorator('hub_password', {
              initialValue: data.hub_password || '',
              rules: [
                {
                  required: false,
                  message: '请输入密码'
                }
              ]
            })(<Input type="password" placeholder="请输入密码" />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
