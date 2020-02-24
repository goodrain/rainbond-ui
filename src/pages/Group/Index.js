import React, { PureComponent } from "react";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";
import {
  Row,
  Col,
  Form,
  Button,
  Input,
  Icon,
  Modal,
  notification,
  Spin,
  Divider
} from "antd";

import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import AppList from "./AppList";
import AppShape from "./AppShape";
import EditorTopology from "./EditorTopology";
import ConfirmModal from "../../components/ConfirmModal";
import NoPermTip from "../../components/NoPermTip";
import VisterBtn from "../../components/visitBtnForAlllink";
import styles from "./Index.less";
import globalUtil from "../../utils/global";
import teamUtil from "../../utils/team";
import userUtil from "../../utils/user";
import AddServiceComponent from "./AddServiceComponent";
import AddThirdParty from "./AddThirdParty";
import { FormattedMessage, formatMessage } from "umi-plugin-react/locale";
const FormItem = Form.Item;
const ButtonGroup = Button.Group;

@Form.create()
class EditGroupName extends PureComponent {
  onOk = e => {
    e.preventDefault();
    this.props.form.validateFields(
      {
        force: true
      },
      (err, vals) => {
        if (!err) {
          this.props.onOk && this.props.onOk(vals);
        }
      }
    );
  };
  render() {
    const { title, onCancel, group_name } = this.props;
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 6
        }
      },
      wrapperCol: {
        xs: {
          span: 24
        },
        sm: {
          span: 16
        }
      }
    };
    return (
      <Modal title={title || ""} visible onCancel={onCancel} onOk={this.onOk}>
        <Form onSubmit={this.onOk}>
          <FormItem {...formItemLayout} label="应用名称">
            {getFieldDecorator("group_name", {
              initialValue: group_name || "",
              rules: [
                {
                  required: true,
                  message: "请填写应用名称"
                }
              ]
            })(<Input placeholder="请填写应用名称" />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

@connect(({ user, groupControl, global }) => ({
  currUser: user.currentUser,
  apps: groupControl.apps,
  groupDetail: groupControl.groupDetail || {},
  groups: global.groups || [],
  rainbondInfo: global.rainbondInfo
}))
class Main extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      type: "shape",
      toDelete: false,
      toEdit: false,
      toAdd: false,
      service_alias: [],
      linkList: [],
      running: false,
      secondJustify: "",
      json_data_length: 0,
      promptModal: false,
      code: "",
      clearTime: false,
      size: "large",
      currApp: {},
      loadingDetail: true
    };
  }
  getGroupId() {
    return this.props.appID;
  }
  componentDidMount() {
    this.loading();
  }

  loading = () => {
    this.fetchGroupDetail();
    this.recordShare();
    this.loadTopology();
    this.timer = setInterval(() => {
      this.loadTopology();
    }, 10000);
  };

  loadTopology() {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    const groupId = this.getGroupId();
    dispatch({
      type: "global/fetAllTopology",
      payload: {
        region_name,
        team_name,
        groupId
      },
      callback: res => {
        if (res && res._code == 200) {
          const data = res.bean;
          if (JSON.stringify(data) == "{}") {
            return;
          }
          const service_alias = [];
          const json_data = data.json_data;
          this.setState({ running: false });
          this.setState({ json_data_length: Object.keys(json_data).length });
          Object.keys(json_data).map(key => {
            if (json_data[key].cur_status == "running") {
              this.setState({ running: true });
            }
            if (
              json_data[key].cur_status == "running" &&
              json_data[key].is_internet == true
            ) {
              service_alias.push(json_data[key].service_alias);
            }
          });
          this.setState({ service_alias }, () => {
            // if(service_alias.length>0){
            this.loadLinks(service_alias.join("-"));
            // }
          });
        }
      }
    });
  }
  loadLinks(service_alias) {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    dispatch({
      type: "global/queryLinks",
      payload: {
        service_alias,
        team_name
      },
      callback: data => {
        this.setState({
          linkList: (data && data.list) || []
        });
      }
    });
  }
  fetchGroupDetail = () => {
    const { dispatch } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    const region_name = globalUtil.getCurrRegionName();
    this.setState({ loadingDetail: true });
    dispatch({
      type: "groupControl/fetchGroupDetail",
      payload: {
        team_name,
        region_name,
        group_id: this.getGroupId()
      },
      callback: res => {
        if (res && res.status === 200) {
          this.setState({
            currApp: res.bean,
            loadingDetail: false
          });
        }
      },
      handleError: res => {
        if (res && res.status === 404) {
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps`
            )
          );
        }
      }
    });
  };

  componentWillUnmount() {
    this.timer && clearInterval(this.timer);
    this.props.dispatch({ type: "groupControl/clearGroupDetail" });
  }
  handleFormReset = () => {
    const { form } = this.props;
    form.resetFields();
    this.loadApps();
  };
  handleSearch = e => {
    e.preventDefault();
    this.loadApps();
  };
  changeType = type => {
    this.setState({ type });
  };
  toDelete = () => {
    this.setState({ toDelete: true });
  };
  cancelDelete = () => {
    this.setState({ toDelete: false });
  };
  handleDelete = () => {
    this.setState(
      {
        clearTime: true
      },
      () => {
        const { dispatch } = this.props;
        const grid = this.getGroupId();
        dispatch({
          type: "groupControl/delete",
          payload: {
            team_name: globalUtil.getCurrTeamName(),
            group_id: this.getGroupId()
          },
          callback: res => {
            if (res && res._code == 200) {
              notification.success({ message: "删除成功" });
              this.cancelDelete();
              this.newAddress(grid);
            } else {
              this.setState({
                clearTime: false
              });
            }
          }
        });
      }
    );
  };

  newAddress = grid => {
    this.props.dispatch({
      type: "global/fetchGroups",
      payload: {
        team_name: globalUtil.getCurrTeamName()
      },
      callback: list => {
        if (list && list.length) {
          if (grid == list[0].group_id) {
            this.newAddress(grid);
          } else {
            this.props.dispatch(
              routerRedux.push(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/apps/${list[0]
                  .group_id}`
              )
            );
          }
        } else {
          this.props.dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
            )
          );
        }
      }
    });
  };

  toEdit = () => {
    this.setState({ toEdit: true });
  };
  cancelEdit = () => {
    this.setState({ toEdit: false });
  };
  handleEdit = vals => {
    const { dispatch } = this.props;
    dispatch({
      type: "groupControl/editGroup",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
        group_name: vals.group_name
      },
      callback: () => {
        this.cancelEdit();
        this.fetchGroupDetail();
        dispatch({
          type: "global/fetchGroups",
          payload: {
            team_name: globalUtil.getCurrTeamName()
          }
        });
      }
    });
  };
  toAdd = () => {
    this.setState({ toAdd: true });
  };
  cancelAdd = () => {
    this.setState({ toAdd: false });
  };

  handleAdd = vals => {
    const { dispatch } = this.props;
    dispatch({
      type: "groupControl/addGroup",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_name: vals.group_name
      },
      callback: () => {
        notification.success({ message: "添加成功" });
        this.cancelAdd();
        dispatch({
          type: "global/fetchGroups",
          payload: {
            team_name: globalUtil.getCurrTeamName()
          }
        });
      }
    });
  };

  recordShare = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "groupControl/recordShare",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId()
      },
      callback: data => {
        if (data && data._code == 20021) {
          this.setState({ recordShare: true });
          notification.info({
            message: "分享未完成",
            description: "您有分享未完成，可以点击继续分享"
          });
        } else {
          this.setState({ recordShare: false });
        }
      }
    });
  };

  handleShare = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "groupControl/ShareGroup",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId()
      },
      callback: data => {
        if (data && data.bean.step === 1) {
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/share/one/${data
                .bean.group_id}/${data.bean.ID}`
            )
          );
        }
        if (data && data.bean.step === 2) {
          dispatch(
            routerRedux.push(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/share/two/${data
                .bean.group_id}/${data.bean.ID}`
            )
          );
        }
      }
    });
  };
  /** 构建拓扑图 */
  handleTopology = code => {
    this.setState({
      promptModal: true,
      code
    });
  };

  handlePromptModal_open = () => {
    const { code } = this.state;
    this.props.dispatch({
      type: "global/buildShape",
      payload: {
        tenantName: globalUtil.getCurrTeamName(),
        group_id: this.getGroupId(),
        action: code
      },
      callback: data => {
        notification.success({
          message: data.msg_show || "构建成功",
          duration: "3"
        });
        this.handlePromptModal_close();
        this.loadTopology();
      }
    });
  };

  handlePromptModal_close = () => {
    this.setState({
      promptModal: false,
      code: ""
    });
  };
  handleSizeChange = e => {
    this.setState({ size: e.target.value });
  };

  render() {
    const { currUser, groupDetail, appID } = this.props;

    const team_name = globalUtil.getCurrTeamName();
    const team = userUtil.getTeamByTeamName(currUser, team_name);
    const { loadingDetail } = this.state;
    if (groupDetail.group_id != appID && !loadingDetail) {
      this.fetchGroupDetail();
    }

    const codeObj = {
      start: "启动",
      restart: "重启",
      stop: "停用",
      deploy: "构建"
    };

    const pageHeaderContent = (
      <div className={styles.pageHeaderContent}>
        <div style={{ display: "flex" }}>
          <div style={{ marginTop: "3px" }}>
            {globalUtil.fetchSvg("application")}
          </div>
          <div className={styles.content}>
            <div className={styles.contentTitle}>
              {groupDetail.group_name || "-"}
              {teamUtil.canManageGroup(team) &&
                <Icon
                  style={{
                    cursor: "pointer"
                  }}
                  onClick={this.toEdit}
                  type="edit"
                />}
            </div>
            <div className={styles.content_Box}>
              <a onClick={this.toAdd} href="javascript:;">
                新增
              </a>
              {teamUtil.canManageGroup(team) &&
                <span>
                  <Divider type="vertical" />

                  <a onClick={this.toDelete} href="javascript:;">
                    删除
                  </a>
                </span>}
              {teamUtil.canManageGroup(team) &&
                <span>
                  <Divider type="vertical" />
                  <a
                    onClick={this.handleTopology.bind(this, "stop")}
                    href="javascript:;"
                  >
                    停用
                  </a>
                </span>}
            </div>
          </div>
        </div>
      </div>
    );

    const BtnDisabled = !(this.state.json_data_length > 0);
    const MR = { marginRight: "10px" };
    const extraContent = (
      <div className={styles.extraContent}>
        <Button
          style={MR}
          onClick={this.handleTopology.bind(this, "start")}
          disabled={BtnDisabled}
        >
          启动
        </Button>

        <Button
          style={MR}
          onClick={this.handleTopology.bind(this, "upgrade")}
          disabled={BtnDisabled}
        >
          更新
        </Button>
        <Button
          style={MR}
          disabled={BtnDisabled}
          onClick={this.handleTopology.bind(this, "deploy")}
        >
          构建
        </Button>
        {this.state.linkList.length > 0 &&
          <VisterBtn linkList={this.state.linkList} />}
      </div>
    );
    return (
      <PageHeaderLayout
        loading={loadingDetail}
        content={pageHeaderContent}
        extraContent={
          <Row>
            <Col span={24} style={{ paddingTop: "10px" }}>
              {extraContent}
            </Col>
          </Row>
        }
      >
        <Row
          style={{
            display: "flex",
            background: "#FFFFFF",
            height: "60px",
            alignItems: "center",
            borderBottom: "1px solid #e8e8e8"
          }}
        >
          <Col span={16} style={{ paddingleft: "12px" }}>
            {<Link
                onClick={() => {
                  this.changeType("shape");
                }}
                style={{
                  marginLeft: "30px",
                  color:
                    this.state.type !== "list"
                      ? "#1890ff"
                      : "rgba(0, 0, 0, 0.65)"
                }}
              >
                拓扑图
              </Link>}
            <Link
              onClick={() => {
                this.changeType("list");
              }}
              style={{
                marginLeft: "30px",
                color:
                  this.state.type === "list"
                    ? "#1890ff"
                    : "rgba(0, 0, 0, 0.65)"
              }}
            >
              列表
            </Link>
          </Col>

          <Col span={4} style={{ textAlign: "right" }}>
            <AddThirdParty
              groupId={this.getGroupId()}
              refreshCurrent={() => {
                this.loading();
              }}
              onload={() => {
                this.setState({ type: "spin" }, () => {
                  this.setState({
                    type: this.state.size == "large" ? "shape" : "list"
                  });
                });
              }}
            />
          </Col>
          <Col span={4} style={{ textAlign: "center" }}>
            <AddServiceComponent
              groupId={this.getGroupId()}
              refreshCurrent={() => {
                this.loading();
              }}
              onload={() => {
                this.setState({ type: "spin" }, () => {
                  this.setState({
                    type: this.state.size == "large" ? "shape" : "list"
                  });
                });
              }}
            />
          </Col>
        </Row>
        {this.state.type !== "list" &&
          <Row
            style={{
              textAlign: "right",
              paddingTop: "16px",
              paddingRight: "20px",
              background: "#fff"
            }}
          >
            {this.state.type === "shapes"
              ? <a
                  onClick={() => {
                    this.changeType("shape");
                  }}
                >
                  切换到展示模式
                </a>
              : <a
                  onClick={() => {
                    this.changeType("shapes");
                  }}
                >
                  切换到编辑模式
                </a>}
          </Row>}

        {this.state.type === "list"&&<AppList groupId={this.getGroupId()} />}
        {this.state.type === "shape" &&<AppShape group_id={this.getGroupId()} />}
        {this.state.type === "spin" && <Spin />}
        {this.state.type === "shapes" &&
          <EditorTopology
            changeType={type => {
              this.changeType(type);
            }}
            group_id={this.getGroupId()}
          />}
        {this.state.toDelete &&
          <ConfirmModal
            title="删除应用"
            desc="确定要此删除此应用吗？"
            subDesc="此操作不可恢复"
            onOk={this.handleDelete}
            onCancel={this.cancelDelete}
          />}
        {this.state.toEdit &&
          <EditGroupName
            group_name={groupDetail.group_name}
            title="修改应用名称"
            onCancel={this.cancelEdit}
            onOk={this.handleEdit}
          />}
        {this.state.toAdd &&
          <EditGroupName
            title="添加新应用"
            onCancel={this.cancelAdd}
            onOk={this.handleAdd}
          />}
        {this.state.promptModal &&
          <Modal
            title="友情提示"
            visible={this.state.promptModal}
            onOk={this.handlePromptModal_open}
            onCancel={this.handlePromptModal_close}
          >
            <p>
              {codeObj[this.state.code]}当前应用下的全部组件？
            </p>
          </Modal>}
      </PageHeaderLayout>
    );
  }
}

@connect(({ user }) => ({ currUser: user.currentUser }), null, null, {
  pure: false
})
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      show: true
    };
  }
  getGroupId() {
    const params = this.props.match.params;
    return params.appID;
  }
  render() {
    const { currUser } = this.props;
    const { teamName } = this.props.match.params;
    const team = userUtil.getTeamByTeamName(currUser, teamName);
    if (!teamUtil.canViewApp(team)) return <NoPermTip />;
    return (
      <Main key={this.getGroupId()} {...this.props} appID={this.getGroupId()} />
    );
  }
}
