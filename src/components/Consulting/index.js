import { Button, Form, Input, Modal, notification, Typography } from 'antd';
import axios from 'axios';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
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
                  notification.success({ message: formatMessage({id:'notification.success.relation_successfully'}) });
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
        title={<FormattedMessage id='enterpriseOverview.overview.Consulting.understand'/>}
        visible
        className={styles.TelescopicModal}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}>  <FormattedMessage id='button.cancel'/></Button>,
          <Button type="primary" loading={loading} onClick={this.handleSubmit}>
            <FormattedMessage id='button.apply'/>
          </Button>
        ]}
      >
        <div style={{ background: 'rgba(22, 184, 248, 0.1)', padding: '16px' }}>
          <h3><FormattedMessage id='enterpriseOverview.overview.Consulting.ability'/></h3>
          <Paragraph className={styles.describe}>
            <ul>
              <li>
                <FormattedMessage id='enterpriseOverview.overview.Consulting.product'/>
              </li>
              <li><FormattedMessage id='enterpriseOverview.overview.Consulting.state'/></li>
              <li><FormattedMessage id='enterpriseOverview.overview.Consulting.support'/></li>
              <li><FormattedMessage id='enterpriseOverview.overview.Consulting.log'/></li>
              <li><FormattedMessage id='enterpriseOverview.overview.Consulting.monitor'/></li>
              <li><FormattedMessage id='enterpriseOverview.overview.Consulting.after'/></li>
            </ul>
          </Paragraph>
        </div>
        <Form onSubmit={this.handleSubmit} layout="horizontal">
          <FormItem {...formItemLayout}  label={<FormattedMessage id='enterpriseOverview.overview.Consulting.name'/>}hasFeedback>
            {getFieldDecorator('name', {
              rules: [
                {
                  required: true,
                  message:formatMessage({id:'enterpriseOverview.overview.Consulting.input_name'})
                }
              ]
            })(<Input  placeholder={formatMessage({id:'enterpriseOverview.overview.Consulting.input_name'})}/>)}
          </FormItem>

          <FormItem {...formItemLayout} label="iphone"label={<FormattedMessage id='enterpriseOverview.overview.Consulting.iphone'/>}>
            {getFieldDecorator('phone', {
              rules: [
                { required: true,  message:formatMessage({id:'enterpriseOverview.overview.Consulting.input_iphone'})},
                {
                  pattern: /^1\d{10}$/,
                  message:formatMessage({id:'enterpriseOverview.overview.Consulting.error'})
                }
              ]
            })(<Input type="text"  placeholder={formatMessage({id:'enterpriseOverview.overview.Consulting.input_iphone'})}/>)}
          </FormItem>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='enterpriseOverview.overview.Consulting.company'/>}hasFeedback>
            {getFieldDecorator('enterpriseName', {
              initialValue: name || '',
              rules: [
                {
                  required: true,
                  message:formatMessage({id:'enterpriseOverview.overview.Consulting.company_name'})
                }
              ]
            })(<Input  placeholder={formatMessage({id:'enterpriseOverview.overview.Consulting.company_name'})}/>)}
          </FormItem>
          <FormItem {...formItemLayout} label={<FormattedMessage id='enterpriseOverview.overview.Consulting.position'/>} hasFeedback>
            {getFieldDecorator('position', {
              rules: [
                {
                  required: true,
                  message:formatMessage({id:'enterpriseOverview.overview.Consulting.input_position'})
                }
              ]
            })(<Input  placeholder={formatMessage({id:'enterpriseOverview.overview.Consulting.input_position'})}/>)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
