import { Form, Input, Modal } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
const { TextArea } = Input;

/* 修改镜像命令 修改DockerRun命令 */
@Form.create()
export default class ModifyImageCmd extends PureComponent {
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
    const data = this.props.data || {};
    return (
      <Modal
        visible
        title={formatMessage({id:'componentCheck.modify_image_name.title'})}
        onOk={this.handleSubmit}
        onCancel={this.props.onCancel}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label={formatMessage({id:'componentCheck.modify_image_name.label.service_cname'})}>
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'placeholder.app_not_name'})
                }
              ]
            })(<Input disabled placeholder={formatMessage({id:'placeholder.image.service_cname'})} />)}
          </Form.Item>

          <Form.Item {...formItemLayout} label={formatMessage({id:'componentCheck.modify_image_name.label.dockerRun'})}>
            {getFieldDecorator('docker_cmd', {
              initialValue: data.docker_cmd || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'placeholder.dockerRunMsg'})
                }
              ]
            })(
              <TextArea placeholder={formatMessage({id:'placeholder.dockerRun'})} />
            )}
          </Form.Item>
          <Form.Item {...formItemLayout} label={formatMessage({id:'componentCheck.modify_image_name.label.username'})}>
            {getFieldDecorator('username', {
              initialValue: data.user_name || '',
              rules: [{ required: false, message: formatMessage({id:'placeholder.user_name'}) }]
            })(<Input placeholder={formatMessage({id:'placeholder.user_name'})} />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label={formatMessage({id:'componentCheck.modify_image_name.label.password'})}>
            {getFieldDecorator('password', {
              initialValue: data.password || '',
              rules: [{ required: false, message: formatMessage({id:'placeholder.password'}) }]
            })(<Input type="password" placeholder={formatMessage({id:'placeholder.password'})} />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
