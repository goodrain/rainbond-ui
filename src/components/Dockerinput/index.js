import React, { Component } from 'react';
import { formatMessage } from '@/utils/intl';
import { Form, Checkbox, Row, Col, Select, Input, Button, Icon } from 'antd';

let uuid = 0;
class Parameterinput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: this.props.editInfo && this.props.editInfo.length>0?this.props.editInfo : [{ key: '', value: '' }]
        }
        // this.initFromProps();
    }
    add = () => {
        var values = this.state.values;
        this.setState({ values: values.concat({ key: '', value: '' }) })
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.editInfo.length !== this.props.editInfo.length) {
            this.initFromProps(nextProps.editInfo)
        }
    }

    initFromProps(values) {
        this.setState({ values })
        // var value = value || this.props.value;
        // if (value) {
        //     var res = [];
        //     var valArr = value.split(';');
        //     for (var i = 0; i < valArr.length; i++) {
        //         res.push({ key: valArr[i].split('=')[0], value: valArr[i].split('=')[1] });
        //     }
        //     this.setValues(res);
        // }
    }
    setValues(arr) {
        arr = arr || [];
        if (!arr.length) { arr.push({ key: '', value: '' }) };
        this.setState({ values: arr });
    }
    remove = (index) => {
        var values = this.state.values;
        values.splice(index, 1);
        this.setValues(values);
        this.triggerChange(values);
    }

    triggerChange(values) {
        // var res = [];
        // for (var i = 0; i < values.length; i++) {
        //     res.push(values[i].key + '=' + values[i].value);
        // }
        var onChange = this.props.onChange;
        onChange && onChange(values);
    }
    onKeyChange = (index, e) => {
        var values = this.state.values;
        values[index].key = e.target.value;

        this.triggerChange(values);
        this.setValues(values);

    }
    onValueChange = (index, e) => {
        var values = this.state.values;
        values[index].value = e.target.value;
        this.triggerChange(values);
        this.setValues(values);
    }
    render() {
        const keyPlaceholder = this.props.keyPlaceholder || `${formatMessage({id:'componentOverview.body.Dockerinput.key'})}`;
        const valuePlaceholder = this.props.valuePlaceholder || `${formatMessage({id:'componentOverview.body.Dockerinput.value'})}`;
        const values = this.state.values;
        const {editInfo}=this.props
        return (
            <div>
                {
                    values && values.length > 0 && values.map((item, index) => {
                        uuid++;
                        return (<Row key={index}>
                            <Col span={9}><Input name="key" onChange={this.onKeyChange.bind(this, index)} value={item.key} placeholder={keyPlaceholder} /></Col>
                            <Col span={2} style={{ textAlign: 'center' }}>:</Col>
                            <Col span={9}><Input name="value" onChange={this.onValueChange.bind(this, index)} value={item.value} placeholder={valuePlaceholder} /></Col>
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
export default Parameterinput;
