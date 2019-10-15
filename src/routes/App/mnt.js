import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Link } from "dva/router";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Icon,
  Input,
  Alert,
  Table,
  Modal,
  Radio,
  Tooltip,
  notification,
} from "antd";
import ConfirmModal from "../../components/ConfirmModal";
import { getMnt, addMnt } from "../../services/app";
import globalUtil from "../../utils/global";
import { volumeTypeObj } from "../../utils/utils";
import AddRelationMnt from "../../components/AddRelationMnt";
import ScrollerX from "../../components/ScrollerX";
import AddVolumes from "../../components/AddOrEditVolume"

@connect(
  ({ user, appControl }) => ({
    currUser: user.currentUser,
    volumes: appControl.volumes,
    appBaseInfo: appControl.baseInfo,
  }),
  null,
  null,
  { withRef: true },
)
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      showAddVar: null,
      showAddRelation: false,
      selfPathList: [],
      mntList: [],
      toDeleteMnt: null,
      toDeleteVolume: null,
      editor: null
    };
  }

  componentDidMount() {
    this.loadMntList();
    this.fetchVolumes();
    this.fetchBaseInfo()
  }
  fetchVolumes = () => {
    this.props.dispatch({
      type: "appControl/fetchVolumes",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        volume_type: ["share-file", "memoryfs", "local"]
      },
    });
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
  loadMntList = () => {

    getMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      page: 1,
      page_size: 1000,
      volume_type: ["share-file", "memoryfs", "local"],
      type: "mnt"
    }).then((data) => {
      if (data) {
        this.setState({
          mntList: data.list || [],
        });
      }
    });
  };
  handleAddVar = () => {
    this.setState({
      showAddVar: {
        new: true,
      },
    });
  };
  handleCancelAddVar = () => {
    this.setState({ showAddVar: null, editor: null });
  };
  handleSubmitAddVar = (vals) => {
    this.fetchBaseInfo();
    const { editor } = this.state
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
          this.handleCancelAddVar();
          this.props.onshowRestartTips(true);
          this.remindInfo();
        },
      });
    } else {
      this.props.dispatch({
        type: "appControl/addVolume",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          ...vals,
        },
        callback: () => {
          this.fetchVolumes();
          this.handleCancelAddVar();
          this.props.onshowRestartTips(true);
          this.remindInfo();
        },
      });
    }
  };


  remindInfo = () => {
    const { appBaseInfo } = this.props
    if (appBaseInfo && appBaseInfo.extend_method && appBaseInfo.extend_method != "stateless") {
      notification.warning({
        message: <div>
          有状态组件存储配置发生变化后<br />
          需要重启组件才能生效!
        </div>,
      })
    } else {
      notification.success({ message: "操作成功" });
    }
  }
  showAddRelation = () => {
    this.loadMntList();
    this.setState({ showAddRelation: true });
  };
  handleCancelAddRelation = () => {
     this.loadMntList();
    this.setState({ showAddRelation: false });
  };
  handleSubmitAddMnt = (mnts) => {
    addMnt({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      body: mnts,
    }).then((data) => {
      if (data) {
        this.handleCancelAddRelation();
        notification.success({ message: "操作成功" });
        this.props.onshowRestartTips(true);
      }
    });
  };
  onDeleteMnt = (mnt) => {
    this.setState({ toDeleteMnt: mnt });
  };
  onDeleteVolume = (data) => {
    this.setState({ toDeleteVolume: data });
  };
  onEditVolume = (data) => {
    this.setState({ showAddVar: data, editor: data });
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
        volume_id: this.state.toDeleteVolume.ID,
      },
      callback: () => {
        this.onCancelDeleteVolume();
        this.fetchVolumes();
        notification.success({ message: "操作成功" });
        this.props.onshowRestartTips(true);
      },
    });
  };
  handleDeleteMnt = () => {
    this.props.dispatch({
      type: "appControl/deleteMnt",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias,
        dep_vol_id: this.state.toDeleteMnt.dep_vol_id,
      },
      callback: () => {
        this.cancelDeleteMnt();
        this.loadMntList();
        notification.success({ message: "操作成功" });
        this.props.onshowRestartTips(true);
      },
    });
  };
  cancelDeleteMnt = () => {
    this.setState({ toDeleteMnt: null });
  };
  render() {
    const { mntList } = this.state;
    const { volumes } = this.props;
    return (
      <Fragment>
        <Row>
          <Col span={12}>
            <Alert
              showIcon
              message="存储配置发生变化后需要更新组件才能生效"
              type="info"
              style={{
                marginBottom: 24,
              }}
            />
          </Col>
        </Row>
        <Card
          style={{
            marginBottom: 24,
          }}
          title={<span> 存储设置 </span>}
        >
          <ScrollerX sm={650}>
            <Table
              pagination={false}
              columns={[
                {
                  title: "存储名称",
                  dataIndex: "volume_name",
                },
                {
                  title: "挂载路径",
                  dataIndex: "volume_path",
                },
                {
                  title: "存储类型",
                  dataIndex: "volume_type",
                  render: (text, record) => {
                    return <span>{volumeTypeObj[text]}</span>
                  }
                },
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
                  ),
                },
              ]}
              dataSource={volumes}
            />
          </ScrollerX>
          <div
            style={{
              marginTop: 10,
              textAlign: "right",
            }}
          >
            <Button onClick={this.handleAddVar}>
              <Icon type="plus" />添加存储
            </Button>
          </div>
        </Card>
        <Card title={<span> 共享其他组件存储 </span>}>
          <ScrollerX sm={850}>
            <Table
              pagination={false}
              columns={[
                {
                  title: "本地挂载路径",
                  dataIndex: "local_vol_path",
                  key: "1",
                  width: "20%",
                  render: (data, index) => (
                    <Tooltip title={data}>
                      <span style={{
                        wordBreak: "break-all",
                        wordWrap: "break-word"
                      }}>{data}</span>
                    </Tooltip>
                  )
                },
                {
                  title: "目标存储名称",
                  dataIndex: "dep_vol_name",
                  key: "2",
                  width: "15%",
                  render: (data, index) => (
                    <Tooltip title={data}>
                      <span style={{
                        wordBreak: "break-all",
                        wordWrap: "break-word"
                      }}>{data}</span>
                    </Tooltip>
                  )
                },
                {
                  title: "目标挂载路径",
                  dataIndex: "dep_vol_path",
                  key: "3",
                  width: "15%",
                  render: (data, index) => (
                    <Tooltip title={data}>
                      <span style={{
                        wordBreak: "break-all",
                        wordWrap: "break-word"
                      }}>{data}</span>
                    </Tooltip>
                  )
                },
                {
                  title: "目标存储类型",
                  dataIndex: "dep_vol_type",
                  key: "4",
                  width: "10%",
                  render: (text, record) => {
                    return <span>{volumeTypeObj[text]}</span>
                  }
                },
                {
                  title: "目标所属组件",
                  dataIndex: "dep_app_name",
                  key: "5",
                  width: "10%",
                  render: (v, data) => (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${
                        data.dep_app_alias
                        }/overview`}
                    >
                      {v}
                    </Link>
                  ),
                },
                {
                  title: "目标组件所属应用",
                  dataIndex: "dep_app_group",
                  key: "6",
                  width: "15%",
                  render: (v, data) => (
                    <Link
                      to={`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${
                        data.dep_group_id
                        }`}
                    >
                      {v}
                    </Link>
                  ),
                },
                {
                  title: "操作",
                  dataIndex: "action",
                  key: "7",
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
                  ),
                },
              ]}
              dataSource={mntList}
            />
          </ScrollerX>
          <div
            style={{
              marginTop: 10,
              textAlign: "right",
            }}
          >
            <Button onClick={this.showAddRelation}>
              <Icon type="plus" />
              挂载共享存储
            </Button>
          </div>
        </Card>
        {this.state.showAddVar && (
          <AddVolumes
            appBaseInfo={this.props.appBaseInfo}
            onCancel={this.handleCancelAddVar}
            onSubmit={this.handleSubmitAddVar}
            data={this.state.showAddVar}
            editor={this.state.editor}
          />
        )}
        {this.state.showAddRelation && (
          <AddRelationMnt
            appAlias={this.props.appAlias}
            onCancel={this.handleCancelAddRelation}
            onSubmit={this.handleSubmitAddMnt}
            volume_type={["share-file", "memoryfs", "local"]}
          />
        )}
        {this.state.toDeleteMnt && (
          <ConfirmModal
            title="取消挂载"
            desc="确定要取消此挂载目录吗?"
            onCancel={this.cancelDeleteMnt}
            onOk={this.handleDeleteMnt}
          />
        )}
        {this.state.toDeleteVolume && (
          <ConfirmModal
            title="删除存储目录"
            desc="确定要删除此存储目录吗?"
            onCancel={this.onCancelDeleteVolume}
            onOk={this.handleDeleteVolume}
          />
        )}
      </Fragment>
    );
  }
}
