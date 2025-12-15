import { Form, Input, Modal, Select, Button, Spin, notification } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import globalUtil from '../../utils/global';
import cookie from '../../utils/cookie';
import handleAPIError from '../../utils/error';
import {
  getHubTypeRules,
  getSecretIdRules,
  getDomainRules,
  getUsernameRules,
  getPasswordRules
} from './validations';

const { Option } = Select;
const FormItem = Form.Item;

@Form.create()
@connect()
class ConfirmModal extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      language: cookie.get('language') === 'zh-CN',
      checking: true,
      checkLoading: false
    };
  }
  // 检查仓库链接状态
  handleCheckImageHub = (values) => {
    const { dispatch, clusters, onOk } = this.props;
    this.setState({ checkLoading: true });
    dispatch({
      type: 'global/checkHubLink',
      payload: {
        regionName: clusters[0].region_name,
        domain: values.domain,
        username: values.username,
        password: values.password
      },
      callback: res => {
        if (res) {
          this.setState({
            checking: false,
            checkLoading: false
          });
          onOk(values);
        }
      },
      handleError: err => {
        handleAPIError(err);
        this.setState({
          checking: true,
          checkLoading: false
        });
      }
    });
  };

  handleSubmit = () => {
    const { form, onOk } = this.props;
    form.validateFields((err, values) => {
      if (!err && onOk) {
        // 删除域名末尾的斜杠
        if (values.domain && values.domain.endsWith('/')) {
          values.domain = values.domain.slice(0, -1);
        }
        onOk(values);
      }
    });
  };
  render() {
    const { onCancel, data, form, loading } = this.props;
    const { getFieldDecorator } = form;
    const { language, checkLoading } = this.state;

    const formItemLayout = {
      labelCol: { span: 24 },
      wrapperCol: { span: 24 }
    };
    const en_formItemLayout = {
      labelCol: { span: 24 },
      wrapperCol: { span: 24 }
    };
    const is_language = language ? formItemLayout : en_formItemLayout;
    return (
      <Modal
        title={
          data
            ? formatMessage({ id: 'confirmModal.edit.common.image.title' })
            : formatMessage({ id: 'confirmModal.add.common.image.title' })
        }
        visible
        onCancel={onCancel}
        bodyStyle={{
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 200px)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        footer={
          <div>
            <Button onClick={onCancel}>{formatMessage({ id: 'button.cancel' })}</Button>
            <Button type="primary" loading={loading} onClick={this.handleSubmit}>
              {formatMessage({ id: 'button.confirm' })}
            </Button>
          </div>
        }
      >

        <Form onSubmit={this.handleSubmit} layout="vertical" hideRequiredMark>
          <Spin spinning={checkLoading} tip={formatMessage({ id: 'status.checking' })}>
            <FormItem {...is_language} label={formatMessage({ id: 'versionUpdata_6_1.hub_type' })}>
              {getFieldDecorator('hub_type', {
                initialValue: (data && data.hub_type) || 'Docker',
                rules: getHubTypeRules()
              })(
                <Select placeholder={formatMessage({ id: 'placeholder.warehouse_name' })} disabled={!!data}>
                  <Option value="Docker">Docker Registry</Option>
                  <Option value="Harbor">Harbor</Option>
                </Select>
              )}
            </FormItem>
            {!data && (
              <FormItem {...is_language} label={formatMessage({ id: 'confirmModal.common.image.lable.name' })}>
                {getFieldDecorator('secret_id', {
                  initialValue: (data && data.secret_id) || '',
                  rules: getSecretIdRules(this.props.imageList),
                  getValueFromEvent: event => event.target.value.replace(/(^\s*)|(\s*$)/g, '')
                })(
                  <Input placeholder={formatMessage({ id: 'placeholder.warehouse_name' })} disabled={!!data} />
                )}
              </FormItem>
            )}
            {!data && (
              <FormItem {...is_language} label={formatMessage({ id: 'confirmModal.common.image.lable.domain' })}>
                {getFieldDecorator('domain', {
                  initialValue: (data && data.domain) || '',
                  rules: getDomainRules(),
                  getValueFromEvent: event => event.target.value.replace(/(^\s*)|(\s*$)/g, '')
                })(
                  <Input placeholder={formatMessage({ id: 'placeholder.git_url_domain' })} />
                )}
              </FormItem>
            )}
            <FormItem {...is_language} label={formatMessage({ id: 'confirmModal.common.image.lable.username' })}>
              {getFieldDecorator('username', {
                initialValue: (data && data.username) || '',
                rules: getUsernameRules()
              })(
                <Input placeholder={formatMessage({ id: 'placeholder.userName' })} />
              )}
            </FormItem>
            <FormItem {...is_language} label={formatMessage({ id: 'confirmModal.common.image.lable.password' })}>
              {getFieldDecorator('password', {
                initialValue: (data && data.password) || '',
                rules: getPasswordRules()
              })(
                <Input placeholder={formatMessage({ id: 'placeholder.password_1' })} type="password" />
              )}
            </FormItem>
          </Spin>
        </Form>
      </Modal>
    );
  }
}

export default ConfirmModal;
