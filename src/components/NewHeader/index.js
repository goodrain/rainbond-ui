import {
    Col,
    Icon,
    Input,
    notification,
    Row,
    Select,
    Tooltip
} from 'antd';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';

const { Option } = Select;
class Headers extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: [{ name: '', value: '', scope: 'Header', op: 'Equal' }]
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
        values[index].scope = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onSelect1Change = (value, index) => {
        const { values } = this.state;
        values[index].op = value;
        this.triggerChange(values);
        this.setValues(values);
    };

    setValues(arr) {
        const setArr = arr || [];
        if (!setArr.length) {
            setArr.push({ name: '', value: '', scope: 'Header', op: 'Equal' });
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
            values: values.concat({ name: '', value: '', scope: 'Header', op: 'Equal' })
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
                scope: values[i].scope,
                op: values[i].op
            });
        }
        const { onChange } = this.props;
        if (onChange) {
            onChange(res, this.props.index);
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
                            <Col span={5}>
                                <Select
                                    name="select"
                                    allowClear
                                    value={item.scope != '' ? item.scope : 'Header'}
                                    placeholder='scope'
                                    onChange={e => {
                                        this.onSelectChange(e, index);
                                    }}
                                    style={{ width: "90%" }}
                                >
                                    <Select.Option value="Header">Header</Select.Option>
                                    <Select.Option value="Query">Query</Select.Option>
                                    <Select.Option value="Cookie">Cookie</Select.Option>
                                </Select>
                            </Col>
                            <Col
                                span={5}
                            >
                                <Input
                                    style={{ width: "90%" }}
                                    name="name"
                                    onChange={e => {
                                        this.onNameChange(e.target.value, index);
                                    }}
                                    value={item.name || ''}
                                    placeholder={'name'}
                                />
                            </Col>
                            <Col span={7}>
                                <Select
                                    name="op"
                                    allowClear
                                    value={item.op !== '' ? item.op : 'Equal'}
                                    placeholder={'type'}
                                    onChange={e => {
                                        this.onSelect1Change(e, index);
                                    }}
                                    style={{ width: "95%" }}
                                >
                                    <Select.Option value="Equal">等于</Select.Option>
                                    <Select.Option value="NotEqual">不等于</Select.Option>
                                    <Select.Option value="GreaterThan">大于</Select.Option>
                                    <Select.Option value="LessThan">小于</Select.Option>
                                    <Select.Option value="NotIn">不包括</Select.Option>
                                    <Select.Option value="RegexMatch">正则匹配</Select.Option>
                                    <Select.Option value="RegexNotMatch">正则不匹配</Select.Option>
                                    <Select.Option value="RegexMatchCaseInsensitive">
                                        <Tooltip placement="left" title='正则匹配不区分大小写'>
                                            正则匹配不区分大小写
                                        </Tooltip>
                                    </Select.Option>
                                    <Select.Option value="RegexNotMatchCaseInsensitive">
                                        <Tooltip placement="left" title='正则不匹配不区分大小写'>
                                            正则不匹配不区分大小写
                                        </Tooltip>
                                    </Select.Option>
                                </Select>
                            </Col>
                            <Col
                                span={3}
                            >
                                <Input
                                    name="value"
                                    onChange={e => {
                                        this.onValueChange(e.target.value, index);
                                    }}
                                    value={item.value || ''}
                                    placeholder={'value'}
                                />
                            </Col>
                            <Col span={3} style={{ textAlign: 'center', marginLeft: 10 }}>
                                <Icon
                                    type={first ? 'plus-circle' : 'minus-circle'}
                                    style={{ fontSize: '20px' }}
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
