import { Form, Input, Modal, Radio, Select } from 'antd';
import React, { PureComponent } from 'react';
import KVinput from '../../../components/KVinput';
import appProbeUtil from '../../../utils/appProbe-util';

const FormItem = Form.Item;
const { Option } = Select;
const RadioGroup = Radio.Group;

// 设置、编辑健康监测
@Form.create()
export default class EditHealthCheck extends PureComponent {
  constructor(props) {
    super(props);
    const { ports, data } = this.props;
    const HeavyList = ports ? this.handleHeavyList(ports) : [];
    this.state = {
      isRestart: this.handleUnhealthyTreatment(data && data.mode),
      list: HeavyList,
      prolist: HeavyList,
      showHTTP: data.scheme === 'http'
    };
  }
  onChanges = e => {
    const val = e.target.value;
    const { setFieldsValue } = this.props.form;
    const isRestart = this.handleUnhealthyTreatment(val);
    const info = {
      mode: val
    };
    if (isRestart) {
      info.success_threshold = '1';
    }
    setFieldsValue(info);
    this.setState({
      isRestart
    });
  };
  handleUnhealthyTreatment = val => {
    return val === 'liveness';
  };
  handleSubmit = e => {
    e.preventDefault();
    const { form, onOk } = this.props;
    form.validateFields(
      {
        force: true
      },
      (err, vals) => {
        if (!err && onOk) {
          onOk(vals);
        }
      }
    );
  };
  checkPath = (_, value, callback) => {
    const visitType = this.props.form.getFieldValue('scheme');
    if (visitType === 'tcp') {
      callback();
      return;
    }

    if (visitType !== 'tcp' && value) {
      callback();
      return;
    }
    callback('请填写路径!');
  };
  checkNums = (_, value, callback) => {
    if (value && value < 1) {
      callback(`最小值为1`);
      return;
    }
    callback();
  };
  handleHeavyList = arr => {
    const arrs = [];
    arr.map(item => {
      arrs.push(item.container_port);
    });
    return arrs;
  };

  handleList = value => {
    if (value == null && value === '') {
      return;
    }
    const arr = this.state.list ? this.state.list : [];

    value && arr.unshift(`${value}`);
    if ((arr && arr.length > 0 && arr[0] === 'null') || arr[0] === '') {
      return;
    }
    const res = [arr[0]];
    for (let i = 1; i < arr.length; i++) {
      let repeat = false;
      for (let j = 0; j < res.length; j++) {
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

  render() {
    const { title, onCancel, form, types, loading = false } = this.props;
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
    const { getFieldDecorator, getFieldValue } = form;
    const { list, prolist, isRestart, showHTTP } = this.state;
    const scheme = getFieldValue('scheme') || 'tcp';
    const secondBox = (
      <span
        style={{
          marginLeft: 8
        }}
      >
        秒
      </span>
    );
    const numberBox = (disabled = false) => (
      <Input
        disabled={disabled}
        type="number"
        min={1}
        style={{
          width: '80%'
        }}
      />
    );
    const checkNum = [
      {
        validator: this.checkNums
      }
    ];
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
          <FormItem {...formItemLayout} label="检测端口">
            {getFieldDecorator('port', {
              initialValue:
                appProbeUtil.getPort(data) ||
                (list && list.length ? list[0] : ''),
              rules: [{ required: true, message: '请输入' }]
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                showSearch={!(prolist && prolist.length > 0)}
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
          <FormItem {...formItemLayout} label="探针协议">
            {getFieldDecorator('scheme', {
              initialValue: data.scheme || 'tcp'
            })(
              <RadioGroup
                onChange={e => {
                  this.setState({ showHTTP: e.target.value === 'http' });
                }}
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
              initialValue: data.mode || (types && 'ignore') || 'readiness',
              rules: [{ required: true, message: '请选择' }]
            })(
              <RadioGroup onChange={this.onChanges}>
                <Radio value="readiness">下线</Radio>
                {!types && <Radio value="liveness">重启</Radio>}
                {types && <Radio value="ignore">忽略</Radio>}
              </RadioGroup>
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="http请求头"
            style={{
              display: !showHTTP ? 'none' : ''
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
              display: !showHTTP ? 'none' : ''
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
                },
                ...checkNum
              ]
            })(numberBox())}
            {secondBox}
          </FormItem>
          <FormItem {...formItemLayout} label="检测间隔时间">
            {getFieldDecorator('period_second', {
              initialValue: data.period_second || '3',
              rules: [
                {
                  required: true,
                  message: '请填写检测间隔时间'
                },
                ...checkNum
              ]
            })(numberBox())}
            {secondBox}
          </FormItem>
          <FormItem {...formItemLayout} label="检测超时时间">
            {getFieldDecorator('timeout_second', {
              initialValue: data.timeout_second || '20',
              rules: [
                {
                  required: true,
                  message: '请填写检测超时时间'
                },
                ...checkNum
              ]
            })(numberBox())}
            {secondBox}
          </FormItem>
          <FormItem {...formItemLayout} label="连续成功次数">
            {getFieldDecorator('success_threshold', {
              initialValue: isRestart ? '1' : data.success_threshold || '1',
              rules: [
                {
                  required: true,
                  message: '请填写连续成功次数'
                },
                ...checkNum
              ]
            })(numberBox(isRestart))}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
