import {
    Col,
    Icon,
    Input,
    notification,
    Row,
    Select,
    Card
} from 'antd';
import React, { Component } from 'react';
import { formatMessage } from '@/utils/intl';
import styles from './index.less'
const { Option } = Select;
class DAinputs extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: {
                scheme: "",
                hostname: "",
                port: '',
                status_code: 0
            },
            showport: false
        };
    }
    componentDidMount() {
        this.initFromProps();
    }

    componentWillReceiveProps(nextProps) {
        if ('value' in nextProps) {
            const { value } = nextProps;
            this.initFromProps(value);
        }
    }
    onSchemeChange = (value) => {
        const { values } = this.state;
        values.scheme = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onHostnameChange = (value, index) => {
        const { values } = this.state;
        values.hostname = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onStatusCodeChange = (value, index) => {
        const { values } = this.state;
        values.status_code = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onPortChange = (value, index) => {
        const { values } = this.state;
        values.port = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    setValues(obj) {
        const setArr = obj || [];
        if (!Object.keys(setArr).length) {
            setArr = {                 
            scheme: "",
            hostname: "",
            port: '',
            status_code: ''
        }
        }
        this.setState({ values: setArr });
    }
    initFromProps(value) {
        const setValue = value || this.props.value;
        if (setValue) {
            this.setValues(setValue);
        }
    }
    triggerChange(values) {
        const res = {};
            res.scheme = values.scheme
            res.hostname = values.hostname
            res.status_code = values.status_code
            res.port = values.port
        const { onChange } = this.props;
        if (onChange) {
            onChange(res, this.props.index);
        }
    }

    render() {
        const { editState, removeShow } = this.props
        const { values, showport } = this.state;
        const spanStyle = {
            color: '#8d9ba',
            fontSize: 14,
            fontWeight: 800,
            textAlign: 'right'
        }
        return (
            <div>
                        <Row  className={styles.RedirectionRowStyle}>
                            
                                    <Row>
                                        <Col span={6}>
                                            <span style={spanStyle}>{formatMessage({id:'teamGateway.DrawerGateWayAPI.Filtration.type'})}</span>
                                        </Col>
                                        <Col span={16}>
                                        <Select
                                                name="select"
                                                value={values.scheme}
                                                onChange={e => {
                                                    this.onSchemeChange(e);
                                                }}
                                                style={{ width: "80%" }}
                                                placeholder={formatMessage({id:'teamGateway.DrawerGateWayAPI.Filtration.select_type'})}
                                            >
                                                <Select.Option value="http">http</Select.Option>
                                                <Select.Option value="https">https</Select.Option>
                                            </Select>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col span={6}>
                                            <span style={spanStyle}>{formatMessage({id:'teamGateway.DrawerGateWayAPI.Filtration.hostname'})}</span>
                                        </Col>
                                        <Col span={16}>
                                            <Input
                                                style={{ width: "80%" }}
                                                name="key"
                                                onChange={e => {
                                                    this.onHostnameChange(e.target.value);
                                                }}
                                                value={values.hostname}
                                                placeholder={formatMessage({id:'teamGateway.DrawerGateWayAPI.Filtration.input_hostname'})}
                                            />
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col span={6}>
                                            <span style={spanStyle}>{formatMessage({id:'teamGateway.DrawerGateWayAPI.Filtration.port'})}</span>
                                        </Col>
                                        <Col span={16}>
                                            <Input
                                                style={{ width: "80%" }}
                                                name="key"
                                                onChange={e => {
                                                    this.onPortChange(e.target.value);
                                                }}
                                                value={values.port}
                                                placeholder={formatMessage({id:'teamGateway.DrawerGateWayAPI.Filtration.input_port'})}
                                                type='number'
                                            />

                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col span={6}>
                                            <span style={spanStyle}>{formatMessage({id:'teamGateway.DrawerGateWayAPI.Filtration.status_code'})}</span>
                                        </Col>
                                        <Col span={16}>
                                            {/* <Input
                                                style={{ width: "80%" }}
                                                name="key"
                                                onChange={e => {
                                                    this.onStatusCodeChange(e.target.value);
                                                }}
                                                value={values.status_code}
                                                placeholder={formatMessage({id:'teamGateway.DrawerGateWayAPI.Filtration.input_status_code'})}
                                                type='number'
                                            /> */}
                                            <Select
                                                name="select"
                                                value={values.status_code}
                                                allowClear
                                                onChange={e => {
                                                    this.onStatusCodeChange(e);
                                                }}
                                                style={{ width: "80%" }}
                                                placeholder={formatMessage({id:'teamGateway.DrawerGateWayAPI.Filtration.input_status_code'})}
                                            >
                                                <Select.Option value="301">301</Select.Option>
                                                <Select.Option value="302">302</Select.Option>
                                            </Select>
                                        </Col>
                                    </Row>
                        </Row>
            </div>
        );
    }
}

export default DAinputs;