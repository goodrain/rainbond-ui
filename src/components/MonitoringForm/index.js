import { Form, Icon, Input, Modal } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import cookie from '../../utils/cookie';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;

@Form.create()
export default class MonitoringForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
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
    const { language } = this.state;
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
    const formItemLayouts = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    const is_language = language ? formItemLayout : formItemLayouts;
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
          <FormItem {...is_language} label='endpoint'>
            {getFieldDecorator('oss_endpoint', {
              initialValue: data?.oss_endpoint || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'placeholder.oauth.endpoint'})
                },
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.max255'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'placeholder.oauth.endpoint'})} />)}
          </FormItem>
          <FormItem {...is_language} label='bucket_name'>
            {getFieldDecorator('oss_bucket', {
              initialValue: data?.oss_bucket || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'placeholder.oauth.bucket_name'})
                },
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.max255'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'placeholder.oauth.bucket_name'})} />)}
          </FormItem>
          <FormItem {...is_language} label='Access Key'>
            {getFieldDecorator('oss_access_key', {
              initialValue: data?.oss_access_key || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'placeholder.oauth.access_key'})
                },
                {
                  max: 1024,
                  message: formatMessage({id:'placeholder.max1024'})
                }
              ]
            })(<Input placeholder="Access Key" />)}
          </FormItem>
          <FormItem {...is_language} label='Secret Key'>
            {getFieldDecorator('oss_access_key_secret', {
              initialValue: data?.oss_access_key_secret || '',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'placeholder.oauth.secret_key'})
                },
                {
                  max: 1024,
                  message: formatMessage({id:'placeholder.max1024'})
                }
              ]
            })(<Input type="password" placeholder="Secret Key" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
