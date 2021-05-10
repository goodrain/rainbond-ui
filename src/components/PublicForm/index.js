import { Col, Input, InputNumber, Row, Select, Switch } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import styles from './index.less';

const { Option } = Select;

@connect(({ user, loading }) => ({
  currUser: user.currentUser,
  addHttpStrategyLoading: loading.effects['gateWay/addHttpStrategy'],
  editHttpStrategyLoading: loading.effects['gateWay/editHttpStrategy']
}))
class PublicForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  onChangeSwitch = (value, info) => {
    const { upDateQuestions, data } = this.props;
    data.map(item => {
      if (item.variable === info.variable) {
        item.default = value;
      }
    });
    if (upDateQuestions) {
      upDateQuestions(data);
    }
  };

  handleOk = e => {
    e.preventDefault();
    const { onOk, form } = this.props;
    form.validateFields((err, values) => {
      if (!err && onOk) {
        onOk(values);
      }
    });
  };
  handleFormItem = data => {
    return (
      data &&
      data.map((item, index) => {
        const {
          subquestions,
          default: defaults,
          group,
          show_subquestion_if = false
        } = item;
        console.log('1group', group !== data[index < 1 ? 0 : index - 1].group);
        return (
          <Fragment>
            {group !==
            data[index >= data.length ? data.length : index + 1].group ? (
              <Col span={24}>
                {this.FormItemBox(item)}
                {defaults == show_subquestion_if &&
                  subquestions &&
                  subquestions.length > 0 &&
                  subquestions.map(items => {
                    return this.FormItemBox(items);
                  })}
              </Col>
            ) : (
              <Fragment>
                {this.FormItemBox(item)}
                {defaults == show_subquestion_if &&
                  subquestions &&
                  subquestions.length > 0 &&
                  subquestions.map(items => {
                    return this.FormItemBox(items);
                  })}
              </Fragment>
            )}
          </Fragment>
        );
      })
    );
  };
  FormItemBox = item => {
    const { Form, getFieldDecorator } = this.props;
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 24 }
      },
      wrapperCol: {
        xs: { span: 23 },
        sm: { span: 23 }
      }
    };
    const {
      variable,
      required = false,
      default: defaults,
      description,
      label,
      type,
      show_subquestion_if = false,
      group,
      subquestions
    } = item;
    const box = this.handleBox(item, type, defaults);
    if (box) {
      return (
        <Col span={12}>
          <FormItem
            {...formItemLayout}
            label={label}
            className={styles.antd_form}
          >
            {getFieldDecorator(variable, {
              rules: [
                {
                  required,
                  message: `${label}必须设置`
                }
              ],
              initialValue: defaults && defaults === 'true' ? true : defaults
            })(box)}
            <div>{description}</div>
          </FormItem>
        </Col>
      );
    }
    return null;
  };
  handleBox = (item, type, defaults) => {
    if (type === 'string') {
      return <Input placeholder="请输入" />;
    } else if (type === 'boolean') {
      return (
        <Switch
          checkedChildren="开"
          unCheckedChildren="关"
          onChange={value => {
            this.onChangeSwitch(value, item);
          }}
          defaultChecked={defaults && defaults === 'true' ? true : defaults}
        />
      );
    } else if (type === 'int') {
      return (
        <InputNumber
          min={item.min || 1}
          max={item.max || 255}
          placeholder="节点数量"
        />
      );
    } else if (type === 'enum') {
      return (
        <Select placeholder="请选择">
          {item.options &&
            item.options.map(items => {
              return (
                <Option key={items} value={items}>
                  {items}
                </Option>
              );
            })}
        </Select>
      );
    }
    return null;
  };
  render() {
    const { data } = this.props;
    return (
      <Fragment>
        <Row>{this.handleFormItem(data)}</Row>
        {/* <FormItem
          {...formItemLayout}
          label="请求超时时间"
          className={styles.antd_form}
        >
          {getFieldDecorator('proxy_send_timeout', {
            rules: [
              {
                required: true,
                message: '请输入请求超时时间'
              }
            ],
            initialValue: editInfo ? editInfo.proxy_send_timeout : '60'
          })(<Input addonAfter="秒" />)}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="响应超时时间"
          className={styles.antd_form}
        >
          {getFieldDecorator('proxy_read_timeout', {
            rules: [
              {
                required: true,
                message: '请输入响应超时时间'
              }
            ],
            initialValue: editInfo ? editInfo.proxy_read_timeout : '60'
          })(<Input addonAfter="秒" />)}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="上传限制"
          className={styles.antd_form}
        >
          {getFieldDecorator('proxy_body_size', {
            rules: [
              {
                required: true,
                message: '请输入'
              },
              ...customRules
            ],
            initialValue: editInfo ? editInfo.proxy_body_size : '0'
          })(<Input addonAfter="Mb" />)}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="缓冲区数量"
          className={styles.antd_form}
        >
          {getFieldDecorator('proxy_buffer_numbers', {
            rules: customRules,
            initialValue: editInfo ? editInfo.proxy_buffer_numbers : '4'
          })(<Input />)}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="缓冲区大小"
          className={styles.antd_form}
        >
          {getFieldDecorator('proxy_buffer_size', {
            rules: customRules,
            initialValue: editInfo ? editInfo.proxy_buffer_size : '4'
          })(<Input addonAfter="K" placeholder="请输入缓冲区大小" />)}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="WebSocket支持"
          className={styles.antd_form}
        >
          {getFieldDecorator('WebSocket', {
            rules: [
              {
                required: false
              }
            ],
            initialValue: WebSocket
          })(
            <Switch
              checkedChildren="开"
              unCheckedChildren="关"
              checked={WebSocket}
              onClick={() => {
                this.onChangeWebSocket();
              }}
            />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="开启ProxyBuffer"
          className={styles.antd_form}
        >
          {getFieldDecorator('proxy_buffering', {
            rules: [
              {
                required: false
              }
            ],
            initialValue: proxyBuffering
          })(
            <Switch
              checkedChildren="开"
              unCheckedChildren="关"
              checked={proxyBuffering}
              onClick={() => {
                this.setState({ proxyBuffering: !proxyBuffering });
              }}
            />
          )}
        </FormItem>
        <FormItem {...formItemLayout} label="自定义请求头">
          {getFieldDecorator('set_headers', {
            initialValue: editInfo ? editInfo.set_headers : ''
          })(
            <Parameterinput editInfo={editInfo ? editInfo.set_headers : ''} />
          )}
        </FormItem> */}
      </Fragment>
    );
  }
}
export default PublicForm;
