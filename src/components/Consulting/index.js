import { Button, Form, Input, Modal, notification, Typography } from 'antd';
import axios from 'axios';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { Paragraph } = Typography;
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
                if (res.status === 200) {
                  this.setState({ loading: false });
                  notification.success({ message: '获取成功,稍后将与您联系' });
                  if (onOk) {
                    onOk();
                  }
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
        title="了解企业服务"
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
        <div style={{ background: 'rgba(22, 184, 248, 0.1)', padding: '16px' }}>
          <h3>获取企业版授权，获得以下能力：</h3>
          <Paragraph className={styles.describe}>
            <ul>
              <li>
                【授权】交付客户商业化场景的产品授权（开源版本进行商业交付违背开源协议）
              </li>
              <li>【功能】应用状态全局监控与报警。</li>
              <li>【功能】站内信支持。</li>
              <li>【功能】操作日志审计。</li>
              <li>【功能】集群监控可视化和报警。</li>
              <li>【服务】多种级别的售后支持服务可选。</li>
            </ul>
          </Paragraph>
        </div>
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
