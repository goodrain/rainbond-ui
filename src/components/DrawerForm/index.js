import React, { PureComponent } from 'react';
import Search from '../Search';
import DAinput from '../DAinput'
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
    Radio,
    InputNumber,
    Checkbox,
    Icon,
    Modal
} from 'antd';
import globalUtil from '../../utils/global';
import styles from './index.less'
const FormItem = Form.Item;
const Option = Select.Option;
const RadioGroup = Radio.Group;

@connect(
    ({ user }) => ({
        currUser: user.currentUser,
    }),
)
class DrawerForm extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            serviceComponentList: [],
            portList: [],
            licenseList: [],
            service_id: "",
            group_name: "",
            descriptionVisible: false,
            rule_extensions_visible: false
        }
    }
    componentWillMount() {
        const { dispatch, editInfo, form } = this.props;
        const team_name = globalUtil.getCurrTeamName();
        dispatch({
            type: "appControl/fetchCertificates",
            payload: {
                team_name
            },
            callback: (data) => {
                if (data.list) {
                    this.setState({ licenseList: data.list })
                }
            }
        })
        if (editInfo) {
            this.handleServices(editInfo.g_id)
            this.state.serviceComponentList.length > 0 && this.handlePorts(editInfo.service_id)
        }
    }
    handleOk = (e) => {
        e.preventDefault();
        const { onOk } = this.props
        const { group_name } = this.state;
        this.props.form.validateFields((err, values) => {
            if (!err) {
                onOk && onOk(values, group_name);
            }
        });
    }
    /**获取服务组件 */
    handleServices = (group_id) => {
        const { dispatch } = this.props;
        const team_name = globalUtil.getCurrTeamName();
        /**获取对应的group_name */
        const group_obj = this.props.groups.filter((item) => {
            return item.group_id == group_id
        })
        this.setState({ group_name: group_obj[0].group_name })
        dispatch({
            type: "groupControl/fetchApps",
            payload: {
                group_id: group_id,
                team_name
            },
            callback: (data) => {
                this.setState({ serviceComponentList: data.list })
            }
        })
    }
    /**获取端口 */
    handlePorts = (service_id) => {
        const { dispatch } = this.props;
        const team_name = globalUtil.getCurrTeamName();
        const service_obj = this.state.serviceComponentList.filter((item) => {
            return item.service_id == service_id
        })
        dispatch({
            type: "appControl/fetchPorts",
            payload: {
                app_alias: service_obj[0].service_alias,
                team_name
            },
            callback: (data) => {
                this.setState({ portList: data.list })
            }
        })
    }
    /**介绍域名说明 */
    showDescription = () => {
        this.setState({
            descriptionVisible: true
        })
    }
    handleOk_description = () => {
        this.setState({
            descriptionVisible: false
        })
    }
    handeCertificateSelect = (value) => {
        if (value) {
            console.log(value)
            this.setState({ rule_extensions_visible: true })
        }
    }
    render() {
        const { onClose, onOk, groups, editInfo } = this.props;
        const { getFieldDecorator } = this.props.form;
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
        // const currentGroup = editInfo ? editInfo.g_id : groups.lenth > 0 ? groups[0].group_id : null;
        let rule_http, rule_round;
        if (editInfo && editInfo.rule_extensions) {
            editInfo.rule_extensions.split(',').map((item) => {
                if (item.includes('httptohttps')) {
                    rule_http = item.split(':')[0];
                } else if (item.includes('lb-type')) {
                    rule_round = item.split(':')[1]
                }
            });
        }
        /**筛选当前的数据中心 */
        const { region } = this.props.currUser.teams[0];
        const currentRegion = region.filter((item) => {
            return item.team_region_name == globalUtil.getCurrRegionName();
        })
        return (
            <div>
                <Drawer
                    title={editInfo ? "编辑Http访问策略" : "添加http访问策略"}
                    placement="right"
                    width={500}
                    closable={false}
                    onClose={onClose}
                    visible={this.props.visible}
                    maskClosable={true}
                    closable={true}
                    style={{
                        height: 'calc(100% - 55px)',
                        overflow: 'auto',
                        paddingBottom: 53,
                    }}
                >
                    <Form >
                        <FormItem
                            {...formItemLayout}
                            label="域名"
                            className={styles.antd_form}
                        >
                            {getFieldDecorator('domain_name', {
                                rules: [
                                    {
                                        required: true,
                                        message: "请添加域名",
                                    },
                                    // {
                                    //     pattern: /(\.)(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/,
                                    //     message: "格式不正确",
                                    // },
                                ],
                                initialValue: editInfo.domain_name,
                            })(
                                <Input placeholder="请输入域名" />
                            )}
                            <span style={{ fontWeight: "bold", fontSize: "16px" }}><Icon type="question-circle" theme="filled" /><a href="javascript:void(0)" onClick={this.showDescription}>请将域名解析到：{currentRegion[0].tcpdomain}</a></span>
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label="Path"
                        >
                            {getFieldDecorator('domain_path', { initialValue: editInfo.domain_path })(
                                <Input placeholder="/" />
                            )}
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label="请求头"
                        >
                            {getFieldDecorator("domain_heander", { initialValue: editInfo.domain_heander })(<DAinput />)}
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label="Cookie"
                        >
                            {getFieldDecorator("domain_cookie", { initialValue: editInfo.domain_cookie })(<DAinput />)}
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label="权重"
                        >
                            {getFieldDecorator("the_weight", { initialValue: editInfo.the_weight || 100 })(
                                <InputNumber min={1} max={100} style={{ width: "100%" }} />
                            )}
                        </FormItem>
                        {this.state.licenseList && <FormItem
                            {...formItemLayout}
                            label="绑定证书"
                            style={{ zIndex: 99999 }}
                        >
                            {getFieldDecorator('certificate_id', { initialValue: editInfo.certificate_id })(
                                <Select placeholder="请绑定证书" onSelect={this.handeCertificateSelect}>
                                    {
                                        (this.state.licenseList).map((license, index) => {
                                            return <Option value={license.id} key={index}>{license.alias}</Option>
                                        })
                                    }
                                    {/* {this.state.licenseList.length > 0 ? (this.state.licenseList).map((license, index) => {
                                        return <Option value={license.id.toString()} key={index}>{license.alias}</Option>
                                    }) : <Option value={editInfo.certificate_id} key={editInfo.certificate_id}>{editInfo.certificate_name}</Option>} */}
                                </Select>
                            )}
                        </FormItem>}
                        <FormItem
                            {...formItemLayout}
                            label="应用(组)"
                            style={{ zIndex: 99999 }}
                        >
                            {getFieldDecorator('group_id', {
                                rules: [{ required: true, message: '请选择' }],
                                initialValue: editInfo.g_id,
                            })(
                                <Select placeholder="请选择要所属应用组" onChange={this.handleServices}>
                                    {
                                        (groups || []).map((group) => {
                                            return <Option value={group.group_id.toString()} key={group.group_id}>{group.group_name}</Option>
                                        })
                                    }
                                </Select>
                            )}
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label="服务组件"
                            style={{ zIndex: 99999 }}
                        >
                            {getFieldDecorator('service_id', {
                                rules: [{ required: true, message: '请选择' }],
                                initialValue: editInfo.service_id,
                            })(
                                <Select placeholder="请选择服务组件" onChange={this.handlePorts} >
                                    {
                                        (this.state.serviceComponentList || []).map((service, index) => {
                                            return <Option value={service.service_id.toString()} key={index}>{service.service_cname}</Option>
                                        })
                                    }

                                </Select>
                            )}
                        </FormItem>
                        <FormItem
                            {...formItemLayout}
                            label="端口号"
                            style={{ zIndex: 99999 }}
                        >
                            {getFieldDecorator('container_port', {
                                initialValue: editInfo.container_port,
                                rules: [{ required: true, message: '请选择端口号' }],
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
                            label="扩展功能"
                        >
                            {this.state.rule_extensions_visible && getFieldDecorator("rule_extensions_http", { initialValue: [rule_http] })(
                                <Checkbox.Group>
                                    <Row>
                                        <Col span={24}>
                                            <Checkbox value="httptohttps">HTTP Rewrite HTTPs</Checkbox>
                                        </Col>
                                    </Row>
                                </Checkbox.Group>
                            )}
                            <FormItem>
                            {getFieldDecorator("rule_extensions_round", { initialValue: rule_round || 'round-robin' })(
                                <Select placeholder="请选择负载均衡类型">
                                    <Option value="round-robin">round-robin</Option>
                                    {/* <Option value="random">random</Option>
                                    <Option value="consistence-hash">consistence-hash</Option> */}
                                </Select>
                            )}
                            </FormItem>
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
                        <Button onClick={this.handleOk} type="primary">确认</Button>
                    </div>
                </Drawer>
                {this.state.descriptionVisible && <Modal
                    closable={false}
                    title="域名解析说明"
                    visible={this.state.descriptionVisible}
                    onOk={this.handleOk_description}
                    footer={[<Button type="primary" size="small" onClick={this.handleOk_description}>确定</Button>]}
                    zIndex={999999}
                >
                    <ul className={styles.ulStyle}>
                        <li>1.HTTP访问控制策略是基于“域名"等组成路由规则，你需要在所绑定域名的域名服务商增加域名DNS A记录 到当前数据中心的应用网关出口IP地址之上域名访问即可生效。</li>
                        <li>2.当前数据中心（{currentRegion[0].team_region_alias}）出口IP地址是:  {currentRegion[0].tcpdomain}</li>
                        <li>3.如有疑问请联系平台运营管理员</li>
                    </ul>
                </Modal>}
            </div>
        )
    }
}
const drawerForm = Form.create()(DrawerForm);
export default drawerForm;