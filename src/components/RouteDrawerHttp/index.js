import React, { Fragment, PureComponent, Component } from 'react';
import { connect } from 'dva';
import { Drawer, Form, Button, Col, Row, Input, Select, DatePicker, Icon, Skeleton, Spin, Radio, Switch } from 'antd';
import globalUtil from '../../utils/global';
import { formatMessage, FormattedMessage } from 'umi-plugin-locale';
import ServiceInput from '../ServiceInput';
import ServiceInputK8s from '../ServiceInputK8s'
import GatewayPluginsFrom from '../GatewayPluginsFrom'
import styles from './index.less';
import DAinput from '../DAinput';
import DAHosts from '../DAHosts'
import DAPath from '../DAPath'
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
            comList: [],
            serviceList: [],
            serviceLoading: true,
            values: [{
                name: "limit-count",
                enable: true,
                config: {
                },
                secretRef: ""
            }],
            formRefs: [],
            showPlugin: false
        };
    }
    componentWillMount() {
        const { editInfo, appID } = this.props;
        
        if (Object.keys(editInfo).length > 0) {
          const hasMethods = editInfo.methods && editInfo.methods.length > 0;
          const hasExprs = editInfo.match.exprs && editInfo.match.exprs.length > 0;
          const hasBackends = editInfo.backends && editInfo.backends.length > 0;
          const hasUpstreams = editInfo.upstreams && editInfo.upstreams.length > 0;
      
          this.setState({
            showMateMore: hasMethods || editInfo.priority || editInfo.remoteAddrs || hasExprs,
            groupSelect: hasBackends ? 'k8s' : 'advanced',
          },()=>{
            if(this.state.groupSelect == 'k8s'){
                this.handleServices({ key: editInfo.name.match(/^(\d+)/)[1] });
            }
          });
        }
      
        if (appID) {
          this.handleServices({ key: appID });
        }
      
        if (editInfo?.plugins && editInfo.plugins.length > 0) {
          this.setState({
            values: editInfo.plugins,
            showPlugin: true,
          });
        }

        this.fetchInfo();
        this.getTableData();
      }
    extractPreviousCharacters = (inputString) => {
        const pattern = /([^:]+):/;
        const match = inputString.match(pattern);
        return match ? match[1] : '';
    }
    extractAfterColon = (inputString) => {
        const pattern = /:(.+)/;
        const match = inputString.match(pattern);
        return match ? match[1] : '';
    }
    onClose = () => {
        this.props.onClose({}, "add")
    }
    handleSubmit = e => {
        e.preventDefault();
        const { formRefs } = this.state;
        const plugins = []
        formRefs.forEach((formRef, index) => {
            if (!formRef) return
            const form = formRef.props.form;
            form.validateFields((err, values) => {    
                if (!err) {
                    const { name, ...config } = values;
                    plugins.push({name:values.name,secretRef:'', enable: true, config: config})
                }
            });
        });
        const { editInfo, form, onOk } = this.props;
        form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                const data = {
                    match: { paths: [] },
                    authentication: {
                        enable: false,
                        type: 'basicAuth',
                        keyAuth: {},
                        jwtAuth: {},
                        ldapAuth: {},
                    },
                    plugins: plugins,
                };
                if (editInfo && Object.keys(editInfo).length > 0) {
                    const splitString = editInfo.name.split("|")[0];
                    data.name = splitString
                }
                if (values.priority) {
                    data.priority = Number(values.priority);
                }
                data.websocket = values.websocket === undefined ? false : values.websocket;
                data.match.paths = (values.paths && values.paths.length > 0) ? values.paths : ['/*'];
                data.match.hosts = values.hosts;
                data.match.methods = values.methods;
                data.match.remoteAddrs = values.remoteAddrs;
                if (values.exprs && values.exprs.length > 0) {
                    if(values.exprs.length == 1 && (values.exprs[0].name == '' ||  values.exprs[0].value == '')){
                        data.match.exprs = [];
                    }else{
                        const arr = values.exprs.map(item => ({
                            subject: { scope: item.scope, name: item.name },
                            op: item.op,
                            set: null,
                            value: item.value,
                        }));
                        data.match.exprs = arr;
                    }
                }
                if (values.type === 'k8s') {
                    data.backends = (values.comListInfo || []).map(item => ({
                        serviceName: item.name,
                        servicePort: item.port,
                        weight: Number(item.weight),
                    }));
                    data.upstreams = [];
                } else {
                    data.upstreams = (values.upstreams || []).map(item => ({
                        name: item.value,
                        weight: Number(item.weight),
                    }));
                    data.backends = [];
                }
                if(values?.group_id?.key){
                onOk(data, Number(values.group_id.key));
                }else{
                onOk(data);
                }
            }
        });
    };
    // 获取访问令牌token
    fetchInfo = () => {
        const { dispatch } = this.props
        const teamName = globalUtil.getCurrTeamName()
        dispatch({
            type: 'teamControl/fetchToken',
            payload: {
                team_name: teamName,
                tokenNode: 'spring'
            },
            callback: res => {
                if (res && res.status_code == 200) {
                    this.setState({
                        token: res.bean.access_key || false
                    }, () => {
                        this.fetchGetServiceAddress(res.bean.access_key)
                    })
                }
            }
        })
    }
    // 获取当前团队的命名空间
    fetchGetServiceAddress = (token) => {
        const { dispatch } = this.props
        const teamName = globalUtil.getCurrTeamName()
        const regionName = globalUtil.getCurrRegionName()
        dispatch({
            type: 'gateWay/fetchGetServiceAddress',
            payload: {
                team_name: teamName,
                region_name: regionName,
                token: token
            },
            callback: res => {
                this.setState({
                    comList: res.bean.ports,
                    serviceComponentLoading: false
                })
            }
        })
    }
    // 获取表格信息
    getTableData = () => {
        const { dispatch, nameSpace, appID } = this.props
        const teamName = globalUtil.getCurrTeamName()
        dispatch({
            type: 'gateWay/getApiGatewayService',
            payload: {
                teamName: teamName,
                app_id: appID || ''
            },
            callback: res => {
                const arr = []
                if (res && res.bean) {
                    for (const key in res.bean) {
                        if (Object.keys(res.bean[key]).length > 0)
                            arr.push({
                                value: key,
                            })
                    }
                    this.setState({
                        serviceList: arr,
                    })
                } else {
                    this.setState({
                        serviceList: [],
                    })
                }
                this.setState({ serviceLoading: false })

            },
            handleError: () => {
                this.setState({
                    serviceList: [],
                    serviceLoading: false
                })
            }
        })
    }
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
    handleExprs = (data) => {
        let arr = []
        if (data && data.length > 0) {
            data.map(item => {
                arr.push({ scope: item.subject.scope, name: item.subject.name, op: item.op, value: item.value })
            })
            return arr
        } else {
            return []
        }
    }
    handleService = (data, type) => {
        let arr = []
        if (type != 'upstreams') {
            if (data && data.length > 0) {
                data.map(item => {
                    arr.push({ name: item.serviceName, weight: item.weight, port: item.servicePort })
                })
                return arr
            } else {
                return []
            }
        } else {
            if (data && data.length > 0) {
                data.map(item => {
                    arr.push({ value: item.name, weight: item.weight })
                })
                return arr
            } else {
                return []
            }
        }
    }
    /** 获取组件 */
    handleServices = groupObj => {
        this.handleComponentLoading(true);
        const { dispatch, editInfo, groups, form } = this.props;
        const { setFieldsValue } = form;
        const { isPerform } = this.state;
        const team_name = globalUtil.getCurrTeamName();
        dispatch({
            type: 'application/fetchApps',
            payload: {
                page_size: -1,
                group_id: groupObj.key,
                team_name
            },
            callback: data => {
                const list = (data && data.list) || [];
                this.setState(
                    {
                        serviceComponentList: list,
                        serviceComponentLoading: false
                    }
                );
                this.handleComponentLoading(false);
            }
        });
    };
    handleComponentLoading = loading => {
        this.setState({
            componentLoading: loading
        });
    };
    add = () => {
        const { values } = this.state;
        if (values.length > 100) {
            notification.warning({
                message: formatMessage({ id: 'notification.warn.add_max' })
            });
            return null;
        }
        this.setState(prevState => ({
            values: prevState.values.concat({ name: 'limit-req', config: {} })
        }));
    };

    remove = index => {
        const { values, formRefs } = this.state;
        this.setState({
            values: values.filter((_, i) => i !== index),
            formRefs: formRefs.filter((_, i) => i !== index)
        });
    };
    render() {
        const { getFieldDecorator } = this.props.form;
        const {
            visible,
            groups,
            editInfo,
            appID
        } = this.props;
        const {
            serviceComponentList,
            serviceComponentLoading,
            portList,
            componentLoading,
            portLoading,
            groupSelect,
            showServiceMore,
            showMateMore,
            selsectRewrite,
            comList,
            serviceLoading,
            serviceList,
            showPlugin
        } = this.state
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
                sm: { span: 9 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 15 }
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
        const appKey = appID && { key: appID };
        let appKeys = {};
        if (groupSelect === 'k8s') {
            if (editInfo && editInfo.name) {
                const matchResult = editInfo.name.match(/^(\d+)/);
                if (matchResult) {
                    appKeys = { key: matchResult[1] };
                } else {
                    appKeys = undefined;
                }
            } else {
                appKeys = undefined;
            }
        }
        const serviceId = editInfo && editInfo.service_id && editInfo.service_id;
        const serviceIds =
            serviceComponentList &&
            serviceComponentList.length > 0 &&
            serviceComponentList[0].service_id;
        const containerPort =
            editInfo && editInfo.container_port && editInfo.container_port;
        const containerPorts =
            portList && portList.length > 0 && portList[0].container_port;
        const isOk = !(componentLoading || portLoading);

        return (
            <Drawer
                title={Object.keys(editInfo).length > 0 ? formatMessage({id:'teamNewGateway.NewGateway.GatewayRoute.edit'}) :formatMessage({id:'teamNewGateway.NewGateway.GatewayRoute.add'})}
                width={700}
                onClose={this.onClose}
                visible={visible}
                bodyStyle={{ paddingBottom: 80 }}
            >
                <Form hideRequiredMark onSubmit={this.handleSubmit}>
                    <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.GatewayRoute.host'})}>
                        {getFieldDecorator('hosts', {
                            rules: [{ required: true, message: formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.InputHost'}) }],
                            initialValue: (editInfo && editInfo.match && editInfo.match.hosts) || []
                        })(<DAHosts hostPlaceholder={formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.InputHost'})} />)}
                    </Form.Item>
                    <Row>
                        <Col>
                            <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.GatewayRoute.path'})}>
                                {getFieldDecorator('paths', {
                                    // rules: [{ required: true, message: formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.InputPath'}) }],
                                    initialValue: (editInfo && editInfo.match && editInfo.match.paths) || []
                                })(<DAPath hostPlaceholder={'/*'}/>)}
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
                                        {formatMessage({id:"enterpriseOverview.team.more"})}
                                        {globalUtil.fetchSvg('gatewayMore', "#3d54c4", 10)}
                                    </Button>
                                    :
                                    <Button
                                        type="link"
                                        className={styles.buttonStyle}
                                        onClick={() => { this.setState({ showMateMore: !this.state.showMateMore }) }}
                                    >
                                        {formatMessage({id:'appPublish.table.btn.release_cancel'})}
                                        {globalUtil.fetchSvg('gatewayMore', "#3d54c4", 10)}
                                    </Button>
                            }
                        </Col>
                    </Row>
                    {showMateMore && (
                        <Fragment>
                            <Form.Item {...formItemLayout} label="Method" >
                                {getFieldDecorator('methods',
                                    { initialValue: (editInfo && editInfo.match && editInfo.match.methods && editInfo.match.methods.length > 0) ? editInfo.match.methods : ["GET", "POST", "PUT", "DELETE", "OPTIONS", 'HEAD', 'PATCH', "TRACE"] },
                                )(
                                    <Select
                                        mode="multiple"
                                        style={{ width: '100%' }}
                                        placeholder={formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.method'})}
                                    >
                                        {MethodOptions.map(item => (
                                            <Option key={item.value} value={item.value}>
                                                {item.label}
                                            </Option>
                                        ))}
                                    </Select>
                                )}
                            </Form.Item>

                            <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.IP'})}>
                                {getFieldDecorator('remoteAddrs', {
                                    // rules: [{ required: true, message: formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.InputIP'}) }],
                                    initialValue: (editInfo && editInfo.match && editInfo.match.remoteAddrs) || []
                                })(<DAHosts hostPlaceholder={formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.InputIP'})} />)}
                            </Form.Item>
                            <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.Advanced'})}>
                                {getFieldDecorator('exprs', {
                                    rules: [{ required: true, message: formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.InputAdvanced'}) }],
                                    initialValue: (editInfo && editInfo.match && editInfo.match.exprs && this.handleExprs(editInfo.match.exprs)) || []
                                })(<NewHeader />)}
                            </Form.Item>
                            <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.priority'})}>
                                {getFieldDecorator('priority', {
                                    // rules: [{ required: true, message: formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.InputPriority'}) }],
                                    initialValue: editInfo && editInfo.priority || null
                                })(<Input type='number' placeholder={formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.InputPriority'})} style={{ width: '25%' }} />)}
                            </Form.Item>
                        </Fragment>
                    )}
                    <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.source'})} >
                        {getFieldDecorator('type',
                            { initialValue: groupSelect },
                        )(
                            <Radio.Group onChange={this.groupChange}>
                                <Radio value="k8s"> {formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.default'})}</Radio>
                                <Radio value="advanced"> {formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.senior'})}</Radio>
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
                                    {(serviceComponentList && serviceComponentList.length>0) &&
                                    <Skeleton loading={componentLoading}>
                                        <Form.Item {...formItemLayout} label={formatMessage({ id: 'popover.newApp.appName' })}>
                                            {getFieldDecorator('comListInfo', {
                                                rules: [{ required: true, message: formatMessage({ id: 'placeholder.select' }) }],
                                                initialValue: (editInfo && editInfo.backends && this.handleService(editInfo.backends, "backends")) || []
                                            })(
                                                <ServiceInputK8s comList={serviceComponentList} />
                                            )}
                                        </Form.Item>
                                    </Skeleton>
                                    }
                                </Fragment>
                            </Skeleton>
                        </Fragment>
                    ) : (
                        <Fragment>
                            <Skeleton loading={serviceLoading} active key="upstreams">
                            <Form.Item {...formItemLayout} label={formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.service'})}>
                                            {getFieldDecorator('upstreams', {
                                                rules: [{ required: true, message: formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.InputService'}) }],
                                                initialValue: (editInfo && editInfo.upstreams && this.handleService(editInfo.upstreams, "upstreams")) || []
                                            })(<ServiceInput comList={serviceList} type="upstreams" onClickEven={() => { this.props.onTabChange('service', true) }}/>)}
                                        </Form.Item>
                            </Skeleton>
                        </Fragment>
                    )}
                    <Form.Item {...formItemLayout} label="websocket">
                        {getFieldDecorator('websocket', {
                            valuePropName: 'checked',
                            initialValue: (editInfo && editInfo.websocket) || false
                        })(<Switch />)}
                    </Form.Item>
                    <Button
                        onClick={() => {
                            this.setState({
                                showPlugin: !this.state.showPlugin
                            })
                        }}
                        style={{marginBottom:12}}
                        type={showPlugin ? "danger" : "primary"}
                    >
                        {showPlugin ? formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.Plugin'}) : formatMessage({id:'teamNewGateway.NewGateway.RouteDrawer.addPlugin'})}
                    </Button>

                    {showPlugin && this.state.values.map((item, index) => {
                        const { name, enable, config, secretRef } = item
                        const first = index === 0;
                        if (name)
                            return (
                                <Row key={index}>
                                    <Col span={22}>
                                        <GatewayPluginsFrom
                                            wrappedComponentRef={formRef => (this.state.formRefs[index] = formRef)}
                                            info={item}
                                            formItemLayout={formItemLayouts}
                                        />
                                    </Col>
                                    <Col span={2}>
                                        <Icon
                                            type={first ? 'plus-circle' : 'minus-circle'}
                                            style={{ fontSize: '20px', marginLeft: 20 }}
                                            onClick={() => {
                                                if (first) {
                                                    this.add();
                                                } else {
                                                    this.remove(index);
                                                }
                                            }}
                                        />
                                    </Col>
                                </Row>
                            )
                    })}
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
