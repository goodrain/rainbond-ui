import { Form, Input, Modal } from 'antd';
import React, { PureComponent } from 'react';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;

@Form.create()
class ChangePassword extends PureComponent {
  handleSubmit = () => {
    const { form, onOk } = this.props;
    form.validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };

  checkPassword = (rule, value, callback) => {
    const { form } = this.props;
    if (value && value.length < 8) {
      callback('密码长度至少为8位');
    } else if (value && value.length > 16) {
      callback('最大长度16位');
    } else if (
      rule &&
      rule.field === 'new_password2' &&
      value &&
      value !== form.getFieldValue('new_password')
    ) {
      callback('两次输入的密码不匹配!');
    } else {
      callback();
    }
  };
  render() {
    const { onCancel, form } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 6
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 14
        }
      }
    };
    const checks = message => {
      return [
        {
          required: true,
          message
        },
        {
          validator: this.checkPassword
        }
      ];
    };
    return (
      <Modal
        title="修改密码"
        className={styles.TelescopicModal}
        visible
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="旧密码">
            {getFieldDecorator('password', {
              rules: checks('请输入旧密码')
            })(<Input type="password" placeholder="请输入旧密码" />)}
          </FormItem>

          <FormItem {...formItemLayout} label="新密码">
            {getFieldDecorator('new_password', {
              rules: checks('请输入您的新密码')
            })(<Input type="password" placeholder="请输入新密码" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="确认新密码">
            {getFieldDecorator('new_password2', {
              rules: checks('请确认新密码')
            })(<Input type="password" placeholder="请确认新密码" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default ChangePassword;
