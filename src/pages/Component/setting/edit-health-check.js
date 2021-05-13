import { Form, Input, Modal, Radio, Select } from 'antd';
import React, { PureComponent } from 'react';
import KVinput from '../../../components/KVinput';
import appProbeUtil from '../../../utils/appProbe-util';

const FormItem = Form.Item;
const Option = Select.Option;
const RadioGroup = Radio.Group;

// 设置、编辑健康监测
@Form.create()
export default class EditHealthCheck extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: this.props.ports ? this.handleHeavyList(this.props.ports) : [],
      prolist: this.props.ports ? this.handleHeavyList(this.props.ports) : []
    };
  }

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
  checkPath = (rule, value, callback) => {
    const visitType = this.props.form.getFieldValue('scheme');
    if (visitType == 'tcp') {
      callback();
      return;
    }

    if (visitType != 'tcp' && value) {
      callback();
      return;
    }
    callback('请填写路径!');
  };

  handleHeavyList = arr => {
    let arrs = [];
    arr.map(item => {
      arrs.push(item.container_port);
    });
    return arrs;
  };

  handleList = value => {
    if (value == null && value == '') {
      return;
    }
    let arr = this.state.list ? this.state.list : [];

    value && arr.unshift(value + '');
    if ((arr && arr.length > 0 && arr[0] == 'null') || arr[0] == '') {
      return;
    }
    var res = [arr[0]];
    for (var i = 1; i < arr.length; i++) {
      var repeat = false;
      for (var j = 0; j < res.length; j++) {
        if (arr[i] == res[j]) {
          repeat = true;
          break;
        }
      }
      if (!repeat) {
        res.push(arr[i]);
      }
    }

    this.setState({ list: res });
    this.props.form.setFieldsValue({
      port: value
    });
  };
  onChanges = e => {
    this.props.form.setFieldsValue({
      mode: e.target.value
    });
  };

  render() {
    const { title, onCancel, ports, loading = false } = this.props;
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
    const { list, prolist } = this.state;
    const scheme = getFieldValue('scheme') || 'tcp';
    return (
      <Modal
        width={700}
        title={title}
        onOk={this.handleSubmit}
        maskClosable={false}
        onCancel={onCancel}
        visible
        confirmLoading={loading}
      >
        <Form onSubmit={this.handleSubmit}>
          {prolist && prolist.length > 0 ? (
            <FormItem {...formItemLayout} label="检测端口">
              {getFieldDecorator('port', {
                initialValue:
                  appProbeUtil.getPort(data) ||
                  (list && list.length ? list[0] : ''),
                rules: [{ required: true, message: '请输入' }]
              })(
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  onSearch={val => {
                    this.handleList(val);
                  }}
                >
                  {list &&
                    list.map(port => (
                      <Option key={port} value={port}>
                        {port}
                      </Option>
                    ))}
                </Select>
              )}
            </FormItem>
          ) : (
            <FormItem {...formItemLayout} label="检测端口">
              {getFieldDecorator('port', {
                initialValue:
                  appProbeUtil.getPort(data) ||
                  (list && list.length ? list[0] : ''),
                rules: [{ required: true, message: '请输入' }]
              })(
                <Select
                  getPopupContainer={triggerNode => triggerNode.parentNode}
                  showSearch
                  onSearch={val => {
                    this.handleList(val);
                  }}
                >
                  {list &&
                    list.map(port => (
                      <Option key={port} value={port}>
                        {port}
                      </Option>
                    ))}
                </Select>
              )}
            </FormItem>
          )}

          <FormItem {...formItemLayout} label="探针协议">
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
          <FormItem {...formItemLayout} label="不健康处理方式:">
            {getFieldDecorator('mode', {
              initialValue:
                data.mode || (this.props.types && 'ignore') || 'readiness',
              rules: [{ required: true, message: '请选择' }]
            })(
              <RadioGroup onChange={this.onChanges}>
                <Radio value={'readiness'}>下线</Radio>
                {!this.props.types && <Radio value={'liveness'}>重启</Radio>}
                {this.props.types && <Radio value={'ignore'}>忽略</Radio>}
              </RadioGroup>
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="http请求头"
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
            label="路径"
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
            })(<Input placeholder="响应码2xx、3xx为正常" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="初始化等候时间">
            {getFieldDecorator('initial_delay_second', {
              initialValue: data.initial_delay_second || '2',
              rules: [
                {
                  required: true,
                  message: '请填写初始化等候时间'
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
              秒
            </span>
          </FormItem>
          <FormItem {...formItemLayout} label="检测间隔时间">
            {getFieldDecorator('period_second', {
              initialValue: data.period_second || '3',
              rules: [
                {
                  required: true,
                  message: '请填写检测间隔时间'
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
              秒
            </span>
          </FormItem>
          <FormItem {...formItemLayout} label="检测超时时间">
            {getFieldDecorator('timeout_second', {
              initialValue: data.timeout_second || '20',
              rules: [
                {
                  required: true,
                  message: '请填写检测超时时间'
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
              秒
            </span>
          </FormItem>
          <FormItem {...formItemLayout} label="连续成功次数">
            {getFieldDecorator('success_threshold', {
              initialValue: data.success_threshold || '1',
              rules: [
                {
                  required: true,
                  message: '请填写连续成功次数'
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
