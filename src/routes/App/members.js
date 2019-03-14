import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Card, Form, Button, Icon, Table, Tag, notification, Tooltip, Modal, Radio, Popconfirm, Switch, Input } from "antd";
import ConfirmModal from "../../components/ConfirmModal";
import SetMemberAppAction from "../../components/SetMemberAppAction";
import ScrollerX from "../../components/ScrollerX";
import globalUtil from "../../utils/global";
import appProbeUtil from "../../utils/appProbe-util";
import appUtil from "../../utils/app";
import appStatusUtil from '../../utils/appStatus-util';
import NoPermTip from "../../components/NoPermTip";
import AutoDeploy from "./setting/auto-deploy";
import AddTag from "./setting/add-tag";
import EditActions from "./setting/perm";
import MarketAppDetailShow from "../../components/MarketAppDetailShow";
import EditHealthCheck from "./setting/edit-health-check";

const FormItem = Form.Item;
import {
    getStatus,
    restart
} from '../../services/app';
const RadioGroup = Radio.Group;

@connect(
    ({ user, appControl, teamControl }) => ({
        currUser: user.currentUser,
        innerEnvs: appControl.innerEnvs,
        startProbe: appControl.startProbe,
        runningProbe: appControl.runningProbe,
        ports: appControl.ports,
        baseInfo: appControl.baseInfo,
        // tags: appControl.tags,
        appDetail: appControl.appDetail,
        teamControl,
        appControl,
    }),
    null,
    null,
    { withRef: true },
)
@Form.create()
export default class Index extends React.Component {
    constructor(arg) {
        super(arg);
        this.state = {
            isShow: false,
            showEditVar: null,
            deleteVar: null,
            viewStartHealth: null,
            editStartHealth: null,
            viewRunHealth: null,
            editRunHealth: null,
            addTag: false,
            tabData: [],
            showAddMember: false,
            toEditAction: null,
            toDeleteMember: null,
            memberslist: null,
            members: null,
            buildSource: null,
            changeBuildSource: false,
            showApp: {},
            // appStatus: null,
            visibleAppSetting: false,
            tags: [],
            isInput: false,
            healthList: null,
            showHealth: false,
            Permissions: [],
            isScheme: "",
            list: []
        };
    }
    componentDidMount() {
        if (!this.canView()) return;
        this.props.dispatch({ type: "teamControl/fetchAllPerm" });
        this.fetchStartProbe();
        this.fetchPorts();
        this.fetchBaseInfo();
        this.fetchTags();
        this.loadMembers();
        this.loadpermsMembers();
        this.handleGetList();
        // this.getHealth();
        // this.loadBuildSourceInfo();
    }
    componentWillUnmount() {
        const { dispatch } = this.props;
        // dispatch({ type: "appControl/clearTags" });
        // dispatch({ type: "appControl/clearPorts" });
        // dispatch({ type: "appControl/clearInnerEnvs" });
        // dispatch({ type: "appControl/clearStartProbe" });
        // dispatch({ type: "appControl/clearRunningProbe" });
        // dispatch({ type: "appControl/clearMembers" });
    }

