import React, { Fragment, PureComponent, Component } from 'react';
import { connect } from 'dva';
import { Drawer, Form, Button, Col, Row, Input, Select, DatePicker, Icon, Skeleton, Spin, Radio, Switch, notification, InputNumber } from 'antd';
import globalUtil from '../../utils/global';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from './index.less';
import HostAddress from '../HostAddress';
import DAHosts from '../DAHosts'
import NewHeader from '../NewHeader'
import cookie from '@/utils/cookie';
const { Option } = Select;
@Form.create()

@connect()

/**
 * 主要作用：网关服务抽屉组件，用于新增或编辑网关服务信息。
 * 
 * Props:
 * - visible: 控制抽屉的显示状态。
 * - editInfo: 编辑信息对象。
 * - appID: 应用程序ID。
 * - onClose: 关闭抽屉的回调函数。
 * - onOk: 提交表单的回调函数。
 * 
 * State:
 * - upstreamType: 上游类型，默认为'node'。
 * - schemeType: 协议类型，默认为'http'。
 * - passHostType: host请求头类型。
 * - loadbalancerType: 负载均衡器类型，默认为'hash'。
 * 
 * 方法:
 * - onClose(): 关闭抽屉的方法。
 * - handleSubmit(e): 提交表单的方法。
 * - upstreamTypeChange(e): 上游类型切换的回调函数。
 * - transformArray(inputArray): 将数组转换为指定格式。
 * - splitAddress(inputAddress, type): 解析地址，获取主机或端口。
 * - handleValidator(rule, value, callback): 自定义校验器，用于校验值是否大于0。
 * - handleValidatorNode(rule, val, callback): 自定义校验器，用于节点值的校验。
 */

