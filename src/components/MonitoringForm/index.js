import { Form, Icon, Input, Modal } from 'antd';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage  } from 'umi-plugin-locale';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;

@Form.create()
export default class MonitoringForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      advancedConfiguration: false
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

  handleAdvancedConfiguration = () => {
    this.setState({
      advancedConfiguration: !this.state.advancedConfiguration
    });
  };

  render() {
    const { title, onCancel, data = {}, form, loading = false } = this.props;
    const { getFieldDecorator } = form;
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
    const { advancedConfiguration } = this.state;
    const monitoringObj = { display: advancedConfiguration ? 'block' : 'none' };
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
          <FormItem {...formItemLayout} label={formatMessage({id:'enterpriseSetting.basicsSetting.monitoring.form.label.home_url'})}>
            <Input.Group compact>
              {getFieldDecorator('home_url', {
                initialValue: data.home_url || '',
                rules: [
                  {
                    required: true,
                    message: formatMessage({id:'placeholder.oauth.home_url'})
                  },
                  {
                    max: 255,
                    message: formatMessage({id:'placeholder.max255'})
                  }
                ]
              })(<Input placeholder={formatMessage({id:'placeholder.oauth.home_url'})} />)}
            </Input.Group>
          </FormItem>
          {!advancedConfiguration && (
            <div>
              <p style={{ textAlign: 'center' }}>
                {formatMessage({id:'enterpriseSetting.basicsSetting.monitoring.form.label.more'})}
                <br />
                <Icon type="down" onClick={this.handleAdvancedConfiguration} />
              </p>
            </div>
          )}

          <FormItem style={monitoringObj} {...formItemLayout} label={formatMessage({id:'enterpriseSetting.basicsSetting.monitoring.form.label.cluster_monitor_suffix'})}>
            {getFieldDecorator('cluster_monitor_suffix', {
              initialValue: data.cluster_monitor_suffix || '',
              rules: [
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.max255'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'placeholder.oauth.cluster_monitor_suffix'})} />)}
          </FormItem>
          <FormItem style={monitoringObj} {...formItemLayout} label={formatMessage({id:'enterpriseSetting.basicsSetting.monitoring.form.label.node_monitor_suffix'})}>
            {getFieldDecorator('node_monitor_suffix', {
              initialValue: data.node_monitor_suffix || '',
              rules: [
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.max255'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'placeholder.oauth.node_monitor_suffix'})} />)}
          </FormItem>
          <FormItem style={monitoringObj} {...formItemLayout} label={formatMessage({id:'enterpriseSetting.basicsSetting.monitoring.form.label.component_monitor_suffix'})}>
            {getFieldDecorator('component_monitor_suffix', {
              initialValue: data.component_monitor_suffix || '',
              rules: [
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.max255'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'placeholder.oauth.component_monitor_suffix'})} />)}
          </FormItem>
          <FormItem style={monitoringObj} {...formItemLayout} label={formatMessage({id:'enterpriseSetting.basicsSetting.monitoring.form.label.slo_monitor_suffix'})}>
            {getFieldDecorator('slo_monitor_suffix', {
              initialValue: data.slo_monitor_suffix || '',
              rules: [
                {
                  max: 255,
                  message: formatMessage({id:'placeholder.max255'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'placeholder.oauth.slo_monitor_suffix'})}/>)}
          </FormItem>
          {advancedConfiguration && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Icon type="up" onClick={this.handleAdvancedConfiguration} />
            </div>
          )}
        </Form>
      </Modal>
    );
  }
}
