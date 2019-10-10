import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Link } from "dva/router";
import {
  Card,
  Form,
  Button,
  Icon,
  Table,
  Tag,
  notification,
  Tooltip,
  Row,
  Col,
  Alert,
  Popconfirm,
  Switch,
  Input
} from "antd";
import ConfirmModal from "../../components/ConfirmModal";
import NoPermTip from "../../components/NoPermTip";
import AddVarModal from "./setting/env";
import { getMnt, addMnt } from "../../services/app";
import globalUtil from "../../utils/global";
import { volumeTypeObj } from "../../utils/utils";
import RelationMnt from "../../components/AddStorage/relationMnt";
import ScrollerX from "../../components/ScrollerX";
import AddVolumes from "../../components/AddOrEditVolume";
import AddStorage from "../../components/AddStorage";

const FormItem = Form.Item;
const { Search } = Input;
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

    volumes: appControl.volumes,
    appBaseInfo: appControl.baseInfo
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
      env_name: "",
      showAddVars: null,
      showAddRelation: false,
      selfPathList: [],
      mntList: [],
      toDeleteMnt: null,
      toDeleteVolume: null,
      editor: null
    };
  }
  componentDidMount() {
    this.props.dispatch({ type: "teamControl/fetchAllPerm" });
    this.fetchInnerEnvs();
    this.loadMembers();
    this.loadpermsMembers();

    this.loadMntList();
    this.fetchVolumes();
    this.fetchBaseInfo();
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
  onDeleteVar = data => {
    this.setState({ deleteVar: data });
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
      callback: res => {
        this.fetchInnerEnvs();
        this.handleCancelAddVar();
      }
    });
  };

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
      callback: res => {
        if (res && res._code == 200) {
          notification.success({ message: "操作成功" });
          this.fetchInnerEnvs();
        }
        this.cancelDeleteVar();
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
        if (res && res._code == 200) {
          notification.success({ message: "操作成功" });
          this.fetchInnerEnvs();
        }
        this.cancelTransfer();
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

  onCancelEditStartProbe = () => {
    this.setState({ editStartHealth: null });
  };
  onCancelEditRunProbe = () => {
    this.setState({ editRunHealth: null });
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
        user_id: this.state.toDeleteMember.user_id
      },
      callback: () => {
        this.loadMembers();
        this.loadpermsMembers();
        this.hideDelMember();
      }
    });
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

  onTransfer = data => {
    this.setState({ transfer: data });
  };

  fetchVolumes = () => {
    this.props.dispatch({
      type: "appControl/fetchVolumes",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        volume_type: ["config-file"]
      }
    });
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
  loadMntList = () => {
    getMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      page: 1,
      page_size: 1000,
      volume_type: ["config-file"]
    }).then(data => {
      if (data) {
        this.setState({
          mntList: data.list || []
        });
      }
    });
  };
  handleAddVars = () => {
    this.setState({
      showAddVars: {
        new: true
      }
    });
  };
  handleCancelAddVars = () => {
    this.setState({ showAddVars: null, editor: null });
  };
  handleSubmitAddVars = vals => {
    const { editor } = this.state;
    if (editor) {
      this.props.dispatch({
        type: "appControl/editorVolume",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          new_volume_path: vals.volume_path,
          new_file_content: vals.file_content,
          ID: editor.ID
        },
        callback: () => {
          this.fetchVolumes();
          this.handleCancelAddVars();
          notification.success({ message: "操作成功" });
          this.props.onshowRestartTips(true);
        }
      });
    } else {
      this.props.dispatch({
        type: "appControl/addVolume",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ...vals
        },
        callback: () => {
          this.fetchVolumes();
          this.handleCancelAddVars();
          notification.success({ message: "操作成功" });
          this.props.onshowRestartTips(true);
        }
      });
    }
  };
  showAddRelation = () => {
    this.setState({ showAddRelation: true });
  };
  handleCancelAddRelation = () => {
    this.setState({ showAddRelation: false });
  };
  handleSubmitAddMnt = mnts => {
    addMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      body: mnts
    }).then(data => {
      if (data) {
        this.handleCancelAddRelation();
        this.loadMntList();
        notification.success({ message: "操作成功" });
        this.props.onshowRestartTips(true);
      }
    });
  };
  onDeleteMnt = mnt => {
    this.setState({ toDeleteMnt: mnt });
  };
  onDeleteVolume = data => {
    this.setState({ toDeleteVolume: data });
  };
  onEditVolume = data => {
    this.setState({ showAddVars: data, editor: data });
  };
  onCancelDeleteVolume = () => {
    this.setState({ toDeleteVolume: null });
  };
  handleDeleteVolume = () => {
    this.props.dispatch({
      type: "appControl/deleteVolume",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        volume_id: this.state.toDeleteVolume.ID
      },
      callback: () => {
        this.onCancelDeleteVolume();
        this.fetchVolumes();
        notification.success({ message: "操作成功" });
        this.props.onshowRestartTips(true);
      }
    });
  };
  handleDeleteMnt = () => {
    this.props.dispatch({
      type: "appControl/deleteMnt",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        dep_vol_id: this.state.toDeleteMnt.dep_vol_id
      },
      callback: () => {
        this.cancelDeleteMnt();
        this.loadMntList();
        notification.success({ message: "操作成功" });
        this.props.onshowRestartTips(true);
      }
    });
  };
  cancelDeleteMnt = () => {
    this.setState({ toDeleteMnt: null });
  };

  render() {
    const self = this;
    const { mntList } = this.state;
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
    const { innerEnvs, baseInfo, volumes } = this.props;
    const members = this.state.members || [];
    if (typeof baseInfo.build_upgrade != "boolean") {
      return null;
    }
    return (
      <Fragment>
        <Row>
          <Col span={12}>
            <Alert
              showIcon
              message="组件环境配置变更后需要更新或重启组件生效"
              type="info"
              style={{
                marginBottom: 24
              }}
            />
          </Col>
        </Row>
        <Row>
          <Card
            style={{
              marginBottom: 24
            }}
            title="自定义环境变量"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px"
              }}
            >
              <Search
                style={{ width: "260px" }}
                placeholder="请输入变量名进行搜索"
                onSearch={this.handleSearch}
              />
              <Button onClick={this.handleAddVar}>
                <Icon type="plus" />
                添加变量
              </Button>
            </div>
            <ScrollerX sm={600}>
              <Table
                columns={[
                  {
                    title: "变量名",
                    dataIndex: "attr_name",
                    key: "1",
                    width: "20%",
                    render: v => (
                      <Tooltip title={v}>
                        <div
                          style={{
                            wordBreak: "break-all",
                            wordWrap: "break-word"
                          }}
                        >
                          {v}
                        </div>
                      </Tooltip>
                    )
                  },
                  {
                    title: "变量值",
                    dataIndex: "attr_value",
                    key: "2",
                    width: "40%",
                    render: v => (
                      <Tooltip title={v}>
                        <div
                          style={{
                            wordBreak: "break-all",
                            wordWrap: "break-word"
                          }}
                        >
                          {v}
                        </div>
                      </Tooltip>
                    )
                  },
                  {
                    title: "说明",
                    dataIndex: "name",
                    key: "3",
                    width: "20%",
                    render: v => (
                      <Tooltip title={v}>
                        <div
                          style={{
                            wordBreak: "break-all",
                            wordWrap: "break-word"
                          }}
                        >
                          {v}
                        </div>
                      </Tooltip>
                    )
                  },
                  {
                    title: "操作",
                    dataIndex: "action",
                    key: "4",
                    width: "20%",
                    render: (v, data) => (
                      <Fragment>
                        <a
                          href="javascript:;"
                          onClick={() => {
                            this.onDeleteVar(data);
                          }}
                          style={{ marginRight: "5px" }}
                        >
                          删除
                        </a>
                        <Tooltip
                          title={
                            <p>
                              将此环境变量转换为
                              <br />
                              组件连接信息变量
                            </p>
                          }
                        >
                          <a
                            href="javascript:;"
                            onClick={() => {
                              this.onTransfer(data);
                            }}
                            style={{ marginRight: "5px" }}
                          >
                            转移
                          </a>
                        </Tooltip>
                        {data.is_change ? (
                          <a
                            href="javascript:;"
                            onClick={() => {
                              this.onEditVar(data);
                            }}
                            style={{ marginRight: "5px" }}
                          >
                            修改
                          </a>
                        ) : (
                          ""
                        )}
                      </Fragment>
                    )
                  }
                ]}
                dataSource={innerEnvs}
                pagination={{
                  current: this.state.page,
                  pageSize: this.state.page_size,
                  total: this.state.total,
                  onChange: this.onPageChange
                }}
              />
            </ScrollerX>
          </Card>

          <Col span={12}>
            <Alert
              showIcon
              message="配置文件内容支持使用环境变量动态渲染，方式为：${ENV_NAME}"
              type="info"
              style={{
                marginBottom: 24
              }}
            />
          </Col>
        </Row>
        <Card
          style={{
            marginBottom: 24
          }}
          title={<span> 配置文件设置 </span>}
        >
          <ScrollerX sm={650}>
            <Table
              pagination={false}
              columns={[
                {
                  title: "配置文件名称",
                  dataIndex: "volume_name"
                },
                {
                  title: "配置文件挂载路径",
                  dataIndex: "volume_path"
                },
                // {
                //   title: "存储类型",
                //   dataIndex: "volume_type",
                //   render: (text, record) => {
                //     return <span>{volumeTypeObj[text]}</span>
                //   }
                // },
                {
                  title: "操作",
                  dataIndex: "action",
                  render: (v, data) => (
                    <div>
                      <a
                        onClick={() => {
                          this.onDeleteVolume(data);
                        }}
                        href="javascript:;"
                      >
                        删除
                      </a>
                      <a
                        onClick={() => {
                          this.onEditVolume(data);
                        }}
                        href="javascript:;"
                      >
                        编辑
                      </a>
                    </div>
                  )
                }
              ]}
              dataSource={volumes}
            />
          </ScrollerX>
          <div
            style={{
              marginTop: 10,
              textAlign: "right"
            }}
          >
            <Button onClick={this.handleAddVars}>
              <Icon type="plus" />
              添加配置文件
            </Button>
          </div>
        </Card>
        <Card title={<span> 共享配置文件 </span>}>
          <ScrollerX sm={850}>
            <Table
              pagination={false}
              columns={[
                {
                  title: "本地挂载配置文件路径",
                  dataIndex: "local_vol_path",
                  key: "1",
                  width: "20%",
                  render: (data, index) => (
                    <Tooltip title={data}>
                      <span
                        style={{
                          wordBreak: "break-all",
                          wordWrap: "break-word"
                        }}
                      >
                        {data}
                      </span>
                    </Tooltip>
                  )
                },
                {
                  title: "配置文件名称",
                  dataIndex: "dep_vol_name",
                  key: "2",
                  width: "15%",
                  render: (data, index) => (
                    <Tooltip title={data}>
                      <span
                        style={{
                          wordBreak: "break-all",
                          wordWrap: "break-word"
                        }}
                      >
                        {data}
                      </span>
                    </Tooltip>
                  )
                },
                {
                  title: "目标挂载配置文件路径",
                  dataIndex: "dep_vol_path",
                  key: "3",
                  width: "20%",
                  render: (data, index) => (
                    <Tooltip title={data}>
                      <span
                        style={{
                          wordBreak: "break-all",
                          wordWrap: "break-word"
                        }}
                      >
                        {data}
                      </span>
                    </Tooltip>
                  )
                },
                // {
                //   title: "配置文件类型",
                //   dataIndex: "dep_vol_type",
                //   render: (text, record) => {
                //     return <span>{volumeTypeObj[text]}</span>
                //   }
                // },
                {
                  title: "所属组件",
                  dataIndex: "dep_app_name",
                  key: "4",
                  width: "15%",
                  render: (v, data) => (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${
                        data.dep_app_alias
                      }/overview`}
                    >
                      {v}
                    </Link>
                  )
                },
                {
                  title: "组件所属应用",
                  dataIndex: "dep_app_group",
                  key: "5",
                  width: "15%",
                  render: (v, data) => (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${
                        data.dep_group_id
                      }`}
                    >
                      {v}
                    </Link>
                  )
                },
                {
                  title: "操作",
                  dataIndex: "action",
                  key: "6",
                  width: "15%",
                  render: (v, data) => (
                    <a
                      onClick={() => {
                        this.onDeleteMnt(data);
                      }}
                      href="javascript:;"
                    >
                      取消挂载
                    </a>
                  )
                }
              ]}
              dataSource={mntList}
            />
          </ScrollerX>
          <div
            style={{
              marginTop: 10,
              textAlign: "right"
            }}
          >
            <Button onClick={this.showAddRelation}>
              <Icon type="plus" />
              挂载共享配置文件
            </Button>
          </div>
        </Card>
        {this.state.showAddVars && (
          <AddStorage
            appBaseInfo={this.props.appBaseInfo}
            onCancel={this.handleCancelAddVars}
            onSubmit={this.handleSubmitAddVars}
            data={this.state.showAddVars}
            editor={this.state.editor}
            {...this.props}
          />
        )}
        {this.state.showAddRelation && (
          <RelationMnt
            appAlias={this.props.appAlias}
            onCancel={this.handleCancelAddRelation}
            onSubmit={this.handleSubmitAddMnt}
            volume_type={["config-file"]}
          />
        )}
        {this.state.toDeleteMnt && (
          <ConfirmModal
            title="取消挂载共享配置文件"
            desc="确定要取消此挂载共享配置文件目录吗?"
            onCancel={this.cancelDeleteMnt}
            onOk={this.handleDeleteMnt}
          />
        )}
        {this.state.toDeleteVolume && (
          <ConfirmModal
            title="删除配置文件"
            desc="确定要删除此配置文件吗?"
            onCancel={this.onCancelDeleteVolume}
            onOk={this.handleDeleteVolume}
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

        {this.state.transfer && (
          <ConfirmModal
            onOk={this.handleTransfer}
            onCancel={this.cancelTransfer}
            title="转移环境变量"
            desc="确定要将此环境变量转换为组件连接信息变量吗?"
            subDesc=""
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
        {this.state.toDeleteMember && (
          <ConfirmModal
            onOk={this.handleDelMember}
            title="删除成员权限"
            desc="确定要删除此成员的应用权限吗？"
            onCancel={this.hideDelMember}
          />
        )}
      </Fragment>
    );
  }
}
