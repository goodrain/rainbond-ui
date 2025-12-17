import { Form, Input, Modal } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
@Form.create()
export default class ModifyUrl extends PureComponent {
  constructor(props) {
    super(props);
  }
  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };
  render() {
    const formItemLayout = {
      labelCol: {
        span: 5
      },
      wrapperCol: {
        span: 19
      }
    };
    const { getFieldDecorator } = this.props.form;
    const { service_cname, isServiceCname=false } = this.props
    const data = this.props.data || {};
    const showUsernameAndPass = !!this.props.showUsernameAndPass;
    return (
      <Modal
        title={formatMessage({ id: 'componentCheck.modify_image_name.title' })}
        width={600}
        visible
        onOk={this.handleSubmit}
        onCancel={this.handleCancel}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
            <Form.Item
              {...formItemLayout}
              label={formatMessage({ id: 'componentCheck.modify_image_name.label.service_cname' })}
            >
              {getFieldDecorator('service_cname', {
                initialValue: (isServiceCname ? service_cname : data.service_cname) || '',
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'placeholder.app_not_name' })
                  }
                ]
              })(<Input disabled placeholder={formatMessage({ id: 'placeholder.image.service_cname' })} />)}
            </Form.Item>

          <Form.Item {...formItemLayout} label={formatMessage({ id: 'componentCheck.modify_image_name.label.git_url' })}>
            <Input.Group compact>
              {getFieldDecorator('git_url', {
                initialValue: data.git_url || '',
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'placeholder.git_url' })
                  },
                  {
                    pattern: /^(git@|ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/).+$/gi,
                    message: formatMessage({ id: 'placeholder.git_url.error' })
                  }
                ]
              })(
                <Input
                  placeholder={formatMessage({ id: 'placeholder.git_url' })}
                />
              )}
            </Input.Group>
          </Form.Item>
          <Form.Item
            style={{
              display: showUsernameAndPass ? '' : 'none'
            }}
            {...formItemLayout}
            label={formatMessage({ id: 'componentCheck.modify_image_name.label.username' })}
          >
            {getFieldDecorator('user_name', {
              initialValue: data.user_name || data.user || '',
              rules: [
                {
                  required: false,
                  message: formatMessage({ id: 'placeholder.user_name' })
                }
              ]
            })(<Input placeholder={formatMessage({ id: 'placeholder.user_name' })} />)}
          </Form.Item>
          <Form.Item
            style={{
              display: showUsernameAndPass ? '' : 'none'
            }}
            {...formItemLayout}
            label={formatMessage({ id: 'componentCheck.modify_image_name.label.password' })}
          >
            {getFieldDecorator('password', {
              initialValue: data.password || '',
              rules: [
                {
                  required: false,
                  message: formatMessage({ id: 'placeholder.password' })
                }
              ]
            })(<Input type="password" placeholder={formatMessage({ id: 'placeholder.password' })} />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
