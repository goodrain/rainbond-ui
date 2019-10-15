import React, { PureComponent, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import {
  Form,
  Button,
  Icon,
  Menu,
  Dropdown,
  notification,
  Modal,
  Input,
  Select,
  Tooltip,
  Radio,
  Alert,
  Badge,
  Divider
} from "antd";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import Overview from "./overview";
import ConnectionInformation from "./connectionInformation";
import ThirdPartyServices from "./ThirdPartyServices";
import Monitor from "./monitor";
import Log from "./log";
import Expansion from "./expansion";
import EnvironmentConfiguration from "./environmentConfiguration";
import Relation from "./relation";
import Mnt from "./mnt";
import Port from "./port";
import Plugin from "./plugin";
import Setting from "./setting";
import Members from "./members";
import Resource from "./resource";
import ConfirmModal from "../../components/ConfirmModal";
import styles from "./Index.less";
import globalUtil from "../../utils/global";
import appUtil from "../../utils/app";
import appStatusUtil from "../../utils/appStatus-util";
import VisitBtn from "../../components/VisitBtn";
import httpResponseUtil from "../../utils/httpResponse";
import MarketAppDetailShow from "../../components/MarketAppDetailShow";
import userUtil from "../../utils/user";
import teamUtil from "../../utils/team";
import regionUtil from "../../utils/region";
import AppPubSubSocket from "../../utils/appPubSubSocket";
import dateUtil from "../../utils/date-util";

import {
  deploy,
  restart,
  start,
  stop,
  rollback,
  getDetail,
  getStatus,
  updateRolling
} from "../../services/app";
import ManageAppGuide from "../../components/ManageAppGuide";

const FormItem = Form.Item;
const Option = Select.Option;
const ButtonGroup = Button.Group;
const RadioGroup = Radio.Group;

/*转移到其他应用组*/
@Form.create()
class MoveGroup extends PureComponent {
  handleSubmit = e => {
    e.preventDefault();
    const { form, currGroup } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      if (fieldsValue.group_id === currGroup) {
        notification.warning({ message: "不能选择当前所在组" });
        return;
      }

      this.props.onOk(fieldsValue);
    });
  };
  onCancel = () => {
    this.props.onCancel();
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    const initValue = this.props.currGroup.toString();
    const groups = this.props.groups || [];
    return (
      <Modal
        title="修改应用所属组"
        visible={true}
        onOk={this.handleSubmit}
        onCancel={this.onCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem label="">
            {getFieldDecorator("group_id", {
              initialValue: initValue || "",
              rules: [
                {
                  required: true,
                  message: "不能为空!"
                }
              ]
            })(
              <Select>
                {groups &&
                  groups.length > 0 &&
                  groups.map(group => {
                    return (
                      <Option
                        key={group.group_id}
                        value={group.group_id.toString()}
                      >
                        {group.group_name}
                      </Option>
                    );
                  })}
              </Select>
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

/*修改应用名称*/
@Form.create()
class EditName extends PureComponent {
  handleSubmit = e => {
    e.preventDefault();
    const { form } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.props.onOk(fieldsValue);
    });
  };
  onCancel = () => {
    this.props.onCancel();
  };
  render() {
    const { title } = this.props;
    const { getFieldDecorator } = this.props.form;
    const initValue = this.props.name;
    return (
      <Modal
        title={title || "修改应用名称"}
        visible={true}
        onOk={this.handleSubmit}
        onCancel={this.onCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <FormItem label="">
            {getFieldDecorator("service_cname", {
              initialValue: initValue || "",
              rules: [
                {
                  required: true,
                  message: "不能为空!"
                }
              ]
            })(
              <Input
                placeholder={
                  title ? "请输入新的组件名称" : "请输入新的应用名称"
                }
              />
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

/* 管理容器 */
@Form.create()
@connect(
  ({ user, appControl, global }) => ({ pods: appControl.pods }),
  null,
  null,
  { withRef: true }
)
class ManageContainer extends PureComponent {
  componentDidMount() {}
  fetchPods = () => {
    const appAlias = this.props.app_alias;
    this.props.dispatch({
      type: "appControl/fetchPods",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      }
    });
  };
  handlePodClick = item => {
    var { key } = item;
    var podName = key.split("_")[0];
    var manageName = key.split("_")[1];
    let pod_status = key.split("_")[2];
    if (pod_status != "RUNNING") {
      notification.warning({
        message: "当前节点暂不支持运行容器管理",
        duration: 5
      });
      return;
    }

    const appAlias = this.props.app_alias;
    if (podName && manageName) {
      if (navigator.userAgent.indexOf("Firefox") > 0) {
        var adPopup = window.open();
      } else {
        var adPopup = window.open("about:blank");
      }
      this.props.dispatch({
        type: "appControl/managePod",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: appAlias,
          pod_name: podName,
          manage_name: manageName
        },
        callback: () => {
          adPopup.location.href =
            "/console/teams/" +
            globalUtil.getCurrTeamName() +
            "/apps/" +
            appAlias +
            "/docker_console/";
        }
      });
    }
  };
  handleVisibleChange = visible => {
    if (visible) {
      this.fetchPods();
    }
  };
  render() {
    const pods = this.props.pods
      ? (this.props.pods.new_pods || []).concat(this.props.pods.old_pods || [])
      : [];

    const renderPods = (
      <Menu onClick={this.handlePodClick}>
        {pods &&
          pods.length > 0 &&
          pods.map((item, index) => {
            const { pod_name, pod_status, manage_name } = item;
            return (
              <Menu.Item key={pod_name + "_" + manage_name + "_" + pod_status}>
                实例{index + 1}
              </Menu.Item>
            );
          })}
      </Menu>
    );
    return (
      <Dropdown
        onVisibleChange={this.handleVisibleChange}
        overlay={renderPods}
        placement="bottomRight"
      >
        <Button>管理容器</Button>
      </Dropdown>
    );
  }
}

@Form.create()
@connect(
  ({ user, appControl, global }) => ({
    currUser: user.currentUser,
    appDetail: appControl.appDetail,
    pods: appControl.pods,
    groups: global.groups,
    build_upgrade: appControl.build_upgrade
  }),
  null,
  null,
  { withRef: true }
)
class Main extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      actionIng: false,
      appDetail: {},
      status: {},
      showDeleteApp: false,
      pageStatus: "",
      showEditName: false,
      showMoveGroup: false,
      showDeployTips: false,
      showreStartTips: false,
      visibleBuild: null,
      BuildText: "",
      BuildList: [],
      showMarketAppDetail: null,
      showApp: {},
      BuildState: null,
      deployCanClick: false,
      rollingCanClick: false,
      isShowThirdParty: false,
      promptModal: null,
      websocketURL: ""
    };
    this.timer = null;
    this.mount = false;
    this.socket = null;
  }
  static childContextTypes = {
    isActionIng: PropTypes.func,
    appRolback: PropTypes.func
  };
  getChildContext() {
    return {
      isActionIng: res => {
        //this.setState({actionIng: res})
      },
      appRolback: data => {
        this.handleRollback(data);
      }
    };
  }
  componentDidMount() {
    this.loadDetail();
    this.mount = true;
  }
  componentWillUnmount() {
    this.mount = false;
    clearInterval(this.timer);
    this.props.dispatch({ type: "appControl/clearPods" });
    this.props.dispatch({ type: "appControl/clearDetail" });
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }
  loadBuildState = appDetail => {
    if (
      appDetail &&
      appDetail.service &&
      appDetail.service.service_source == "market"
    ) {
      const serviceAlias = appDetail.service.service_alias;
      this.props.dispatch({
        type: "appControl/getBuildInformation",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: serviceAlias
        },
        callback: res => {
          if (res && res._code == 200) {
            this.setState({
              BuildState:
                res.list && res.list.length > 0 ? res.list.length : null
            });
          }
        }
      });
    }
    return;
  };
  loadDetail = () => {
    this.props.dispatch({
      type: "appControl/fetchDetail",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.getAppAlias()
      },
      callback: appDetail => {
        this.loadBuildState(appDetail);
        if (appDetail.service.service_source) {
          this.setState({
            isShowThirdParty: appDetail.is_third ? appDetail.is_third : false
          });
        }
        if (
          !appUtil.isCreateComplete(appDetail) &&
          !appUtil.isMarketApp(appDetail)
        ) {
          if (
            appDetail.service &&
            appDetail.service.create_status == "complete"
          ) {
            this.getStatus();
          } else if (!appUtil.isCreateFromCompose(appDetail)) {
            this.props.dispatch(
              routerRedux.replace(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-check/${
                  appDetail.service.service_alias
                }`
              )
            );
          } else {
            this.props.dispatch(
              routerRedux.replace(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-compose-check/${
                  appDetail.service.group_id
                }/${appDetail.service.compose_id}`
              )
            );
          }
        } else {
          this.getStatus();
        }
        // get websocket url and create client
        this.getWebSocketUrl(appDetail.service.service_id);
      },
      handleError: data => {
        var code = httpResponseUtil.getCode(data);

        if (code) {
          //应用不存在
          if (code === 404) {
            this.props.dispatch(
              routerRedux.push(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/exception/404`
              )
            );
          }

          //访问的应用不在当前的数据中心里
          if (code === 10404) {
          }

          //访问的应用不在当前团队里
          if (code === 10403) {
          }
        }
      }
    });
  };
  getWebSocketUrl(service_id) {
    var currTeam = userUtil.getTeamByTeamName(
      this.props.currUser,
      globalUtil.getCurrTeamName()
    );
    var currRegionName = globalUtil.getCurrRegionName();
    if (currTeam) {
      var region = teamUtil.getRegionByName(currTeam, currRegionName);
      if (region) {
        const websocketURL = regionUtil.getNewWebSocketUrl(region, service_id);
        this.setState({ websocketURL: websocketURL }, () => {
          this.createSocket();
        });
      }
    }
  }
  getStatus = () => {
    if (!this.mount) return;
    getStatus({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.getAppAlias()
    }).then(data => {
      if (data) {
        this.setState({ status: data.bean });
      }
      setTimeout(() => {
        this.getStatus();
      }, 5000);
    });
  };
  handleTabChange = key => {
    const { dispatch, match } = this.props;
    const { appAlias } = this.props.match.params;
    dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${appAlias}/${key}`
      )
    );
  };
  getChildCom = () => {
    if (this.ref) {
      return this.ref.getWrappedInstance({});
    }
    return null;
  };
  getAppAlias() {
    return this.props.match.params.appAlias;
  }
  handleshowDeployTips = showonoff => {
    this.setState({ showDeployTips: showonoff });
  };
  handleDeploy = (group_version, is_upgrate) => {
    this.setState({
      showDeployTips: false,
      showreStartTips: false,
      deployCanClick: true
    });
    if (this.state.actionIng) {
      notification.warning({ message: `正在执行操作，请稍后` });
      return;
    }
    const { build_upgrade } = this.props;
    deploy({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.getAppAlias(),
      group_version: group_version ? group_version : "",
      is_upgrate: build_upgrade
    }).then(data => {
      this.setState({ deployCanClick: false });
      if (data) {
        this.handleCancelBuild();
        this.loadBuildState(this.props.appDetail);
        notification.success({ message: `操作成功，部署中` });
        var child = this.getChildCom();

        if (child && child.onLogPush) {
          child.onLogPush(true);
        }
        if (child && child.onAction) {
          child.onAction(data.bean);
        }
      }
    });
  };
  handleRollback = datas => {
    if (this.state.actionIng) {
      notification.warning({ message: `正在执行操作，请稍后` });
      return;
    }
    rollback({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.getAppAlias(),
      deploy_version: datas.build_version
        ? datas.build_version
        : datas.deploy_version
        ? datas.deploy_version
        : "",
      upgrade_or_rollback: datas.upgrade_or_rollback
        ? datas.upgrade_or_rollback
        : -1
    }).then(data => {
      if (data) {
        notification.success({
          message: datas.upgrade_or_rollback
            ? datas.upgrade_or_rollback == 1
              ? `操作成功，升级中`
              : `操作成功，回滚中`
            : `操作成功，回滚中`
        });
        var child = this.getChildCom();
        if (child && child.onAction) {
          child.onAction(data.bean);
        }
      }
    });
  };
  handleshowRestartTips = showonoff => {
    this.setState({ showreStartTips: showonoff });
  };
  handleRestart = () => {
    this.setState({ showreStartTips: false });
    this.handleOffHelpfulHints();

    if (this.state.actionIng) {
      notification.warning({ message: `正在执行操作，请稍后` });
      return;
    }
    restart({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.getAppAlias()
    }).then(data => {
      if (data) {
        notification.success({ message: `操作成功，重启中` });
        var child = this.getChildCom();
        if (child && child.onAction) {
          child.onAction(data.bean);
        }
      }
    });
  };
  handleStart = () => {
    this.handleOffHelpfulHints();

    if (this.state.actionIng) {
      notification.warning({ message: `正在执行操作，请稍后` });
      return;
    }
    start({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.getAppAlias()
    }).then(data => {
      if (data) {
        notification.success({ message: `操作成功，启动中` });
        var child = this.getChildCom();
        if (child && child.onAction) {
          child.onAction(data.bean);
        }
      }
    });
  };
  handleStop = () => {
    this.handleOffHelpfulHints();
    if (this.state.actionIng) {
      notification.warning({ message: `正在执行操作，请稍后` });
      return;
    }
    stop({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.getAppAlias()
    }).then(data => {
      if (data) {
        notification.success({ message: `操作成功，关闭中` });
        var child = this.getChildCom();
        if (child && child.onAction) {
          child.onAction(data.bean);
        }
      }
    });
  };
  saveRef = ref => {
    this.ref = ref;
  };
  handleDropClick = item => {
    if (item === "deleteApp") {
      this.onDeleteApp();
    }

    if (item === "moveGroup") {
      this.showMoveGroup();
    }
    if (item === "restart") {
      this.setState({
        promptModal: "restart"
      });
    }
  };
  onDeleteApp = () => {
    this.setState({ showDeleteApp: true });
  };
  cancelDeleteApp = () => {
    this.setState({ showDeleteApp: false });
  };
  createSocket() {
    const appDetail = this.props.appDetail;
    const { websocketURL } = this.state;
    if (websocketURL) {
      let isThrough = dateUtil.isWebSocketOpen(websocketURL);
      if (isThrough && isThrough === "through") {
        this.socket = new AppPubSubSocket({
          url: websocketURL,
          serviceId: appDetail.service.service_id,
          isAutoConnect: true,
          destroyed: false
        });
      }
    }
  }
  handleDeleteApp = () => {
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "appControl/deleteApp",
      payload: {
        team_name: team_name,
        app_alias: this.getAppAlias()
      },
      callback: () => {
        this.props.dispatch({
          type: "global/fetchGroups",
          payload: {
            team_name: team_name
          }
        });
        this.props.dispatch(
          routerRedux.replace(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${
              this.props.appDetail.service.group_id
            }`
          )
        );
      }
    });
  };
  showEditName = () => {
    this.setState({ showEditName: true });
  };
  hideEditName = () => {
    this.setState({ showEditName: false });
  };
  handleEditName = data => {
    const team_name = globalUtil.getCurrTeamName();
    const appDetail = this.props.appDetail;
    const serviceAlias = appDetail.service.service_alias;
    this.props.dispatch({
      type: "appControl/editName",
      payload: {
        team_name,
        app_alias: serviceAlias,
        ...data
      },
      callback: () => {
        this.loadDetail();
        this.hideEditName();
      }
    });
  };
  showMoveGroup = () => {
    this.setState({ showMoveGroup: true });
  };
  hideMoveGroup = () => {
    this.setState({ showMoveGroup: false });
  };
  handleMoveGroup = data => {
    const team_name = globalUtil.getCurrTeamName();
    const appDetail = this.props.appDetail;
    const serviceAlias = appDetail.service.service_alias;
    this.props.dispatch({
      type: "appControl/moveGroup",
      payload: {
        team_name,
        app_alias: serviceAlias,
        ...data
      },
      callback: () => {
        this.hideMoveGroup();
        this.loadDetail();
        this.props.dispatch({
          type: "global/fetchGroups",
          payload: {
            team_name: team_name
          }
        });

        notification.success({ message: "操作成功" });
      }
    });
  };
  renderTitle(name) {
    const { appDetail, groups } = this.props;
    const { status, isShowThirdParty } = this.state;
    return (
      <Fragment>
        <div style={{ display: "flex" }}>
          <div style={{ marginTop: "3px" }}>
            {globalUtil.fetchSvg("application")}
          </div>
          <div style={{ marginLeft: "14px" }}>
            <div className={styles.contentTitle}>
              {name || "-"}
              <Icon
                style={{
                  cursor: "pointer"
                }}
                onClick={this.showEditName}
                type="edit"
              />
            </div>

            <div className={styles.content_Box}>
              {!appDetail.is_third && (
                <a
                  onClick={() => {
                    !(
                      !appUtil.canRestartApp(appDetail) ||
                      !appStatusUtil.canRestart(status)
                    ) && this.handleDropClick("restart");
                  }}
                  style={{
                    cursor:
                      !appUtil.canRestartApp(appDetail) ||
                      !appStatusUtil.canRestart(status)
                        ? "no-drop"
                        : "pointer"
                  }}
                >
                  重启
                </a>
              )}
              {!appDetail.is_third && <Divider type="vertical" />}

              {appUtil.canStopApp(appDetail) &&
              !appStatusUtil.canStart(status) &&
              !isShowThirdParty ? (
                <span>
                  <a
                    style={{
                      cursor: !appStatusUtil.canStop(status)
                        ? "no-drop"
                        : "pointer"
                    }}
                    onClick={() => {
                      appStatusUtil.canStop(status) &&
                        this.handleOpenHelpfulHints("stop");
                    }}
                  >
                    关闭
                  </a>
                  <Divider type="vertical" />
                </span>
              ) : status && status.status && status.status == "upgrade" ? (
                <span>
                  <a
                    onClick={() => {
                      this.handleOpenHelpfulHints("stop");
                    }}
                  >
                    关闭
                  </a>
                  <Divider type="vertical" />
                </span>
              ) : null}

              {!appDetail.is_third ? (
                <a
                  onClick={() => {
                    !(groups.length <= 1 || !appUtil.canMoveGroup(appDetail)) &&
                      this.handleDropClick("moveGroup");
                  }}
                  style={{
                    cursor:
                      groups.length <= 1 || !appUtil.canMoveGroup(appDetail)
                        ? "no-drop"
                        : "pointer"
                  }}
                >
                  修改所属应用
                </a>
              ) : (
                <a
                  onClick={() => {
                    this.handleDropClick("moveGroup");
                  }}
                >
                  修改所属应用
                </a>
              )}
              <Divider type="vertical" />
              <a
                onClick={() => {
                  appUtil.canDelete(appDetail) &&
                    this.handleDropClick("deleteApp");
                }}
                style={{
                  cursor: !appUtil.canDelete(appDetail) ? "no-drop" : "pointer"
                }}
              >
                删除
              </a>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
  handleUpdateRolling = () => {
    this.setState({
      showDeployTips: false,
      showreStartTips: false,
      rollingCanClick: true
    });
    if (this.state.actionIng) {
      notification.warning({ message: `正在执行操作，请稍后` });
      return;
    }
    updateRolling({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.getAppAlias()
    }).then(data => {
      this.setState({ rollingCanClick: false });
      if (data) {
        notification.success({ message: `操作成功，更新中` });
        var child = this.getChildCom();
        if (child && child.onAction) {
          child.onAction(data.bean);
        }
      }
    });
  };
  handleChecked = value => {
    this.props.dispatch({
      type: "appControl/changeApplicationState",
      payload: {
        build_upgrade: value,
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.getAppAlias()
      },
      callback: data => {
        if (data) {
          notification.info({ message: "修改成功" });
        }
      }
    });
  };
  handleOkBuild = () => {
    this.props.form.validateFields((err, fieldsValue) => {
      if (!err) {
        this.handleDeploy(fieldsValue.group_version);
      }
    });
  };

  handleOpenBuild = () => {
    const appDetail = this.props.appDetail;
    const serviceAlias = appDetail.service.service_alias;
    const buildType = appDetail.service.service_source;
    const text = appDetail.rain_app_name;
    const { status } = this.state;
    if (buildType == "market" && (status && status.status != "undeploy")) {
      this.props.dispatch({
        type: "appControl/getBuildInformation",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: serviceAlias
        },
        callback: res => {
          if (res && res._code == 200) {
            this.setState({
              BuildList: res.list,
              visibleBuild: true,
              BuildText: text,
              BuildState:
                res.list && res.list.length > 0 ? res.list.length : null,
              showApp: {
                details: false,
                group_name: text
              }
            });
          }
        }
      });
    } else {
      buildType == "market" ? this.handleDeploy("", true) : this.handleDeploy();
    }
  };
  handleCancelBuild = () => {
    this.setState({
      visibleBuild: null,
      BuildText: ""
    });
  };
  hideMarketAppDetail = () => {
    this.setState({
      showMarketAppDetail: null
    });
  };
  hideMarketOpenAppDetail = () => {
    this.setState({
      showMarketAppDetail: true
    });
  };
  handleOpenHelpfulHints = promptModal => {
    this.setState({
      promptModal
    });
  };
  handleOffHelpfulHints = () => {
    this.setState({
      promptModal: null
    });
  };
  handleJumpAgain = () => {
    const { promptModal } = this.state;
    promptModal == "stop"
      ? this.handleStop()
      : promptModal == "start"
      ? this.handleStart()
      : promptModal == "restart"
      ? this.handleRestart()
      : "";
  };
  render() {
    const appDetail = this.props.appDetail;
    const status = this.state.status || {};
    const groups = this.props.groups || [];
    const isShowThirdParty = this.state.isShowThirdParty;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const codeObj = {
      start: "启动",
      restart: "重启",
      stop: "关闭",
      deploy: "构建",
      rolling: "更新(滚动）"
    };
    if (!appDetail.service) {
      return null;
    }
    const appAlias = this.getAppAlias();
    if (!status.status) {
      return null;
    }
    const action = (
      <div>
        {appUtil.canStartApp(appDetail) &&
        !appStatusUtil.canStop(status) &&
        !isShowThirdParty ? (
          <Button
            disabled={!appStatusUtil.canStart(status)}
            onClick={this.handleStart}
          >
            启动
          </Button>
        ) : null}

        {appUtil.canManageContainter(appDetail) &&
        appStatusUtil.canManageDocker(status) &&
        !isShowThirdParty ? (
          <ManageContainer app_alias={appDetail.service.service_alias} />
        ) : null}

        {isShowThirdParty ? (
          ""
        ) : this.state.BuildState ? (
          <Tooltip title={"有新版本"}>
            <Button onClick={this.handleOpenBuild}>
              <Badge
                className={styles.badge}
                status="success"
                text=""
                count="有更新版本"
                title="有更新版本"
              />
              构建
            </Button>
          </Tooltip>
        ) : status && status.status == "undeploy" ? (
          <Button onClick={this.handleOpenBuild}>构建</Button>
        ) : (
          <Button onClick={this.handleOpenBuild}>构建</Button>
        )}
        {status.status == "undeploy" ||
        status.status == "closed" ||
        status.status == "stopping" ||
        isShowThirdParty ? (
          ""
        ) : (
          <Button
            onClick={this.handleUpdateRolling}
            loading={this.state.rollingCanClick}
          >
            更新(滚动)
          </Button>
        )}

        {appDetail.service.service_source == "market" &&
          appStatusUtil.canVisit(status) &&
          !isShowThirdParty && (
            <VisitBtn btntype="primary" app_alias={appAlias} />
          )}
        {appDetail.service.service_source != "market" &&
          appStatusUtil.canVisit(status) &&
          !isShowThirdParty && (
            <VisitBtn btntype="primary" app_alias={appAlias} />
          )}
        {isShowThirdParty && (
          <VisitBtn btntype="primary" app_alias={appAlias} />
        )}

        {/* {(appDetail.service.service_source == "market" && appStatusUtil.canVisit(status)) && (<VisitBtn btntype="primary" app_alias={appAlias} />)} */}
      </div>
    );
    const tabList = isShowThirdParty
      ? [
          {
            key: "thirdPartyServices",
            tab: "总览"
          },
          {
            key: "port",
            tab: "端口"
          },
          {
            key: "connectionInformation",
            tab: "连接信息"
          },
          {
            key: "members",
            tab: "更多设置"
          }
        ]
      : [
          {
            key: "overview",
            tab: "总览"
          },
          {
            key: "monitor",
            tab: "监控"
          },
          {
            key: "log",
            tab: "日志"
          },
          {
            key: "expansion",
            tab: "伸缩"
          },
          {
            key: "environmentConfiguration",
            tab: "环境配置"
          },
          {
            key: "relation",
            tab: "依赖"
          },
          {
            key: "mnt",
            tab: "存储"
          },
          {
            key: "port",
            tab: "端口"
          },
          {
            key: "plugin",
            tab: "插件"
          },
          {
            key: "resource",
            tab: "构建源"
          },
          {
            key: "setting",
            tab: "其他设置"
          }
        ];
    // const { service_source, language } = this.state;
    const map = {
      thirdPartyServices: ThirdPartyServices,
      connectionInformation: ConnectionInformation,
      members: Members,
      overview: isShowThirdParty ? ThirdPartyServices : Overview,
      monitor: Monitor,
      log: Log,
      expansion: Expansion,
      environmentConfiguration: EnvironmentConfiguration,
      relation: Relation,
      mnt: Mnt,
      port: Port,
      plugin: Plugin,
      setting: Setting,
      resource: Resource
    };
    var type = this.props.match.params.type;

    if (!type) {
      type = isShowThirdParty ? "thirdPartyServices" : "overview";
    }
    const Com = map[type];
    const formItemLayout = {
      labelCol: {
        span: 1
      },
      wrapperCol: {
        span: 23
      }
    };
    const { BuildList } = this.state;
    return (
      <PageHeaderLayout
        breadcrumbList={[
          {
            title: "首页",
            href: `/`
          },
          {
            title: "我的应用",
            href: ``
          },
          {
            title: this.props.appDetail.service.group_name,
            href: `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/groups/${
              this.props.appDetail.service.group_id
            }`
          },
          {
            title: this.props.appDetail.service.service_cname,
            href: ""
          }
        ]}
        action={action}
        title={this.renderTitle(appDetail.service.service_cname)}
        onTabChange={this.handleTabChange}
        tabActiveKey={type}
        tabList={tabList}
      >
        {this.state.showMarketAppDetail && (
          <MarketAppDetailShow
            onOk={this.hideMarketAppDetail}
            onCancel={this.hideMarketAppDetail}
            app={this.state.showApp}
          />
        )}

        {this.state.promptModal && (
          <Modal
            title="友情提示"
            visible={this.state.promptModal}
            onOk={this.handleJumpAgain}
            onCancel={this.handleOffHelpfulHints}
            confirmLoading={!this.state.promptModal}
          >
            <p>确定{codeObj[this.state.promptModal]}当前组件？</p>
          </Modal>
        )}
        <Modal
          title={[<span>从云市应用构建</span>]}
          visible={this.state.visibleBuild}
          onOk={this.handleOkBuild}
          onCancel={this.handleCancelBuild}
          afterClose={() => {
            this.setState({ BuildList: [] });
          }}
          footer={
            BuildList && BuildList.length > 0
              ? [
                  <Button
                    onClick={() => {
                      this.handleCancelBuild();
                    }}
                  >
                    取消
                  </Button>,
                  <Button
                    type="primary"
                    onClick={() => {
                      this.handleOkBuild();
                    }}
                  >
                    构建
                  </Button>
                ]
              : [
                  <Button
                    onClick={() => {
                      this.handleCancelBuild();
                    }}
                  >
                    取消
                  </Button>,
                  <Button
                    type="primary"
                    onClick={() => {
                      this.handleOkBuild();
                    }}
                  >
                    强制构建
                  </Button>
                ]
          }
        >
          <div>
            {BuildList && BuildList.length > 0 ? (
              <Form onSubmit={this.handleOkBuild}>
                <Alert
                  message={[
                    <span>从云市应用</span>,
                    <a
                      onClick={() => {
                        this.hideMarketOpenAppDetail();
                      }}
                    >
                      {this.state.BuildText}
                    </a>,
                    <span>构建而来,当前云市应用版本有更新!</span>
                  ]}
                  type="success"
                  style={{ marginBottom: "5px" }}
                />
                <Form.Item {...formItemLayout} label="">
                  {getFieldDecorator("group_version", {
                    initialValue: BuildList[0],
                    rules: [{ required: true, message: "选择版本" }]
                  })(
                    <RadioGroup>
                      {BuildList.map((item, index) => {
                        return (
                          <div>
                            版本:&nbsp;
                            <Radio key={index} value={item}>
                              <a>{item}</a>可更新
                            </Radio>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  )}
                </Form.Item>
              </Form>
            ) : (
              <Alert
                message="云市应用暂未有新版本更新，您无需构建。"
                type="success"
                style={{ marginBottom: "5px" }}
              />
            )}
          </div>
        </Modal>

        {Com ? (
          <Com
            status={this.state.status}
            ref={this.saveRef}
            {...this.props.match.params}
            {...this.props}
            onshowDeployTips={msg => {
              this.handleshowDeployTips(msg);
            }}
            onshowRestartTips={msg => {
              this.handleshowRestartTips(msg);
            }}
            socket={this.socket}
            onChecked={this.handleChecked}
          />
        ) : (
          "参数错误"
        )}

        {this.state.showDeleteApp && (
          <ConfirmModal
            onOk={this.handleDeleteApp}
            onCancel={this.cancelDeleteApp}
            title="删除组件"
            desc="确定要删除此组件吗？"
            subDesc="此操作不可恢复"
          />
        )}
        {this.state.showEditName && (
          <EditName
            name={appDetail.service.service_cname}
            onOk={this.handleEditName}
            onCancel={this.hideEditName}
            title="修改组件名称"
          />
        )}
        {this.state.showMoveGroup && (
          <MoveGroup
            currGroup={appDetail.service.group_id}
            groups={groups}
            onOk={this.handleMoveGroup}
            onCancel={this.hideMoveGroup}
          />
        )}
        <ManageAppGuide />
      </PageHeaderLayout>
    );
  }
}
@Form.create()
@connect(
  ({ user, groupControl }) => ({}),
  null,
  null,
  {
    pure: false,
    withRef: true
  }
)
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.id = "";
    this.state = {
      show: true
    };
  }
  getAlias = () => {
    return this.props.match.params.appAlias;
  };
  componentDidMount() {}
  flash = () => {
    this.setState(
      {
        show: false
      },
      () => {
        this.setState({ show: true });
      }
    );
  };
  render() {
    //Switching applications show
    if (this.id !== this.getAlias()) {
      this.id = this.getAlias();
      this.flash();
    }
    if (!this.state.show) {
      return null;
    }
    return <Main {...this.props} />;
  }
}
