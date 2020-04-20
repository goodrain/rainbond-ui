import React, { PureComponent } from 'react';
import { Modal, Form, Input } from 'antd';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;

@Form.create()
class ChangePassword extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      actions: [],
      regions: [],
    };
  }
  componentDidMount() {}
  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onOk && this.props.onOk(values);
      }
    });
  };
  checkPassword = (rule, value, callback) => {
    const form = this.props.form;
    if (value && value !== form.getFieldValue('new_password')) {
      callback('二次密码输入不一致!');
    } else {
      callback();
    }
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const { onCancel } = this.props;

    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 6,
        },
      },
      wrapperCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 14,
        },
      },
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
          <FormItem {...formItemLayout} label="旧密码" hasFeedback>
            {getFieldDecorator('password', {
              rules: [
                {
                  required: true,
                  message: '请输入旧密码',
                },
              ],
            })(<Input type="password" placeholder="请输入旧密码" />)}
          </FormItem>

          <FormItem {...formItemLayout} label="新密码" hasFeedback>
            {getFieldDecorator('new_password', {
              rules: [
                {
                  required: true,
                  message: '请输入您的新密码',
                },
              ],
            })(<Input type="password" placeholder="请输入新密码" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="确认新密码" hasFeedback>
            {getFieldDecorator('new_password2', {
              rules: [
                {
                  required: true,
                  message: '请确认新密码',
                },
                {
                  validator: this.checkPassword,
                },
              ],
            })(<Input type="password" placeholder="请确认新密码" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default ChangePassword;
