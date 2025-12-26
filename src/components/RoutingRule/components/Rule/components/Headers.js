import {
    Col,
    Icon,
    Input,
    notification,
    Row,
    Select,
} from 'antd';
import React, { Component } from 'react';
import { formatMessage } from '@/utils/intl';

const { Option } = Select;
class Headers extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: [{ name: '', value: '', type: '' }]
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
    onNameChange = (value, index) => {
        const { values } = this.state;
        values[index].name = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onValueChange = (value, index) => {
        const { values } = this.state;
        values[index].value = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onSelectChange = (value, index) => {
        const { values } = this.state;
        values[index].type = value;
        this.triggerChange(values);
        this.setValues(values);
    };

    setValues(arr) {
        const setArr = arr || [];
        if (!setArr.length) {
            setArr.push({ name: '', value: '', type: '' });
        }
        this.setState({ values: setArr });
    }
    initFromProps(value) {
        const setValue = value || this.props.value;
        if (setValue) {
            this.setValues(setValue);
        }
    }
    add = () => {
        const { values } = this.state;
        if (values.length > 100) {
            notification.warning({
                message: formatMessage({ id: 'notification.warn.add_max' })
            });
            return null;
        }
        this.setState({
            values: values.concat({ name: '', value: '', type: '' })
        });
    };

    remove = index => {
        const { values } = this.state;
        values.splice(index, 1);
        this.setValues(values);
        this.triggerChange(values);
    };
    triggerChange(values) {
        const res = [];
        for (let i = 0; i < values.length; i++) {
            res.push({
                name: values[i].name,
                value: values[i].value,
                type: values[i].type
            });
        }
        const { onChange } = this.props;
        if (onChange) {
            onChange(res,this.props.index);
        }
    }

    render() {
        const { setspan = false } = this.props
        const { values } = this.state;
        const spanStyle = {
            color: '#8d9ba',
            fontSize: 14,
            fontWeight: 600,
            marginRight: 15
        }
        return (
            <div>
                {values.map((item, index) => {
                    const first = index === 0;
                    return (
                        <Row key={index}>
                            <Col span={7}>
                                <Select
                                    name="select"
                                    allowClear
                                    value={item.type || ''}
                                    placeholder={'type'}
                                    onChange={e => {
                                        this.onSelectChange(e, index);
                                    }}
                                    style={{ width: "90%" }}
                                >
                                    <Select.Option value="Exact">{formatMessage({id:'teamGateway.license.Precise'})}</Select.Option>
                                    <Select.Option value="RegularExpression">{formatMessage({id:'teamGateway.license.regular'})}</Select.Option>
                                </Select>
                            </Col>
                            <Col
                                span={7}
                            >
                                <Input
                                    style={{ width: "90%"}}
                                    name="key"
                                    onChange={e => {
                                        this.onNameChange(e.target.value, index);
                                    }}
                                    value={item.name || ''}
                                    placeholder={'name'}
                                />
                            </Col>
                            <Col
                                span={7}
                            >

                                <Input
                                    style={{ width: "90%" }}
                                    name="value"
                                    onChange={e => {
                                        this.onValueChange(e.target.value, index);
                                    }}
                                    value={item.value||''}
                                    placeholder={'value'}
                                />
                            </Col>
                            <Col span={1}>
                                <Icon
                                    type={first ? 'plus-circle' : 'minus-circle'}
                                    style={{ fontSize: '20px', marginLeft:5 }}
                                    onClick={() => {
                                        if (first) {
                                            this.add();
                                        } else {
                                            this.remove(index);
                                        }
                                    }}
                                />
                            </Col>

                        </Row>
                    );
                })}
            </div>
        );
    }
}

export default Headers;
