import { Form, Input, Modal } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
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
          <Form.Item {...formItemLayout} label={formatMessage({id:'enterpriseSetting.basicsSetting.mirroring.form.label.hub_url'})}>
            <Input.Group compact>
              {getFieldDecorator('hub_url', {
                initialValue: data.hub_url || '',
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'placeholder.git_url'})
                  },
                  {
                    max: 255,
                    message: formatMessage({id:'placeholder.max255'})
                  }
                ]
              })(<Input placeholder={formatMessage({id:'placeholder.git_url'})} />)}
            </Input.Group>
          </Form.Item>
          <Form.Item {...formItemLayout} label={formatMessage({id:'enterpriseSetting.basicsSetting.mirroring.form.label.namespace'})}>
            {getFieldDecorator('namespace', {
              initialValue: data.namespace || '',
              rules: [
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.max255'})
                },
                {
                  pattern: /^[a-zA-Z][\da-zA-Z]*$/,
                  message: formatMessage({id:'placeholder.oauth.namespace.reg'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'placeholder.oauth.namespace'})} />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label={formatMessage({id:'enterpriseSetting.basicsSetting.mirroring.form.label.hub_user'})}>
            {getFieldDecorator('hub_user', {
              initialValue: data.hub_user || '',
              rules: [
                {
                  max: 64,
                  message: formatMessage({id:'placeholder.appShare.max64'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'placeholder.userName'})} />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label={formatMessage({id:'enterpriseSetting.basicsSetting.mirroring.form.label.hub_password'})}>
            {getFieldDecorator('hub_password', {
              initialValue: data.hub_password || '',
              rules: [
                {
                  max: 64,
                  message: formatMessage({id:'placeholder.appShare.max64'})
                }
              ]
            })(<Input type="password" placeholder={formatMessage({id:'placeholder.oauth.password'})} />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
