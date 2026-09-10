import React, { Component } from 'react';
import { connect } from 'dva';
import { Drawer, Form, Button, InputNumber, Select, Alert, Spin } from 'antd';
import globalUtil from '../../utils/global';
import { formatMessage } from '@/utils/intl';
import { streamProtocols, protocolLabel } from '../../utils/streamProtocols';

const { Option } = Select;
const targetKey = port => `${port.service_id}:${port.port}`;

@Form.create()
@connect()
export default class RouteDrawerTcp extends Component {
  state = { ports: [], loading: true, failed: false };

  componentDidMount() {
    this.loadPorts();
  }

  loadPorts = () => {
    this.setState({ loading: true, failed: false });
    const { dispatch, appID, componentPort, editInfo = {}, form } = this.props;
    dispatch({
      type: 'gateWay/fetchGetServiceAddress',
      payload: { team_name: globalUtil.getCurrTeamName(), region_name: globalUtil.getCurrRegionName(), appID },
      callback: response => {
        const all = response?.bean?.ports;
        if (!Array.isArray(all)) {
          this.setState({ loading: false, failed: true });
          return;
        }
        const ports = all.filter(port => !componentPort ||
          (port.service_id === componentPort.service_id && Number(port.port) === Number(componentPort.container_port)));
        const selected = ports.find(port =>
          Number(port.port) === Number(editInfo.container_port || editInfo.port) &&
          ((editInfo.service_id && port.service_id === editInfo.service_id) ||
           (editInfo.backend_service_name && port.service_name === editInfo.backend_service_name) ||
           (editInfo.service_alias && port.service_alias === editInfo.service_alias))) ||
          (componentPort ? ports[0] : null);
        this.setState({ ports, loading: false }, () => {
          if (selected) {
            const choices = streamProtocols(selected.protocol);
            form.setFieldsValue({
              target: targetKey(selected),
              protocol: editInfo.protocol ? String(editInfo.protocol).toLowerCase() : choices[choices.length - 1]
            });
          }
        });
      },
      handleError: () => this.setState({ loading: false, failed: true })
    });
  };

  changeTarget = key => {
    const selected = this.state.ports.find(port => targetKey(port) === key);
    const choices = streamProtocols(selected?.protocol);
    this.props.form.setFieldsValue({ protocol: choices[choices.length - 1] });
  };

  submit = event => {
    event.preventDefault();
    this.props.form.validateFields((error, values) => {
      if (error) return;
      const selected = this.state.ports.find(port => targetKey(port) === values.target);
      if (!selected || !streamProtocols(selected.protocol).includes(values.protocol)) {
        this.props.form.setFields({ protocol: { value: values.protocol,
          errors: [new Error(formatMessage({ id: 'streamRules.incompatible' }))] } });
        return;
      }
      this.props.onOk({
        protocol: values.protocol,
        match: { ingressPort: Number(values.ingressPort || 0) },
        backend: { serviceName: selected.service_name || selected.service_alias, servicePort: Number(selected.port) }
      }, selected.app_id, selected);
    });
  };

  render() {
    const { visible, onClose, editInfo = {}, form, saving, componentPort } = this.props;
    const { ports, loading, failed } = this.state;
    const editing = Boolean(editInfo.service_name || editInfo.name);
    const selected = ports.find(port => targetKey(port) === form.getFieldValue('target'));
    const choices = selected ? streamProtocols(selected.protocol) : [];
    return (
      <Drawer title={formatMessage({ id: editing ? 'streamRules.edit' : 'streamRules.add' })}
        width={650} visible={visible} onClose={() => !saving && onClose({}, 'add')} destroyOnClose>
        <Spin spinning={loading}>
          {failed && <Alert type="error" showIcon message={formatMessage({ id: 'streamRules.loadFailed' })}
            description={<Button onClick={this.loadPorts}>{formatMessage({ id: 'streamRules.retry' })}</Button>} />}
          <Form layout="vertical" onSubmit={this.submit}>
            <Form.Item label={formatMessage({ id: 'streamRules.target' })}>
              {form.getFieldDecorator('target', {
                rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }]
              })(<Select disabled={editing || Boolean(componentPort) || saving} onChange={this.changeTarget}
                placeholder={formatMessage({ id: 'streamRules.selectTarget' })}>
                {ports.map(port => <Option key={targetKey(port)} value={targetKey(port)}>
                  {port.component_name || port.service_alias} / {port.port} ({protocolLabel(port.protocol)})
                </Option>)}
              </Select>)}
            </Form.Item>
            <Form.Item label={formatMessage({ id: 'streamRules.protocol' })}
              extra={formatMessage({ id: 'streamRules.compatibility' })}>
              {form.getFieldDecorator('protocol', {
                rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }]
              })(<Select disabled={!selected || saving}>
                {choices.map(protocol => <Option key={protocol} value={protocol}>{protocolLabel(protocol)}</Option>)}
              </Select>)}
            </Form.Item>
            <Form.Item label={formatMessage({ id: 'streamRules.externalPort' })}
              extra={formatMessage({ id: editing ? 'streamRules.fixedAddress' : 'streamRules.autoPort' })}>
              {form.getFieldDecorator('ingressPort', {
                initialValue: editInfo.nodePort || undefined,
                rules: [{ validator: (_, value, callback) => {
                  if (value != null && (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 65535)) {
                    callback(formatMessage({ id: 'streamRules.invalidPort' }));
                  } else callback();
                } }]
              })(<InputNumber min={1} max={65535} precision={0} disabled={editing || saving} />)}
            </Form.Item>
            <Button onClick={() => onClose({}, 'add')} disabled={saving}>{formatMessage({ id: 'popover.cancel' })}</Button>{' '}
            <Button type="primary" htmlType="submit" loading={saving} disabled={loading || failed || !selected}>
              {formatMessage({ id: 'popover.confirm' })}
            </Button>
          </Form>
        </Spin>
      </Drawer>
    );
  }
}
