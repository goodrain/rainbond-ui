import { Form, Input, Modal } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import cookie from '../../utils/cookie';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;

@Form.create()
export default class ImageHubForm extends PureComponent {
  constructor(props){
    super(props);
    this.state= {
      language: cookie.get('language') === 'zh-CN' ? true : false
    }
    
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
    const {language} = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 15 }
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
    const is_language = language ? formItemLayout : formItemLayouts
    return (
      <Modal
        title={'登录注册短信配置'}
        confirmLoading={loading}
        visible
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.onOk}
      >
        <Form onSubmit={this.onOk}>

          <Form.Item {...is_language} label={'AccessKey'}>
            {getFieldDecorator('access_key', {
              initialValue: data.access_key || '',
            })(<Input placeholder='请输入AccessKey'/>)}
          </Form.Item>
          <Form.Item {...is_language} label={'AccessKey'}>
            {getFieldDecorator('access_secret', {
              initialValue: data.access_secret || '',
            })(<Input placeholder='请输入AccessSecret'/>)}
          </Form.Item>
          <Form.Item {...is_language} label={'SignName'}>
            {getFieldDecorator('sign_name', {
              initialValue: data.sign_name || '',
            })(<Input placeholder='请输入SignName'/>)}
          </Form.Item>
          <Form.Item {...is_language} label={'TemplateCode'}>
            {getFieldDecorator('template_code', {
              initialValue: data.template_code || '',
            })(<Input placeholder='请输入TemplateCode'/>)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
