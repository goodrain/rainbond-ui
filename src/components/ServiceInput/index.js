import {
    Col,
    Icon,
    Input,
    InputNumber,
    notification,
    Row,
    Select,
    Tooltip
} from 'antd';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from '../RouteDrawerHttp/index.less'

const { Option } = Select;
class Headers extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: [{ weight: '', value: '' }]
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
        values[index].value = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onValueChange = (value, index) => {
        const { values } = this.state;
        values[index].weight = value;
        this.triggerChange(values);
        this.setValues(values);
    };

    setValues(arr) {
        const setArr = arr || [];
        if (!setArr.length) {
            setArr.push({ weight: '', value: '' });
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
            values: values.concat({ weight: '', value: '' })
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
                weight: values[i].weight,
                value: values[i].value,
            });
        }
        const { onChange } = this.props;
        if (onChange) {
            onChange(res, this.props.index);
        }
    }

    render() {
        const { setspan = false, comList,type } = this.props
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
                        <Row key={index} style={{ marginBottom: 10 }}>
                            <Col span={17}>
                                <Select
                                    placeholder="选择服务"
                                    allowClear
                                    value={item.value || undefined}
                                    onChange={e => { this.onNameChange(e, index) }}
                                    style={{ width: '95%' }}
                                    dropdownRender={menu => (
                                        <div>
                                          {menu}
                                          <div
                                            style={{ padding: '4px 8px', cursor: 'pointer' }}
                                            onMouseDown={e => e.preventDefault()}
                                            onClick={()=>this.props.onClickEven()}
                                          >
                                            <Icon type="plus" /> 添加目标服务
                                          </div>
                                        </div>
                                      )}
                                >
                                    {comList &&
                                        type == 'service' ?
                                        comList.map((item, index) => {
                                            const { component_name, port, service_name } = item;
                                            if (service_name != null) {
                                                return (
                                                    <Option
                                                        value={`${service_name}:${port}`}
                                                        key={index + service_name}
                                                    >
                                                        <span>
                                                            服务名称：
                                                            {service_name}
                                                            <span style={{ color: 'rgb(0 0 0 / 31%)' }}>
                                                                ({component_name})
                                                            </span>{' '}
                                                            端口号：
                                                            {port}
                                                        </span>
                                                    </Option>
                                                );
                                            }
                                        })
                                        :
                                        comList.map((item, index) => {
                                            const { value } = item;
                                            if (value != null) {
                                                return (
                                                    <Option
                                                        value={`${value}`}
                                                        key={index + value}
                                                    >
                                                        <span>
                                                            服务名称：
                                                            {value}
                                                        </span>
                                                    </Option>
                                                );
                                            }
                                        })

                                    }
                                    
                                </Select>
                            </Col>
                            <Col span={3} className={styles.inputNumberStyle}>
                                <InputNumber
                                    name="value"
                                    min={1}
                                    onChange={val => {
                                        this.onValueChange(val, index);
                                    }}
                                    value={item.weight || ''}
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
                })
                }
            </div >
        );
    }
}

export default Headers;
