import {
    Card,
    Col,
    Icon,
    Input,
    notification,
    Row,
    Select
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
            onChange(res,this.props.index);
        }
    }
    triggerChanges = (val, index) => {
        const {values} = this.state
        const arr = values
        arr[index].headers = val
        this.setState({
            values:arr
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
                <h2>条件匹配</h2>
                {values.map((item, index) => {
                    const first = index === 0;
                    const { headers, path } = item
                    return (
                        <Row key={index} className={styles.RowStyle}>
                            <Card>
                                <Col span={22}>
                                    <Row>
                                        <Col span={6}><span>Headers：</span></Col>
                                        <Col span={18}> <GateWayHeaders value={headers} onChange={this.triggerChanges} index={index}/> </Col>
                                    </Row>
                                    <Row
                                    >
                                        <Col span={6}><span>path：</span></Col>
                                        <Col span={18}>
                                            <Row>
                                                <Col
                                                    span={7}
                                                >
                                                    <Input
                                                        style={{ width: "80%" }}
                                                        name="key"
                                                        onChange={e => {
                                                            this.onkeyChange(e.target.value, index);
                                                        }}
                                                        value={path.value}
                                                        placeholder={'请输入name'}
                                                    />
                                                </Col>
                                                <Col 
                                                span={7}
                                                >
                                                    <Select
                                                        name="select"
                                                        allowClear
                                                        value={path.type}
                                                        placeholder={'请选择类型'}
                                                        onChange={e => {
                                                            this.onSelectChange(e, index);
                                                        }}
                                                        style={{ width: "80%" }}
                                                    >
                                                        <Select.Option value="Exact">Exact</Select.Option>
                                                        <Select.Option value="PathPrefix">PathPrefix</Select.Option>
                                                        <Select.Option value="RegularExpression">RegularExpression</Select.Option>
                                                    </Select>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>
                                </Col>

                                {!editState &&
                                    <Col span={2}>
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