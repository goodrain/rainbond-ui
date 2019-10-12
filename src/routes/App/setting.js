import React, { Fragment } from "react";
import { connect } from "dva";
import {
  Card,
  Form,
  Button,
  Icon,
  Table,
  Tag,
  notification,
  Tooltip,
  Modal,
  Radio,
  Popconfirm,
  Switch
} from "antd";
import ConfirmModal from "../../components/ConfirmModal";
import SetMemberAppAction from "../../components/SetMemberAppAction";
import ScrollerX from "../../components/ScrollerX";
import globalUtil from "../../utils/global";
import appProbeUtil from "../../utils/appProbe-util";
import appUtil from "../../utils/app";
import appStatusUtil from "../../utils/appStatus-util";
import NoPermTip from "../../components/NoPermTip";
import AddTag from "./setting/add-tag";
import EditActions from "./setting/perm";
import ViewHealthCheck from "./setting/health-check";
import ViewRunHealthCheck from "./setting/run-health-check";
import EditHealthCheck from "./setting/edit-health-check";
import AddVarModal from "./setting/env";
import EditRunHealthCheck from "./setting/edit-run-health-check";
import MarketAppDetailShow from "../../components/MarketAppDetailShow";
const FormItem = Form.Item;
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
    appControl
  }),
  null,
  null,
  { withRef: true }
)
@Form.create()
export default class Index extends React.Component {
  constructor(arg) {
    super(arg);
    this.state = {
      isShow: false,
      showAddVar: false,
      showEditVar: null,
      deleteVar: null,
      transfer: null,
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
      showMarketAppDetail: false,
      showApp: {},
      // appStatus: null,
      visibleAppSetting: false,
      tags: [],
      isInput: false,
      page: 1,
      page_size: 5,
      total: 0,
      env_name: ""
    };
  }
  componentDidMount() {
    if (!this.canView()) return;
    this.props.dispatch({ type: "teamControl/fetchAllPerm" });
    this.fetchInnerEnvs();
    this.fetchStartProbe();
    this.fetchRunningProbe();
    this.fetchPorts();
    this.fetchBaseInfo();
    this.fetchTags();
    this.loadMembers();
    this.loadpermsMembers();
    // this.loadBuildSourceInfo();
  }
  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({ type: "appControl/clearTags" });
    dispatch({ type: "appControl/clearPorts" });
    dispatch({ type: "appControl/clearInnerEnvs" });
    dispatch({ type: "appControl/clearStartProbe" });
    dispatch({ type: "appControl/clearRunningProbe" });
    dispatch({ type: "appControl/clearMembers" });
  }

  onTransfer = data => {
    this.setState({ transfer: data });
  };

  onDeleteVar = data => {
    this.setState({ deleteVar: data });
  };
  fetchBaseInfo = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "appControl/fetchBaseInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      }
    });
  };
  fetchPorts = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "appControl/fetchPorts",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      }
    });
  };
  fetchTags = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "appControl/fetchTags",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: data => {
        if (data) {
          this.setState({ tags: data.used_labels });
        }
      }
    });
  };
  // 变量信息
  fetchInnerEnvs = () => {
    const { page, page_size, env_name } = this.state;
    this.props.dispatch({
      type: "appControl/fetchInnerEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        page,
        page_size,
        env_name
      },
      callback: res => {
        if (res && res._code == 200) {
          this.setState({ total: res.bean.total });
        }
      }
    });
  };
  fetchStartProbe() {
    this.props.dispatch({
      type: "appControl/fetchStartProbe",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      }
    });
  }
  fetchRunningProbe() {
    this.props.dispatch({
      type: "appControl/fetchRunningProbe",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: code => {}
    });
  }
  loadMembers = () => {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    dispatch({
      type: "teamControl/fetchMember",
      payload: {
        team_name,
        app_alias: this.props.appAlias
      },
      callback: data => {
        if (data) {
          this.setState({ memberslist: data.list });
        }
      }
    });
  };

  loadpermsMembers = () => {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    dispatch({
      type: "appControl/fetchpermsMember",
      payload: {
        team_name,
        app_alias: this.props.appAlias
      },
      callback: data => {
        if (data) {
          this.setState({ members: data.list });
        }
      }
    });
  };
  showAddMember = () => {
    this.setState({ showAddMember: true });
  };
  hideAddMember = () => {
    this.setState({ showAddMember: false });
  };
  handleAddMember = values => {
    this.props.dispatch({
      type: "appControl/setMemberAction",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ...values
      },
      callback: () => {
        this.loadMembers();
        this.loadpermsMembers();
        this.hideAddMember();
      }
    });
  };
  handleAddVar = () => {
    this.setState({ showAddVar: true });
  };
  handleCancelAddVar = () => {
    this.setState({ showAddVar: false });
  };
  handleSubmitAddVar = vals => {
    this.props.dispatch({
      type: "appControl/addInnerEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        attr_name: vals.attr_name,
        attr_value: vals.attr_value,
        name: vals.name
      },
      callback: () => {
        this.handleCancelAddVar();
        this.fetchInnerEnvs();
      }
    });
  };
  // 是否可以浏览当前界面
  canView() {
    return true;
    // return appUtil.canManageAppSetting(this.props.appDetail);
  }
  cancelDeleteVar = () => {
    this.setState({ deleteVar: null });
  };
  cancelTransfer = () => {
    this.setState({ transfer: null });
  };

  handleDeleteVar = () => {
    this.props.dispatch({
      type: "appControl/deleteEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ID: this.state.deleteVar.ID
      },
      callback: () => {
        this.cancelDeleteVar();
        this.fetchInnerEnvs();
        notification.success({ message: "操作成功" });
        this.props.onshowRestartTips(true);
      }
    });
  };

  handleTransfer = () => {
    const { transfer } = this.state;
    this.props.dispatch({
      type: "appControl/putTransfer",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ID: transfer.ID,
        scope: transfer.scope == "inner" ? "outer" : "inner"
      },
      callback: res => {
        this.cancelTransfer();
        this.fetchInnerEnvs();
        notification.success({ message: "操作成功" });
      }
    });
  };

  onEditVar = data => {
    this.setState({ showEditVar: data });
  };
  cancelEditVar = () => {
    this.setState({ showEditVar: null });
  };
  handleEditVar = vals => {
    const { showEditVar } = this.state;
    this.props.dispatch({
      type: "appControl/editEvns",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ID: showEditVar.ID,
        attr_value: vals.attr_value,
        name: vals.name
      },
      callback: () => {
        this.cancelEditVar();
        this.fetchInnerEnvs();
      }
    });
  };
  handleStartProbeStart = isUsed => {
    const { startProbe } = this.props;
    this.props.dispatch({
      type: "appControl/editStartProbe",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ...startProbe,
        is_used: isUsed
      },
      callback: () => {
        this.fetchStartProbe();
      }
    });
  };
  handleRunProbeStart = isUsed => {
    const { runningProbe } = this.props;
    this.props.dispatch({
      type: "appControl/editRunProbe",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ...runningProbe,
        is_used: isUsed
      },
      callback: () => {
        this.fetchRunningProbe();
      }
    });
  };
  handleEditHealth = vals => {
    const { startProbe } = this.props;
    if (appProbeUtil.isStartProbeUsed(this.state.editStartHealth)) {
      this.props.dispatch({
        type: "appControl/editStartProbe",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ...vals,
          old_mode: startProbe.mode
        },
        callback: () => {
          this.onCancelEditStartProbe();
          this.fetchStartProbe();
        }
      });
    } else {
      this.props.dispatch({
        type: "appControl/addStartProbe",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ...vals
        },
        callback: () => {
          this.onCancelEditStartProbe();
          this.fetchStartProbe();
        }
      });
    }
  };
  handleEditRunHealth = vals => {
    if (appProbeUtil.isRunningProbeUsed(this.state.editRunHealth)) {
      this.props.dispatch({
        type: "appControl/editRunProbe",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ...vals
        },
        callback: () => {
          this.onCancelEditRunProbe();
          this.fetchRunningProbe();
        }
      });
    } else {
      this.props.dispatch({
        type: "appControl/addRunProbe",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ...vals
        },
        callback: () => {
          this.onCancelEditRunProbe();
          this.fetchRunningProbe();
        }
      });
    }
  };
  showViewStartHealth = data => {
    this.setState({ viewStartHealth: data });
  };
  hiddenViewStartHealth = () => {
    this.setState({ viewStartHealth: null });
  };
  showViewRunningHealth = data => {
    this.setState({ viewRunHealth: data });
  };
  hiddenViewRunningHealth = () => {
    this.setState({ viewRunHealth: null });
  };
  onCancelEditStartProbe = () => {
    this.setState({ editStartHealth: null });
  };
  onCancelEditRunProbe = () => {
    this.setState({ editRunHealth: null });
  };
  handleRemoveTag = tag => {
    this.props.dispatch({
      type: "appControl/deleteTag",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        label_id: tag.label_id
      },
      callback: () => {
        notification.success({ message: "删除成功" });
        this.fetchTags();
      }
    });
  };
  onAddTag = () => {
    this.props.dispatch({
      type: "appControl/getTagInformation",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: data => {
        if (data) {
          this.setState({
            addTag: true,
            tabData: data.list
          });
        }
      }
    });
  };
  cancelAddTag = () => {
    this.setState({ addTag: false, tabData: [] });
  };
  handleAddTag = tags => {
    this.props.dispatch({
      type: "appControl/addTag",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        label_ids: tags
      },
      callback: () => {
        this.cancelAddTag();
        notification.success({ message: "添加成功" });
        this.fetchTags();
        this.setState({ tabData: [] });
      }
    });
  };
  onEditAction = member => {
    this.setState({ toEditAction: member });
  };
  hideEditAction = () => {
    this.setState({ toEditAction: null });
  };
  handleEditAction = value => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "appControl/editMemberAction",
      payload: {
        team_name,
        user_id: this.state.toEditAction.user_id,
        app_alias: this.props.appAlias,
        ...value
      },
      callback: () => {
        this.loadMembers();
        this.loadpermsMembers();
        this.hideEditAction();
      }
    });
  };
  onDelMember = member => {
    this.setState({ toDeleteMember: member });
  };
  hideDelMember = () => {
    this.setState({ toDeleteMember: null });
  };
  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false
    });
  };
  handleDelMember = () => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "appControl/deleteMember",
      payload: {
        team_name,
        app_alias: this.props.appAlias,
        user_id: this.state.toDeleteMember.user_id
      },
      callback: () => {
        this.loadMembers();
        this.loadpermsMembers();
        this.hideDelMember();
      }
    });
  };
  setupAttribute = () => {
    if (appStatusUtil.canVisit(this.props.status)) {
      notification.warning({ message: "请先关闭组件后再更改状态" });
      return;
    }
    this.setState({
      visibleAppSetting: true
    });
  };
  handleOk_AppSetting = () => {
    const { dispatch } = this.props;

    this.props.form.validateFields((err, values) => {
      if (!err) {
        dispatch({
          type: "appControl/updateAppStatus",
          payload: {
            team_name: globalUtil.getCurrTeamName(),
            app_alias: this.props.appAlias,
            extend_method: values.extend_method
          },
          callback: data => {
            if (data) {
              notification.success({ message: data.msg_show || "修改成功" });
              this.setState(
                {
                  visibleAppSetting: false,
                  isShow: false
                },
                () => {
                  this.fetchBaseInfo();
                }
              );
            }
          }
        });
      }
    });
  };
  handleChange = checked => {
    const { onChecked } = this.props;
    if (onChecked) {
      onChecked && onChecked(checked);
      setTimeout(() => {
        this.fetchBaseInfo();
      }, 1000);
    }
  };
  handleCancel_AppSetting = () => {
    this.setState({
      visibleAppSetting: false,
      isShow: false
    });
  };
  modifyText = () => {
    this.setState({ isInput: true });
  };
  handlePressenter = e => {
    const { dispatch } = this.props;
    const service_name = e.target.value;
    const { baseInfo } = this.props;
    if (service_name == baseInfo.service_name) {
      this.setState({ isInput: false });
      return;
    }
    dispatch({
      type: "appControl/updateServiceName",
      payload: {
        service_name,
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      },
      callback: data => {
        if (data) {
          this.fetchBaseInfo();
          notification.success({ message: "修改成功" });
          this.setState({ isInput: false });
        }
      }
    });
  };

  onChange1 = e => {
    const show =
      e.target.value == (this.props.baseInfo.extend_method || "stateless")
        ? false
        : true;
    this.setState({
      isShow: show
    });
  };

  handleState = data => {
    if (appProbeUtil.isStartProbeUsed(data)) {
      if (appProbeUtil.isStartProbeStart(data)) {
        return "已启用";
      }
      return "已禁用";
    }
    return "未设置";
  };

  onPageChange = page => {
    this.setState(
      {
        page
      },
      () => {
        this.fetchInnerEnvs();
      }
    );
  };

  handleSearch = env_name => {
    this.setState(
      {
        page: 1,
        env_name
      },
      () => {
        this.fetchInnerEnvs();
      }
    );
  };

  render() {
    if (!this.canView()) return <NoPermTip />;
    const self = this;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 4
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 18
        }
      }
    };
    const appsetting_formItemLayout = {
      labelCol: {
        span: 5
      },
      wrapperCol: {
        span: 19
      }
    };
    const radioStyle = {
      display: "block",
      height: "30px",
      lineHeight: "30px"
    };
    const {
      innerEnvs,
      runningProbe,
      startProbe,
      ports,
      baseInfo,
      appDetail,
      teamControl
    } = this.props;
    const members = this.state.members || [];
    const { viewStartHealth, is_fix, tags, tabData, isShow } = this.state;
    if (typeof baseInfo.build_upgrade != "boolean") {
      return null;
    }
    return (
      <Fragment>
        <Card
          style={{
            marginBottom: 24
          }}
          title="基础信息"
        >
          <Form>
            <FormItem
              style={{
                marginBottom: 0
              }}
              {...formItemLayout}
              label="创建时间"
            >
              {baseInfo.create_time || ""}
            </FormItem>
            <FormItem
              style={{
                marginBottom: 0
              }}
              {...formItemLayout}
              label="应用部署类型"
            >
              {baseInfo.extend_method == "stateless"
                ? "无状态应用"
                : "有状态应用"}
              <Button
                onClick={this.setupAttribute}
                size="small"
                style={{ marginLeft: "10px" }}
              >
                更改
              </Button>
            </FormItem>
            <FormItem
              style={{
                marginBottom: 0
              }}
              {...formItemLayout}
              label="应用特性"
            >
              {(tags || []).map(tag => (
                <Tag
                  closable
                  onClose={e => {
                    e.preventDefault();
                    this.handleRemoveTag(tag);
                  }}
                >
                  {tag.label_alias}
                </Tag>
              ))}
              <Button onClick={this.onAddTag} size="small">
                添加特性
              </Button>
            </FormItem>
            <FormItem
              style={{
                marginBottom: 0
              }}
              {...formItemLayout}
              label="应用构建后自动升级"
            >
              <Switch
                defaultChecked={baseInfo.build_upgrade}
                checkedChildren="是"
                unCheckedChildren="否"
                onChange={this.handleChange}
              />
            </FormItem>
            {/* 5.1.6 TODO: */}
            {/* {!(baseInfo.extend_method == "stateless") && <FormItem
              style={{
                marginBottom: 0,
              }}
              {...formItemLayout}
              label="组件名称"
            >
              {this.state.isInput ? <Input style={{ width: "200px" }} defaultValue={baseInfo.service_name} onPressEnter={this.handlePressenter} ref="myInput" /> : baseInfo.service_name || '无'}
              {this.state.isInput ? '' : <Button onClick={this.modifyText} size="small" style={{ marginLeft: "10px" }}>修改</Button>}
            </FormItem>} */}
          </Form>
        </Card>
        {/* <AutoDeploy app={appDetail} /> */}
        <Card
          style={{
            marginBottom: 24
          }}
          title={
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              健康检测
              {startProbe && (
                <div>
                  <a
                    onClick={() => {
                      this.setState({ editStartHealth: startProbe });
                    }}
                    style={{
                      marginRight: "5px",
                      fontSize: "14px",
                      fontWeight: 400
                    }}
                  >
                    {JSON.stringify(startProbe) != "{}" ? "编辑" : "设置"}
                  </a>

                  {/* {JSON.stringify(startProbe) != "{}" && <a
                    href="javascript:;"
                    onClick={() => {
                      this.showViewStartHealth(startProbe);
                    }}
                    style={{ marginRight: "5px" }}
                  >查看</a>} */}

                  {JSON.stringify(startProbe) != "{}" &&
                  appProbeUtil.isStartProbeStart(startProbe) ? (
                    <a
                      onClick={() => {
                        this.handleStartProbeStart(false);
                      }}
                      href="javascript:;"
                      style={{ fontSize: "14px", fontWeight: 400 }}
                    >
                      禁用
                    </a>
                  ) : (
                    JSON.stringify(startProbe) != "{}" && (
                      <a
                        onClick={() => {
                          this.handleStartProbeStart(true);
                        }}
                        href="javascript:;"
                        style={{ fontSize: "14px", fontWeight: 400 }}
                      >
                        启用
                      </a>
                    )
                  )}
                </div>
              )}
            </div>
          }
        >
          {/* <Table
            columns={[
              {
                title: "不健康处理方式",
                dataIndex: "type",
                render: (v, data, index) => {
                  // if (index === 0) {
                  //   return "启动时检测";
                  // }
                  // if (index === 1) {
                  //   return "运行时检测";
                  // }
                  if (data) {
                    return data.mode == "readiness" ? "下线" : data.mode == "liveness" ? "重启" : data.mode == "ignore" ? "忽略" : ""
                  }
                  return ""
                },
              },
              {
                title: "状态",
                dataIndex: "status",
                render: (v, data, index) => {
                  if (index === 0) {
                    if (appProbeUtil.isStartProbeUsed(data)) {
                      if (appProbeUtil.isStartProbeStart(data)) {
                        return "已启用";
                      }
                      return "已禁用";
                    }
                    return "未设置";
                  }
                  if (index === 1) {
                    if (appProbeUtil.isRunningProbeUsed(data)) {
                      if (appProbeUtil.isRunningProbeStart(data)) {
                        return "已启用";
                      }
                      return "已禁用";
                    }
                    return "未设置";
                  }
                },
              },
              {
                title: "操作",
                dataIndex: "action",
                render: (v, data, index) => {
                  if (index === 0) {
                    if (appProbeUtil.isStartProbeUsed(data)) {
                      return (
                        <Fragment>
                          <a
                            href="javascript:;"
                            onClick={() => {
                              this.showViewStartHealth(data);
                            }}
                          >
                            查看
                          </a>
                          {
                            <a
                              href="javascript:;"
                              onClick={() => {
                                this.setState({ editStartHealth: data });
                              }}
                            >
                              {" "}
                              设置{" "}
                            </a>
                          }
                          {appProbeUtil.isStartProbeStart(data) ? (
                            <a
                              onClick={() => {
                                this.handleStartProbeStart(false);
                              }}
                              href="javascript:;"
                            >
                              禁用
                            </a>
                          ) : (
                              <a
                                onClick={() => {
                                  this.handleStartProbeStart(true);
                                }}
                                href="javascript:;"
                              >
                                启用
                            </a>
                            )}
                        </Fragment>
                      );
                    }
                    return (
                      <a
                        href="javascript:;"
                        onClick={() => {
                          this.setState({
                            editStartHealth: {
                              data,
                            },
                          });
                        }}
                      >
                        设置
                      </a>
                    );
                  }
                  if (index === 1) {
                    if (appProbeUtil.isRunningProbeUsed(data)) {
                      return (
                        <Fragment>
                          <a
                            href="javascript:;"
                            onClick={() => {
                              this.showViewRunningHealth(data);
                            }}
                          >
                            查看
                          </a>
                          {
                            <a
                              href="javascript:;"
                              onClick={() => {
                                this.setState({ editRunHealth: data });
                              }}
                            >
                              {" "}
                              设置{" "}
                            </a>
                          }
                          {appProbeUtil.isRunningProbeStart(data) ? (
                            <a
                              onClick={() => {
                                this.handleRunProbeStart(false);
                              }}
                              href="javascript:;"
                            >
                              禁用
                            </a>
                          ) : (
                              <a
                                onClick={() => {
                                  this.handleRunProbeStart(true);
                                }}
                                href="javascript:;"
                              >
                                启用
                            </a>
                            )}
                        </Fragment>
                      );
                    }
                    return (
                      <a
                        href="javascript:;"
                        onClick={() => {
                          this.setState({ editRunHealth: data });
                        }}
                      >
                        设置
                      </a>
                    );
                  }
                },
              },
            ]}
            pagination={false}
            dataSource={[startProbe, runningProbe]}
          /> */}

          {startProbe && (
            <div style={{ display: "flex" }}>
              <div style={{ width: "33%", textAlign: "center" }}>
                当前状态:{this.handleState(startProbe)}
              </div>
              <div style={{ width: "33%", textAlign: "center" }}>
                检测方式:{startProbe.scheme ? startProbe.scheme : "未设置"}
              </div>
              <div style={{ width: "33%", textAlign: "center" }}>
                不健康处理方式:
                {startProbe.mode == "readiness"
                  ? "下线"
                  : startProbe.mode == "liveness"
                  ? "重启"
                  : startProbe.mode == "ignore"
                  ? "忽略"
                  : "未设置"}
              </div>
            </div>
          )}
        </Card>
        <Card
          style={{
            marginBottom: 24
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
                  dataIndex: "nick_name"
                },
                {
                  title: "邮箱",
                  dataIndex: "email"
                },
                {
                  title: "操作权限",
                  width: "50%",
                  dataIndex: "service_perms",
                  render(val) {
                    const arr = val || [];
                    return (
                      <span>
                        {arr.map(item => (
                          <Tag>{item.perm_info}</Tag>
                        ))}
                      </span>
                    );
                  }
                },
                {
                  title: "操作",
                  dataIndex: "action",
                  render: (v, data) => {
                    if (!appUtil.canManageAppMember(this.props.appDetail))
                      return null;

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
                  }
                }
              ]}
              pagination={false}
              dataSource={members}
            />
          </ScrollerX>
          {appUtil.canManageAppMember(this.props.appDetail) && (
            <div
              style={{
                marginTop: 10,
                textAlign: "right"
              }}
            >
              <Button onClick={this.showAddMember}>
                <Icon type="plus" />
                设置成员应用权限
              </Button>
            </div>
          )}
        </Card>

        {this.state.addTag && (
          <AddTag
            tags={tabData ? tabData : []}
            onCancel={this.cancelAddTag}
            onOk={this.handleAddTag}
          />
        )}
        {this.state.showAddVar && (
          <AddVarModal
            onCancel={this.handleCancelAddVar}
            onSubmit={this.handleSubmitAddVar}
            isShowRestartTips={onoffshow => {
              this.props.onshowRestartTips(onoffshow);
            }}
          />
        )}
        {this.state.showEditVar && (
          <AddVarModal
            onCancel={this.cancelEditVar}
            onSubmit={this.handleEditVar}
            data={this.state.showEditVar}
            isShowRestartTips={onoffshow => {
              this.props.onshowRestartTips(onoffshow);
            }}
          />
        )}

        {this.state.deleteVar && (
          <ConfirmModal
            onOk={this.handleDeleteVar}
            onCancel={this.cancelDeleteVar}
            title="删除变量"
            desc="确定要删除此变量吗？"
            subDesc="此操作不可恢复"
          />
        )}

        {this.state.transfer && (
          <ConfirmModal
            onOk={this.handleTransfer}
            onCancel={this.cancelTransfer}
            title="转移环境变量"
            desc="确定要转移此变量吗？"
            subDesc=""
          />
        )}

        {this.state.viewStartHealth && (
          <ViewHealthCheck
            title="健康检查查看"
            data={this.state.viewStartHealth}
            onCancel={() => {
              this.setState({ viewStartHealth: null });
            }}
          />
        )}
        {this.state.editStartHealth && (
          <EditHealthCheck
            ports={ports}
            onOk={this.handleEditHealth}
            title="健康检测"
            data={this.state.editStartHealth}
            onCancel={this.onCancelEditStartProbe}
          />
        )}
        {this.state.toEditAction && (
          <EditActions
            onSubmit={this.handleEditAction}
            onCancel={this.hideEditAction}
            actions={teamControl.actions}
            value={this.state.toEditAction.service_perms.map(item => item.id)}
          />
        )}
        {this.state.viewRunHealth && (
          <ViewRunHealthCheck
            title="运行时检查查看"
            data={this.state.viewRunHealth}
            onCancel={() => {
              this.setState({ viewRunHealth: null });
            }}
          />
        )}
        {this.state.editRunHealth && (
          <EditRunHealthCheck
            ports={ports}
            onOk={this.handleEditRunHealth}
            title="设置运行时检查"
            data={this.state.editRunHealth}
            onCancel={this.onCancelEditRunProbe}
          />
        )}
        {this.state.showAddMember && (
          <SetMemberAppAction
            members={this.state.memberslist}
            actions={teamControl.actions}
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
        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}
        {this.state.visibleAppSetting && (
          <Modal
            title="应用设置"
            visible={this.state.visibleAppSetting}
            // onOk={this.handleOk_AppSetting}
            onCancel={this.handleCancel_AppSetting}
            footer={
              isShow ? (
                [
                  <Popconfirm
                    title="修改类型数据会丢失,你确定要修改吗？"
                    onConfirm={this.handleOk_AppSetting}
                    onCancel={this.handleCancel_AppSetting}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button type="primary">确定</Button>
                  </Popconfirm>,
                  <Button type="primary" onClick={this.handleCancel_AppSetting}>
                    取消
                  </Button>
                ]
              ) : (
                <div>
                  {" "}
                  <Button type="primary" onClick={this.handleCancel_AppSetting}>
                    确定
                  </Button>
                  <Button type="primary" onClick={this.handleCancel_AppSetting}>
                    取消
                  </Button>
                </div>
              )
            }
          >
            <Form.Item {...appsetting_formItemLayout} label="应用类型">
              {getFieldDecorator("extend_method", {
                initialValue: baseInfo.extend_method || "stateless",
                rules: [
                  {
                    required: true,
                    message: "请选择应用类型"
                  }
                ]
              })(
                <RadioGroup onChange={this.onChange1}>
                  <Radio style={radioStyle} value="stateless">
                    无状态应用（包括Web类，API类）
                  </Radio>
                  <Radio style={radioStyle} value={"state"}>
                    有状态应用（包括DB类，集群类，消息中间件类，数据类）
                  </Radio>
                </RadioGroup>
              )}
            </Form.Item>
          </Modal>
        )}
      </Fragment>
    );
  }
}
