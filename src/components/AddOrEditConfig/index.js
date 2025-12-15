/* eslint-disable no-loop-func */
/* eslint-disable react/no-multi-comp */
/*
  添加或者修改插件配置
*/
import { Form, Icon, Input, Modal, Radio, Select, Tooltip } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage } from '@/utils/intl';

const RadioGroup = Radio.Group;
const { Option } = Select;

@Form.create()
class EvnOption extends React.Component {
  componentWillMount() {
    const { onDidMount, index } = this.props;
    if (onDidMount) {
      onDidMount(index, this);
    }
  }
  componentDidMount() {
    const { onChange, index, form } = this.props;
    if (onChange) {
      onChange(index, form.getFieldsValue());
    }
  }
  componentWillUnmount() {
    const { onUnmount, index } = this.props;
    if (onUnmount) {
      onUnmount(index);
    }
  }

  checkAttrAltValue = (_, value, callback) => {
    const { getFieldValue } = this.props.form;
    if (getFieldValue('attr_type') !== 'string' && !value) {
      callback(`${formatMessage({id:'teamOther.AddOrEditConfig.input'})}`);
    } else {
      callback();
    }
  };

  validAttrName = (_, value, callback) => {
    if (value && !/^[-._a-zA-Z][-._a-zA-Z0-9]*$/.test(value)) {
      callback(`${formatMessage({id:'teamOther.AddOrEditConfig.only'})}`);
      return;
    }
    callback();
  };
  check(callback) {
    const { form } = this.props;
    form.validateFields(err => {
      if (callback) {
        callback(err);
      }
    });
  }
  handleOnchange = (key, value) => {
    const { form, onChange, index } = this.props;
    const { setFieldsValue, validateFields, getFieldsValue } = form;
    setFieldsValue({ [key]: value });
    validateFields([key], err => {
      if ((!err && onChange, index)) {
        onChange(index, getFieldsValue());
      }
    });
  };
  render() {
    const { form, data = {}, protocols = [] } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const attrType = getFieldValue('attr_type') || 'string';
    return (
      <Form
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
        layout="inline"
      >
        <Form.Item style={{ display: 'none' }}>
          {getFieldDecorator('ID', {
            initialValue: data.ID || ''
          })(<Input />)}
        </Form.Item>
        <Form.Item style={{ width: 100 }}>
          {getFieldDecorator('attr_name', {
            initialValue: data.attr_name || '',
            rules: [
              {
                required: true,
                message: formatMessage({id:'teamOther.AddOrEditConfig.input_name'})
              },
              {
                max: 32,
                message: formatMessage({id:'teamOther.AddOrEditConfig.max'})
              },
              {
                validator: this.validAttrName
              }
            ]
          })(
            <Input
              onChange={e => {
                this.handleOnchange('attr_name', e.target.value);
              }}
              placeholder={formatMessage({id:'teamOther.AddOrEditConfig.name'})}
            />
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('protocol', {
            initialValue:
              (data.protocol && data.protocol.toString().split(',')) || '',
            rules: [{ required: false, message: formatMessage({id:'teamOther.AddOrEditConfig.agreement'})}]
          })(
            <Select
              showArrow
              mode="multiple"
              getPopupContainer={triggerNode => triggerNode.parentNode}
              onChange={values => {
                this.handleOnchange('protocol', values);
              }}
              style={{ width: 120 }}
              placeholder={formatMessage({id:'teamOther.AddOrEditConfig.select_agreement'})}
            >
              <Option value="">{formatMessage({id:'teamOther.AddOrEditConfig.all_agreement'})}</Option>
              {protocols.map(item => (
                <Option value={item}>{item}</Option>
              ))}
            </Select>
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('attr_type', {
            initialValue: data.attr_type || 'string',
            rules: [{ required: true, message: formatMessage({id:'teamOther.AddOrEditConfig.name'}) }]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              onChange={values => {
                this.handleOnchange('attr_type', values);
              }}
              style={{ width: 100 }}
            >
              <Option value="string">{formatMessage({id:'teamOther.AddOrEditConfig.string'})}</Option>
              <Option value="radio">{formatMessage({id:'teamOther.AddOrEditConfig.choice'})}</Option>
              <Option value="checkbox">{formatMessage({id:'teamOther.AddOrEditConfig.Multiple'})}</Option>
            </Select>
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('attr_default_value', {
            initialValue: data.attr_default_value || '',
            rules: [
              { required: false, message: formatMessage({id:'teamOther.AddOrEditConfig.Default'}) },
              {
                max: 65535,
                message: formatMessage({id:'teamOther.AddOrEditConfig.max_length'})
              }
            ]
          })(
            <Input
              onChange={e => {
                this.handleOnchange('attr_default_value', e.target.value);
              }}
              style={{ width: 80 }}
              placeholder={formatMessage({id:'teamOther.AddOrEditConfig.Default'})}
            />
          )}
        </Form.Item>
        <Form.Item style={{ display: attrType === 'string' ? 'none' : '' }}>
          <Tooltip title={formatMessage({id:'teamOther.AddOrEditConfig.tooltip'})}>
            {getFieldDecorator('attr_alt_value', {
              initialValue: data.attr_alt_value || '',
              rules: [
                {
                  max: 65535,
                  message: formatMessage({id:'teamOther.AddOrEditConfig.max_length'})
                },
                { validator: this.checkAttrAltValue }
              ]
            })(
              <Input
                onChange={e => {
                  this.handleOnchange('attr_alt_value', e.target.value);
                }}
                style={{ width: 100 }}
                placeholder={formatMessage({id:'teamOther.AddOrEditConfig.Optional_values'})}
              />
            )}
          </Tooltip>
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('is_change', {
            initialValue: data.is_change === void 0 ? true : data.is_change,
            rules: [{ required: false, message: formatMessage({id:'teamOther.AddOrEditConfig.Default'}) }]
          })(
            <Select
              getPopupContainer={triggerNode => triggerNode.parentNode}
              onChange={values => {
                this.handleOnchange('is_change', values);
              }}
              style={{ width: 100 }}
            >
              <Option value>{formatMessage({id:'teamOther.AddOrEditConfig.Modifiable'})}</Option>
              <Option value={false}>{formatMessage({id:'teamOther.AddOrEditConfig.unModifiable'})}</Option>
            </Select>
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('attr_info', {
            initialValue: data.attr_info || '',
            rules: [
              { required: false, message: formatMessage({id:'teamOther.AddOrEditConfig.Default'}) },
              {
                max: 40,
                message: formatMessage({id:'teamOther.AddOrEditConfig.Max'})
              }
            ]
          })(
            <Input
              onChange={e => {
                this.handleOnchange('attr_info', e.target.value);
              }}
              style={{ width: 100 }}
              placeholder={formatMessage({id:'teamOther.AddOrEditConfig.explain'})}
            />
          )}
        </Form.Item>
      </Form>
    );
  }
}

@Form.create()
class EnvGroup extends PureComponent {
  constructor(props) {
    super(props);
    let group = (this.props.value || []).map(item => ({
      key: Math.random(),
      value: item
    }));

    if (!group.length) {
      group = [{ key: Math.random() }];
    }

    this.state = {
      group
    };

    // 保存组建引用
    this.groupItem = [];
  }
  componentWillMount() {
    const { onDidMount } = this.props;
    if (onDidMount) {
      onDidMount(this);
    }
  }
  check() {
    let res = true;
    for (let i = 0; i < this.groupItem.length; i++) {
      this.groupItem[i].com.check(err => {
        res = !err;
      });
      if (!res) break;
    }
    return res;
  }
  handlePlus = key => {
    const { group } = this.state;
    let index = 0;
    const setGroup = group.filter((item, i) => {
      if (item.key === key) {
        index = i;
      }
      return true;
    });
    setGroup.splice(index + 1, 0, { key: Math.random() });
    this.setState({ group: setGroup });
  };
  handleMinus = key => {
    const { onChange } = this.props;
    const { group } = this.state;
    let setGroup = [].concat(group);
    if (setGroup.length === 1) return;
    setGroup = group.filter(item => !!item).filter(item => item.key !== key);
    this.setState({ group: setGroup }, () => {
      if (onChange) {
        onChange(setGroup.map(item => item.value));
      }
    });
  };
  handleChange = (index, val) => {
    const { onChange } = this.props;
    const { group } = this.state;
    group.map(item => {
      if (item.key === index) {
        item.value = val;
      }
      return item;
    });
    const onchangeVal = group.map(item => item.value);
    if (onChange) {
      onChange(onchangeVal);
    }
  };
  handleOptionMount = (k, com) => {
    this.groupItem.push({ key: k, com });
  };
  handleOptionUnmout = k => {
    this.groupItem = this.groupItem.filter(item => item.key !== k);
  };
  render() {
    let { group } = this.state;
    group = group.filter(item => !!item);
    const IconStyle = {
      cursor: 'pointer',
      fontSize: 20
    };
    return (
      <div>
        {(group || []).map(item => (
          <div key={item.key} style={{ display: 'flex' }}>
            <EvnOption
              onDidMount={this.handleOptionMount}
              onUnmount={this.handleOptionUnmout}
              protocols={this.props.protocols}
              data={item.value}
              key={item.key}
              index={item.key}
              onChange={this.handleChange}
            />
            <div>
              <Icon
                onClick={() => {
                  this.handlePlus(item.key);
                }}
                style={IconStyle}
                type="plus"
              />
              <Icon
                onClick={() => {
                  this.handleMinus(item.key);
                }}
                style={IconStyle}
                type="minus"
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
}

const formItemLayout = {
  labelCol: {
    span: 5
  },
  wrapperCol: {
    span: 19
  }
};

@Form.create()
@connect(({ region }) => ({
  protocols: region.protocols || []
}))
export default class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.envGroup = null;
  }
  componentDidMount() {}
  handleSubmit = () => {
    const { form, onSubmit } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (this.envGroup) {
        const check = this.envGroup.check();
        if (!err && onSubmit && check) {
          if (fieldsValue.options) {
            fieldsValue.options.map(item => {
              if (item.protocol) {
                item.protocol = item.protocol.join(',');
              }
              return item;
            });
          }
          onSubmit(fieldsValue);
        }
      }
    });
  };
  handleCancel = () => {
    const { onCancel } = this.props;
    if (onCancel) {
      onCancel();
    }
  };
  hanldeMetaTypeChange = e => {
    const { setFieldsValue } = this.props.form;
    if (e.target.value !== 'un_define') {
      setFieldsValue({ injection: 'auto' });
    }
  };

  handleEvnGroupMount = com => {
    this.envGroup = com;
  };
  render() {
    const { title, form, data = {}, loading = false } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    const metaType = getFieldValue('service_meta_type') || 'un_define';
    return (
      <Modal
        title={title || formatMessage({id:'teamOther.AddOrEditConfig.add'})}
        width={1100}
        visible
        confirmLoading={loading}
        onOk={this.handleSubmit}
        onCancel={this.handleCancel}
      >
        <Form>
          <Form.Item
            style={{ marginRight: 8 }}
            {...formItemLayout}
            label={formatMessage({id:'teamOther.AddOrEditConfig.config_name'})}
          >
            {getFieldDecorator('config_name', {
              initialValue: data.config_name || '',
              rules: [
                { required: true, message: formatMessage({id:'teamOther.AddOrEditConfig.enter_name'}) },
                {
                  max: 32,
                  message: formatMessage({id:'teamOther.AddOrEditConfig.max'})
                }
              ],
              validateFirst: true
            })(<Input placeholder={formatMessage({id:'teamOther.AddOrEditConfig.input_name'})} />)}
          </Form.Item>
          <Form.Item {...formItemLayout} label={formatMessage({id:'teamOther.AddOrEditConfig.rely_on'})}>
            {getFieldDecorator('service_meta_type', {
              initialValue: data.service_meta_type || 'un_define',
              rules: [{ required: true, message: formatMessage({id:'teamOther.AddOrEditConfig.enter_name'}) }]
            })(
              <RadioGroup onChange={this.hanldeMetaTypeChange}>
                <Radio value="un_define">{formatMessage({id:'teamOther.AddOrEditConfig.unrely_on'})}</Radio>
                {/* <Radio value="upstream_port">{formatMessage({id:'teamOther.AddOrEditConfig.port'})}</Radio>
                <Radio value="downstream_port">{formatMessage({id:'teamOther.AddOrEditConfig.downstream'})}</Radio> */}
              </RadioGroup>
            )}
          </Form.Item>
          <Form.Item {...formItemLayout} label={formatMessage({id:'teamOther.AddOrEditConfig.type'})}>
            {getFieldDecorator('injection', {
              initialValue: data.injection || 'env',
              rules: [{ required: true, message: formatMessage({id:'teamOther.AddOrEditConfig.enter_name'}) }]
            })(
              <RadioGroup>
                <Radio
                  style={{ display: metaType === 'un_define' ? '' : 'none' }}
                  value="env"
                >
                  {formatMessage({id:'teamOther.AddOrEditConfig.env'})}
                </Radio>
                {/* <Radio value="auto">{formatMessage({id:'teamOther.AddOrEditConfig.find'})}</Radio> */}
              </RadioGroup>
            )}
          </Form.Item>
          <Form.Item validateStatus="t" {...formItemLayout} label={formatMessage({id:'teamOther.AddOrEditConfig.config'})}>
            {getFieldDecorator('options', {
              initialValue: data.options || []
            })(
              <EnvGroup
                onDidMount={this.handleEvnGroupMount}
                protocols={this.props.protocols}
              />
            )}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
