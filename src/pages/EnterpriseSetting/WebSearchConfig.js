/* eslint-disable camelcase */
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Row,
  Select,
  Spin,
  Switch
} from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';

const { Option } = Select;
const FormItem = Form.Item;

@Form.create()
@connect(({ loading }) => ({
  loadingConfig: loading.effects['global/fetchAgentWebSearchConfig'],
  updatingConfig: loading.effects['global/updateAgentWebSearchConfig'],
  clearingConfig: loading.effects['global/clearAgentWebSearchConfig']
}))
class WebSearchConfig extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      config: {}
    };
  }

  componentDidMount() {
    this.fetchConfig();
  }

  getEnterpriseId = () => {
    const { match } = this.props;
    return match && match.params ? match.params.eid : '';
  };

  setFormValues = (config = {}) => {
    const { form } = this.props;
    form.setFieldsValue({
      enabled: config.enabled !== false,
      provider: config.provider || 'exa',
      api_key: '',
      max_results: config.max_results || 5,
      fetch_timeout_ms: config.fetch_timeout_ms || 15000
    });
  };

  fetchConfig = () => {
    const eid = this.getEnterpriseId();
    if (!eid) return;
    this.props.dispatch({
      type: 'global/fetchAgentWebSearchConfig',
      payload: { eid },
      callback: res => {
        const config = (res && res.bean) || {};
        this.setState({ config });
        this.setFormValues(config);
      }
    });
  };

  handleSubmit = () => {
    const eid = this.getEnterpriseId();
    if (!eid) return;
    this.props.form.validateFields((err, values) => {
      if (err) return;
      this.props.dispatch({
        type: 'global/updateAgentWebSearchConfig',
        payload: {
          eid,
          enabled: !!values.enabled,
          provider: values.provider,
          api_key: values.api_key,
          max_results: values.max_results,
          fetch_timeout_ms: values.fetch_timeout_ms
        },
        callback: res => {
          const config = (res && res.bean) || {};
          this.setState({ config });
          this.props.form.setFieldsValue({ api_key: '' });
          notification.success({ message: '联网搜索配置已保存' });
        }
      });
    });
  };

  handleClear = () => {
    const eid = this.getEnterpriseId();
    if (!eid) return;
    Modal.confirm({
      title: '确认重置联网搜索配置？',
      content: '重置后将恢复默认 provider 和限额，并删除已保存的 API Key。',
      okText: '重置',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        this.props.dispatch({
          type: 'global/clearAgentWebSearchConfig',
          payload: { eid },
          callback: () => {
            this.setState({ config: {} });
            this.setFormValues({});
            notification.success({ message: '联网搜索配置已重置' });
          }
        });
      }
    });
  };

  renderApiKeyExtra() {
    const { config } = this.state;
    if (config.api_key_set) {
      return `已配置：${config.api_key_masked || '********'}（留空保持不变）`;
    }
    return '未配置 API Key 时联网搜索不可用';
  }

  render() {
    const { form, loadingConfig, updatingConfig, clearingConfig } = this.props;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: { span: 8 },
      wrapperCol: { span: 12 }
    };
    const apiKeyConfigured = !!this.state.config.api_key_set;

    return (
      <Spin spinning={!!loadingConfig}>
        <Card title="联网搜索" style={{ padding: 24, marginTop: 16 }}>
          <Form>
            <Row gutter={24}>
              <Col span={12}>
                <FormItem {...formItemLayout} label="启用联网搜索">
                  {getFieldDecorator('enabled', {
                    valuePropName: 'checked',
                    initialValue: true
                  })(<Switch />)}
                </FormItem>
              </Col>
              <Col span={12}>
                <FormItem {...formItemLayout} label="Provider">
                  {getFieldDecorator('provider', { initialValue: 'exa' })(
                    <Select>
                      <Option value="exa">Exa</Option>
                      <Option value="perplexity">Perplexity</Option>
                    </Select>
                  )}
                </FormItem>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <FormItem
                  {...formItemLayout}
                  label="API Key"
                  extra={this.renderApiKeyExtra()}
                >
                  {getFieldDecorator('api_key', {
                    rules: [
                      {
                        required: !apiKeyConfigured,
                        message: '请输入联网搜索 API Key'
                      }
                    ]
                  })(
                    <Input.Password
                      autoComplete="new-password"
                      placeholder={
                        apiKeyConfigured ? '留空保持当前 Key' : '请输入 API Key'
                      }
                    />
                  )}
                </FormItem>
              </Col>
              <Col span={12}>
                <FormItem {...formItemLayout} label="最大结果数">
                  {getFieldDecorator('max_results', {
                    rules: [{ required: true, message: '请输入 1-10 的结果数' }]
                  })(
                    <InputNumber min={1} max={10} style={{ width: '100%' }} />
                  )}
                </FormItem>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={12}>
                <FormItem {...formItemLayout} label="抓取超时（毫秒）">
                  {getFieldDecorator('fetch_timeout_ms', {
                    rules: [
                      { required: true, message: '请输入 1000-60000 的超时' }
                    ]
                  })(
                    <InputNumber
                      min={1000}
                      max={60000}
                      step={1000}
                      style={{ width: '100%' }}
                    />
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
                保存
              </Button>
              <Button
                loading={!!clearingConfig}
                disabled={!!updatingConfig}
                style={{ marginLeft: 12 }}
                onClick={this.handleClear}
              >
                重置
              </Button>
            </div>
          </Form>
        </Card>
      </Spin>
    );
  }
}

export default WebSearchConfig;
