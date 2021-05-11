import { Button, Form, Input, Modal, notification } from 'antd';
import axios from 'axios';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
@Form.create()
@connect()
export default class Consulting extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: false
    };
  }

  handleSubmit = () => {
    const { form, onOk } = this.props;
    const { validateFields } = form;
    validateFields((err, values) => {
      if (!err) {
        this.setState(
          {
            loading: true
          },
          () => {
            axios
              .post(
                `https://log.rainbond.com/visitors`,
                Object.assign(values, {
                  source: '开源Rainbond'
                })
              )
              .then(res => {
                if (res.status == 200) {
                  this.setState({ loading: false });
                  notification.success({ message: '获取成功,稍后将与您联系' });
                  onOk && onOk();
                }
              });
          }
        );
      }
    });
  };
  render() {
    const { onCancel, form, name } = this.props;
    const { getFieldDecorator } = form;
    const { loading } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 }
      }
    };

    return (
      <Modal
        title="获取商业解决方案"
        visible
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}> 取消 </Button>,
          <Button type="primary" loading={loading} onClick={this.handleSubmit}>
            申请
          </Button>
        ]}
      >
        <Form onSubmit={this.handleSubmit} layout="horizontal">
          <FormItem {...formItemLayout} label="姓名" hasFeedback>
            {getFieldDecorator('name', {
              rules: [
                {
                  required: true,
                  message: '请填写姓名'
                }
              ]
            })(<Input placeholder="请填写姓名" />)}
          </FormItem>

          <FormItem {...formItemLayout} label="手机号">
            {getFieldDecorator('phone', {
              rules: [
                { required: true, message: '请填写手机号!' },
                {
                  pattern: /^1\d{10}$/,
                  message: '手机号格式错误！'
                }
              ]
            })(<Input type="text" placeholder="请填写手机号!" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="公司名称" hasFeedback>
            {getFieldDecorator('enterpriseName', {
              initialValue: name || '',
              rules: [
                {
                  required: true,
                  message: '请填写公司名称'
                }
              ]
            })(<Input placeholder="请填写公司名称" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="职位" hasFeedback>
            {getFieldDecorator('position', {
              rules: [
                {
                  required: true,
                  message: '请填写职位'
                }
              ]
            })(<Input placeholder="请填写职位" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
