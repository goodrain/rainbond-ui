import { Form, Icon, Input, Modal } from 'antd';
import React, { PureComponent } from 'react';
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
          <FormItem {...formItemLayout} label="监控地址">
            <Input.Group compact>
              {getFieldDecorator('home_url', {
                initialValue: data.home_url || '',
                rules: [
                  {
                    required: true,
                    message: '请输入监控地址'
                  },
                  {
                    max: 255,
                    message: '最大长度255位'
                  }
                ]
              })(<Input placeholder="请输入监控地址" />)}
            </Input.Group>
          </FormItem>
          {!advancedConfiguration && (
            <div>
              <p style={{ textAlign: 'center' }}>
                更多高级设置
                <br />
                <Icon type="down" onClick={this.handleAdvancedConfiguration} />
              </p>
            </div>
          )}

          <FormItem style={monitoringObj} {...formItemLayout} label="集群监控">
            {getFieldDecorator('cluster_monitor_suffix', {
              initialValue: data.cluster_monitor_suffix || '',
              rules: [
                {
                  max: 255,
                  message: '最大长度255位'
                }
              ]
            })(<Input placeholder="请输入集群监控" />)}
          </FormItem>
          <FormItem style={monitoringObj} {...formItemLayout} label="节点监控">
            {getFieldDecorator('node_monitor_suffix', {
              initialValue: data.node_monitor_suffix || '',
              rules: [
                {
                  max: 255,
                  message: '最大长度255位'
                }
              ]
            })(<Input placeholder="请输入节点监控" />)}
          </FormItem>
          <FormItem style={monitoringObj} {...formItemLayout} label="组件监控">
            {getFieldDecorator('component_monitor_suffix', {
              initialValue: data.component_monitor_suffix || '',
              rules: [
                {
                  max: 255,
                  message: '最大长度255位'
                }
              ]
            })(<Input placeholder="请输入组件监控" />)}
          </FormItem>
          <FormItem style={monitoringObj} {...formItemLayout} label="服务监控">
            {getFieldDecorator('slo_monitor_suffix', {
              initialValue: data.slo_monitor_suffix || '',
              rules: [
                {
                  max: 255,
                  message: '最大长度255位'
                }
              ]
            })(<Input placeholder="请输入服务监控" />)}
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
