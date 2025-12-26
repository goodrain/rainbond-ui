import { Form, Input, Modal, Radio, Select } from 'antd';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi';
import { formatMessage } from '@/utils/intl';
import KVinput from '../../../components/KVinput';
import appProbeUtil from '../../../utils/appProbe-util';

const FormItem = Form.Item;
const { Option } = Select;
const RadioGroup = Radio.Group;

// 设置、编辑运行时健康监测
@Form.create()
export default class EditRunHealthCheck extends PureComponent {
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields(
      {
        force: true
      },
      (err, vals) => {
        if (!err) {
          this.props.onOk && this.props.onOk(vals);
        }
      }
    );
  };
  checkPath = (rules, value, callback) => {
    const visitType = this.props.form.getFieldValue('scheme');
    if (visitType == 'tcp') {
      callback();
      return;
    }

    if (visitType != 'tcp' && value) {
      callback();
      return;
    }

    callback(<FormattedMessage id='componentOverview.body.EditRunHealthCheck.input_path'/>);
  };
  render() {
    const { title, onCancel, ports } = this.props;
    const data = this.props.data || {};
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 6
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 16
        }
      }
    };
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const scheme = getFieldValue('scheme') || 'tcp';
    return (
      <Modal
        width={700}
        title={title}
        onOk={this.handleSubmit}
        onCancel={onCancel}
        visible
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout}  label={<FormattedMessage id='componentOverview.body.EditRunHealthCheck.port'/>}>
            {getFieldDecorator('port', {
              initialValue:
                appProbeUtil.getPort(data) ||
                (ports.length ? ports[0].container_port : '')
            })(
              <Select getPopupContainer={triggerNode => triggerNode.parentNode}>
                {ports.map(port => (
                  <Option key={port.container_port} value={port.container_port}>
                    {port.container_port}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.EditRunHealthCheck.agreement'/>}>
            {getFieldDecorator('scheme', {
              initialValue: data.scheme || 'tcp'
            })(
              <RadioGroup
                options={[
                  {
                    label: 'tcp',
                    value: 'tcp'
                  },
                  {
                    label: 'http',
                    value: 'http'
                  }
                ]}
              />
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={<FormattedMessage id='componentOverview.body.EditRunHealthCheck.http'/>}
            style={{
              display: scheme === 'tcp' ? 'none' : ''
            }}
          >
            {getFieldDecorator('http_header', {
              initialValue: data.http_header || ''
            })(<KVinput />)}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={<FormattedMessage id='componentOverview.body.EditRunHealthCheck.path'/>}
            style={{
              display: scheme === 'tcp' ? 'none' : ''
            }}
          >
            {getFieldDecorator('path', {
              initialValue: data.path || '',
              rules: [
                {
                  validator: this.checkPath
                }
              ]
            })(<Input placeholder={formatMessage({id:'componentOverview.body.EditRunHealthCheck.Response'})}/> )}
          </FormItem>
          <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.EditRunHealthCheck.initialization'/>}>
            {getFieldDecorator('initial_delay_second', {
              initialValue: data.initial_delay_second || '20',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.EditRunHealthCheck.input_initialization'}),
                }
              ]
            })(
              <Input
                type="number"
                style={{
                  width: '80%'
                }}
              />
            )}
            <span
              style={{
                marginLeft: 8
              }}
            >
              <FormattedMessage id='componentOverview.body.EditRunHealthCheck.second'/>
            </span>
          </FormItem>
          <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.EditRunHealthCheck.time'/>}>
            {getFieldDecorator('period_second', {
              initialValue: data.period_second || '3',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.EditRunHealthCheck.input_time'}),
                }
              ]
            })(
              <Input
                type="number"
                style={{
                  width: '80%'
                }}
              />
            )}
            <span
              style={{
                marginLeft: 8
              }}
            >
              <FormattedMessage id='componentOverview.body.EditRunHealthCheck.second'/>
            </span>
          </FormItem>
          <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.EditRunHealthCheck.over_time'/>}>
            {getFieldDecorator('timeout_second', {
              initialValue: data.timeout_second || '20',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.EditRunHealthCheck.input_over_time'}),
                }
              ]
            })(
              <Input
                type="number"
                style={{
                  width: '80%'
                }}
              />
            )}
            <span
              style={{
                marginLeft: 8
              }}
            >
              <FormattedMessage id='componentOverview.body.EditRunHealthCheck.second'/>
            </span>
          </FormItem>
          <FormItem {...formItemLayout} label={<FormattedMessage id='componentOverview.body.EditRunHealthCheck.error'/>}>
            {getFieldDecorator('failure_threshold', {
              initialValue: data.failure_threshold || '3',
              rules: [
                {
                  required: true,
                  message: formatMessage({id:'componentOverview.body.EditRunHealthCheck.error_frequency'}),
                }
              ]
            })(
              <Input
                type="number"
                style={{
                  width: '80%'
                }}
              />
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
