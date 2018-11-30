import React, { Component } from 'react';
import { Form, Checkbox, Row, Col, Select, Input, Button, Icon } from 'antd';

class PriceInput extends React.Component {
    static getDerivedStateFromProps(nextProps) {
        // Should be a controlled component.
        if ('value' in nextProps) {
            return {
                ...(nextProps.value || {}),
            };
        }
        return null;
    }

    constructor(props) {
        super(props);
        this.state = {
            number: '',
            currency: undefined,
        };
    }
    handleNumberChange = (e) => {
        const number = parseInt(e.target.value || 0, 10);
        if (isNaN(number)) {
            return;
        }
        if (!('value' in this.props)) {
            this.setState({ number });
        }
        this.triggerChange({ number });
    }

    handleCurrencyChange = (currency) => {
        if (!('value' in this.props)) {
            this.setState({ currency });
        }
        this.triggerChange({ currency });
    }

    triggerChange = (changedValue) => {
        // Should provide an event to pass value to Form.
        const onChange = this.props.onChange;
        this.state = {
            number: this.props.domain_port[0].port,
            currency: this.props.domain_port[0].ip
        }
        if (onChange) {
            onChange(Object.assign({}, this.state, changedValue));
        }
    }
    render() {
        const { domain_port } = this.props;
        const state = this.state;
        return (

            <Row>
                <Col span={12}>
                    <Select
                        // value={state.currency}
                        onChange={this.handleCurrencyChange}
                        style={{ width: "100%" }}
                        placeholder="域名"
                        // defaultValue={domain_port[0].ip}
                    >
                        {/* <Select.Option value={domain_port.ip}>{domain_port.ip}</Select.Option> */}
                        {
                            (this.props.domain_port||[]).map((domain_port, index) => {
                                return <Select.Option value={domain_port.ip} key={index}>{domain_port.ip}</Select.Option>
                            })
                        }
                    </Select>
                </Col>
                <Col span={2} style={{ textAlign: 'center' }}>:</Col>
                <Col span={8}><Input defaultValue={domain_port[0].port} placeholder="请输入端口" onChange={this.handleNumberChange} /></Col>
            </Row>
        );
    }
}
export default PriceInput;