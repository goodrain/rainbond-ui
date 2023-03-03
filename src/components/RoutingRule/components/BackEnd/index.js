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
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from './index.less'
const { Option } = Select;
class DAinputs extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: [
                {
                  name: "",
                  weight: "",
                  kind: "",
                  namespace: "",
                  port: ""
                }
              ]
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
    onWeightChange = (value, index) => {
        const { values } = this.state;
        values[index].weight = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onNamespaceChange = (value, index) => {
        const { values } = this.state;
        values[index].namespace = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onPortChange = (value, index) => {
        const { values } = this.state;
        values[index].port = value;
        this.triggerChange(values);
        this.setValues(values);
    };
    onSelectChange = (value, index) => {
        const { values } = this.state;
        values[index].kind = value;
        this.triggerChange(values);
        this.setValues(values);
    };

    setValues(arr) {
        const setArr = arr || [];
        if (!setArr.length) {
            setArr.push({ name: '', weight: '', kind: '', namespace: '',port: '' });
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
            values: values.concat({ name: '', weight: '', kind: '', namespace: '',port: '' })
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
                weight: values[i].weight,
                kind: values[i].kind,
                namespace: values[i].namespace,
                port: values[i].port
            });
        }
        const { onChange } = this.props;
        if (onChange) {
            onChange(res,this.props.index);
        }
    }

    render() {
        const { editState, removeShow } = this.props
        const { values } = this.state;
        const spanStyle = {
            color: '#8d9ba',
            fontSize: 14,
            fontWeight: 600,
            marginRight: 15,
            textAlign: 'right'
        }
        return (
            <div>
                <h2>后端</h2>
                {values.map((item, index) => {
                    const first = index === 0;
                    return (
                        <Row key={index} className={styles.RowStyle}>
                            <Card style={{width:'100%'}}>
                            <Col span={22}>
                                <Row>
                                    <Col span={6}>
                                    <span style={spanStyle}>名称：</span>
                                    </Col>
                                    <Col span={18}>
                                    <Input
                                        style={{ width: "80%" }}
                                        name="key"
                                        onChange={e => {
                                            this.onNameChange(e.target.value, index);
                                        }}
                                        value={item.name}
                                        placeholder="请输入名称"
                                        disabled={editState}
                                    />
                                    </Col>
 
                                </Row>
                                <Row>
                                    <Col span={6}>
                                    <span style={spanStyle}>类型：</span>
                                    </Col>
                                    <Col span={18}>
                                    <Select
                                        name="select"
                                        allowClear
                                        value={item.kind || null}
                                        onChange={e => {
                                            this.onSelectChange(e, index);
                                        }}
                                        style={{ width: "80%" }}
                                        placeholder="请选择类型"
                                        disabled={editState}
                                    >
                                        <Select.Option value="HTTPRoute">HTTPRoute</Select.Option>
                                        <Select.Option value="Service">Service</Select.Option>
                                    </Select>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col span={6}>
                                    <span style={spanStyle}>命名空间：</span>
                                    </Col>
                                    <Col span={18}>
                                    <Input
                                        style={{ width: "80%" }}
                                        name="key"
                                        onChange={e => {
                                            this.onNamespaceChange(e.target.value, index);
                                        }}
                                        value={item.namespace}
                                        placeholder="请输入命名空间"
                                        disabled={editState}
                                    />
                                    </Col>
                                </Row>
                                <Row>
                                    <Col span={6}>
                                    <span style={spanStyle}>权重：</span>
                                    </Col>
                                    <Col span={18}>
                                    <Input
                                        style={{ width: "80%" }}
                                        name="value"
                                        onChange={e => {
                                            this.onWeightChange(e.target.value, index);
                                        }}
                                        value={item.weight}
                                        placeholder="请选择权重"
                                        disabled={editState}
                                    />
                                    </Col>
                                </Row>
                                <Row>
                                    <Col span={6}>
                                    <span style={spanStyle}>端口：</span>
                                    </Col>
                                    <Col span={18}>
                                    <Input
                                        style={{ width: "80%" }}
                                        name="value"
                                        onChange={e => {
                                            this.onPortChange(e.target.value, index);
                                        }}
                                        value={item.port}
                                        placeholder="请输入端口号"
                                        disabled={editState}
                                    />
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
                })}
            </div>
        );
    }
}

export default DAinputs;