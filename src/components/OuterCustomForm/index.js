import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Form, Button, Select, Input, Radio, Alert, Modal } from "antd";
import AddGroup from "../../components/AddOrEditGroup";
import globalUtil from "../../utils/global";
import ShowRegionKey from "../../components/ShowRegionKey";
import styles from './index.less';

const FormItem = Form.Item;

const RadioGroup = Radio.Group;
const { Option } = Select;

const formItemLayout = {
    labelCol: {
        span: 5,
    },
    wrapperCol: {
        span: 19,
    },
};

@connect(
    ({ user, global }) => ({
        currUser: user.currentUser,
        groups: global.groups,
    }),
    null,
    null,
    { withRef: true },
)
@Form.create()
export default class Index extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            showUsernameAndPass: false,
            showKey: false,
            addGroup: false,
            serverType: "git",
            endpointsType: "static",
            visible: false
        };
    }
    onAddGroup = () => {
        this.setState({ addGroup: true });
    };

    cancelAddGroup = () => {
        this.setState({ addGroup: false });
    };
    handleAddGroup = (vals) => {
        const { setFieldsValue } = this.props.form;

        this.props.dispatch({
            type: "groupControl/addGroup",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                ...vals,
            },
            callback: (group) => {
                if (group) {
                    // 获取群组
                    this.props.dispatch({
                        type: "global/fetchGroups",
                        payload: {
                            team_name: globalUtil.getCurrTeamName(),
                            region_name: globalUtil.getCurrRegionName(),
                        },
                        callback: () => {
                            setFieldsValue({ group_id: group.ID });
                            this.cancelAddGroup();
                        },
                    });
                }
            },
        });
    };
    handleChange = () => {
        this.setState({
            visible: true,
        });
    }
    handleSubmit = (e) => {
        e.preventDefault();
        const form = this.props.form;
        form.validateFields((err, fieldsValue) => {
            console.log("fieldsValue",fieldsValue)
            if (err) {
                console.log("err", err);
                if (err.type) {
                    return;
                } else {
                    if (err.endpoints || err.key) {
                        this.setState({
                            visible: true,
                        });
                    }
                }
                return;
            }

            if (fieldsValue.endpoints_type == "discovery" && (fieldsValue.endpoints == "" || fieldsValue.endpoints == undefined || fieldsValue.key == "" || fieldsValue.key == undefined)) {
                this.setState({
                    visible: true,
                });
                return
            }

            this.props.onSubmit && this.props.onSubmit(fieldsValue);
        });
    };
    handleChangeEndpointsType = (types) => {
        this.setState({
            endpointsType: types.target.value
        })
    };


    showModal = () => {
        this.props.form.validateFields(['type'], { force: true });
        this.setState({
            visible: this.props.form.getFieldValue('type') ? true : false,
        });
    }

    handleOk = (e) => {
        console.log(e);
        this.setState({
            visible: false,
        });
    }

    handleCancel = (e) => {
        console.log(e);
        this.setState({
            visible: false,
        });
    }

    render() {
        const { getFieldDecorator, getFieldValue } = this.props.form;
        const { groups } = this.props;
        const { showUsernameAndPass, showKey, endpointsType } = this.state;
        const gitUrl = getFieldValue("git_url");
        let isHttp = /^(http:\/\/|https:\/\/)/.test(gitUrl || "");
        let urlCheck = /^(.+@.+\.git)|([^@]+\.git(\?.+)?)$/gi;
        if (this.state.serverType == "svn") {
            isHttp = true;
            urlCheck = /^(svn:\/\/|http:\/\/|https:\/\/).+$/gi;
        }
        const isSSH = !isHttp;
        const data = this.props.data || {};
        const showSubmitBtn = this.props.showSubmitBtn === void 0 ? true : this.props.showSubmitBtn;
        const showCreateGroup = this.props.showCreateGroup === void 0 ? true : this.props.showCreateGroup;
        return (
            <Fragment>
                <Form onSubmit={this.handleSubmit} layout="horizontal" hideRequiredMark>
                    <Form.Item {...formItemLayout} label="服务名称">
                        {getFieldDecorator("service_cname", {
                            initialValue: data.service_cname || "",
                            rules: [
                                { required: true, message: "请输入服务名称" },
                                { min: 4, message: "服务名称必须大于4位" },
                            ],
                        })(<Input placeholder="请输入服务名称" />)}
                    </Form.Item>

                    <Form.Item {...formItemLayout} label="应用名称">
                        {getFieldDecorator("group_id", {
                            initialValue: (this.props.handleType && this.props.handleType === "Service") ? Number(this.props.groupId) : data.group_id,
                            rules: [{ required: true, message: "请选择" }],
                        })(<Select
                            placeholder="请选择要所属应用"
                            style={{ display: "inline-block", width: (this.props.handleType && this.props.handleType === "Service") ? "" : 277, marginRight: 15 }}
                            disabled={(this.props.handleType && this.props.handleType === "Service") ? true : false}
                        >
                            {(groups || []).map(group => (
                                <Option key={group.group_id} value={group.group_id}>{group.group_name}</Option>
                            ))}
                        </Select>)}
                        {(this.props.handleType && this.props.handleType === "Service") ? null : showCreateGroup ? <Button onClick={this.onAddGroup}>创建新应用</Button> : null}
                    </Form.Item>

                    <FormItem
                        {...formItemLayout}
                        label="服务注册方式"
                    >
                        {getFieldDecorator('endpoints_type', {
                            rules: [{ required: true, message: '请选择endpoints类型!' }],
                            initialValue: "static",
                        })(
                            <RadioGroup onChange={this.handleChangeEndpointsType} value={endpointsType}>
                                <Radio value="static">静态注册</Radio>
                                <Radio value="discovery">动态注册</Radio>
                                <Radio value="api">API注册</Radio>
                            </RadioGroup>
                        )}
                    </FormItem>

                    {endpointsType == "static" && <FormItem
                        {...formItemLayout}
                        label="服务地址"
                        style={{ textAlign: "right" }}
                    >
                        {getFieldDecorator('static', {
                            rules: [{ required: true, message: '请输入服务地址' },
                            // {
                            //     pattern:/^[0-9]*$/,
                            //     message: "格式不正确",
                            // }
                        ],
                            initialValue: undefined,
                        })(
                            <Select
                                className={styles.zsl_static}
                                mode="tags"
                                style={{ width: '100%' }}
                                placeholder={
                                    <div>
                                        <div>192.168.1.1:8888 （输入方式1示例）</div>
                                        <div>192.168.1.3      （输入方式2示例）</div>
                                    </div>
                                }
                                onChange={this.handleChange}
                            >
                            </Select>
                            // <textarea className={styles.zsl_static} style={{ width: '100%' }}  placeholder={
                            //     "192.168.1.1:8888 （输入方式1示例）                                        192.168.1.3      （输入方式2示例）"
                            //     // <div>
                            //     //     <div>192.168.1.1:8888 （输入方式1示例）</div>
                            //     //     <div>192.168.1.3      （输入方式2示例）</div>
                            //     // </div>
                            // }>

                            // </textarea>
                        )}
                    </FormItem>}



                    {/* {endpointsType == "api" &&   <FormItem
                        {...formItemLayout}
                        label="url"
                        style={{ textAlign: "right" }}
                    >
                        {getFieldDecorator('api', {
                            rules: [{ required: true, message: '请输入url!' },
                            {
                                pattern: /^(?=^.{3,255}$)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)*(\/\w+\.\w+)*$/,
                                message: "格式不正确",
                            }
                            ],
                            initialValue: undefined,
                        })(
                            <Input placeholder="请输入url" />
                        )}
                    </FormItem>} */}

                    {endpointsType == "discovery" && <div>  <FormItem
                        {...formItemLayout}
                        label="动态注册类型"
                        style={{ zIndex: 99999 }}
                    >
                        {getFieldDecorator('type', {
                            rules: [{ required: true, message: '请输入type' }],
                            initialValue: "",
                        })(
                            <Select onChange={this.handleChange} placeholder="请选择类型" style={{ display: "inline-block", width: 277, marginRight: 15 }}>
                                {
                                    (["Zookeeper", "Etcd", "Consul"]).map((port, index) => {
                                        return <Option value={port} key={index}>{port}</Option>
                                    })
                                }
                            </Select>
                        )}
                        <Button onClick={this.showModal}>补全信息</Button>
                    </FormItem>
                        <Modal
                            title={this.props.form.getFieldValue('type')}
                            visible={this.state.visible}
                            onOk={this.handleOk}
                            onCancel={this.handleCancel}
                        >
                            <FormItem
                                {...formItemLayout}
                                label="服务地址"
                                style={{ textAlign: "right" }}
                            >
                                {getFieldDecorator('endpoints', {
                                    rules: [{ required: true, message: '请输入IP+端口号!' },
                                    // {
                                    //     pattern: /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\:([0-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-5]{2}[0-3][0-5])$/,
                                    //     message: "格式不正确",
                                    // }
                                ],
                                    initialValue: undefined,
                                })(

                                    <Select
                                        className={styles.zsl_static}
                                        mode="tags"
                                        style={{ width: '100%' }}
                                        placeholder="请输入IP+端口号"
                                        onChange={this.handleChange}
                                    >
                                    </Select>
                                )}
                            </FormItem>
                            <FormItem
                                {...formItemLayout}
                                label="key"
                                style={{ textAlign: "right" }}
                            >
                                {getFieldDecorator('key', {
                                    rules: [{ required: true, message: '请输入key!' }],
                                    initialValue: undefined,
                                })(
                                    <Input placeholder="请输入key" />
                                )}
                            </FormItem>
                            <FormItem
                                {...formItemLayout}
                                label="用户名"
                                style={{ textAlign: "right" }}
                            >
                                {getFieldDecorator('username', {
                                    rules: [{ required: false, message: '请输入用户名!' }],
                                    initialValue: undefined,
                                })(
                                    <Input placeholder="请输入用户名" />
                                )}
                            </FormItem>
                            <FormItem
                                {...formItemLayout}
                                label="密码"
                                style={{ textAlign: "right" }}
                            >
                                {getFieldDecorator('password', {
                                    rules: [{ required: false, message: '请输入密码!' }],
                                    initialValue: undefined,
                                })(
                                    <Input placeholder="请输入密码" />
                                )}
                            </FormItem>
                        </Modal>

                    </div>}

                    {showSubmitBtn ? (
                        <Form.Item
                            wrapperCol={{
                                xs: { span: 24, offset: 0 },
                                sm: { span: formItemLayout.wrapperCol.span, offset: formItemLayout.labelCol.span },
                            }}
                            label=""
                        >
                            {this.props.handleType && this.props.handleType === "Service" && this.props.ButtonGroupState ?
                                this.props.handleServiceBotton(<Button onClick={this.handleSubmit} type="primary">创建服务</Button>, false) :
                                !this.props.handleType && <div style={{
                                    display: "flex", alignItems: "center", justifyContent:
                                        endpointsType == "api" ?
                                            "space-evenly" : "start"
                                }}>
                                    <Button onClick={this.handleSubmit} type="primary">创建服务</Button>
                                    {endpointsType == "api" && <Alert message="API地址在服务创建后获取" type="warning" showIcon />}
                                </div>
                            }

                        </Form.Item>
                    ) : null}
                </Form>
                {this.state.addGroup && (
                    <AddGroup onCancel={this.cancelAddGroup} onOk={this.handleAddGroup} />
                )}
                {/* {showKey && isSSH && <ShowRegionKey onCancel={this.hideShowKey} />} */}
            </Fragment>
        );
    }
}
