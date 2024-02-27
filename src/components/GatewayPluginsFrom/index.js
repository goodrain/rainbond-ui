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
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import globalUtil from '../../utils/global';
import PluginSystem from './Plugins'
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
                                return <Option key={name} value={name}>
                                    <Tooltip placement="right" title={message}>
                                        <span style={{ width: "100%" }}>{name}</span>
                                    </Tooltip>
                                </Option>

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
        const { name, type, describe, placeholder, FromType, defaultValue, selectArr, value, rules } = val
        const { getFieldDecorator } = this.props.form;
        const { formItemLayout } = this.props;
        switch (FromType) {
            case 'input':
                return (
                    <Form.Item label=
                        {
                            <span>
                                {name}
                                <Tooltip placement="top" title={describe}>
                                    <Icon type="question-circle" style={{ marginLeft: 4 }} />
                                </Tooltip>
                            </span>
                        }
                        {...formItemLayout}>
                        {getFieldDecorator(name, {
                            initialValue: value || defaultValue,
                            rules: [...rules]
                        })(type == 'integer' ? <InputNumber placeholder={placeholder} /> : <Input placeholder={placeholder} />)}
                    </Form.Item>
                )
            case 'select':
                return (
                    <Form.Item label=
                        {
                            <span>
                                {name}

                                <Tooltip placement="top" title={describe} >
                                    <Icon type="question-circle" style={{ marginLeft: 4 }} />
                                </Tooltip>
                            </span>
                        }
                        {...formItemLayout}>
                        {getFieldDecorator(name, {
                            initialValue: value || defaultValue,
                            rules: [...rules]
                        })(
                            <Select
                                style={{ width: '100%' }}
                                placeholder={placeholder}
                            >
                                {selectArr && selectArr.map(item => (
                                    <Option key={item} value={item}>
                                        {item}
                                    </Option>
                                ))}
                            </Select>
                        )}
                    </Form.Item>
                )
            case 'switch':
                return (
                    <Form.Item label=
                        {
                            <span>
                                {name}
                                <Tooltip placement="top" title={describe} >
                                    <Icon type="question-circle" style={{ marginLeft: 4 }} />
                                </Tooltip>
                            </span>
                        }
                        {...formItemLayout}>
                        {getFieldDecorator(name, {
                            initialValue: value || defaultValue,
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
