import { Form, Input, Modal } from 'antd';
import React, { PureComponent } from 'react';

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
    const data = this.props.data || {};
    const showUsernameAndPass = !!this.props.showUsernameAndPass;
    return (
      <Modal
        title="信息修改"
        width={600}
        visible
        onOk={this.handleSubmit}
        onCancel={this.handleCancel}
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
          <Form.Item {...formItemLayout} label="仓库地址">
            <Input.Group compact>
              {getFieldDecorator('git_url', {
                initialValue: data.git_url || '',
                rules: [
                  {
                    required: true,
                    message: '请输入仓库地址'
                  },
                  {
                    pattern: /^(git@|ssh:\/\/|svn:\/\/|http:\/\/|https:\/\/).+$/gi,
                    message: '仓库地址不正确'
                  }
                ]
              })(
                <Input
                  style={{
                    width: 'calc(100% - 100px)'
                  }}
                  placeholder="请输入仓库地址"
                />
              )}
            </Input.Group>
          </Form.Item>
          <Form.Item
            style={{
              display: showUsernameAndPass ? '' : 'none'
            }}
            {...formItemLayout}
            label="仓库用户名"
          >
            {getFieldDecorator('user_name', {
              initialValue: data.user_name || '',
              rules: [
                {
                  required: false,
                  message: '请输入仓库用户名'
                }
              ]
            })(<Input placeholder="请输入仓库用户名" />)}
          </Form.Item>
          <Form.Item
            style={{
              display: showUsernameAndPass ? '' : 'none'
            }}
            {...formItemLayout}
            label="仓库密码"
          >
            {getFieldDecorator('password', {
              initialValue: data.password || '',
              rules: [
                {
                  required: false,
                  message: '请输入仓库密码'
                }
              ]
            })(<Input type="password" placeholder="请输入仓库密码" />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
