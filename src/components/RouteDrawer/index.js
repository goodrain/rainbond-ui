import React, { Fragment, PureComponent, Component } from 'react';
import { connect } from 'dva';
import { Drawer, Form, Button, Col, Row, Input, Select, DatePicker, Icon, Skeleton, Spin, Radio, Switch } from 'antd';
import globalUtil from '../../utils/global';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import styles from './index.less';
import DAinput from '../DAinput';
import DAHosts from '../DAHosts'
import NewHeader from '../NewHeader'
const { Option } = Select;
@Form.create()

@connect(({ user, global, loading, teamControl, enterprise }) => ({
    currUser: user.currentUser,
    groups: global.groups,
    currentTeam: teamControl.currentTeam,
    currentEnterprise: enterprise.currentEnterprise,
}))

export default class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isPerform: true,
            serviceComponentLoading: true,
            portLoading: false,
            dataList: [],
            loading: true,
            page_num: 1,
            page_size: 10,
            total: '',
            http_search: '',
            groupSelect: 'k8s',
            showServiceMore: false,
            showMateMore: false,
            selsectRewrite: 'rewrite',
        };
    }
    componentWillMount() {
        const { groups } = this.props;
        if (groups && groups.length > 0) {
            console.log(groups[0], "groups[0].group_id");
            this.handleServices({ key: groups[0].group_id });
        }
    }

    onClose = () => {
        this.props.onClose()
    }
    handleSubmit = e => {
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                console.log('Received values of form: ', values);
            }
        });
    };
    /** 获取组件 */
    handleServices = groupObj => {
        this.handleComponentLoading(true);
        const { dispatch, editInfo, groups, form } = this.props;
        const { setFieldsValue } = form;
        const { isPerform } = this.state;
        const team_name = globalUtil.getCurrTeamName();
        /** 获取对应的group_name */
        let group_obj = null;
        if (groups) {
            group_obj = groups.filter(item => {
                return item.group_id == groupObj.key;
            });
        }
        if (group_obj && group_obj.length > 0) {
            this.setState({ group_name: group_obj[0].group_name });
        }
        dispatch({
            type: 'application/fetchApps',
            payload: {
                page_size: -1,
                group_id: groupObj.key,
                team_name
            },
            callback: data => {
                console.log(data, "data");
                const list = (data && data.list) || [];
                this.setState(
                    {
                        serviceComponentList: list,
                        serviceComponentLoading: false
                    },
                    () => {
                        let serviceId =
                            (list && list.length > 0 && list[0].service_id) || undefined;
                        const info = {};
                        if (serviceId) {
                            const services = list.filter(item => {
                                return item.service_id === (editInfo && editInfo.service_id);
                            });
                            if (isPerform && services.length > 0) {
                                serviceId = editInfo.service_id;
                            }
                            this.handlePorts(serviceId);
                        } else {
                            info.container_port = undefined;
                        }
                        info.service_id = serviceId;
                        setFieldsValue(info);
                    }
                );
                this.handleComponentLoading(false);
            }
        });
    };
    /** 获取端口 */
    handlePorts = service_id => {
        this.handlePortLoading(true);
        const { dispatch, editInfo, form } = this.props;
        const { isPerform, serviceComponentList } = this.state;
        const { setFieldsValue } = form;
        const team_name = globalUtil.getCurrTeamName();
        const service_obj = serviceComponentList.filter(item => {
            return item.service_id === service_id;
        });
        const serviceAlias =
            service_obj && service_obj.length > 0 && service_obj[0].service_alias;
        if (!serviceAlias) {
            setFieldsValue({
                container_port: undefined
            });
            this.handlePortLoading(false);
            return null;
        }
        dispatch({
            type: 'appControl/fetchPorts',
            payload: {
                app_alias: serviceAlias,
                team_name
            },
            callback: data => {
                const list = (data && data.list) || [];
                this.setState({ portList: list }, () => {
                    let containerPort =
                        (list && list.length > 0 && list[0].container_port) || undefined;
                    if (containerPort) {
                        const containerPorts = list.filter(item => {
                            return (
                                item.container_port === (editInfo && editInfo.container_port)
                            );
                        });
                        if (isPerform && containerPorts.length > 0) {
                            this.setState({
                                isPerform: false
                            });
                            containerPort = editInfo.container_port;
                        }
                    }
                    setFieldsValue({
                        container_port: containerPort
                    });
                });
                this.handlePortLoading(false);
            }
        });
    };
    handleComponentLoading = loading => {
        this.setState({
            componentLoading: loading
        });
    };
    handlePortLoading = loading => {
        this.setState({
            portLoading: loading
        });
    };
    groupChange = e => {
        this.setState({
            groupSelect: e.target.value
        });
    }
    rewriteChange = e => {
        this.setState({
            selsectRewrite: e.target.value
        });
    }
    render() {
        const { getFieldDecorator } = this.props.form;
        const { visible, groups, editInfo, appID } = this.props;
        const { serviceComponentList, serviceComponentLoading, portList, componentLoading, portLoading, groupSelect, showServiceMore, showMateMore, selsectRewrite } = this.state
        const isOk = !(componentLoading || portLoading);
        const serviceId = editInfo && editInfo.service_id && editInfo.service_id;
        const serviceIds =
            serviceComponentList &&
            serviceComponentList.length > 0 &&
            serviceComponentList[0].service_id;
        const appKey = groups && groups.length > 0 && { key: groups[0].group_name };
        const appKeys = editInfo &&
            editInfo.g_id &&
            editInfo.group_name && {
            key: editInfo.g_id,
            label: editInfo.group_name
        };
        const containerPort =
            editInfo && editInfo.container_port && editInfo.container_port;
        const containerPorts =
            portList && portList.length > 0 && portList[0].container_port;
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
        const MethodOptions = [
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' },
            { label: 'DELETE', value: 'DELETE' },
            { label: 'OPTIONS', value: 'OPTIONS' },
            { label: 'HEAD', value: 'HEAD' },
            { label: 'PATCH', value: 'PATCH' },
            { label: 'TRACE', value: 'TRACE' },
        ];
        return (
            <Drawer
                title={"新增路由"}
                width={700}
                onClose={this.onClose}
                visible={visible}
                bodyStyle={{ paddingBottom: 80 }}
            >
                <Form hideRequiredMark onSubmit={this.handleSubmit}>
                    <Form.Item {...formItemLayout} label="名称">
                        {getFieldDecorator('name', {
                            rules: [{ required: true, message: 'Please enter user name' }],
                        })(<Input placeholder="Please enter user name" />)}
                    </Form.Item>
                    <Form.Item {...formItemLayout} label="域名">
                        {getFieldDecorator('yumin', {
                            rules: [{ required: true, message: 'Please enter user name' }],
                        })(<DAHosts />)}
                    </Form.Item>
                    <Row>
                        <Col>
                            <Form.Item {...formItemLayout} label="匹配规则">
                                {getFieldDecorator('guize', {
                                    rules: [{ required: true, message: 'Please enter user name' }],
                                })(<DAHosts />)}
                            </Form.Item>
                        </Col>
                        <Col style={{ position: 'absolute', right: 0, top: '5%' }}>
                            {
                                !showMateMore ?
                                    <Button
                                        type="link"
                                        className={styles.buttonStyle}
                                        onClick={() => { this.setState({ showMateMore: !this.state.showMateMore }) }}
                                    >
                                        更多 {globalUtil.fetchSvg('gatewayMore', "#3d54c4", 10)}
                                    </Button>
                                    :
                                    <Button
                                        type="link"
                                        className={styles.buttonStyle}
                                        onClick={() => { this.setState({ showMateMore: !this.state.showMateMore }) }}
                                    >
                                        取消 {globalUtil.fetchSvg('gatewayMore', "#3d54c4", 10)}
                                    </Button>
                            }
                        </Col>
                    </Row>
                    {showMateMore && (
                        <Fragment>
                            <Form.Item {...formItemLayout} label="Method" >
                                {getFieldDecorator('Method',
                                    { initialValue: "POST" },
                                )(
                                    <Select
                                        mode="multiple"
                                        style={{ width: '100%' }}
                                        placeholder="Please select"
                                    >
                                        {MethodOptions.map(item => (
                                            <Option key={item.value} value={item.value}>
                                                {item.label}
                                            </Option>
                                        ))}
                                    </Select>
                                )}
                            </Form.Item>
                            <Form.Item {...formItemLayout} label="优先级">
                                {getFieldDecorator('name', {
                                    rules: [{ required: true, message: 'Please enter user name' }],
                                })(<Input type='number' placeholder="Please enter user name" />)}
                            </Form.Item>
                            <Form.Item {...formItemLayout} label="路径重写">
                                {getFieldDecorator('rewrite', {
                                    rules: [{ required: true, message: 'Please enter user name' }],
                                    initialValue: selsectRewrite
                                })(
                                    <Radio.Group onChange={this.rewriteChange}>
                                        <Radio value="rewrite">不重写</Radio>
                                        <Radio value="unRewrite">正则重写</Radio>
                                    </Radio.Group>)}
                            </Form.Item>
                            {selsectRewrite == 'unRewrite' &&
                                <Form.Item {...formItemLayout} label="重写规则">
                                    {getFieldDecorator('unRewrite', {
                                        rules: [{ required: true, message: 'Please enter user name' }],
                                    })(<DAinput />)}
                                </Form.Item>
                            }
                            {/* <Form.Item {...formItemLayout} label="请求头重写">
                                {getFieldDecorator('header', {
                                    rules: [{ required: true, message: 'Please enter user name' }],
                                })(<DAinput />)}
                            </Form.Item> */}
                            <Form.Item {...formItemLayout} label="高级条件">
                                {getFieldDecorator('gaoji', {
                                    rules: [{ required: true, message: 'Please enter user name' }],
                                })(<NewHeader />)}
                            </Form.Item>
                        </Fragment>
                    )}
                    <Form.Item {...formItemLayout} label="服务来源" >
                        {getFieldDecorator('type',
                            { initialValue: groupSelect },
                        )(
                            <Radio.Group onChange={this.groupChange}>
                                <Radio value="k8s">k8s</Radio>
                                <Radio value="advanced">高级</Radio>
                            </Radio.Group>,
                        )}
                    </Form.Item>
                    {groupSelect == 'k8s' ? (
                        <Fragment>
                            <Skeleton loading={serviceComponentLoading} active>
                                <Fragment>
                                    <Form.Item {...formItemLayout} label={formatMessage({ id: 'popover.newApp.appName' })}>
                                        {getFieldDecorator('group_id', {
                                            rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }],
                                            initialValue: appKey || appKeys || undefined
                                        })(
                                            <Select
                                                getPopupContainer={triggerNode => triggerNode.parentNode}
                                                labelInValue
                                                disabled={appID}
                                                placeholder={formatMessage({ id: 'placeholder.appName' })}
                                                onChange={this.handleServices}
                                            >
                                                {(groups || []).map(group => {
                                                    return (
                                                        <Option
                                                            value={`${group.group_id}`}
                                                            key={group.group_id}
                                                        >
                                                            {group.group_name}
                                                        </Option>
                                                    );
                                                })}
                                            </Select>
                                        )}
                                    </Form.Item>
                                    <Spin spinning={componentLoading}>
                                        <Form.Item {...formItemLayout} label={formatMessage({ id: 'popover.access_strategy.lable.component' })}>
                                            {getFieldDecorator('service_id', {
                                                rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }],
                                                initialValue: serviceId || serviceIds || undefined
                                            })(
                                                <Select
                                                    getPopupContainer={triggerNode =>
                                                        triggerNode.parentNode
                                                    }
                                                    placeholder={formatMessage({ id: 'placeholder.selectComponent' })}
                                                    onChange={this.handlePorts}
                                                >
                                                    {(serviceComponentList || []).map((service, index) => {
                                                        return (
                                                            <Option value={`${service.service_id}`} key={index}>
                                                                {service.service_cname}
                                                            </Option>
                                                        );
                                                    })}
                                                </Select>
                                            )}
                                        </Form.Item>
                                    </Spin>
                                    <Spin spinning={!isOk}>
                                        <Form.Item
                                            {...formItemLayout}
                                            label={formatMessage({ id: 'popover.access_strategy.lable.port' })}
                                            style={{ marginBottom: '40px' }}
                                        >
                                            {getFieldDecorator('container_port', {
                                                initialValue:
                                                    containerPort || containerPorts || undefined,
                                                rules: [{ required: true, message: formatMessage({ id: 'placeholder.selectPort' }) }]
                                            })(
                                                <Select
                                                    getPopupContainer={triggerNode =>
                                                        triggerNode.parentNode
                                                    }
                                                    placeholder={formatMessage({ id: 'placeholder.selectPort' })}
                                                >
                                                    {(portList || []).map((port, index) => {
                                                        return (
                                                            <Option value={port.container_port} key={index}>
                                                                {port.container_port}
                                                            </Option>
                                                        );
                                                    })}
                                                </Select>
                                            )}
                                        </Form.Item>
                                    </Spin>
                                </Fragment>
                            </Skeleton>
                        </Fragment>
                    ) : (
                        <Fragment>
                            <Row>
                                <Col>
                                    <Form.Item {...formItemLayout} label="目标服务">
                                        {getFieldDecorator('name', {
                                            rules: [{ required: true, message: 'Please enter user name' }],
                                        })(<Input placeholder="Please enter user name" />)}
                                    </Form.Item>
                                </Col>
                                <Col style={{ position: 'absolute', right: 0, top: '5%' }}>
                                    {
                                        !showServiceMore ?
                                            <Button
                                                type="link"
                                                className={styles.buttonStyle}
                                                onClick={() => { this.setState({ showServiceMore: !this.state.showServiceMore }) }}
                                            >
                                                更多 {globalUtil.fetchSvg('gatewayMore', "#3d54c4", 10)}
                                            </Button>
                                            :
                                            <Button
                                                type="link"
                                                className={styles.buttonStyle}
                                                onClick={() => { this.setState({ showServiceMore: !this.state.showServiceMore }) }}
                                            >
                                                取消 {globalUtil.fetchSvg('gatewayMore', "#3d54c4", 10)}
                                            </Button>
                                    }
                                </Col>
                            </Row>
                            {showServiceMore && (<>
                                <Form.Item {...formItemLayout} label="版本">
                                    {getFieldDecorator('name', {
                                        rules: [{ required: true, message: 'Please enter user name' }],
                                    })(<Input placeholder="Please enter user name" />)}
                                </Form.Item>
                                <Form.Item {...formItemLayout} label="重定向">
                                    {getFieldDecorator('name', {
                                        rules: [{ required: true, message: 'Please enter user name' }],
                                    })(<Input placeholder="Please enter user name" />)}
                                </Form.Item>
                            </>)}
                            <Form.Item {...formItemLayout} label="websocket">
                                    {getFieldDecorator('websocket', { valuePropName: 'checked' })(<Switch />)}
                                </Form.Item>
                                <Form.Item {...formItemLayout} label="是否启用">
                                    {getFieldDecorator('websocket', { valuePropName: 'checked' })(<Switch />)}
                                </Form.Item>

                        </Fragment>
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
                        Cancel
                    </Button>
                    <Button type="primary" onClick={this.handleSubmit}>
                        Submit
                    </Button>
                </div>
            </Drawer>
        )
    }
}
