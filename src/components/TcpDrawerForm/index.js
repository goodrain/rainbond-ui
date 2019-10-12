import React, { PureComponent } from 'react';
import PortInput from './portInput';
import { connect } from 'dva';
import {
    Row,
    Col,
    Card,
    Table,
    Button,
    Drawer,
    Form,
    Input,
    Select,
    notification
} from 'antd';
import globalUtil from '../../utils/global';
const FormItem = Form.Item;
const Option = Select.Option;

@connect(
    ({ user, global, loading }) => ({
        currUser: user.currentUser,
        groups: global.groups,
        addTcpLoading: loading.effects['gateWay/addTcp'],
        editTcpLoading: loading.effects['gateWay/editTcp'],
    }),
)
class DrawerForm extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            serviceComponentList: [],
            portList: [],
            domain_port: '',
            end_point: '',
            isPerform: true
        }
    }
    resolveOk = (e) => {
        e.preventDefault();
        const { onOk, editInfo } = this.props
        const { domain_port } = this.state
        this.props.form.validateFields((err, values) => {
            if (!err) {
                values.default_port = domain_port[0].port
                onOk && onOk(values);
            }
        });
    }
    componentDidMount() {
        this.props.dispatch({
            type: "gateWay/querydomain_port",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
            },
            callback: (data) => {
                if (data) {
                    this.setState({
                        domain_port: data.list
                    })
                }
            }
        })
        const { editInfo } = this.props;
        if (editInfo) {
            this.handleServices({ key: editInfo.g_id })
            // this.state.serviceComponentList.length > 0 && this.handlePorts(editInfo.service_id)
        }
    }
    /**获取组件 */
    handleServices = (groupObj) => {
        const { isPerform } = this.state
        const { dispatch, editInfo } = this.props;
        const team_name = globalUtil.getCurrTeamName();
        /**获取对应的group_name */
        dispatch({
            type: "groupControl/fetchApps",
            payload: {
                group_id: groupObj.key,
                team_name
            },
            callback: (data) => {
                if (data) {
                    this.setState({ serviceComponentList: data.list }, () => {
                        if (data.list && data.list.length > 0) {
                            if (isPerform && editInfo) {
                                this.handlePorts(editInfo.service_id, true);
                                this.props.form.setFieldsValue({ service_id: editInfo.service_id });
                            } else {
                                this.handlePorts(data.list[0].service_id, false);
                                this.props.form.setFieldsValue({ service_id: data.list[0].service_id });
                            }
                        }
                    })
                }
            }
        })
    }
    /**获取端口 */
    handlePorts = (service_id) => {
        const { dispatch, editInfo } = this.props;
        const { isPerform } = this.state
        const team_name = globalUtil.getCurrTeamName();
        const service_obj = this.state.serviceComponentList.filter((item) => {
            return item.service_id == service_id
        })

        dispatch({
            type: "appControl/fetchPorts",
            payload: {
                app_alias: service_obj && service_obj.length > 0 && service_obj[0].service_alias && service_obj[0].service_alias,
                team_name
            },
            callback: (data) => {
                if (data) {
                    this.setState({ portList: data.list }, () => {
                        if (data.list && data.list.length > 0) {
                            if (isPerform && editInfo) {
                                this.setState({
                                    isPerform: false
                                })
                                this.props.form.setFieldsValue({ container_port: editInfo.container_port });
                            } else {
                                this.props.form.setFieldsValue({ container_port: data.list[0].container_port });
                            }
                        }
                    })
                }
            }
        })
    }
    handleChange = (data) => {
        // this.props.form.setFieldsValue({end_point:data.})

    }
    checkport = (rules, value, callback) => {
        const { tcpType, editInfo } = this.props;
        if (!value.ip || !value.port) {
            callback('请输入完整的ip和端口');
            return;
        }
        if (editInfo && tcpType == 0 && (value.port == 80 || value.port == 443 || value.port == 7070 || value.port == 6060 || value.port == 8443 || value.port == 8888)) {
            callback('当前端口不可用!');
            return;
        }
        // if(editInfo&&tcpType==0&&value.port<20000){
        //     // callback('你填写的端口小于20000且选用默认IP, 应用网关将监听 0.0.0.0:20001 如不能访问请查询是否端口冲突。');
        //     // notification.info({message:'你填写的端口小于20000且选用默认IP, 应用网关将监听 0.0.0.0:20001 如不能访问请查询是否端口冲突。'})
        //     return;
        // }
        else {
            callback()
            return;
        }
    }
    render() {
        const { onClose, editInfo, addTcpLoading, editTcpLoading } = this.props;
        const { getFieldDecorator } = this.props.form;
        const { domain_port } = this.state;
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 4 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 18 }
            }
        };

        let rule_round, current_enpoint;
        if (editInfo && editInfo.rule_extensions)
            rule_round = editInfo.rule_extensions.split(':')[1]

        if (editInfo && editInfo.end_point) {
            const end_pointArr = editInfo.end_point.split(":");
            current_enpoint = [
                {
                    ip: end_pointArr[0],
                    port: end_pointArr[1]
                }
            ]
        }
        return (
            <div>
                {domain_port && <Drawer
                    title={editInfo ? "编辑tcp访问策略" : "添加tcp访问策略"}
                    placement="right"
                    width={500}
                    closable={false}
                    onClose={onClose}
                    visible={this.props.visible}
                    maskClosable={false}
                    closable={true}
                    zIndex={1001}
                    style={{
                        overflow: 'auto',
                    }}
                >
                    <Form>
                        <h3 style={{ borderBottom: "1px solid #BBBBBB", marginBottom: "10px" }}>路由规则</h3>

                        <FormItem
                            {...formItemLayout}
                            label="IP"
                        >
                            {getFieldDecorator('end_point', {
                                rules: [{ required: true, validator: this.checkport }],
                                initialValue: editInfo ? current_enpoint[0] : domain_port[0],
                            })(
                                <PortInput domain_port={editInfo && editInfo.end_point ? current_enpoint : domain_port} onChange={this.handleChange} />
                            )}
                        </FormItem>
                        <h3 style={{ borderBottom: "1px solid #BBBBBB", marginBottom: "10px" }}>访问目标</h3>

                        <FormItem
                            {...formItemLayout}
                            label="应用(组)"
                            style={{ zIndex: 10011 }}
                        >
                            {getFieldDecorator('group_id', {
                                rules: [{ required: true, message: '请选择应用(组)' }],
                                initialValue: { key: editInfo.g_id || "-1", label: editInfo.group_name || "请选择应用(组)" }
                            })(
                                <Select labelInValue placeholder="请选择要所属应用(组)" onChange={this.handleServices}>
                                    <Option value="-1">请选择应用(组)</Option>
                                    {
                                        (this.props.groups || []).map((group, index) => {
                                            return <Option value={group.group_id+""} key={index}>{group.group_name}</Option>
                                        })
                                    }
                                </Select>
                            )}
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label="组件"
                            style={{ zIndex: 10011 }}
                        >
                            {getFieldDecorator('service_id', {
                                rules: [{ required: true, message: '请选择' }],
                                initialValue: editInfo && editInfo.service_id ? editInfo.service_id : this.state.serviceComponentList && this.state.serviceComponentList.length > 0 ? this.state.serviceComponentList[0].service_id : undefined,
                            })(
                                <Select placeholder="请选择组件" onChange={this.handlePorts}>
                                    {
                                        (this.state.serviceComponentList || []).map((service, index) => {
                                            return <Option value={service.service_id+""} key={index}>{service.service_cname}</Option>
                                        })
                                    }

                                </Select>
                            )}
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label="端口号"
                            style={{ zIndex: 10011 }}
                        >
                            {getFieldDecorator('container_port', {
                                rules: [{ required: true, message: '请选择端口号' }],
                                initialValue: editInfo && editInfo.container_port ? editInfo.container_port : this.state.portList && this.state.portList.length > 0 ? this.state.portList[0].container_port : undefined,
                            })(
                                <Select placeholder="请选择端口号">
                                    {
                                        (this.state.portList || []).map((port, index) => {
                                            return <Option value={port.container_port} key={index}>{port.container_port}</Option>
                                        })
                                    }
                                </Select>
                            )}
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label="负载均衡"
                            style={{ zIndex: 10011 }}
                        >
                            {getFieldDecorator("rule_extensions", { initialValue: rule_round || 'round-robin' })(
                                <Select placeholder="请选择负载均衡类型">
                                    <Option value="round-robin">轮询</Option>
                                    {/* <Option value="random">random</Option>
                                    <Option value="consistence-hash">consistence-hash</Option> */}
                                </Select>
                            )}
                        </FormItem>
                    </Form>
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            width: '100%',
                            borderTop: '1px solid #e8e8e8',
                            padding: '10px 16px',
                            textAlign: 'right',
                            left: 0,
                            background: '#fff',
                            borderRadius: '0 0 4px 4px',
                            zIndex: 99999,
                        }}
                    >
                        <Button
                            style={{
                                marginRight: 8,
                            }}
                            onClick={onClose}
                        >
                            取消
                        </Button>
                        <Button onClick={this.resolveOk} type="primary" loading={addTcpLoading || editTcpLoading}>确认</Button>
                    </div>
                </Drawer>}
            </div>
        )
    }
}
const drawerForm = Form.create()(DrawerForm);
export default drawerForm;
