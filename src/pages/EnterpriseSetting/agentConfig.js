/* eslint-disable camelcase */
import { Button, Card, Col, Form, Input, Modal, notification, Row, Select, Spin, Switch } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';

const { Option } = Select;
const FormItem = Form.Item;

@Form.create()
@connect(({ loading }) => ({
  loadingConfig: loading.effects['global/fetchAgentLlmConfig'],
  updatingConfig: loading.effects['global/updateAgentLlmConfig'],
  clearingConfig: loading.effects['global/clearAgentLlmConfig']
}))
class AgentConfig extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      config: {}
    };
  }

  componentDidMount() {
    this.fetchConfig();
  }

  setFormValues = (config = {}) => {
    const { form } = this.props;
    form.setFieldsValue({
      openai_api_key: '',
      openai_model: config.openai_model || '',
      openai_base_url: config.openai_base_url || '',
      llm_thinking_enabled: !!config.llm_thinking_enabled,
      llm_reasoning_effort: config.llm_reasoning_effort || 'medium'
    });
  };

  resetFormValues = () => {
    const { form } = this.props;
    form.setFieldsValue({
      openai_api_key: '',
      openai_model: '',
      openai_base_url: '',
      llm_thinking_enabled: false,
      llm_reasoning_effort: 'medium'
    });
  };

  fetchConfig = () => {
    const {
      dispatch,
      match: {
        params: { eid }
      }
    } = this.props;

    dispatch({
      type: 'global/fetchAgentLlmConfig',
      payload: { eid },
      callback: res => {
        const config = (res && res.bean) || {};
        this.setState({ config });
        this.setFormValues(config);
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
          const config = (res && res.bean) || {};
          this.setState({ config });
          form.setFieldsValue({ openai_api_key: '' });
          notification.success({
            message: formatMessage({ id: 'enterpriseSetting.agentConfig.save.success' })
          });
        }
      });
    });
  };

  handleClearConfig = () => {
    Modal.confirm({
      title: formatMessage({ id: 'enterpriseSetting.agentConfig.clear.title' }),
      content: formatMessage({ id: 'enterpriseSetting.agentConfig.clear.content' }),
      okText: formatMessage({ id: 'enterpriseSetting.agentConfig.clear' }),
      okType: 'danger',
      cancelText: formatMessage({ id: 'enterpriseSetting.agentConfig.clear.cancel' }),
      onOk: () => {
        const {
          dispatch,
          match: {
            params: { eid }
          }
        } = this.props;

        dispatch({
          type: 'global/clearAgentLlmConfig',
          payload: { eid },
          callback: res => {
            const config = (res && res.bean) || {};
            this.setState({ config });
            this.resetFormValues();
            notification.success({
              message: formatMessage({ id: 'enterpriseSetting.agentConfig.clear.success' })
            });
          }
        });
      }
    });
  };

  validateBaseUrl = (_, value, callback) => {
    if (!value || /^https?:\/\//.test(value)) {
      callback();
      return;
    }
    callback(formatMessage({ id: 'enterpriseSetting.agentConfig.baseUrl.invalid' }));
  };

  renderApiKeyExtra() {
    const { config } = this.state;
    if (config.openai_api_key_set) {
      return formatMessage(
        { id: 'enterpriseSetting.agentConfig.apiKey.configured' },
        { key: config.openai_api_key_masked || '********' }
      );
    }
    return formatMessage({ id: 'enterpriseSetting.agentConfig.apiKey.empty' });
  }

  render() {
    const { form, loadingConfig, updatingConfig, clearingConfig } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: { span: 8 },
      wrapperCol: { span: 12 }
    };
    const actionLoading = !!updatingConfig || !!clearingConfig;

    return (
      <Spin spinning={!!loadingConfig}>
        <Card style={{padding:24}}>
          <Form>
            <Row gutter={24}>
              <Col span={12}>
                <FormItem
                  {...formItemLayout}
                  label={formatMessage({ id: 'enterpriseSetting.agentConfig.label.apiKey' })}
                  extra={this.renderApiKeyExtra()}
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
              </Col>
              <Col span={12}>
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
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
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
              </Col>
              <Col span={12}>
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
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <FormItem {...formItemLayout} label={formatMessage({ id: 'enterpriseSetting.agentConfig.label.thinkingEnabled' })}>
                  {getFieldDecorator('llm_thinking_enabled', {
                    valuePropName: 'checked',
                    initialValue: false
                  })(
                    <Switch />
                  )}
                </FormItem>
              </Col>
            </Row>
            <div style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                loading={!!updatingConfig}
                disabled={!!clearingConfig}
                onClick={this.handleSubmit}
              >
                {formatMessage({ id: 'enterpriseSetting.agentConfig.save' })}
              </Button>
              <Button
                loading={!!clearingConfig}
                disabled={actionLoading && !clearingConfig}
                style={{ marginLeft: 12 }}
                onClick={this.handleClearConfig}
              >
                {formatMessage({ id: 'enterpriseSetting.agentConfig.clear' })}
              </Button>
            </div>
          </Form>
        </Card>
      </Spin>
    );
  }
}

export default AgentConfig;
