import React, { Fragment, PureComponent, Component } from 'react';
import { connect } from 'dva';
import { Drawer, Form, Button, Col, Row, Input, Select, DatePicker, Icon, Skeleton, Spin, Radio, Switch, notification } from 'antd';
import globalUtil from '../../utils/global';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from './index.less';
import HostAddress from '../HostAddress';
import DAHosts from '../DAHosts'
import NewHeader from '../NewHeader'
const { Option } = Select;
@Form.create()

@connect()

export default class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            upstreamType: 'node',
            schemeType: 'http',
            passHostType: '',
            loadbalancerType: 'hash',
        };
    }
    componentWillMount() {
        const { editInfo } = this.props;
        if (editInfo && editInfo.scheme) {
            this.setState({
                schemeType: editInfo.scheme
            })

        }
        if (editInfo && editInfo.passHost) {
            this.setState({
                passHostType: editInfo.passHost
            })
        }
        if(editInfo?.loadbalancer?.type && editInfo.loadbalancer.type !== 'hash'){
            this.setState({
                loadbalancerType: editInfo.loadbalancer.type
            })
        }
    }
    onClose = () => {
        this.props.onClose()
    }
    handleSubmit = e => {
        e.preventDefault();
        const { onOk, form } = this.props;
        form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                const data = {
                    passHost: values.passHost,
                    upstreamHost: values.upstreamHost || "",
                    retries: Number(values.retries),
                    scheme: values.scheme,
                    timeout: {
                        connect: values.connect ? values.connect + "s" : null,
                        send: values.send ? values.send + "s" : null,
                        read: values.read ? values.read + "s" : null
                    },
                    externalNodes: values.node.map(item => ({
                        name: this.splitAddress(item.key,'host'),
                        port: Number(this.splitAddress(item.key,'port')),
                        weight: Number(item.value),
                        type: "Domain"
                    })),
                    loadbalancer: {
                        type: values.loadbalancerType,
                        key: values.loadbalancerType == 'hash' ? values.loadbalancerHashOn : values.loadbalancerKey
                    }
                };
                if(values.connect===null && values.send===null && values.read===null){
                     data.timeout = {}
                }
                if (onOk) {
                    onOk({ name: values.name, values: data });
                }
            }
        });
    };
    upstreamTypeChange = (e) => {
        this.setState({
            upstreamType: e.target.value
        })
    }
    transformArray = (inputArray) => {
        return inputArray.map(item => {
            return {
                value: item.weight,
                key: item.name + ":" + item.port
            };
        });
    }
    splitAddress(inputAddress,type) {
        // 定义正则表达式匹配规则
        const pattern = /([^:]+)(:\d+)?/;
        // 使用正则表达式匹配输入的地址
        const match = inputAddress.match(pattern);
        if (match) {
            // 如果匹配成功
            const baseUrl = match[1];
            const port = match[2] ? match[2].substring(1) : "80";
            if(type === 'host'){
                return baseUrl;
            }
            return port;
        } else {
            // 如果匹配失败，抛出错误
            notification.error({
                message: '目标主机地址不能为空',
            });
        }
    }

    handleValidator = (rule, value, callback) => {
        if (value !== undefined && value !== null && value !== "" && parseInt(value, 10) <= 0) {
          callback('值需要大于0'); // 提示值需要大于0
        } else {
          callback();
        }
    }

    handleValidatorNode = (rule, val, callback) => {
        let isPass = false;
        if (val && val.length > 0) {
            val.some(item => {
            if (item.key && item.value) {
                if(item.value !== undefined && item.value !== null && item.value !== "" && parseInt(item.value, 10) <= 0){
                    callback(new Error('值需要大于0'));
                }else{
                    callback();
                }
                isPass = true;
            } else {
                isPass = false;
                return true;
            }
            });
            if (isPass) {
                callback();
            } else {
                callback(new Error('需要填写完整'));
            }
        } else {
            callback();
        }
    }


    render() {
        const { getFieldDecorator } = this.props.form;
        const { visible, groups, editInfo, appID } = this.props;
        const { upstreamType, schemeType, passHostType, loadbalancerType } = this.state;
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 3 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 18 }
            }
        };
        const formItemLayouts = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 6 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 18 }
            }
        };
        return (
            <Drawer
                title={ Object.keys(editInfo).length > 0 ? formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.edit'}) : formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.add'})}
                width={700}
                onClose={this.onClose}
                visible={visible}
                bodyStyle={{ paddingBottom: 80 }}
            >
                <Form hideRequiredMark onSubmit={this.handleSubmit}>
                    <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.GatewayRoute.name'})}>
                        {getFieldDecorator('name', {
                            rules: [{ required: true, message: formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.name'}) }],
                            initialValue: (editInfo && editInfo.name) || ''
                        })(<Input placeholder={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.name'})} disabled={editInfo && Object.keys(editInfo).length > 0} />)}
                    </Form.Item>
                    <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.Upstream'})}>
                        {getFieldDecorator('type'), {
                            initialValue: upstreamType,
                        }, (<Radio.Group onChange={this.upstreamTypeChange} defaultValue={upstreamType}>
                            <Radio.Button value="node">{formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.node'})}</Radio.Button>
                        </Radio.Group>)}
                    </Form.Item>
                    {upstreamType === 'node' &&
                        <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.host'})}>
                            {getFieldDecorator('node', {
                                rules: [
                                    { required: true, message: formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.InputHost'}) },
                                    { validator: this.handleValidatorNode }
                                ],
                                initialValue: (editInfo && editInfo.externalNodes && this.transformArray(editInfo.externalNodes)) || []
                            })(<HostAddress placeholder={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.InputHost'})} />)}
                        </Form.Item>
                    }
                    <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.RequestHeader'})}>
                        {getFieldDecorator('passHost', {
                            initialValue: (editInfo && editInfo.passHost) || 'pass'
                        })(
                            <Radio.Group
                                onChange={(e) => { this.setState({ passHostType: e.target.value }) }}
                            >
                                <Radio value="rewrite">{formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.IP'})}</Radio>
                                <Radio value="pass">{formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.unchanged'})}</Radio>
                            </Radio.Group>
                        )}
                    </Form.Item>
                    {passHostType == 'rewrite' &&
                        <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.Host'})}>
                            {getFieldDecorator('upstreamHost', {
                                rules: [{ required: true, message: formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.InputHosts'}) }],
                                initialValue: (editInfo && editInfo.upstreamHost) || ''
                            })(<Input placeholder={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.InputHosts'})} />)}
                        </Form.Item>
                    }

                    <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.protocol'})}>
                        {getFieldDecorator('scheme', {
                            initialValue: (editInfo && editInfo.scheme) || "http",
                        })(
                            <Radio.Group
                            >
                                <Radio value="http">HTTP</Radio>
                                <Radio value="https">HTTPS</Radio>
                            </Radio.Group>
                        )}
                    </Form.Item>
                    <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.send'})}>
                        {getFieldDecorator('send', {
                            rules: [{ validator: this.handleValidator }],
                            initialValue: (editInfo && editInfo.timeout && editInfo.timeout.send && parseInt(editInfo.timeout.send, 10)) || null
                        })(<Input placeholder={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.sentime'})} style={{ width: "30%" }} addonAfter="s" min={1} type="number" />)}
                    </Form.Item>
                    <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.accept'})}>
                        {getFieldDecorator('read', {
                            // rules: [{ required: true, message: formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.accepttime'}) }],
                            rules: [{ validator: this.handleValidator }],
                            initialValue: (editInfo && editInfo.timeout && editInfo.timeout.read && parseInt(editInfo.timeout.read, 10)) || null
                        })(<Input placeholder={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.accepttime'})} style={{ width: "30%" }} addonAfter="s" min={1} type="number" />)}
                    </Form.Item>
                    <Form.Item  {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.connect'})}>
                        {getFieldDecorator('connect', {
                            // rules: [{ required: true, message: formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.connecttime'}) }],
                            rules: [{ validator: this.handleValidator }],
                            initialValue: (editInfo && editInfo.timeout && editInfo.timeout.connect && parseInt(editInfo.timeout.connect, 10)) || null
                        })(<Input placeholder={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.connecttime'})} style={{ width: "30%" }} addonAfter="s" min={1} type="number" />)}
                    </Form.Item>
                    <Form.Item  {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.retry'})}>
                        {getFieldDecorator('retries', {
                            // rules: [{ required: true, message: formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.retryCount'}) }],
                            initialValue: (editInfo && editInfo.retries) || null
                        })(<Input placeholder={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.retryCount'})} style={{ width: "30%" }} addonAfter="次" />)}
                    </Form.Item>
                    <Row>
                        <Col span={3} style={{ height: 64, textAlign: 'end', marginTop: 10 }}>{formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.balancing'})}</Col>
                        <Col span={9}>
                            <Form.Item  {...formItemLayouts} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.balancingType'})} >
                                {getFieldDecorator('loadbalancerType', {
                                    // rules: [{ required: true, message: formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.selectType'}) }],
                                    initialValue: (editInfo && editInfo.loadbalancer && editInfo.loadbalancer.type) || 'roundrobin'
                                })(
                                    <Select
                                        getPopupContainer={triggerNode => triggerNode.parentNode}
                                        placeholder={ formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.selectType'})}
                                        onChange={(val) => { this.setState({ loadbalancerType: val }) }}
                                    >
                                        <Option value="hash">hash</Option>
                                        <Option value="roundrobin">roundrobin</Option>
                                        <Option value="ewma">ewma</Option>
                                        <Option value="least_conn">least_conn</Option>
                                    </Select>
                                )}
                            </Form.Item>
                        </Col>
                        {loadbalancerType === 'hash' ? (
                            <Col span={9}>
                                <Form.Item {...formItemLayouts} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.value'})} >
                                    {getFieldDecorator('loadbalancerHashOn', {
                                        // rules: [{ required: true, message: formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.name'}) }],
                                        initialValue: (editInfo && editInfo.loadbalancer && editInfo.loadbalancer.hashOn) || ''
                                    })(<Input placeholder={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.selectValue'})} style={{ width: "100%" }} />)}
                                </Form.Item>
                            </Col>
                        ) : (
                            <Col span={9}>
                                <Form.Item {...formItemLayouts} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.value'})} >
                                    {getFieldDecorator('loadbalancerKey', {
                                        // rules: [{ required: true, message: formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.name'}) }],
                                        initialValue: (editInfo && editInfo.loadbalancer && editInfo.loadbalancer.key) || 'remote_addr'
                                    })(
                                        <Select
                                            getPopupContainer={triggerNode => triggerNode.parentNode}
                                            placeholder={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.selectValue'})}
                                        >
                                            <Option value="host">host</Option>
                                            <Option value="remote_addr">remote_addr</Option>
                                            <Option value="uri">uri</Option>
                                            <Option value="server_name">server_name</Option>
                                            <Option value="server_addr">server_addr</Option>
                                            <Option value="request_uri">request_uri</Option>
                                            <Option value="query_string">query_string</Option>
                                            <Option value="remote_port">remote_port</Option>
                                            <Option value="hostname">hostname</Option>
                                            <Option value="arg_id">arg_id</Option>
                                        </Select>
                                    )}
                                </Form.Item>
                            </Col>
                        )}
                    </Row>
                </Form>
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        borderTop: '1px solid #e9e9e9',
                        padding: '10px 16px',
                        background: '#fff',
                        textAlign: 'right',
                    }}
                >
                    <Button onClick={this.onClose} style={{ marginRight: 8 }}>
                    {formatMessage({id:'popover.cancel'})}
                    </Button>
                    <Button type="primary" onClick={this.handleSubmit}>
                    {formatMessage({id:'popover.confirm'})}
                    </Button>
                </div>
            </Drawer>
        )
    }
}