export default class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            upstreamType: 'node',
            schemeType: 'http',
            passHostType: '',
            loadbalancerType: 'roundrobin',
            language: cookie.get('language') === 'zh-CN' ? true : false
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
    /**
     * 关闭对话框的回调函数，调用父组件传入的 onClose 函数。
     * 
     * @returns {void}
     */
    onClose = () => {
        this.props.onClose()
    }
    /**
     * 表单提交处理函数，验证表单并根据验证结果调用 onOk 函数触发父组件更新相应数据。
     * 
     * @param {Event} e - 事件对象。
     * @returns {void}
     */
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
                    }
                };
                if(values.loadbalancerType == 'chash'){
                    data.loadbalancer.key = values.loadbalancerHashOn
                    data.loadbalancer.hashOn = values.hashOn
                }
                if(values.connect===null && values.send===null && values.read===null){
                     data.timeout = {}
                }
                if (onOk) {
                    onOk({ name: values.name, values: data });
                }
            }
        });
    };
    /**
     * 上游类型改变时的回调函数，更新状态中的 upstreamType 值。
     * 
     * @param {object} e - 改变事件对象。
     * @returns {void}
     */
    upstreamTypeChange = (e) => {
        this.setState({
            upstreamType: e.target.value
        })
    }
    /**
     * 转换数组格式的工具函数，将传入的数组转换为符合特定格式的新数组。
     * key值为主机名+端口号
     * 
     * @param {Array} inputArray - 输入的数组。
     * @returns {Array} 转换后的数组。
     */
    transformArray = (inputArray) => {
        return inputArray.map(item => {
            return {
                value: item.weight,
                key: item.name + ":" + item.port
            };
        });
    }
    /**
     * 解析主机地址字符串，根据类型返回地址或端口部分。
     * 
     * @param {string} inputAddress - 输入的主机地址字符串。
     * @param {string} type - 类型，可以是 'host' 或 'port'。
     * @returns {string} 解析后的主机地址或端口部分。
     */
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
    /**
     * 处理表单字段校验，验证值是否大于0。
     * 
     * @param {object} rule - 验证规则对象。
     * @param {any} value - 要验证的值。
     * @param {function} callback - 回调函数，用于返回验证结果。
     * @returns {void}
     */
    handleValidator = (rule, value, callback) => {
        if (value !== undefined && value !== null && value !== "" && parseInt(value, 10) <= 0) {
          callback('值需要大于0'); // 提示值需要大于0
        } else {
          callback();
        }
    }
    /**
     * 处理节点表单字段校验，验证节点的 key 和 value 是否都存在且大于0。
     * 
     * @param {object} rule - 验证规则对象。
     * @param {array} val - 要验证的节点数组。
     * @param {function} callback - 回调函数，用于返回验证结果。
     * @returns {void}
     */
    // handleValidatorNode = (rule, val, callback) => {
    //     let isPass = false;
    //     const chineseRegex = /[\u4e00-\u9fa5]/; // 用于检测中文字符的正则表达式
    //     if (val && val.length > 0) {
    //         val.forEach(item => {
    //             if (item.key && item.value) {
    //                 // 检查是否包含中文字符
    //                 if (chineseRegex.test(item.key)) {
    //                     callback(new Error('值不能包含中文字符'));
    //                 } else if(item.value != undefined && item.value != null && item.value != "" &&( parseInt(item.value, 10) <= 0 || parseInt(item.value, 10) > 100)) {
    //                     callback(new Error('值需要1-100区间范围内'));
    //                 } else {
    //                     callback();
    //                 }
    //             } else {
    //                 isPass = false;
    //             }
    //         });
    //         if (isPass) {
    //             callback();
    //         } else {
    //             callback(new Error('需要填写完整'));
    //         }
    //     } else {
    //         callback();
    //     }
    // }
    handleValidatorNode = (rule, val, callback) => {
        const chineseRegex = /[\u4e00-\u9fa5]/; // 用于检测中文字符的正则表达式
    
        if (val && val.length > 0) {
            let hasError = false;  // 标记是否有错误
            val.forEach(item => {
                if (item.key != '' && item.value != '' && item.value !== undefined && item.value !== null) {
                    // 检查是否包含中文字符
                    if (chineseRegex.test(item.key)) {
                        callback(new Error('值不能包含中文字符'));
                        hasError = true;  // 一旦出错，停止后续校验
                        return; // 退出当前验证，不再继续验证后续项
                    } 
                    // 检查数值范围是否在 1-100 区间内
                    if (item.value !== "" && (parseInt(item.value, 10) <= 0 || parseInt(item.value, 10) > 100)) {
                        callback(new Error('值需要1-100区间范围内'));
                        hasError = true;
                        return;
                    }
                } else {
                    hasError = true;
                    callback(new Error('需要填写完整'));
                    return;
                }
            });
    
            // 如果有错误，直接返回
            if (!hasError) {
                callback(); // 如果没有错误，最终调用callback
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
                sm: { span: this.state.language ? 3 : 6 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: this.state.language ? 18 : 15 }
            }
        };
        const formItemLayouts = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 7 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 17 }
            }
        };
        const formItemLayoutsHash = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 8 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 16 }
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
                            rules: [
                                { required: true, message: formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.name'}) },
                                // 只允许输入小写英文字母
                                { pattern: /^[a-z]*$/, message: '只允许输入小写英文字母' }
                            ],
                            initialValue: (editInfo && editInfo.name) || ''
                        })(<Input placeholder={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.name'})} disabled={editInfo && Object.keys(editInfo).length > 0} />)}
                    </Form.Item>
                    <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.Upstream'})}>
                        {getFieldDecorator('type', {
                            initialValue: upstreamType
                        })(<Radio.Group onChange={this.upstreamTypeChange} defaultValue={upstreamType}>
                            <Radio.Button value="node">{formatMessage({ id: 'teamNewGateway.NewGateway.ServiceDrawer.node' })}</Radio.Button>
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
                            initialValue: (editInfo && editInfo.timeout && editInfo.timeout.send && parseInt(editInfo.timeout.send, 10)) || 5
                        })(<Input placeholder={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.sentime'})} style={{ width: "30%" }} addonAfter="s" min={1} type="number" />)}
                    </Form.Item>
                    <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.accept'})}>
                        {getFieldDecorator('read', {
                            rules: [{ validator: this.handleValidator }],
                            initialValue: (editInfo && editInfo.timeout && editInfo.timeout.read && parseInt(editInfo.timeout.read, 10)) || 5
                        })(<Input placeholder={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.accepttime'})} style={{ width: "30%" }} addonAfter="s" min={1} type="number" />)}
                    </Form.Item>
                    <Form.Item  {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.connect'})}>
                        {getFieldDecorator('connect', {
                            rules: [{ validator: this.handleValidator }],
                            initialValue: (editInfo && editInfo.timeout && editInfo.timeout.connect && parseInt(editInfo.timeout.connect, 10)) || 5
                        })(<Input placeholder={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.connecttime'})} style={{ width: "30%" }} addonAfter="s" min={1} type="number" />)}
                    </Form.Item>
                    <Form.Item  {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.retry'})}>
                        {getFieldDecorator('retries', {
                            initialValue: (editInfo && editInfo.retries) || null
                        })(<InputNumber placeholder={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.retryCount'})} style={{ width: "30%" }} addonAfter="次" />)}
                    </Form.Item>
                    <Form.Item  {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.balancingType'})} >
                                {getFieldDecorator('loadbalancerType', {
                                    initialValue: (editInfo && editInfo.loadbalancer && editInfo.loadbalancer.type) || 'roundrobin'
                                })(
                                    <Select
                                        getPopupContainer={triggerNode => triggerNode.parentNode}
                                        placeholder={ formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.selectType'})}
                                        onChange={(val) => { this.setState({ loadbalancerType: val }) }}
                                        style={{ width: "30%" }}
                                    >
                                        <Option value="chash">chash</Option>
                                        <Option value="roundrobin">roundrobin</Option>
                                        <Option value="ewma">ewma</Option>
                                        <Option value="least_conn">least_conn</Option>
                                    </Select>
                                )}
                            </Form.Item>
                        {loadbalancerType === 'chash' && (
                            <>
                                <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.value'})} >
                                    {getFieldDecorator('loadbalancerHashOn', {
                                        initialValue: (editInfo && editInfo.loadbalancer && editInfo.loadbalancer.key) || 'remote_addr'
                                    })(<Input placeholder={formatMessage({id:'teamNewGateway.NewGateway.ServiceDrawer.selectValue'})} style={{ width: "30%" }} />)}
                                </Form.Item>
                                <Form.Item {...formItemLayout} label='hashOn' >
                                    {getFieldDecorator('hashOn', {
                                        initialValue: (editInfo && editInfo.loadbalancer && editInfo.loadbalancer.hashOn) || 'vars'
                                    })(
                                        <Select
                                            getPopupContainer={triggerNode => triggerNode.parentNode}
                                            placeholder={'请选择hashOn'}
                                            style={{ width: "30%" }}
                                        >
                                            <Option value="vars">vars</Option>
                                            <Option value="header">header</Option>
                                            <Option value="vars_combinations">vars_combinations</Option>
                                            <Option value="cookie">cookie</Option>
                                            <Option value="consumers">consumers</Option>
                                        </Select>
                                    )}
                                </Form.Item>
                            </>
                        )}
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
