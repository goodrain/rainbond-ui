import {
    Card,
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
import Filtration from './Filtration'
import DAHosts from "../../../DAHosts"
import Redirection from './Redirection'
import styles from './index.less'
const { Option } = Select;
class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: [
                {
                    type: "",
                    request_header_modifier: {
                        set: [
                            {
                                name: "",
                                value: ""
                            }
                        ],
                        add: [
                            {
                                name: "",
                                value: ""
                            }
                        ],
                        remove: [
                            ""
                        ]
                    },
                    request_redirect: {
                        scheme: "",
                        hostname: "",
                        port: '',
                        status_code: ''
                    }

                }
            ],
            selectType: ''
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
    onTypeChange = (val, index) => {
        const { values } = this.state;
        this.setState({
            selectType: val
        })
        values[index].type = val;
        this.triggerChange(values);
        this.setValues(values);
    };

    setValues(arr) {
        const setArr = arr || [];
        if (!setArr.length) {
            setArr.push({
                type: "",
                request_header_modifier: {
                    set: [
                        {
                            name: "",
                            value: ""
                        }
                    ],
                    add: [
                        {
                            name: "",
                            value: ""
                        }
                    ],
                    remove: [
                        ""
                    ]
                },
                request_redirect: {
                    scheme: "",
                    hostname: "",
                    port: '',
                    status_code: ''
                }

            });
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
            values: values.concat({
                type: "",
                request_header_modifier: {
                    set: [
                        {
                            name: "",
                            value: ""
                        }
                    ],
                    add: [
                        {
                            name: "",
                            value: ""
                        }
                    ],
                    remove: [
                        ""
                    ]
                },
                request_redirect: {
                    scheme: "",
                    hostname: "",
                    port: '',
                    status_code: ''
                }

            })
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
                type: values[i].type,
                request_header_modifier: values[i].request_header_modifier,
                request_redirect: values[i].request_redirect,
            });
        }
        const { onChange } = this.props;
        if (onChange) {
            onChange(res, this.props.index);
        }
    }

    setChange = (val, index) => {
        const { values } = this.state
        const arr = values
        arr[index].request_header_modifier.set = val
        this.setState({
            values: arr
        }, () => {
            this.triggerChange(this.state.values)
        })
    }
    addChange = (val, index) => {
        const { values } = this.state
        const arr = values
        arr[index].request_header_modifier.add = val
        this.setState({
            values: arr
        }, () => {
            this.triggerChange(this.state.values)
        })
    }
    removeChange = (val, index) => {
        const { values } = this.state
        const arr = values
        arr[index].request_header_modifier.remove = val
        this.setState({
            values: arr
        }, () => {
            this.triggerChange(this.state.values)
        })
    }
    requestChange = (val, index) => {
        const { values } = this.state
        const arr = values
        arr[index].request_redirect = val
        this.setState({
            values: arr
        }, () => {
            this.triggerChange(this.state.values)
        })
    }
    render() {
        const { setspan = false, editState, removeShow } = this.props
        const { values, selectType } = this.state;
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
                    const { request_header_modifier, request_redirect } = item
                    return (
                        <Row key={index} className={styles.RowStyle}>
                            <Card>
                                <Col span={23}>
                                    <Row>
                                        <Col span={6}><span>{formatMessage({id:'teamGateway.DrawerGateWayAPI.Redirection.type'})}</span></Col>
                                        <Col span={18}>
                                            <Row>
                                                <Col span={24}>
                                                    <Select
                                                        allowClear
                                                        name="select"
                                                        value={item.type || ''}
                                                        onChange={e => {
                                                            this.onTypeChange(e, index);
                                                        }}
                                                        style={{ width: "80%" }}
                                                        placeholder={formatMessage({id:'teamGateway.DrawerGateWayAPI.Redirection.select'})}
                                                    >
                                                        <Select.Option value="RequestRedirect">{formatMessage({id:'teamGateway.license.request'})}</Select.Option>
                                                        <Select.Option value="RequestHeaderModifier">{formatMessage({id:'teamGateway.license.processing'})}</Select.Option>
                                                    </Select>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>
                                    {item.type == "RequestHeaderModifier" &&
                                        <>
                                            <Row>
                                                <Col span={6}><span>{formatMessage({id:'teamGateway.DrawerGateWayAPI.Redirection.Cover'})}</span></Col>
                                                <Col span={18}> <Filtration onChange={this.setChange} value={request_header_modifier.set} index ={index} /> </Col>
                                            </Row>
                                            <Row
                                            >
                                                <Col span={6}><span>{formatMessage({id:'teamGateway.DrawerGateWayAPI.Redirection.add'})}</span></Col>
                                                <Col span={18}>
                                                    <Filtration onChange={this.addChange} value={request_header_modifier.add} index ={index}/>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col span={6}><span>{formatMessage({id:'teamGateway.DrawerGateWayAPI.Redirection.del'})}</span></Col>
                                                <Col span={18}>
                                                    <DAHosts setspan={14} setSvgSpan={1} onChange={this.removeChange} value={request_header_modifier.remove} index ={index}/>
                                                </Col>
                                            </Row>
                                        </>
                                    }
                                    {item.type == "RequestRedirect" &&
                                        <Row>
                                            <Col span={6}><span>{formatMessage({id:'teamGateway.DrawerGateWayAPI.Redirection.Redirection'})}</span></Col>
                                            <Col span={18}>
                                                <Redirection onChange={this.requestChange} value={request_redirect} index ={index}/>
                                            </Col>
                                        </Row>
                                    }
                                </Col>

                                {!editState &&
                                    <Col span={1} style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
                                        <Icon
                                            type={first ? 'plus-circle' : 'minus-circle'}
                                            style={{ fontSize: '20px', marginRight: 10 }}
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
                                                    this.props.removeValue(this.props.index)
                                                }}
                                            />
                                        }
                                    </Col>
                                }

                            </Card>
                        </Row>
                    );
                })
                }
            </div >
        );
    }
}

export default index;