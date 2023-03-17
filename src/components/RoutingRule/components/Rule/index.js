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
import GateWayHeaders from './components/Headers';
import styles from './index.less'
const { Option } = Select;
class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: [
                {
                    path: {
                        type: "",
                        value: ""
                    },
                    headers: [
                        {
                            name: "",
                            type: "",
                            value: ""
                        }
                    ]
                }
            ],
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
    onkeyChange = (val, index) => {
        const { values } = this.state;
        values[index].path.value = val;
        this.triggerChange(values);
        this.setValues(values);
    };
    onSelectChange = (val, index) => {
        const { values } = this.state;
        values[index].path.type = val;
        this.triggerChange(values);
        this.setValues(values);
    };

    setValues(arr) {
        const setArr = arr || [];

        if (!setArr.length) {
            setArr.push({
                path: {
                    type: "",
                    value: ""
                },
                headers: [
                    {
                        name: "",
                        type: "",
                        value: ""
                    }
                ]
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
                path: {
                    type: "",
                    value: ""
                },
                headers: [
                    {
                        name: "",
                        type: "",
                        value: ""
                    }
                ]
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
                headers: values[i].headers,
                path: values[i].path,
            });
        }
        const { onChange } = this.props;
        if (onChange) {
            onChange(res, this.props.index);
        }
    }
    triggerChanges = (val, index) => {
        const { values } = this.state
        const arr = values
        arr[index].headers = val
        this.setState({
            values: arr
        },()=>{
            this.triggerChange(this.state.values)
        })
    }

    render() {
        const { setspan = false, editState, removeShow } = this.props
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
                    const { headers, path } = item
                    let bool = true
                    if (path == null){
                        bool = false
                    }
                    return (
                        <Row key={index} className={styles.RowStyle}>
                            <Card>
                                <Col span={23}>
                                    <Row>
                                        <Col span={4}><span>Header：</span></Col>
                                        <Col span={20}> <GateWayHeaders value={headers} onChange={this.triggerChanges} index={index} /> </Col>
                                    </Row>
                                    <Row
                                    >
                                        <Col span={4}><span>path：</span></Col>
                                        <Col span={20}>
                                            <Row>
                                            <Col
                                                    span={7}
                                                >
                                                    <Select
                                                        name="select"
                                                        allowClear
                                                        value={bool ? item.path.type : ''}
                                                        placeholder={'type'}
                                                        onChange={e => {
                                                            this.onSelectChange(e, index);
                                                        }}
                                                        style={{ width: "90%" }}
                                                    >
                                                        <Select.Option value="Exact">{formatMessage({id:'teamGateway.license.Precise'})}</Select.Option>
                                                        <Select.Option value="PathPrefix">{formatMessage({id:'teamGateway.license.prefix'})}</Select.Option>
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
                                                            this.onkeyChange(e.target.value, index);
                                                        }}
                                                        value={bool ? item.path.value : ''}
                                                        placeholder={'value'}
                                                    />
                                                </Col>
                                               
                                            </Row>
                                        </Col>
                                    </Row>
                                </Col>

                                {!editState &&
                                    <Col span={1} style={{display:'flex',justifyContent:'center',paddingTop:10}}>
                                        <Icon
                                            type={first ? 'plus-circle' : 'minus-circle'}
                                            style={{ fontSize: '20px',marginRight:10 }}
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
                                                style={{ fontSize: '20px'}}
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