import React, { Component } from 'react'
import { connect } from 'dva';
import {
    Table,
    Card,
    Button,
    Row,
    Col,
    Form,
    Input,
    notification,
    Popconfirm,
    Tag,
    Tooltip,
    Select,
    Switch,
    Icon,
    InputNumber
} from 'antd';
import { formatMessage } from '@/utils/intl';
import globalUtil from '../../utils/global';
import PluginSystem from './Plugins'
import DApvcinput from './components/DApvcinput';
import DAHosts from './components/DAHosts'
import styles from './index.less'

@Form.create()
@connect()

export default class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            PluginData: PluginSystem.getFromOptins(this.props.info.name, this.props.info.config),
            PluginList: PluginSystem.getPluginList()
        };
    }
    componentDidMount() {
        
    }
    handleSelectChange = (val) => {
        this.setState({
            PluginData: PluginSystem.getFromOptins(val, {})
        })
    }
    getInitialValue = (value, defaultValue) => {
        if (value === undefined || value === null) {
            return defaultValue;
        }
        return value;
    }
    renderTooltip = ({ name, label, describe }) => {
        if (!label) {
            return describe;
        }
        return (
            <span>
                <span>{describe}</span>
                <br />
                <span>{formatMessage({ id: 'gatewayplugin.field_name' })}: {name}</span>
            </span>
        )
    }
    renderLabel = ({ name, label, describe }) => (
        <span className={styles.pluginFieldLabel}>
            <span className={styles.pluginFieldLabelName}>{label || name}</span>
            <Tooltip placement="top" title={this.renderTooltip({ name, label, describe })}>
                <Icon type="question-circle" className={styles.pluginFieldLabelIcon} />
            </Tooltip>
        </span>
    )
    fromItemRender = (PluginData) => {
        const { name, config, message } = PluginData
        const { getFieldDecorator } = this.props.form;
        const { formItemLayout } = this.props;
        const { PluginList } = this.state;
        return (
            <>
                <Form.Item label="插件名称" {...formItemLayout}>
                    {getFieldDecorator('name', {
                        initialValue: name || 'limit-req'
                    })(
                        <Select
                            style={{ width: '100%' }}
                            placeholder="请选择插件"
                            onChange={this.handleSelectChange}
                            allowClear
                        >
                            {PluginList && PluginList.map(item => {
                                const { name, message } = item
                                return <Select.Option key={name} value={name} disabled={this.props.pluginName.includes(name)}>
                                    <Tooltip placement="right" title={message}>
                                        <span style={{ width: "100%" }}>{name}</span>
                                    </Tooltip>
                                </Select.Option>

                            })}
                        </Select>
                    )}
                </Form.Item>
                {config && config.map(item => {
                    return this.FromTypeRender(item)
                })}
            </>
        )
    }
    FromTypeRender = val => {
        const { name, type, describe, placeholder, FromType, defaultValue, selectArr, value, rules, mode, rows } = val
        const { getFieldDecorator } = this.props.form;
        const { formItemLayout } = this.props;
        switch (FromType) {
            case 'password':
            case 'textarea':
            case 'input':
                return (
                    <Form.Item label={this.renderLabel(val)} {...formItemLayout}>
                        {getFieldDecorator(name, {
                            initialValue: this.getInitialValue(value, defaultValue),
                            rules: [...rules]
                        })(
                            type == 'integer'
                                ? <InputNumber style={{ width: '100%' }} placeholder={placeholder} />
                                : FromType == 'password'
                                    ? <Input.Password placeholder={placeholder} />
                                    : FromType == 'textarea'
                                        ? <Input.TextArea rows={rows || 4} placeholder={placeholder} />
                                        : <Input placeholder={placeholder} />
                        )}
                    </Form.Item>
                )
            case 'input_arr':
                const initValue = this.getInitialValue(value, defaultValue);
                let objectValue = [];
                if(type === 'object'){
                    if(initValue && Object.keys(initValue).length > 0){
                        Object.keys(initValue).forEach(key=>{
                            objectValue.push({
                                key: key,
                                value: initValue[key]
                            })
                        })
                    }else{
                        objectValue = undefined;
                    }
                }else{
                    objectValue = initValue;
                }
                return (
                    <Form.Item label={this.renderLabel(val)} {...formItemLayout}>
                        {getFieldDecorator(name, {
                            initialValue: objectValue,
                            rules: [...rules]
                        })(type === 'object' ? <DApvcinput sourcedata='object' setspan={11} setright={true}/> : <DAHosts setspan={22} setSvgSpan={1} hostPlaceholder={placeholder}/>)}
                    </Form.Item>
                )
            case 'select':
                return (
                    <Form.Item label={this.renderLabel(val)} {...formItemLayout}>
                        {getFieldDecorator(name, {
                            initialValue: this.getInitialValue(value, defaultValue),
                            rules: [...rules]
                        })(
                            <Select
                                mode={ mode || (name == 'method' ? 'multiple' : undefined)}
                                style={{ width: '100%' }}
                                placeholder={placeholder}
                            >
                                {selectArr && selectArr.map(item => (
                                    <Select.Option key={typeof item === 'object' ? item.value : item} value={typeof item === 'object' ? item.value : item}>
                                        {typeof item === 'object' ? item.label : item}
                                    </Select.Option>
                                ))}
                            </Select>
                        )}
                    </Form.Item>
                )
            case 'switch':
                return (
                    <Form.Item label={this.renderLabel(val)} {...formItemLayout}>
                        {getFieldDecorator(name, {
                            initialValue: this.getInitialValue(value, defaultValue),
                            rules: [...rules],
                            valuePropName: 'checked',
                        })(
                            <Switch />
                        )}
                    </Form.Item>
                )
            default:
                return null
        }

    }


    render() {
        const { PluginData } = this.state;
        return (
            <Card style={{marginBottom:12}}>
                <Form onSubmit={this.handleSubmit} >
                    {
                        PluginData &&
                        Object.keys(PluginData).length > 0 &&
                        this.fromItemRender(PluginData)
                    }
                </Form>
            </Card>
        )
    }
}
