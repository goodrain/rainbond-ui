import {
    Col,
    Icon,
    Input,
    notification,
    Row,
    Select,
} from 'antd';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';

const { Option } = Select;
class Headers extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: [{ key: '', value: '', scope: '', op: '' }]
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
        values[index].key = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onValueChange = (value, index) => {
        const { values } = this.state;
        values[index].value = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    // onSelectChange = (value, index) => {
    //     const { values } = this.state;
    //     values[index].scope = value;
    //     this.triggerChange(values);
    //     this.setValues(values);
    // };
    // onSelect1Change = (value, index) => {
    //     const { values } = this.state;
    //     values[index].op = value;
    //     this.triggerChange(values);
    //     this.setValues(values);
    // };

    setValues(arr) {
        const setArr = arr || [];
        if (!setArr.length) {
            setArr.push({ key: '', value: '' });
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
            values: values.concat({ key: '', value: ''})
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
                key: values[i].key,
                value: values[i].value,
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

                            <Col
                                span={16}
                            >
                                <Input
                                    style={{ width: "90%"}}
                                    name="name"
                                    onChange={e => {
                                        this.onNameChange(e.target.value, index);
                                    }}
                                    value={item.key || ''}
                                    placeholder={'目标主机'}
                                />
                            </Col>
                            
                            <Col
                                span={4}
                            >
                                <Input
                                    name="value"
                                    type='number'
                                    min={1}
                                    onChange={e => {
                                        this.onValueChange(e.target.value, index);
                                    }}
                                    value={item.value||''}
                                    placeholder={'权重'}
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
