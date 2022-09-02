import { Form, Input, Modal, notification, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import cookie from '../../utils/cookie';
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
      unit: data.interval ? data.interval.slice(data.interval.length - 1) : 's',
      language: cookie.get('language') === 'zh-CN' ? true : false
    };
  }
  componentDidMount() {
    this.handlePorts();
  }

  onOk = e => {
    e.preventDefault();
    const { form, onOk } = this.props;
    const { unit, portList, language } = this.state;
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
      title: formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.port'}),
      content: formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.Internally'}),
      okText: formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.Open'}),
      cancelText: formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.cancel'}),
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
        callback(`${formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.min'})}`);
        return;
      }
      if (num > 65535) {
        callback(`${formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.max'})}`);
        return;
      }
    }
    callback();
  };

  render() {
    const { title, onCancel, form, data = {}, loading = false } = this.props;
    const { unit, portList, language } = this.state;
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
    const en_formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };
    const is_language = language ? formItemLayout : en_formItemLayout
    const selectAfter = (
      <Select
        getPopupContainer={triggerNode => triggerNode.parentNode}
        defaultValue={unit}
        style={{ width: 80 }}
        onChange={this.handleChange}
      >
        <Option value="s">{formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.second'})}</Option>
        <Option value="m">{formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.minute'})}</Option>
        <Option value="h">{formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.hour'})}</Option>
      </Select>
    );
    let interval = '';
    if (data.interval) {
      interval = data.interval.slice(0, data.interval.length - 1);
    }
    const letterPattern = {
      pattern: /^[a-zA-Z]+$/,
      message: formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.Only'})
    };
    const max40 = {
      max: 40,
      message: formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.Maximum'})
    };
    return (
      <Modal
        title={title || data.name ? formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.edit'}) : formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.add'})}
        visible
        confirmLoading={loading}
        className={styles.TelescopicModal}
        onCancel={onCancel}
        onOk={this.onOk}
        okText={data.name ? formatMessage({id:'button.save'}) : formatMessage({id:'button.add'})}
      >
        <Form onSubmit={this.onOk}>
          <FormItem {...is_language} label={formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.name'})}>
            {getFieldDecorator('name', {
              initialValue: data.name || '',
              rules: [
                { required: true, message: formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.input_name'}) },
                letterPattern,
                max40
              ]
            })(<Input disabled={data.name} placeholder={formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.input_name'})} />)}
          </FormItem>
          <FormItem {...is_language} label={formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.collect'})}>
            {getFieldDecorator('service_show_name', {
              initialValue: data.service_show_name || '',
              rules: [
                { required: true, message: formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.collect_name'}) },
                letterPattern,
                max40
              ]
            })(<Input placeholder= {formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.collect_name'})} />)}
          </FormItem>
          <FormItem {...is_language} label={formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.collect_time'})}>
            {getFieldDecorator('interval', {
              initialValue: interval || '10',
              rules: [
                { required: true, message: formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.collect_time'}) },
                { validator: this.checkContent }
              ]
            })(
              <Input
                type="number"
                min={1}
                max={65535}
                addonAfter={selectAfter}
                defaultValue={formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.collect_time'})}
              />
            )}
          </FormItem>
          <FormItem {...is_language} label={formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.path'})}>
            {getFieldDecorator('path', {
              initialValue: data.path || '/metrics',
              rules: [
                { required: true, message: formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.input_path'}) },
                {
                  max: 255,
                  message: formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.Maximum_length'})
                }
              ]
            })(<Input placeholder={formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.input_path'})} />)}
          </FormItem>

          <FormItem {...is_language} label={formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.port_num'})}>
            {getFieldDecorator('port', {
              initialValue:
                data.port ||
                (portList.length > 0 ? portList[0].container_port : ''),
              rules: [{ required: true, message: formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.input_port'}) }]
            })(
              <Select
                placeholder={formatMessage({id:'componentOverview.body.tab.AddCustomMonitor.input_port'})}
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
