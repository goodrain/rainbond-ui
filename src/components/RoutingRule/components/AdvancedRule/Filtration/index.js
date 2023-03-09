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
import styles from './index.less'
const { Option } = Select;
class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: [
                {
                    value: '',
                    name: '',
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
    onValueChange = (val, index) => {
        const { values } = this.state;
        values[index].value = val;
        this.triggerChange(values);
        this.setValues(values);
    };
    onNameChange = (val, index) => {
        const { values } = this.state;
        values[index].name = val;
        this.triggerChange(values);
        this.setValues(values);
    };

    setValues(arr) {
        const setArr = arr || [];

        if (!setArr.length) {
            setArr.push({ name: "", value: "" });
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
            values: values.concat(
                { name: "", value: "" }
            )
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
            });
        }
        const { onChange } = this.props;
        if (onChange) {
            onChange(res, this.props.index);
        }
    }
    render() {
        const { setspan = false, editState, } = this.props
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
                        <Row key={index} className={styles.RowStyle}>
                            <Col
                                span={7}
                            >
                                <Input
                                    style={{ width: "95%" }}
                                    name="name"
                                    onChange={e => {
                                        this.onNameChange(e.target.value, index);
                                    }}
                                    value={item.name}
                                    placeholder={'name'}
                                />
                            </Col>
                            <Col
                                span={7}
                            >
                                <Input
                                    style={{ width: "100%" }}
                                    name="value"
                                    onChange={e => {
                                        this.onValueChange(e.target.value, index);
                                    }}
                                    value={item.value}
                                    placeholder={'value'}
                                />
                            </Col>

                            {!editState &&
                                <Col span={1} style={{ display: 'flex', justifyContent: 'center', marginLeft:10}}>
                                    <Icon
                                        type={first ? 'plus-circle' : 'minus-circle'}
                                        style={{ fontSize: '20px'}}
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
                        </Row>
                    );
                })
                }
            </div >
        );
    }
}

export default index;