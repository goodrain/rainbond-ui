import { Form, Input, Modal } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import cookie from '../../utils/cookie';
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
      callback(`${formatMessage({id:'otherEnterprise.ChangePassword.max'})}`);
    } else if (value && value.length > 16) {
      callback(`${formatMessage({id:'otherEnterprise.ChangePassword.maxLength'})}`);
    } else if (
      rule &&
      rule.field === 'new_password2' &&
      value &&
      value !== form.getFieldValue('new_password')
    ) {
      callback(`${formatMessage({id:'otherEnterprise.ChangePassword.Mismatch'})}`);
    } else {
      callback();
    }
  };
  render() {
    const { onCancel, form } = this.props;
    const { getFieldDecorator } = form;
    const language = cookie.get('language') === 'zh-CN' ? true : false
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
    const formItemLayouts = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 9
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
    const is_language = language ? formItemLayout : formItemLayouts;
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
        title={formatMessage({id:'otherEnterprise.ChangePassword.edit'})}
        className={styles.TelescopicModal}
        visible
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...is_language} label={formatMessage({id:'otherEnterprise.ChangePassword.old'})}>
            {getFieldDecorator('password', {
              rules: checks(`${formatMessage({id:'otherEnterprise.ChangePassword.input_password'})}`)
            })(<Input type="password" placeholder={formatMessage({id:'otherEnterprise.ChangePassword.input_password'})} />)}
          </FormItem>

          <FormItem {...is_language} label={formatMessage({id:'otherEnterprise.ChangePassword.new'})}>
            {getFieldDecorator('new_password', {
              rules: checks(`${formatMessage({id:'otherEnterprise.ChangePassword.input_new'})}`)
            })(<Input type="password" placeholder={formatMessage({id:'otherEnterprise.ChangePassword.input_new'})} />)}
          </FormItem>
          <FormItem {...is_language} label={formatMessage({id:'otherEnterprise.ChangePassword.confirm'})}>
            {getFieldDecorator('new_password2', {
              rules: checks(`${formatMessage({id:'otherEnterprise.ChangePassword.input_confirm'})}`)
            })(<Input type="password" placeholder={formatMessage({id:'otherEnterprise.ChangePassword.input_confirm'})} />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default ChangePassword;
