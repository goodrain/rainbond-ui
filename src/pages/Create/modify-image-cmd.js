import { Form, Input, Modal } from 'antd';
import React, { PureComponent } from 'react';

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
        title="修改信息"
        onOk={this.handleSubmit}
        onCancel={this.props.onCancel}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
          <Form.Item {...formItemLayout} label="应用名称">
            {getFieldDecorator('service_cname', {
              initialValue: data.service_cname || '',
              rules: [
                {
                  required: true,
                  message: '要创建的应用还没有名字'
                }
              ]
            })(<Input disabled placeholder="请为创建的应用起个名字吧" />)}
          </Form.Item>

          <Form.Item {...formItemLayout} label="命令">
            {getFieldDecorator('docker_cmd', {
              initialValue: data.docker_cmd || '',
              rules: [
                {
                  required: true,
                  message: '请输入DockerRun命令'
                }
              ]
            })(
              <TextArea placeholder="例如： docker run -d -p 8080:8080 -e PWD=1qa2ws --name=tomcat_demo tomcat" />
            )}
          </Form.Item>
          <Form.Item {...formItemLayout} label="仓库用户名">
            {getFieldDecorator('username', {
              initialValue: data.user_name || '',
              rules: [{ required: false, message: '请输入仓库用户名' }]
            })(<Input placeholder="请输入仓库用户名" />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label="仓库密码">
            {getFieldDecorator('password', {
              initialValue: data.password || '',
              rules: [{ required: false, message: '请输入仓库密码' }]
            })(<Input type="password" placeholder="请输入仓库密码" />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
