import { Form, Input, Modal } from 'antd';
import React, { PureComponent } from 'react';

const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
  }
};

/* 修改镜像名称 */
@Form.create()
export default class ModifyImageName extends PureComponent {
  handleSubmit = e => {
    e.preventDefault();
    const { form } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onSubmit && this.props.onSubmit(fieldsValue);
    });
  };
  render() {
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
          <Form.Item {...formItemLayout} label="镜像地址">
            {getFieldDecorator('docker_cmd', {
              initialValue: data.docker_cmd || '',
              rules: [
                {
                  required: true,
                  message: '请输入镜像名称'
                }
              ]
            })(
              <Input
                // style={{
                //   width: "calc(100% - 100px)",
                // }}
                placeholder="请输入镜像名称, 如 nginx : 1.11"
              />
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
