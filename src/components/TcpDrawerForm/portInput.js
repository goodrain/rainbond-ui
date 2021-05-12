import { Col, Input, Row, Select } from 'antd';
import React from 'react';

class PriceInput extends React.Component {
  static getDerivedStateFromProps(nextProps, nextState) {
    // Should be a controlled component.
    if ('value' in nextProps) {
      return {
        ...(nextProps.value || {})
      };
    }
    return null;
  }

  constructor(props) {
    super(props);
    this.state = {
      available_port: '',
      ip: undefined
    };
  }
  handleNumberChange = e => {
    const available_port = Number(e.target.value);
    if (isNaN(available_port)) {
      return;
    }

    this.setState({ available_port }, () => {
      this.triggerChange({ available_port });
    });
  };

  handleCurrencyChange = (ip, obj) => {
    const { domain_port } = this.props;
    const key = obj && obj.key && obj.key ? Number(obj.key) : 0;
    if (!('value' in this.props)) {
      this.setState({ ip });
    }

    if (domain_port && domain_port.length > 0) {
      let available_port = domain_port[key].available_port;

      this.setState({ available_port }, () => {
        this.triggerChange({ ip, available_port });
      });
      return false;
    }

    // this.triggerChange({ ip });
  };
  handleBlur = () => {
    const { available_port } = this.state;
  };
  triggerChange = (changedValue, available_ports) => {
    // Should provide an event to pass value to Form.
    const { onChange } = this.props;
    const { available_port, ip } = this.state;

    this.state = {
      available_port:
        changedValue && changedValue.available_port
          ? changedValue.available_port
          : available_ports
          ? available_ports
          : available_port,
      ip: changedValue && changedValue.ip ? changedValue.ip : ip
    };
    onChange && onChange(Object.assign({}, this.state, changedValue));
  };

  render() {
    const { domain_port, current_enpoint } = this.props;

    const { ip, available_port } = this.state;
    return (
      <Row>
        <Col span={12}>
          <Select
            // value={ip}
            getPopupContainer={triggerNode => triggerNode.parentNode}
            onChange={this.handleCurrencyChange}
            style={{ width: '100%' }}
            placeholder="域名"
            defaultValue={
              current_enpoint && current_enpoint.length > 0
                ? current_enpoint[0].ip
                : domain_port[0].ip
            }
          >
            {(domain_port || []).map((item, index) => {
              return (
                <Select.Option value={item.ip} key={index}>
                  {item.ip}
                </Select.Option>
              );
            })}
          </Select>
        </Col>
        <Col span={2} style={{ textAlign: 'center' }}>
          :
        </Col>
        <Col span={8}>
          <Input
            defaultValue={
              current_enpoint && current_enpoint.length > 0
                ? current_enpoint[0].available_port
                : domain_port[0].available_port
            }
            placeholder="请输入端口"
            onChange={this.handleNumberChange}
            onBlur={this.handleBlur}
            value={available_port}
          />
        </Col>
      </Row>
    );
  }
}
export default PriceInput;
