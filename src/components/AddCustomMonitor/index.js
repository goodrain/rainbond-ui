import { Form, Input, Modal, notification, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from '../CreateTeam/index.less';

const FormItem = Form.Item;
const { Option } = Select;
const { confirm } = Modal;

@Form.create()
@connect()
export default class AddCustomMonitor extends PureComponent {
  constructor(props) {
    super(props);
    const { data } = this.props;
    this.state = {
      portList: [],
      unit: data.interval ? data.interval.slice(data.interval.length - 1) : 's'
    };
  }
  componentDidMount() {
    this.handlePorts();
  }

  onOk = e => {
    e.preventDefault();
    const { form, onOk } = this.props;
    const { unit, portList } = this.state;
    form.validateFields({ force: true }, (err, vals) => {
      if (!err && onOk) {
        // eslint-disable-next-line no-param-reassign
        vals.interval += `${unit}`;
        vals.port = Number(vals.port);
        const portInfo = portList.filter(item => {
          return `${vals.port}` === `${item.container_port}`;
        })[0];
        if (!portInfo.is_outer_service && !portInfo.is_inner_service) {
          this.handleOpenInner(vals);
        } else {
          onOk(vals);
        }
      }
    });
  };

  handleOpenInner = vals => {
    const { dispatch, parameter, onOk: onPropOk } = this.props;
    confirm({
      title: '开通端口',
      content: '组件端口需要开通对内服务',
      okText: '开通',
      cancelText: '取消',
      onOk() {
        return new Promise((resolve, reject) => {
          dispatch({
            type: 'appControl/openPortInner',
            payload: {
              ...parameter,
              port: vals.port
            },
            callback: () => {
              onPropOk(vals);
              notification.success({ message: formatMessage({id:'notification.success.opened_successfully'}) });
              Modal.destroyAll();
            }
          });
          setTimeout(Math.random() > 0.5 ? resolve : reject, 2000);
        });
      },
      onCancel() {}
    });
  };

  handleChange = unit => {
    this.setState({
      // eslint-disable-next-line react/no-unused-state
      unit
    });
  };

  /** 获取端口 */
  handlePorts = () => {
    const { dispatch, parameter } = this.props;
    dispatch({
      type: 'appControl/fetchPorts',
      payload: parameter,
      callback: res => {
        if (res) {
          this.setState({
            portList: res.list
          });
        }
      }
    });
  };

  checkContent = (_, value, callback) => {
    const num = Number(value);
    if (num || num === 0) {
      if (num < 1) {
        callback('最小输入值1');
        return;
      }
      if (num > 65535) {
        callback('最大输入值65535');
        return;
      }
    }
    callback();
  };

  render() {
    const { title, onCancel, form, data = {}, loading = false } = this.props;
    const { unit, portList } = this.state;
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
    const selectAfter = (
      <Select
        getPopupContainer={triggerNode => triggerNode.parentNode}
        defaultValue={unit}
        style={{ width: 80 }}
        onChange={this.handleChange}
      >
        <Option value="s">秒</Option>
        <Option value="m">分钟</Option>
        <Option value="h">小时</Option>
      </Select>
    );
    let interval = '';
    if (data.interval) {
      interval = data.interval.slice(0, data.interval.length - 1);
    }
    const letterPattern = {
      pattern: /^[a-zA-Z]+$/,
      message: '只支持字母组合'
    };
    const max40 = {
      max: 40,
      message: '最大长度40位'
    };
    return (
      <Modal
        title={title || data.name ? '编辑配置' : '添加配置'}
        visible
        confirmLoading={loading}
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.onOk}
        okText={data.name ? '保存' : '添加'}
      >
        <Form onSubmit={this.onOk}>
          <FormItem {...formItemLayout} label="配置名">
            {getFieldDecorator('name', {
              initialValue: data.name || '',
              rules: [
                { required: true, message: '请填写配置名' },
                letterPattern,
                max40
              ]
            })(<Input disabled={data.name} placeholder="请填写配置名" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="收集任务名称">
            {getFieldDecorator('service_show_name', {
              initialValue: data.service_show_name || '',
              rules: [
                { required: true, message: '请填写收集任务名称' },
                letterPattern,
                max40
              ]
            })(<Input placeholder="请填写收集任务名称" />)}
          </FormItem>
          <FormItem {...formItemLayout} label="收集间隔时间">
            {getFieldDecorator('interval', {
              initialValue: interval || '10',
              rules: [
                { required: true, message: '收集间隔时间' },
                { validator: this.checkContent }
              ]
            })(
              <Input
                type="number"
                min={1}
                max={65535}
                addonAfter={selectAfter}
                defaultValue="收集间隔时间"
              />
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="指标路径">
            {getFieldDecorator('path', {
              initialValue: data.path || '/metrics',
              rules: [
                { required: true, message: '请填写指标路径' },
                {
                  max: 255,
                  message: '最大长度255位'
                }
              ]
            })(<Input placeholder="请填写指标路径" />)}
          </FormItem>

          <FormItem {...formItemLayout} label="端口号">
            {getFieldDecorator('port', {
              initialValue:
                data.port ||
                (portList.length > 0 ? portList[0].container_port : ''),
              rules: [{ required: true, message: '请选择端口号' }]
            })(
              <Select
                placeholder="请选择端口号"
                getPopupContainer={triggerNode => triggerNode.parentNode}
              >
                {portList.map(items => {
                  const { container_port: containerPort, ID } = items;
                  return (
                    <Option value={containerPort} key={ID}>
                      {containerPort}
                    </Option>
                  );
                })}
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}
