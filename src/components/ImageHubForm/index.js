import { Form, Input, Modal } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
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
        span: 24
      },
      wrapperCol: {
        span: 24
      }
    };
    const formItemLayouts = {
      labelCol: {
        span: 24
      },
      wrapperCol: {
        span: 24
      }
    };
    const is_language = language ? formItemLayout : formItemLayouts
    return (
      <Modal
        title={title}
        confirmLoading={loading}
        visible
        className={styles.TelescopicModal}
        bodyStyle={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onCancel={onCancel}
        onOk={this.onOk}
      >
        <Form onSubmit={this.onOk} layout="vertical" hideRequiredMark>

          <Form.Item {...is_language} label={formatMessage({id:'enterpriseSetting.basicsSetting.mirroring.form.label.hub_url'})}>
            <Input.Group compact>
              {getFieldDecorator('hub_url', {
                initialValue: data.hub_url || '',
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'placeholder.git_url'})
                  },
                  {
                    max: 255,
                    message: formatMessage({id:'placeholder.max255'})
                  },
                  {
                    validator: (_, value, callback) => {
                      if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
                        callback(formatMessage({ id: 'placeholder.warehouse_address.ban' })); // 显示错误消息
                      } else {
                        callback(); // 验证通过
                      }
                    }
                  }
                ]
              })(<Input placeholder={formatMessage({id:'placeholder.git_url_domain'})} />)}
            </Input.Group>
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({id:'enterpriseSetting.basicsSetting.mirroring.form.label.namespace'})}>
            {getFieldDecorator('namespace', {
              initialValue: data.namespace || '',
              rules: [
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.max255'})
                },
                {
                  pattern: /^[a-zA-Z][\da-zA-Z]*$/,
                  message: formatMessage({id:'placeholder.appShare.formatError'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'placeholder.oauth.namespace'})} />)}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({id:'enterpriseSetting.basicsSetting.mirroring.form.label.hub_user'})}>
            {getFieldDecorator('hub_user', {
              initialValue: data.hub_user || '',
              rules: [
                {
                  max: 64,
                  message: formatMessage({id:'placeholder.appShare.max64'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'placeholder.userName'})} />)}
          </Form.Item>
          <Form.Item {...is_language} label={formatMessage({id:'enterpriseSetting.basicsSetting.mirroring.form.label.hub_password'})}>
            {getFieldDecorator('hub_password', {
              initialValue: data.hub_password || '',
              rules: [
                {
                  max: 64,
                  message: formatMessage({id:'placeholder.appShare.max64'})
                }
              ]
            })(<Input type="password" placeholder={formatMessage({id:'placeholder.oauth.password'})} />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
