import {
    Col,
    Icon,
    Input,
    InputNumber,
    notification,
    Row,
    Select,
    Tooltip,
    Spin
} from 'antd';
import { connect } from 'dva';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from '../../utils/global'

const { Option } = Select;
@connect()
class Headers extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: [{ weight: '', port: '', name: '', PortList: [] }],
            portLoading: false,
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
        const { comList } = this.props;
        let str = ''
        comList.filter(i => {
            if (i.service_id == value) {
                str = i.service_alias
            }
        })
        values[index].name = str;
        this.triggerChange(values);
        this.setValues(values);
    };
    onWeightChange = (value, index) => {
        const { values } = this.state;
        values[index].weight = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onPortChange = (value, index) => {
        const { values } = this.state;
        values[index].port = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onPortListChange = (value, index) => {
        const { values } = this.state;
        values[index].PortList = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    setValues(arr) {
        const setArr = arr || [];
        if (!setArr.length) {
            setArr.push({ weight: '', port: '', name: '', PortList: [] });
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
            values: values.concat({ weight: '', port: '', name: '', PortList: [] })
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
                port: values[i].port,
                name: values[i].name,
                PortList: values[i].PortList
            });
        }
        const { onChange } = this.props;
        if (onChange) {
            onChange(res, this.props.index);
        }
    }
    /** 获取端口 */
    handlePorts = (service_id, index) => {
        this.handlePortLoading(true);
        const { dispatch, comList } = this.props
        const team_name = globalUtil.getCurrTeamName();
        const service_obj = comList.filter(item => {
            return item.service_id === service_id;
        });
        const serviceAlias =
            service_obj && service_obj.length > 0 && service_obj[0].service_alias;
        dispatch({
            type: 'appControl/fetchPorts',
            payload: {
                app_alias: serviceAlias,
                team_name
            },
            callback: data => {
                const list = (data && data.list) || [];
                this.setState({ portList: list },()=>{
                    this.onPortChange(this.state.portList[0].container_port, index)
                });
                this.onPortListChange(list, index)
                this.handlePortLoading(false);
            }
        });
    };
    handlePortLoading = loading => {
        this.setState({
            portLoading: loading
        });
    };
    handleName = (val, index) => {
        const { comList } = this.props
        let str = ''
        comList.map(i => {
            if (i.service_alias == val) {
                str = i.service_id
            }
        })
        return str || val
    }

    render() {
        const { setspan = false, comList, type } = this.props
        const { values, portList, portLoading } = this.state;
        const spanStyle = {
            color: '#8d9ba',
            fontSize: 14,
            fontWeight: 600,
            marginRight: 15
        }
        return (
            <div>
                {values.map((item, indexs) => {
                    const first = indexs === 0;
                    const key = item.name && this.handleName(item.name)
                    return (
                        <Row key={indexs} style={{ marginBottom: 10 }}>
                            <Col span={8}>
                                <Select
                                    value={key || undefined}
                                    getPopupContainer={triggerNode =>
                                        triggerNode.parentNode
                                    }
                                    placeholder={formatMessage({ id: 'placeholder.selectComponent' })}
                                    onChange={(val) => {
                                        this.handlePorts(val, indexs);
                                        this.onNameChange(val, indexs);

                                    }
                                    }
                                >
                                    {(comList || []).map((service, index) => {
                                        return (
                                            <Option value={`${service.service_id}`} key={index}>
                                                {service.service_cname}
                                            </Option>
                                        );
                                    })}
                                </Select>
                            </Col>
                            <Col span={8}>
                                <Spin spinning={portLoading}>
                                    <Select
                                        getPopupContainer={triggerNode =>
                                            triggerNode.parentNode
                                        }
                                        placeholder={formatMessage({ id: 'placeholder.selectPort' })}
                                        onChange={(val) => this.onPortChange(val, indexs)}
                                        value={item.port || undefined}
                                    >
                                        {(item.PortList || []).map((port, index) => {
                                            return (
                                                <Option value={port.container_port} key={index}>
                                                    {port.container_port}
                                                </Option>
                                            );
                                        })}
                                    </Select>
                                </Spin>
                            </Col>
                            <Col span={3}>
                                <InputNumber
                                    name="value"
                                    min={1}
                                    onChange={val => {
                                        this.onWeightChange(val, indexs);
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
                                            this.remove(indexs);
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
