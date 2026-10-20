import { Form, Input, Modal, Select } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import cookie from '../../utils/cookie';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { Option } = Select;
const ALIYUN_ROLE_ARN_PATTERN = /^acs:ram::[0-9]+:role\/[A-Za-z0-9._-]+$/;
const VOLCANO_ROLE_TRN_PATTERN = /^trn:iam::[0-9]+:role\/[A-Za-z0-9._-]+$/;

@Form.create()
export default class SmsConfigForm extends PureComponent {
  constructor(props) {
    super(props);
    const { data = {} } = props;
    this.state = {
      language: cookie.get('language') === 'zh-CN',
      selectedProvider: data.provider || 'aliyun',
      selectedAuthType: data.auth_type || 'access_key'
    };
  }

  onOk = event => {
    event.preventDefault();
    const { onOk, form } = this.props;
    const { selectedProvider, selectedAuthType } = this.state;
    form.validateFields({ force: true }, (error, values) => {
      if (!error && onOk) {
        onOk({
          ...values,
          auth_type: selectedAuthType,
          role_arn:
            selectedProvider === 'aliyun' && selectedAuthType === 'role'
              ? values.role_arn
              : '',
          role_trn:
            selectedProvider === 'volcano' && selectedAuthType === 'role'
              ? values.role_trn
              : '',
          sms_account:
            selectedProvider === 'volcano' ? values.sms_account : ''
        });
      }
    });
  };

  handleProviderChange = selectedProvider => {
    this.setState({ selectedProvider });
  };

  handleAuthTypeChange = selectedAuthType => {
    this.setState({ selectedAuthType });
  };

  requiredRule = fieldId => ({
    required: true,
    whitespace: true,
    message: formatMessage(
      { id: 'enterpriseSetting.basicsSetting.smsConfig.required' },
      { field: formatMessage({ id: fieldId }) }
    )
  });

  render() {
    const { onCancel, data = {}, form, loading = false } = this.props;
    const { getFieldDecorator } = form;
    const { language, selectedProvider, selectedAuthType } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: language ? 6 : 8 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: language ? 15 : 16 }
      }
    };
    const fieldIdPrefix = 'enterpriseSetting.basicsSetting.smsConfig';

    return (
      <Modal
        title={formatMessage({ id: `${fieldIdPrefix}.title` })}
        confirmLoading={loading}
        visible
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.onOk}
        destroyOnClose
      >
        <Form onSubmit={this.onOk}>
          <FormItem {...formItemLayout} label={formatMessage({ id: `${fieldIdPrefix}.provider` })}>
            {getFieldDecorator('provider', {
              initialValue: selectedProvider,
              rules: [this.requiredRule(`${fieldIdPrefix}.provider`)]
            })(
              <Select onChange={this.handleProviderChange}>
                <Option value='aliyun'>{formatMessage({ id: `${fieldIdPrefix}.provider.aliyun` })}</Option>
                <Option value='volcano'>{formatMessage({ id: `${fieldIdPrefix}.provider.volcano` })}</Option>
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label={formatMessage({ id: `${fieldIdPrefix}.authType` })}>
            {getFieldDecorator('auth_type', {
              initialValue: selectedAuthType,
              rules: [this.requiredRule(`${fieldIdPrefix}.authType`)]
            })(
              <Select onChange={this.handleAuthTypeChange}>
                <Option value='access_key'>{formatMessage({ id: `${fieldIdPrefix}.authType.accessKey` })}</Option>
                <Option value='role'>{formatMessage({ id: `${fieldIdPrefix}.authType.role` })}</Option>
              </Select>
            )}
          </FormItem>
          {selectedProvider === 'volcano' && (
            <FormItem {...formItemLayout} label={formatMessage({ id: `${fieldIdPrefix}.smsAccount` })}>
              {getFieldDecorator('sms_account', {
                initialValue: data.sms_account || '',
                rules: [this.requiredRule(`${fieldIdPrefix}.smsAccount`)]
              })(<Input placeholder={formatMessage({ id: `${fieldIdPrefix}.smsAccount.placeholder` })} />)}
            </FormItem>
          )}
          <FormItem {...formItemLayout} label={formatMessage({ id: `${fieldIdPrefix}.accessKey` })}>
            {getFieldDecorator('access_key', {
              initialValue: data.access_key || '',
              rules: [this.requiredRule(`${fieldIdPrefix}.accessKey`)]
            })(<Input placeholder={formatMessage({ id: `${fieldIdPrefix}.accessKey.placeholder` })} />)}
          </FormItem>
          <FormItem {...formItemLayout} label={formatMessage({ id: `${fieldIdPrefix}.accessSecret` })}>
            {getFieldDecorator('access_secret', {
              initialValue: data.access_secret || '',
              rules: [this.requiredRule(`${fieldIdPrefix}.accessSecret`)]
            })(
              <Input.Password
                autoComplete='new-password'
                placeholder={formatMessage({ id: `${fieldIdPrefix}.accessSecret.placeholder` })}
              />
            )}
          </FormItem>
          {selectedProvider === 'aliyun' && selectedAuthType === 'role' && (
            <FormItem {...formItemLayout} label={formatMessage({ id: `${fieldIdPrefix}.roleArn` })}>
              {getFieldDecorator('role_arn', {
                initialValue: data.role_arn || '',
                rules: [
                  this.requiredRule(`${fieldIdPrefix}.roleArn`),
                  {
                    pattern: ALIYUN_ROLE_ARN_PATTERN,
                    message: formatMessage({ id: `${fieldIdPrefix}.roleArn.invalid` })
                  }
                ]
              })(<Input placeholder={formatMessage({ id: `${fieldIdPrefix}.roleArn.placeholder` })} />)}
            </FormItem>
          )}
          {selectedProvider === 'volcano' && selectedAuthType === 'role' && (
            <FormItem {...formItemLayout} label={formatMessage({ id: `${fieldIdPrefix}.roleTrn` })}>
              {getFieldDecorator('role_trn', {
                initialValue: data.role_trn || '',
                rules: [
                  this.requiredRule(`${fieldIdPrefix}.roleTrn`),
                  {
                    pattern: VOLCANO_ROLE_TRN_PATTERN,
                    message: formatMessage({ id: `${fieldIdPrefix}.roleTrn.invalid` })
                  }
                ]
              })(<Input placeholder={formatMessage({ id: `${fieldIdPrefix}.roleTrn.placeholder` })} />)}
            </FormItem>
          )}
          <FormItem {...formItemLayout} label={formatMessage({ id: `${fieldIdPrefix}.signName` })}>
            {getFieldDecorator('sign_name', {
              initialValue: data.sign_name || '',
              rules: [this.requiredRule(`${fieldIdPrefix}.signName`)]
            })(<Input placeholder={formatMessage({ id: `${fieldIdPrefix}.signName.placeholder` })} />)}
          </FormItem>
          <FormItem {...formItemLayout} label={formatMessage({ id: `${fieldIdPrefix}.templateCode` })}>
            {getFieldDecorator('template_code', {
              initialValue: data.template_code || '',
              rules: [this.requiredRule(`${fieldIdPrefix}.templateCode`)]
            })(<Input placeholder={formatMessage({ id: `${fieldIdPrefix}.templateCode.placeholder` })} />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
