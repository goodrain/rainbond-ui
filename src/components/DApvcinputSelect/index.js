import { 
    Col, 
    Icon, 
    Input, 
    notification, 
    Row, 
    Select 
} from 'antd';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
const { Option } = Select;
class DAinputs extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: [{ key: '', value: '', effect: '' }]
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
    onkeyChange = (value, index) => {
        const { values } = this.state;
        values[index].key = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onvalueChange = (value, index) => {
        const { values } = this.state;
        values[index].value = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onSelectChange = (value, index) => {
        const { values } = this.state;
        values[index].effect = value;
        this.triggerChange(values);
        this.setValues(values);
    };

    setValues(arr) {
        const setArr = arr || [];
        if (!setArr.length) {
            setArr.push({ key: '', value: '', effect: '' });
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
            values: values.concat({ key: '', value: '', effect: '' })
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
                effect: values[i].effect
            });
        }
        const { onChange } = this.props;
        if (onChange) {
            onChange(res);
        }
    }

    render() {
        const { setspan = false, editState, removeShow } = this.props
        const keyPlaceholder = this.props.keyPlaceholder || 'key';
        const repPlaceholder = this.props.repPlaceholder || 'value';
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
                                span={setspan || 4}
                            >
                                <span style={spanStyle}>key:</span>
                                <Input
                                    style={{ width: "80%" }}
                                    name="key"
                                    onChange={e => {
                                        this.onkeyChange(e.target.value, index);
                                    }}
                                    value={item.key}
                                    placeholder={keyPlaceholder}
                                    disabled={editState}
                                />
                            </Col>
                            <Col
                                span={setspan || 4}
                            >

                                <span style={spanStyle}>value:</span>
                                <Input
                                    style={{ width: "80%" }}
                                    name="value"
                                    onChange={e => {
                                        this.onvalueChange(e.target.value, index);
                                    }}
                                    value={item.value}
                                    placeholder={repPlaceholder}
                                    disabled={editState}
                                />
                            </Col>
                            <Col span={7}>
                                <span style={spanStyle}>策略:</span>
                                <Select
                                    name="select"
                                    allowClear
                                    value={item.effect}
                                    onChange={e => {
                                        this.onSelectChange(e, index);
                                    }}
                                    style={{ width: "80%" }}
                                    disabled={editState}
                                >
                                    <Select.Option value="NoExecute">NoExecute</Select.Option>
                                    <Select.Option value="PreferNoSchedule">PreferNoSchedule</Select.Option>
                                    <Select.Option value="NoSchedule">NoSchedule</Select.Option>
                                </Select>
                            </Col>
                            {!editState &&
                                <Col span={1}>
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
                                    {removeShow && first && values.length == 1 &&
                                        <Icon
                                            type={'minus-circle'}
                                            style={{ fontSize: '20px' }}
                                            onClick={() => {
                                                this.props.removeValue()
                                            }}
                                        />
                                    }

                                </Col>
                            }
                        </Row>
                    );
                })}
            </div>
        );
    }
}

export default DAinputs;