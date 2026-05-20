/* eslint-disable camelcase */
import { Alert, Button, Card, Form, Input, notification, Select, Spin, Switch } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';
import styles from './index.less';

const { Option } = Select;
const FormItem = Form.Item;

@Form.create()
@connect(({ loading }) => ({
  loadingConfig: loading.effects['global/fetchAgentLlmConfig'],
  updatingConfig: loading.effects['global/updateAgentLlmConfig']
}))
class AgentConfig extends PureComponent {
  componentDidMount() {
    this.fetchConfig();
  }

  fetchConfig = () => {
    const {
      dispatch,
      form,
      match: {
        params: { eid }
      }
    } = this.props;

    dispatch({
      type: 'global/fetchAgentLlmConfig',
      payload: { eid },
      callback: res => {
        const config = (res && res.bean) || {};
        form.setFieldsValue({
          openai_api_key: '',
          openai_model: '',
          openai_base_url: '',
          llm_thinking_enabled: !!config.llm_thinking_enabled,
          llm_reasoning_effort: config.llm_reasoning_effort || 'medium'
        });
      }
    });
  };

  handleSubmit = () => {
    const {
      dispatch,
      form,
      match: {
        params: { eid }
      }
    } = this.props;

    form.validateFields((err, values) => {
      if (err) {
        return;
      }

      const payload = {
        eid,
        openai_api_key: values.openai_api_key,
        openai_model: values.openai_model,
        openai_base_url: values.openai_base_url,
        llm_thinking_enabled: !!values.llm_thinking_enabled,
        llm_reasoning_effort: values.llm_reasoning_effort
      };

      dispatch({
        type: 'global/updateAgentLlmConfig',
        payload,
        callback: res => {
          form.setFieldsValue({ openai_api_key: '' });
          notification.success({
            message: formatMessage({ id: 'enterpriseSetting.agentConfig.save.success' })
          });
        }
      });
    });
  };

  validateBaseUrl = (_, value, callback) => {
    if (!value || /^https?:\/\//.test(value)) {
      callback();
      return;
    }
    callback(formatMessage({ id: 'enterpriseSetting.agentConfig.baseUrl.invalid' }));
  };

  render() {
    const { form, loadingConfig, updatingConfig } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: { span: 8 },
      wrapperCol: { span: 8 }
    };

    return (
      <Spin spinning={!!loadingConfig}>
        <Card bordered={false} className={styles.agentConfigCard}>
          <Alert
            type="info"
            showIcon
            className={styles.agentConfigAlert}
            message={formatMessage({ id: 'enterpriseSetting.agentConfig.notice' })}
          />
          <Form>
            <FormItem
              {...formItemLayout}
              label={formatMessage({ id: 'enterpriseSetting.agentConfig.label.apiKey' })}
            >
              {getFieldDecorator('openai_api_key', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'enterpriseSetting.agentConfig.apiKey.required' })
                  }
                ]
              })(
                <Input.Password
                  autoComplete="new-password"
                  placeholder={formatMessage({ id: 'enterpriseSetting.agentConfig.apiKey.placeholder' })}
                />
              )}
            </FormItem>
            <FormItem {...formItemLayout} label={formatMessage({ id: 'enterpriseSetting.agentConfig.label.model' })}>
              {getFieldDecorator('openai_model', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'enterpriseSetting.agentConfig.model.required' })
                  }
                ]
              })(
                <Input placeholder={formatMessage({ id: 'enterpriseSetting.agentConfig.model.placeholder' })} />
              )}
            </FormItem>
            <FormItem {...formItemLayout} label={formatMessage({ id: 'enterpriseSetting.agentConfig.label.baseUrl' })}>
              {getFieldDecorator('openai_base_url', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'enterpriseSetting.agentConfig.baseUrl.required' })
                  },
                  { validator: this.validateBaseUrl }
                ]
              })(
                <Input placeholder={formatMessage({ id: 'enterpriseSetting.agentConfig.baseUrl.placeholder' })} />
              )}
            </FormItem>
            <FormItem {...formItemLayout} label={formatMessage({ id: 'enterpriseSetting.agentConfig.label.thinkingEnabled' })}>
              {getFieldDecorator('llm_thinking_enabled', {
                valuePropName: 'checked',
                initialValue: false
              })(
                <Switch />
              )}
            </FormItem>
            <FormItem {...formItemLayout} label={formatMessage({ id: 'enterpriseSetting.agentConfig.label.reasoningEffort' })}>
              {getFieldDecorator('llm_reasoning_effort', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'enterpriseSetting.agentConfig.reasoning.required' })
                  }
                ],
                initialValue: 'medium'
              })(
                <Select
                  placeholder={formatMessage({ id: 'enterpriseSetting.agentConfig.reasoning.placeholder' })}
                >
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                </Select>
              )}
            </FormItem>
            <FormItem wrapperCol={{ span: 8, offset: 8 }}>
              <Button
                type="primary"
                loading={!!updatingConfig}
                onClick={this.handleSubmit}
              >
                {formatMessage({ id: 'enterpriseSetting.agentConfig.save' })}
              </Button>
              <Button className={styles.agentConfigReloadButton} onClick={this.fetchConfig}>
                {formatMessage({ id: 'enterpriseSetting.agentConfig.reload' })}
              </Button>
            </FormItem>
          </Form>
        </Card>
      </Spin>
    );
  }
}

export default AgentConfig;
