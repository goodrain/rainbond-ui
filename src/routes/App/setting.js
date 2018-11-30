import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Card, Form, Button, Icon, Table, Tag, notification, Tooltip } from "antd";
import ConfirmModal from "../../components/ConfirmModal";
import SetMemberAppAction from "../../components/SetMemberAppAction";
import ScrollerX from "../../components/ScrollerX";
import globalUtil from "../../utils/global";
import appProbeUtil from "../../utils/appProbe-util";
import appUtil from "../../utils/app";
import NoPermTip from "../../components/NoPermTip";
import AutoDeploy from "./setting/auto-deploy";
import AddTag from "./setting/add-tag";
import EditActions from "./setting/perm";
import ViewHealthCheck from "./setting/health-check";
import ViewRunHealthCheck from "./setting/run-health-check";
import EditHealthCheck from "./setting/edit-health-check";
import AddVarModal from "./setting/env";
import EditRunHealthCheck from "./setting/edit-run-health-check";
import DescriptionList from "../../components/DescriptionList";
import ChangeBuildSource from "./setting/edit-buildsource";
import MarketAppDetailShow from "../../components/MarketAppDetailShow";
const FormItem = Form.Item;
import {
  getStatus
} from '../../services/app';
@connect(
  ({ user, appControl, teamControl }) => ({
    currUser: user.currentUser,
    innerEnvs: appControl.innerEnvs,
    startProbe: appControl.startProbe,
    runningProbe: appControl.runningProbe,
    ports: appControl.ports,
    baseInfo: appControl.baseInfo,
    tags: appControl.tags,
    teamControl,
    appControl,
  }),
  null,
  null,
  { withRef: true },
)
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      showAddVar: false,
      showEditVar: null,
      deleteVar: null,
      viewStartHealth: null,
      editStartHealth: null,
      viewRunHealth: null,
      editRunHealth: null,
      addTag: false,
      showAddMember: false,
      toEditAction: null,
      toDeleteMember: null,
      memberslist: null,
      members: null,
      buildSource: null,
      changeBuildSource: false,
      showMarketAppDetail: false,
      showApp: {},
      appStatus: null
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
    this.loadBuildSourceInfo();
    this.queryStatus();
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
  onDeleteVar = (data) => {
    this.setState({ deleteVar: data });
  };
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
    });
  };
  fetchInnerEnvs = () => {
    this.props.dispatch({
      type: "appControl/fetchInnerEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
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
  fetchRunningProbe() {
    this.props.dispatch({
      type: "appControl/fetchRunningProbe",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
      },
      callback: (code) => {
        console.log(code);
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
  loadBuildSourceInfo = () => {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    dispatch({
      type: "appControl/getAppBuidSource",
      payload: {
        team_name,
        service_alias: this.props.appAlias,
      },
      callback: (data) => {
        this.setState({ buildSource: data.bean });
      },
    });
  };
  queryStatus = () => {
    const team_name = globalUtil.getCurrTeamName();
    const { appAlias } = this.props.match.params;
    getStatus({
      team_name,
      app_alias: appAlias
    }).then((data) => {
      if (data) {
        this.setState({ appStatus: data.bean })
      }
      // setTimeout(() => {
      //     this.getStatus();
      // }, 5000)

    })
  }
  showAddMember = () => {
    this.setState({ showAddMember: true });
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
  handleAddVar = () => {
    this.setState({ showAddVar: true });
  };
  handleCancelAddVar = () => {
    this.setState({ showAddVar: false });
  };
  handleSubmitAddVar = (vals) => {
    this.props.dispatch({
      type: "appControl/addInnerEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        attr_name: vals.attr_name,
        attr_value: vals.attr_value,
        name: vals.name,
      },
      callback: () => {
        this.handleCancelAddVar();
        this.fetchInnerEnvs();
      },
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
  handleDeleteVar = () => {
    this.props.dispatch({
      type: "appControl/deleteEnvs",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        attr_name: this.state.deleteVar.attr_name,
      },
      callback: () => {
        this.cancelDeleteVar();
        this.fetchInnerEnvs();
        notification.success({ message: "操作成功，需要重启才能生效" });
        this.props.onshowRestartTips(true);
      },
    });
  };
  onEditVar = (data) => {
    this.setState({ showEditVar: data });
  };
  cancelEditVar = () => {
    this.setState({ showEditVar: null });
  };
  handleEditVar = (vals) => {
    this.props.dispatch({
      type: "appControl/editEvns",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        attr_name: vals.attr_name,
        attr_value: vals.attr_value,
        name: vals.name,
      },
      callback: () => {
        this.cancelEditVar();
        this.fetchInnerEnvs();
      },
    });
  };
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
  handleRunProbeStart = (isUsed) => {
    const { runningProbe } = this.props;
    this.props.dispatch({
      type: "appControl/editRunProbe",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        ...runningProbe,
        is_used: isUsed,
      },
      callback: () => {
        this.fetchRunningProbe();
      },
    });
  };
  handleEditHealth = (vals) => {
    if (appProbeUtil.isStartProbeUsed(this.state.editStartHealth)) {
      this.props.dispatch({
        type: "appControl/editStartProbe",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ...vals,
        },
        callback: () => {
          this.onCancelEditStartProbe();
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
          this.onCancelEditStartProbe();
          this.fetchStartProbe();
        },
      });
    }
  };
  handleEditRunHealth = (vals) => {
    if (appProbeUtil.isRunningProbeUsed(this.state.editRunHealth)) {
      this.props.dispatch({
        type: "appControl/editRunProbe",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ...vals,
        },
        callback: () => {
          this.onCancelEditRunProbe();
          this.fetchRunningProbe();
        },
      });
    } else {
      this.props.dispatch({
        type: "appControl/addRunProbe",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ...vals,
        },
        callback: () => {
          this.onCancelEditRunProbe();
          this.fetchRunningProbe();
        },
      });
    }
  };
  showViewStartHealth = (data) => {
    this.setState({ viewStartHealth: data });
  };
  hiddenViewStartHealth = () => {
    this.setState({ viewStartHealth: null });
  };
  showViewRunningHealth = (data) => {
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
  handleRemoveTag = (tag) => {
    this.props.dispatch({
      type: "appControl/deleteTag",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        label_id: tag.label_id,
      },
      callback: () => {
        notification.success({ message: "删除成功" });
        this.fetchTags();
      },
    });
  };
  onAddTag = () => {
    this.setState({ addTag: true });
  };
  cancelAddTag = () => {
    this.setState({ addTag: false });
  };
  handleAddTag = (tags) => {
    this.props.dispatch({
      type: "appControl/addTag",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        tags,
      },
      callback: () => {
        this.cancelAddTag();
        notification.success({ message: "添加成功" });
        this.fetchTags();
      },
    });
  };
  onEditAction = (member) => {
    this.setState({ toEditAction: member });
  };
  onChangeBuildSource = () => {
    this.hideBuildSource();
    this.loadBuildSourceInfo();
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
  hideMarketAppDetail = () => {
    this.setState({
      showApp: {},
      showMarketAppDetail: false
    });
  }
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
  changeBuildSource = () => {
    this.setState({ changeBuildSource: true });
  };
  hideBuildSource = () => {
    this.setState({ changeBuildSource: false });
  };
  setupAttribute=()=>{
    console.log('todo...')
  }
  render() {
    if (!this.canView()) return <NoPermTip />;

    const self = this;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 3,
        },
      },
      wrapperCol: {
        xs: {
          span: 24,
        },
        sm: {
          span: 16,
        },
      },
    };

    const {
      innerEnvs,
      runningProbe,
      startProbe,
      ports,
      baseInfo,
      appDetail,
      tags,
      teamControl,
    } = this.props;
    const members = this.state.members || [];
    const {appStatus} = this.state
    return (
      <Fragment>
        <Card
          style={{
            marginBottom: 24,
          }}
          title="基础信息"
        >
          <Form>
            <FormItem
              style={{
                marginBottom: 0,
              }}
              {...formItemLayout}
              label="创建时间"
            >
              {baseInfo.create_time || ""}
            </FormItem>
            <FormItem
              style={{
                marginBottom: 0,
              }}
              {...formItemLayout}
              label="应用部署类型"
            >
              {baseInfo.extend_method == "stateless" ? "无状态应用" : "有状态应用"}
              {false?<Button onClick={this.setupAttribute} size="small" style={{marginLeft:"10px"}}>应用设置</Button>:''}
            </FormItem>
            {tags ? (
              <FormItem
                style={{
                  marginBottom: 0,
                }}
                {...formItemLayout}
                label="应用特性"
              >
                {(tags.used_labels || []).map(tag => (
                  <Tag
                    closable
                    onClose={(e) => {
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
            ) : (
                ""
              )}
          </Form>
        </Card>
        {this.state.buildSource && (
          <Card
            title="构建源"
            style={{
              marginBottom: 24,
            }}
            extra={
              !appUtil.isMarketAppByBuildSource(this.state.buildSource) && (
                <a onClick={this.changeBuildSource} href="javascript:;">
                  更改
                </a>
              )
            }
          >
            <Fragment>
              <FormItem
                style={{
                  marginBottom: 0,
                }}
                {...formItemLayout}
                label="创建方式"
              >
                {appUtil.getCreateTypeCNByBuildSource(this.state.buildSource)}
              </FormItem>
            </Fragment>
            {appUtil.isImageAppByBuildSource(this.state.buildSource) ? (
              <Fragment>
                <FormItem
                  style={{
                    marginBottom: 0,
                  }}
                  {...formItemLayout}
                  label="镜像名称"
                >
                  {this.state.buildSource.image}
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0,
                  }}
                  {...formItemLayout}
                  label="版本"
                >
                  {this.state.buildSource.version}
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0,
                  }}
                  {...formItemLayout}
                  label="启动命令"
                >
                  {this.state.buildSource.cmd}
                </FormItem>
              </Fragment>
            ) : (
                ""
              )}
            {appUtil.isMarketAppByBuildSource(this.state.buildSource) ? (
              <Fragment>
                <FormItem
                  style={{
                    marginBottom: 0,
                  }}
                  {...formItemLayout}
                  label="云市应用名称"
                >
                  {this.state.buildSource.group_key ? (
                    <a href="javascript:;" onClick={() => {
                      this.setState({
                        showApp: {
                          details: this.state.buildSource.details,
                          group_name: this.state.buildSource.rain_app_name,
                          group_key: this.state.buildSource.group_key,
                        },
                        showMarketAppDetail: true
                      });
                    }}>{this.state.buildSource.rain_app_name}</a>
                  ) : ("无法找到源应用，可能已删除")}
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0,
                  }}
                  {...formItemLayout}
                  label="版本"
                >
                  {this.state.buildSource.version}
                </FormItem>
              </Fragment>
            ) : (
                ""
              )}
            {appUtil.isCodeAppByBuildSource(this.state.buildSource) ? (
              <Fragment>
                <FormItem
                  style={{
                    marginBottom: 0,
                  }}
                  {...formItemLayout}
                  label="仓库地址"
                >
                  <a href={this.state.buildSource.git_url} target="_blank">
                    {this.state.buildSource.git_url}
                  </a>
                </FormItem>
                <FormItem
                  style={{
                    marginBottom: 0,
                  }}
                  {...formItemLayout}
                  label="代码版本"
                >
                  {this.state.buildSource.code_version}
                </FormItem>
              </Fragment>
            ) : (
                ""
              )}
            {/* <ChangeBranch
                  isCreateFromCustomCode={appUtil.isCreateFromCustomCode(appDetail)}
                  appAlias={this.props.appAlias}
                  isShowDeployTips={(onoffshow) => {
                    this.props.onshowDeployTips(onoffshow);
                  }}
                /> */}
          </Card>
        )}
        <AutoDeploy app={appDetail} />

        <Card
          style={{
            marginBottom: 24,
          }}
          title="自定义环境变量"
        >
          <ScrollerX sm={600}>
            <Table
              columns={[
                {
                  title: "变量名",
                  dataIndex: "attr_name",
                },
                {
                  title: "变量值",
                  dataIndex: "attr_value",
                  width: "40%",
                },
                {
                  title: "说明",
                  dataIndex: "name",
                },
                {
                  title: "操作",
                  dataIndex: "action",
                  render: (v, data) => (
                    <Fragment>
                      <a
                        href="javascript:;"
                        onClick={() => {
                          this.onDeleteVar(data);
                        }}
                      >
                        删除
                      </a>
                      {data.is_change ? (
                        <a
                          href="javascript:;"
                          onClick={() => {
                            this.onEditVar(data);
                          }}
                        >
                          修改
                        </a>
                      ) : (
                          ""
                        )}
                    </Fragment>
                  ),
                },
              ]}
              pagination={false}
              dataSource={innerEnvs}
            />
          </ScrollerX>
          <div
            style={{
              textAlign: "right",
              paddingTop: 20,
            }}
          >
            <Button onClick={this.handleAddVar}>
              <Icon type="plus" />添加变量
            </Button>
          </div>
        </Card>
        <Card
          style={{
            marginBottom: 24,
          }}
          title="健康监测"
        >
          <Table
            columns={[
              {
                title: "监测类型",
                dataIndex: "type",
                render: (v, data, index) => {
                  if (index === 0) {
                    return "启动时检测";
                  }
                  if (index === 1) {
                    return "运行时检测";
                  }
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
          />
        </Card>

        <Card
          style={{
            marginBottom: 24,
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
                },
                {
                  title: "邮箱",
                  dataIndex: "email",
                },
                {
                  title: "操作权限",
                  width: "50%",
                  dataIndex: "service_perms",
                  render(val) {
                    const arr = val || [];
                    return <span>{arr.map(item => <Tag>{item.perm_info}</Tag>)}</span>;
                  },
                },
                {
                  title: "操作",
                  dataIndex: "action",
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

        {this.state.addTag && (
          <AddTag
            tags={tags ? tags.unused_labels : []}
            onCancel={this.cancelAddTag}
            onOk={this.handleAddTag}
          />
        )}
        {this.state.showAddVar && (
          <AddVarModal
            onCancel={this.handleCancelAddVar}
            onSubmit={this.handleSubmitAddVar}
            isShowRestartTips={(onoffshow) => {
              this.props.onshowRestartTips(onoffshow);
            }}
          />
        )}
        {this.state.showEditVar && (
          <AddVarModal
            onCancel={this.cancelEditVar}
            onSubmit={this.handleEditVar}
            data={this.state.showEditVar}
            isShowRestartTips={(onoffshow) => {
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
        {this.state.viewStartHealth && (
          <ViewHealthCheck
            title="启动时检查查看"
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
            title="设置启动时检查"
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
        {this.state.changeBuildSource && (
          <ChangeBuildSource
            onOk={this.onChangeBuildSource}
            buildSource={this.state.buildSource}
            appAlias={this.props.appAlias}
            title="更改应用构建源"
            onCancel={this.hideBuildSource}
          />
        )}
        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}
      </Fragment>
    );
  }
}
