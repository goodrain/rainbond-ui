/* eslint-disable react/prefer-stateless-function */
import { Card, Form, Input, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';

const { Option } = Select;
@Form.create()
@connect()
class Index extends PureComponent {
  handleOptionChange = e => {
    console.log(e, 'e');
  };
  render() {
    const {
      form: { getFieldDecorator }
    } = this.props;
    const formItemLayout = {
      labelCol: {
        xs: { span: 3 },
        sm: { span: 3 }
      },
      wrapperCol: {
        xs: { span: 5 },
        sm: { span: 5 }
      }
    };
    return (
      <div style={{ marginBottom: '24px' }}>
        <Card title="任务运行策略">
          <Form {...formItemLayout} onSubmit={this.handleSubmit}>
            <Form.Item label="运行规则">
              {getFieldDecorator('run', {
                rules: [
                  {
                    required: true,
                    message: '不能为空'
                  }
                ]
              })(
                <Select onChange={this.handleOptionChange}>
                  <Option value="rmb">RMB</Option>
                  <Option value="dollar">Dollar</Option>
                </Select>
              )}
            </Form.Item>
            <Form.Item label="最大重试次数">
              {getFieldDecorator('zuida', {
                rules: [
                  {
                    required: true,
                    message: '不能为空'
                  }
                ]
              })(<Input placeholder="请输入" />)}
            </Form.Item>
            <Form.Item label="并行任务数">
              {getFieldDecorator('bingxing', {
                rules: [
                  {
                    required: true,
                    message: '不能为空'
                  }
                ]
              })(<Input placeholder="请输入" />)}
            </Form.Item>
            <Form.Item label="最大运行时间">
              {getFieldDecorator('max_timer', {
                rules: [
                  {
                    required: true,
                    message: '不能为空'
                  }
                ]
              })(<Input placeholder="请输入" />)}
            </Form.Item>
            <Form.Item label="完成数">
              {getFieldDecorator('complete_count', {
                rules: [
                  {
                    required: true,
                    message: '不能为空'
                  }
                ]
              })(<Input placeholder="请输入" />)}
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }
}

export default Index;
