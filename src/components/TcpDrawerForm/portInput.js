import React, { Component } from 'react';
import { Form, Checkbox, Row, Col, Select, Input, Button, Icon, notification} from 'antd';

class PriceInput extends React.Component {
    static getDerivedStateFromProps(nextProps, nextState) {
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
            port: '',
            ip: undefined,
        };
    }
    handleNumberChange = (e) => {
        const port = Number(e.target.value);
        if (isNaN(port)) {
            return;
        }
        if (!('value' in this.props)) {
            this.setState({ port });
        }
        this.triggerChange({ port });
    }

    handleCurrencyChange = (ip) => {
        if (!('value' in this.props)) {
            this.setState({ ip });
        }
        this.triggerChange({ ip });
    }
    handleBlur=()=>{
        const {port} = this.state;
        if(port<20000){
            notification.warning({message:"你填写的端口小于20000且选用默认IP, 应用网关将监听 0.0.0.0:20001 如不能访问请查询是否端口冲突。",duration:"6"})
        }
    }
    triggerChange = (changedValue) => {
        // Should provide an event to pass value to Form.
        const onChange = this.props.onChange;
        this.state = {
            port: this.props.domain_port[0].port,
            ip: this.props.domain_port[0].ip
        }
        // if (onChange) {
            onChange(Object.assign({}, this.state, changedValue));
        // }
    }
    render() {
        const { domain_port } = this.props;
        const {ip} = this.state;
        return (

            <Row>
                <Col span={12}>
                    <Select
                        // value={ip}
                        onChange={this.handleCurrencyChange}
                        style={{ width: "100%" }}
                        placeholder="域名"
                        defaultValue={domain_port[0].ip}
                    >
                        {
                            (this.props.domain_port||[]).map((domain_port, index) => {
                                return <Select.Option value={domain_port.ip} key={index}>{domain_port.ip}</Select.Option>
                            })
                        }
                    </Select>
                </Col>
                <Col span={2} style={{ textAlign: 'center' }}>:</Col>
                <Col span={8}><Input defaultValue={domain_port[0].port} placeholder="请输入端口" onChange={this.handleNumberChange} onBlur={this.handleBlur}/></Col>
            </Row>
        );
    }
}
export default PriceInput;