    handleGetList = () => {
        this.props.dispatch({
            type: "appControl/getInstanceList",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appAlias,
            },
            callback: (res) => {
                if (res._code == 200) {
                    this.setState({
                        list: res.list
                    })
                }
            },
        });
    }


    getHealth = () => {
        const { dispatch } = this.props;
        dispatch({
            type: "appControl/getHealthList",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appAlias,
            },
            callback: (data) => {
                if (data._code == "200") {
                    this.setState({ healthList: JSON.stringify(data.bean) == "{}" ? null : data.bean, isScheme: data.bean.Scheme });
                }
            },
        });
    }
    fetchBaseInfo = () => {
        const { dispatch } = this.props;
        dispatch({
            type: "appControl/fetchBaseInfo",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appAlias,
            },
        });
    };
    fetchPorts = () => {
        const { dispatch } = this.props;
        dispatch({
            type: "appControl/fetchPorts",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appAlias,
            }, callback: (data) => {
            },
        });
    };
    fetchTags = () => {
        const { dispatch } = this.props;
        dispatch({
            type: "appControl/fetchTags",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appAlias,
            },
            callback: (data) => {
                this.setState({ tags: data.used_labels });
            },
        });
    };

    fetchStartProbe() {
        this.props.dispatch({
            type: "appControl/fetchStartProbe",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appAlias,
            },
        });
    }

    loadMembers = () => {
        const { dispatch } = this.props;
        const team_name = globalUtil.getCurrTeamName();
        dispatch({
            type: "teamControl/fetchMember",
            payload: {
                team_name,
                app_alias: this.props.appAlias,
            },
            callback: (data) => {
                this.setState({ memberslist: data.list });
            },
        });
    };

    loadpermsMembers = () => {
        const { dispatch } = this.props;
        const team_name = globalUtil.getCurrTeamName();
        dispatch({
            type: "appControl/fetchpermsMember",
            payload: {
                team_name,
                app_alias: this.props.appAlias,
            },
            callback: (data) => {
                this.setState({ members: data.list });
            },
        });
    };
    showAddMember = () => {
        this.props.dispatch({
            type: "appControl/getPermissions",
            payload: {
            },
            callback: (res) => {
                if (res._code == "200") {
                    this.setState({
                        Permissions: res.list,
                        showAddMember: true
                    })
                }
            },
        });
    };
    hideAddMember = () => {
        this.setState({ showAddMember: false });
    };
    handleAddMember = (values) => {
        this.props.dispatch({
            type: "appControl/setMemberAction",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appAlias,
                ...values,
            },
            callback: () => {
                this.loadMembers();
                this.loadpermsMembers();
                this.hideAddMember();
            },
        });
    };

    // 是否可以浏览当前界面
    canView() {
        return true;
        // return appUtil.canManageAppSetting(this.props.appDetail);
    }

    onEditAction = (member) => {
        // this.setState({ toEditAction: member });
        this.props.dispatch({
            type: "appControl/getPermissions",
            payload: {
            },
            callback: (res) => {
                if (res._code == "200") {
                    this.setState({
                        Permissions: res.list,
                        toEditAction: member
                    })
                }
            },
        });
    };
    hideEditAction = () => {
        this.setState({ toEditAction: null });
    };
    handleEditAction = (value) => {
        const team_name = globalUtil.getCurrTeamName();
        this.props.dispatch({
            type: "appControl/editMemberAction",
            payload: {
                team_name,
                user_id: this.state.toEditAction.user_id,
                app_alias: this.props.appAlias,
                ...value,
            },
            callback: () => {
                this.loadMembers();
                this.loadpermsMembers();
                this.hideEditAction();
            },
        });
    };
    onDelMember = (member) => {
        this.setState({ toDeleteMember: member });
    };
    hideDelMember = () => {
        this.setState({ toDeleteMember: null });
    };
    handleDelMember = () => {
        const team_name = globalUtil.getCurrTeamName();
        this.props.dispatch({
            type: "appControl/deleteMember",
            payload: {
                team_name,
                app_alias: this.props.appAlias,
                user_id: this.state.toDeleteMember.user_id,
            },
            callback: () => {
                this.loadMembers();
                this.loadpermsMembers();
                this.hideDelMember();
            },
        });
    };
    handleSubmit = (vals) => {
        const { startProbe } = this.props
        if (appProbeUtil.isStartProbeUsed(startProbe)) {
            this.props.dispatch({
                type: "appControl/editStartProbe",
                payload: {
                    team_name: globalUtil.getCurrTeamName(),
                    app_alias: this.props.appAlias,
                    ...vals,
                },
                callback: () => {
                    this.handleCancel();
                    this.fetchStartProbe();
                },
            });
        } else {
            this.props.dispatch({
                type: "appControl/addStartProbe",
                payload: {
                    team_name: globalUtil.getCurrTeamName(),
                    app_alias: this.props.appAlias,
                    ...vals,
                },
                callback: () => {
                    this.handleCancel();
                    this.fetchStartProbe();
                },
            });
        }
    }

    handleCancel = () => {
        this.setState({ showHealth: false })
    };
    openCancel = () => {
        this.setState({ showHealth: true })
    };

    onChange = (e) => {
        this.props.form.setFieldsValue({
            attr_value: e.target.value,
        })
        this.setState({ isScheme: e.target.value, })
    }
    onChanges = (e) => {
        this.props.form.setFieldsValue({
            action: e.target.value,
        })
    }
    handleState = () => {
        let arr = this.state.list || [{ status: "-" }]
        let healthy = 0;
        let unhealthy = 0;
        let Unknown = 0;
        let nos = ""
        arr.map((item) => {
            const { status } = item
            if (status == "healthy") {
                healthy++
            } else if (status == "unhealthy") {
                unhealthy++
            } else if (status == "Unknown"||status == "unknown") {
                Unknown++
            } else {
                nos = "-"
            }
        })
        if (healthy != 0 && unhealthy == 0 && Unknown == 0 && Unknown == 0 && nos == "") {
            return <span>(<span style={{color:"green"}}>健康</span>)</span>
        } else if (healthy != 0 && (unhealthy != 0 || Unknown != 0)) {
            return <span>(<span style={{color:"green"}}>部分健康</span>)</span>
        } else if (healthy == 0 && unhealthy != 0 && Unknown == 0 && nos == "") {
            return <span>(<span style={{color:"red"}}>不健康</span>)</span>
        } else if (healthy == 0 && unhealthy == 0 && Unknown != 0 && nos == "") {
            return "(未知)"
        } else {
            return "(-)"
        }
    }

    handleStartProbeStart = (isUsed) => {
        const { startProbe } = this.props;
        this.props.dispatch({
            type: "appControl/editStartProbe",
            payload: {
                team_name: globalUtil.getCurrTeamName(),
                app_alias: this.props.appAlias,
                ...startProbe,
                is_used: isUsed,
            },
            callback: () => {
                this.fetchStartProbe();
            },
        });
    };

    handleStates = (data) => {
        if (appProbeUtil.isStartProbeUsed(data)) {
            if (appProbeUtil.isStartProbeStart(data)) {
                return "已启用";
            }
            return "已禁用";
        }
        return "未设置";
    }
    render() {
        if (!this.canView()) return <NoPermTip />;
        const self = this;
        const {
            baseInfo,
            teamControl,
            startProbe,
            ports
        } = this.props;
        const members = this.state.members || [];
        if (typeof (baseInfo.build_upgrade) != "boolean") {
            return null;
        }
        const { getFieldDecorator } = this.props.form;
        const data = this.props.data || {};
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 6 },
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 16 },
            },
        };
        const { healthList, showHealth, isScheme, list } = this.state
        return (
            <div>
                {startProbe &&
                    <Card
                        title={
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                健康检测
                                <div>
                                    {startProbe && <a style={{ marginRight: "5px" ,fontSize: "14px", fontWeight: 400 }} onClick={() => { this.openCancel() }}>{JSON.stringify(startProbe) != "{}" ? "编辑" : "设置"}</a>}
                                    {JSON.stringify(startProbe) != "{}" && appProbeUtil.isStartProbeStart(startProbe) ? (
                                        <a
                                            onClick={() => {
                                                this.handleStartProbeStart(false);
                                            }}
                                            href="javascript:;"
                                        >
                                            禁用
                                    </a>
                                    ) : JSON.stringify(startProbe) != "{}" && (
                                        <a
                                            onClick={() => {
                                                this.handleStartProbeStart(true);
                                            }}
                                            href="javascript:;"
                                        >
                                            启用
                                    </a>
                                    )}
                                </div>
                            </div>
                        }
                    >
                        {startProbe && <div style={{ display: "flex" }}>
                            <div style={{ width: "33%", textAlign: "center" }}>当前状态:{this.handleState()}</div>
                            <div style={{ width: "33%", textAlign: "center" }}>检测方式:{startProbe.scheme ? startProbe.scheme : "未设置"}</div>
                            <div style={{ width: "33%", textAlign: "center" }}>不健康处理方式:{startProbe.mode == "readiness" ? "下线" : startProbe.mode == "liveness" ? "重启" : startProbe.mode == "ignore" ? "忽略" : "未设置"}</div>
                        </div>}
                    </Card>}
                {showHealth && <Modal title="编辑健康检测" onOk={() => { this.handleSubmit() }} onCancel={this.handleCancel} visible={showHealth}>
                    {healthList && <Form onSubmit={this.handleSubmit}>
                        <FormItem {...formItemLayout} label="检测方式">
                            {getFieldDecorator("Scheme", {
                                initialValue: healthList.Scheme || "",
                                rules: [{ required: true, message: "请输入检测方式" }],
                            })(
                                <RadioGroup onChange={this.onChange}>
                                    <Radio value={"HTTP"}>HTTP</Radio>
                                    <Radio value={"TCP"}>TCP</Radio>
                                </RadioGroup>
                            )}
                        </FormItem>
                        <FormItem {...formItemLayout} label="检测端口">
                            {getFieldDecorator("port", {
                                initialValue: healthList.port || "",
                                rules: [{ required: true, message: "请输入检测端口" }],
                            })(<Input placeholder="请输入端口" style={{ width: "90%" }} />)}
                        </FormItem>
                        <FormItem {...formItemLayout} label="不健康处理方式:">
                            {getFieldDecorator("action", {
                                initialValue: healthList.action || "",
                                rules: [{ required: true, message: "请选择" }],
                            })(
                                <RadioGroup onChange={this.onChanges}>
                                    <Radio value={"offline"}>下线</Radio>
                                    <Radio value={"ignore"}>忽略</Radio>
                                </RadioGroup>
                            )}
                        </FormItem>
                        {isScheme == "HTTP" && <FormItem {...formItemLayout} label="URI">
                            {getFieldDecorator("path", {
                                initialValue: healthList.path || "",
                            })(<Input placeholder="请输入URI" style={{ width: "90%" }} />)}
                        </FormItem>}
                        <FormItem {...formItemLayout} label="检测间隔时间">
                            {getFieldDecorator("time_interval", {
                                initialValue: healthList.time_interval || "",
                            })(<Input type="number" style={{ width: "90%" }} placeholder="请输入间隔时间" />)}
                            <span style={{ marginLeft: 8 }}> 秒</span>
                        </FormItem>

                        <FormItem {...formItemLayout} label="允许错误次数">
                            {getFieldDecorator("max_error_num", {
                                initialValue: healthList.max_error_num || "",
                            })(<Input type="number" style={{ width: "90%" }} placeholder="请输入允许错误次数" />)}
                            <span style={{ marginLeft: 8 }}> 秒</span>
                        </FormItem>
                    </Form>}
                </Modal>}
                {this.state.showHealth && (
                    <EditHealthCheck
                        ports={ports}
                        onOk={this.handleSubmit}
                        title="健康检测"
                        data={startProbe}
                        onCancel={this.handleCancel}
                        types={"third"}
                    />
                )}
                <Card
                    style={{
                        marginTop: 24,
                    }}
                    title={
                        <Fragment>
                            {" "}
                            成员应用权限{" "}
                            <Tooltip title="示例：成员所属角色包含 `启动`权限, 成员应用权限包含`关闭`权限，则该成员对该应用的最终权限为 `启动`+`关闭`">
                                {" "}
                                <Icon type="info-circle-o" />{" "}
                            </Tooltip>
                        </Fragment>
                    }
                >
                    <ScrollerX sm={600}>
                        <Table
                            columns={[
                                {
                                    title: "用户名",
                                    dataIndex: "nick_name",
                                    key: "1",
                                },
                                {
                                    title: "邮箱",
                                    dataIndex: "email",
                                    key: "2",
                                },
                                {
                                    title: "操作权限",
                                    width: "50%",
                                    dataIndex: "service_perms",
                                    key: "3",
                                    render(val) {
                                        const arr = val || [];
                                        return <span>{arr.map((item, index) => <Tag key={index}>{item.perm_info}</Tag>)}</span>;
                                    },
                                },
                                {
                                    title: "操作",
                                    dataIndex: "action",
                                    key: "4",
                                    render: (v, data) => {
                                        if (!appUtil.canManageAppMember(this.props.appDetail)) return null;
                                        return (
                                            <div>
                                                <a
                                                    onClick={() => {
                                                        self.onEditAction(data);
                                                    }}
                                                    href="javascript:;"
                                                >
                                                    编辑权限
                                                </a>
                                                <a
                                                    onClick={() => {
                                                        self.onDelMember(data);
                                                    }}
                                                    href="javascript:;"
                                                >
                                                    移除应用权限
                                                </a>
                                            </div>
                                        );
                                    },
                                },
                            ]}
                            pagination={false}
                            dataSource={members}
                        />
                    </ScrollerX>
                    {appUtil.canManageAppMember(this.props.appDetail) && (
                        <div
                            style={{
                                marginTop: 10,
                                textAlign: "right",
                            }}
                        >
                            <Button onClick={this.showAddMember}>
                                <Icon type="plus" />
                                设置成员应用权限
                            </Button>
                        </div>
                    )}
                </Card>

                {this.state.toEditAction && (
                    <EditActions
                        onSubmit={this.handleEditAction}
                        onCancel={this.hideEditAction}
                        actions={this.state.Permissions}
                        value={this.state.toEditAction.service_perms.map(item => item.id)}
                    />
                )}
                {this.state.showAddMember && (
                    <SetMemberAppAction
                        members={this.state.memberslist}
                        actions={this.state.Permissions}
                        onOk={this.handleAddMember}
                        onCancel={this.hideAddMember}
                    />
                )}
                {this.state.toDeleteMember && (
                    <ConfirmModal
                        onOk={this.handleDelMember}
                        title="删除成员权限"
                        desc="确定要删除此成员的应用权限吗？"
                        onCancel={this.hideDelMember}
                    />
                )}
            </div>
        );
    }
}
