import React, { Component } from 'react';
import { Form, Checkbox, Row, Col, Select, Input, Button, Icon } from 'antd';

export default class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: [""]
        }
        this.initFromProps();
    }
    add = () => {
        var values = this.state.values;
        this.setState({ values: values.concat('') })
    }

    remove = (index) => {
        var values = this.state.values;
        values.splice(index, 1);
        this.setValues(values);
        // this.triggerChange(values);
    }



    componentWillReceiveProps(nextProps) {
        if ('value' in nextProps) {
            const value = nextProps.value;
            this.initFromProps(value);
        }
    }

    initFromProps(value) {
        var value = value || this.props.value;
            this.setValues(value);
    }
    setValues(arr) {
        arr = arr || [];
        if (!arr.length) { arr.push("") };
        this.setState({ values: arr });
    }

    triggerChange(values) {
        var onChange = this.props.onChange;
        onChange && onChange(values);
    }


    onKeyChange = (index, e) => {
        var values = this.state.values;
        values[index] = e.target.value;
        this.triggerChange(values);
        this.setValues(values);
    }
    render() {
        const keyPlaceholder = this.props.keyPlaceholder || '请输入组件地址';
        const values = this.state.values;
        return (
            <div>
                {
                    values.map((item, index) => {
                        return (<Row key={index}>
                            <Col span={20}><Input name="key" onChange={this.onKeyChange.bind(this, index)} value={item} placeholder={keyPlaceholder} /></Col>
                            <Col span={4} style={{ textAlign: 'center' }}>
                                {index == 0 ? <Icon type="plus-circle" onClick={this.add} style={{ fontSize: "20px" }} /> : <Icon type="minus-circle" style={{ fontSize: "20px" }} onClick={this.remove.bind(this, index)} />}
                            </Col>
                        </Row>)
                    })
                }
            </div>
        )
    }
}


