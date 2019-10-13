import React, { PureComponent } from "react";
import { Button, Icon, Card, Modal, Switch, Radio, Tooltip } from "antd";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import Result from "../../components/Result";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import ConfirmModal from "../../components/ConfirmModal";
import {
  getCreateCheckId,
  getCreateCheckResult,
  buildApp,
  getCheckuuid
} from "../../services/createApp";
import globalUtil from "../../utils/global";
import configureGlobal from "../../utils/configureGlobal";
import LogProcress from "../../components/LogProcress";
import userUtil from "../../utils/user";
import regionUtil from "../../utils/region";
import ShowRegionKey from "../../components/ShowRegionKey";
import ModifyImageCmd from "./modify-image-cmd";
import ModifyImageName from "./modify-image-name";
import ModifyUrl from "./modify-url";

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

@connect(({ user, appControl, global }) => ({
  currUser: user.currentUser,
  appDetail: appControl.appDetail,
  rainbondInfo: global.rainbondInfo
}))
export default class CreateCheck extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      // failure、checking、success
      status: "",
      check_uuid: "",
      errorInfo: [],
      serviceInfo: [],
      showEdit: false,
      eventId: "",
      appDetail: {},
      showDelete: false,
      modifyUrl: false,
      modifyUserpass: false,
      modifyImageName: false,
      modifyImageCmd: false,
      is_deploy: true,
      ServiceGetData: props.ServiceGetData ? props.ServiceGetData : null,
      buildAppLoading: false,
      is_multi: false
    };
    this.mount = false;
    this.socketUrl = "";
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const region = userUtil.hasTeamAndRegion(
      this.props.currUser,
      teamName,
      regionName
    );
    if (region) {
      this.socketUrl = regionUtil.getEventWebSocketUrl(region);
    }
  }
  componentDidMount() {
    this.mount = true;
    this.getDetail();
    this.bindEvent();
  }
  getDetail = () => {
    this.props.dispatch({
      type: "appControl/fetchDetail",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.getAppAlias()
      },
      callback: appDetail => {
        if (appDetail) {
          this.setState({ appDetail: appDetail.service });
          this.getCheckuuid();
        }
      }
    });
  };
  getCheckuuid = () => {
    const appAlias = this.getAppAlias();
    const team_name = globalUtil.getCurrTeamName();
    getCheckuuid({ team_name, app_alias: appAlias }).then(data => {
      if (data) {
        if (!data.bean.check_uuid) {
          this.startCheck();
        } else {
          this.state.check_uuid = data.bean.check_uuid;
          this.loopStatus();
        }
      }
    });
  };
  componentWillUnmount() {
    this.mount = false;
    this.unbindEvent();
  }
  getAppAlias() {
    const { ServiceGetData } = this.state;
    return ServiceGetData ? ServiceGetData : this.props.match.params.appAlias;
  }
  loopStatus = () => {
    if (!this.mount) return;
    const appAlias = this.getAppAlias();
    const team_name = globalUtil.getCurrTeamName();
    getCreateCheckResult({
      team_name,
      app_alias: appAlias,
      check_uuid: this.state.check_uuid
    })
      .then(data => {
        if (data && this.mount) {
          const status = data.bean.check_status;
          const error_infos = data.bean.error_infos || [];
          const serviceInfo = data.bean.service_info || [];
          this.setState({
            status,
            errorInfo: error_infos,
            serviceInfo,
            is_multi: data.bean.is_multi
          });
        }
      })
      .finally(() => {
        if (this.mount && this.state.status === "checking") {
          setTimeout(() => {
            this.loopStatus();
          }, 5000);
        }
      });
  };
  startCheck = loopStatus => {
    const appAlias = this.getAppAlias();
    const team_name = globalUtil.getCurrTeamName();
    const p = getCreateCheckId(
      {
        team_name,
        app_alias: appAlias
      },
      res => {
        if (res.status === 404) {
          this.props.dispatch(
            routerRedux.replace(
              `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/exception/404`
            )
          );
        }
      }
    ).then(data => {
      if (data) {
        this.state.check_uuid = data.bean.check_uuid;
        this.setState({
          eventId: data.bean.check_event_id,
          appDetail: data.bean
        });
        if (loopStatus !== false) {
          this.loopStatus();
        }
      }
    });
  };
  handleCreate = () => {};
  handleSetting = () => {
    const appAlias = this.getAppAlias();
    this.props.dispatch(
      routerRedux.push(
        `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-setting/${appAlias}`
      )
    );
  };
  // 进入多模块构建
  handleMoreService = () => {
    const { ServiceGetData, check_uuid, is_multi } = this.state;
    const appAlias = this.getAppAlias();
    ServiceGetData && !is_multi
      ? this.props.handleServiceDataState(true, null, null, null)
      : this.props.dispatch(
          routerRedux.push(
            `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-moreService/${appAlias}/${check_uuid}`
          )
        );
  };

  handleBuild = () => {
    const appAlias = this.getAppAlias();
    const team_name = globalUtil.getCurrTeamName();
    const { is_deploy, ServiceGetData, appDetail } = this.state;
    this.setState({ buildAppLoading: true });
    buildApp({ team_name, app_alias: appAlias, is_deploy }).then(data => {
      this.setState({ buildAppLoading: false });
      if (data) {
        const appAlias = this.getAppAlias();
        this.props.dispatch({
          type: "global/fetchGroups",
          payload: {
            team_name
          }
        });
        ServiceGetData && is_deploy
          ? this.props.refreshCurrent()
          : appDetail.service_source == "third_party"
          ? this.props.dispatch(
              routerRedux.push(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${appAlias}/thirdPartyServices`
              )
            )
          : this.props.dispatch(
              routerRedux.push(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${appAlias}/overview`
              )
            );
      }
    });
  };

  recheck = () => {
    this.setState(
      {
        status: "checking"
      },
      () => {
        this.startCheck();
      }
    );
  };
  cancelModifyImageName = () => {
    this.setState({ modifyImageName: false });
  };
  cancelModifyImageCmd = () => {
    this.setState({ modifyImageCmd: false });
  };
  handleClick = e => {
    let parent = e.target;
    const appDetail = this.state.appDetail;

    while (parent) {
      if (parent === document.body) {
        return;
      }
      const actionType = parent.getAttribute("action_type");
      if (actionType === "modify_url" || actionType === "modify_repo") {
        this.setState({ modifyUrl: actionType });
        return;
      }

      if (actionType === "modify_userpass") {
        this.setState({ modifyUserpass: true });
        return;
      }

      if (actionType === "get_publickey") {
        this.setState({ showKey: true });
        return;
      }

      if (actionType === "open_repo") {
        if ((appDetail.git_url || "").indexOf("@") === -1) {
          window.open(appDetail.git_url);
        } else {
          Modal.info({ title: "仓库地址", content: appDetail.git_url });
        }
      }

      // 修改镜像名称或dockerrun命令
      if (actionType === "modify_image") {
        // 指定镜像
        if (appDetail.service_source === "docker_image") {
          this.startCheck(false);
          this.setState({ modifyImageName: true });
          return;
        }
        // docker_run命令
        if (appDetail.service_source === "docker_run") {
          this.startCheck(false);
          this.setState({ modifyImageCmd: true });
          return;
        }
      }

      parent = parent.parentNode;
    }
  };
  handleDelete = () => {
    const appAlias = this.getAppAlias();
    const { ServiceGetData } = this.state;
    this.props.dispatch({
      type: "appControl/deleteApp",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        is_force: true
      },
      callback: () => {
        this.props.dispatch({
          type: "global/fetchGroups",
          payload: {
            team_name: globalUtil.getCurrTeamName()
          }
        });

        ServiceGetData
          ? this.props.handleServiceDataState(true, null, null, null)
          : this.props.dispatch(
              routerRedux.replace(
                `/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`
              )
            );
      }
    });
  };
  cancelModifyUrl = () => {
    this.setState({ modifyUrl: false });
  };
  handleCancelEdit = () => {
    this.setState({ showEdit: false, modifyUrl: false });
  };
  handleCancelShowKey = () => {
    this.setState({ showKey: false });
  };
  bindEvent = () => {
    document.addEventListener("click", this.handleClick, false);
  };
  unbindEvent = () => {
    document.removeEventListener("click", this.handleClick);
  };
  cancelModifyUserpass = () => {
    this.setState({ modifyUserpass: false });
  };
  handleModifyUserpass = values => {
    const appDetail = this.state.appDetail;
    this.props.dispatch({
      type: "appControl/editAppCreateInfo",
      payload: {
        service_cname: values.service_cname ? values.service_cname : "",
        git_url: values.git_url ? values.git_url : "",
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail.service_alias,
        user_name: values.user_name,
        password: values.password
      },
      callback: data => {
        if (data) {
          this.startCheck(false);
          this.cancelModifyUserpass();
        }
      }
    });
  };
  handleModifyUrl = values => {
    const appDetail = this.state.appDetail;
    this.props.dispatch({
      type: "appControl/editAppCreateInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail.service_alias,
        git_url: values.git_url
      },
      callback: data => {
        if (data) {
          this.startCheck(false);
          this.handleCancelEdit();
        }
      }
    });
  };
  handleModifyImageName = values => {
    const appDetail = this.state.appDetail;
    this.props.dispatch({
      type: "appControl/editAppCreateInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail.service_alias,
        docker_cmd: values.docker_cmd,
        user_name: values.username,
        password: values.password
      },
      callback: data => {
        if (data) {
          this.startCheck(false);
          this.cancelModifyImageName();
        }
      }
    });
  };
  handleModifyImageCmd = values => {
    const appDetail = this.state.appDetail;
    this.props.dispatch({
      type: "appControl/editAppCreateInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail.service_alias,
        docker_cmd: values.docker_cmd,
        user_name: values.username,
        password: values.password
      },
      callback: data => {
        if (data) {
          this.startCheck(false);
          this.cancelModifyImageCmd();
        }
      }
    });
  };
  handleImageSubmit = () => {};
  showDelete = () => {
    this.setState({ showDelete: true });
  };
  renderError = () => {
    const errorInfo = this.state.errorInfo;
    const extra = (
      <div>
        {errorInfo.map(item => (
          <div
            style={{
              marginBottom: 16
            }}
          >
            <Icon
              style={{
                color: "#f5222d",
                marginRight: 8
              }}
              type="close-circle-o"
            />
            <span
              dangerouslySetInnerHTML={{
                __html: `<span>${item.error_info || ""} ${item.solve_advice ||
                  ""}</span>`
              }}
            />
          </div>
        ))}
      </div>
    );

    const { ServiceGetData } = this.state;

    const actions = (
      <div>
        <Button
          onClick={this.recheck}
          type="primary"
          style={{ marginRight: "8px" }}
        >
          重新检测
        </Button>
        <Button onClick={this.showDelete} type="default">
          放弃创建
        </Button>
      </div>
    );

    if (
      ServiceGetData &&
      (!this.props.ButtonGroupState || !this.props.ErrState)
    ) {
      this.props.handleServiceBotton(actions, true, true);
    }
    return (
      <Result
        type="error"
        title="组件构建源检测未通过"
        description="请核对并修改以下信息后，再重新检测。"
        extra={extra}
        actions={ServiceGetData ? "" : actions}
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
      />
    );
  };

  renderSuccessInfo = item => {
    if (typeof item.value === "string") {
      return (
        <div>
          <span
            style={{
              verticalAlign: "top",
              display: "inline-block",
              fontWeight: "bold"
            }}
          >
            {item.key}：
          </span>
          {item.value}
        </div>
      );
    }
    return (
      <div>
        <span
          style={{
            verticalAlign: "top",
            display: "inline-block",
            fontWeight: "bold"
          }}
        >
          {item.key}：
        </span>
        <div
          style={{
            display: "inline-block"
          }}
        >
          {(item.value || []).map(item => (
            <p
              style={{
                marginBottom: 0
              }}
            >
              {item}
            </p>
          ))}
        </div>
      </div>
    );
  };

  renderSuccessOnChange = () => {
    this.setState({
      is_deploy: !this.state.is_deploy
    });
  };

  renderSuccess = () => {
    const { rainbondInfo } = this.props;
    const { ServiceGetData, is_deploy, appDetail } = this.state;
    const serviceInfo = this.state.serviceInfo;
    const extra =
      serviceInfo && serviceInfo.length > 0
        ? serviceInfo.map(item => (
            <div
              style={{
                marginBottom: 16
              }}
            >
              {this.renderSuccessInfo(item)}
            </div>
          ))
        : "";

    let actions = [];
    ServiceGetData
      ? (actions = [
          <div style={{ display: "flex" }}>
            <Button
              onClick={this.showDelete}
              type="default"
              style={{ marginRight: "8px" }}
            >
              {" "}
              放弃创建{" "}
            </Button>
            <Button
              type="default"
              onClick={this.handleSetting}
              style={{ marginRight: "8px" }}
            >
              高级设置
            </Button>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button
                onClick={this.handleBuild}
                type="primary"
                style={{ marginRight: "8px" }}
                loading={this.state.buildAppLoading}
              >
                {" "}
                创建{" "}
              </Button>
              <Tooltip
                placement="topLeft"
                title={
                  <p>
                    取消本选项你可以先对组件进行
                    <br />
                    高级设置再构建启动。
                  </p>
                }
              >
                <Radio
                  size="small"
                  onClick={this.renderSuccessOnChange}
                  checked={is_deploy}
                >
                  并构建启动
                </Radio>
              </Tooltip>
            </div>
          </div>
        ])
      : appDetail.service_source == "third_party"
      ? (actions = [
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Button
                onClick={this.handleBuild}
                type="primary"
                style={{ marginRight: "8px" }}
                loading={this.state.buildAppLoading}
              >
                {" "}
                创建{" "}
              </Button>
            </div>
          </div>
        ])
      : (actions = [
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button onClick={this.showDelete} type="default">
              {" "}
              放弃创建{" "}
            </Button>
            <Button type="default" onClick={this.handleSetting}>
              高级设置
            </Button>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Button
                onClick={this.handleBuild}
                type="primary"
                style={{ marginRight: "8px" }}
                loading={this.state.buildAppLoading}
              >
                {" "}
                创建{" "}
              </Button>
              {appDetail.service_source == "third_party"}
              <Tooltip
                placement="topLeft"
                title={
                  <p>
                    取消本选项你可以先对组件进行
                    <br />
                    高级设置再构建启动。
                  </p>
                }
              >
                <Radio
                  size="small"
                  onClick={this.renderSuccessOnChange}
                  checked={is_deploy}
                >
                  并构建启动
                </Radio>
              </Tooltip>
            </div>
          </div>
        ]);
    if (appDetail.service_source == "third_party") {
      actions = [
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Button
              onClick={this.handleBuild}
              type="primary"
              style={{ marginRight: "8px" }}
              loading={this.state.buildAppLoading}
            >
              {" "}
              创建{" "}
            </Button>
            <Button onClick={this.showDelete} type="default">
              {" "}
              放弃创建{" "}
            </Button>
          </div>
        </div>
      ];
    }

    if (is_deploy) {
      // ServiceGetData && (!this.props.ButtonGroupState) && this.props.handleServiceBotton(actions, true)

      if (
        ServiceGetData &&
        (!this.props.ButtonGroupState || !this.props.ErrState)
      ) {
        this.props.handleServiceBotton(actions, true, true);
      }
    } else {
      // ServiceGetData && (this.props.ButtonGroupState) && this.props.handleServiceBotton(actions, false)

      if (
        ServiceGetData &&
        (this.props.ButtonGroupState || this.props.ErrState)
      ) {
        this.props.handleServiceBotton(actions, false, false);
      }
    }

    return (
      <Result
        type="success"
        title={
          appDetail.service_source == "third_party"
            ? "第三方组件检测通过"
            : "组件构建源检测通过"
        }
        description={
          appDetail.service_source == "third_party" ? (
            ""
          ) : (
            <div>
              <div>
                组件构建源检测通过仅代表平台可以检测到代码语言类型和代码源。
              </div>
              90%以上的用户在检测通过后可部署成功，如遇部署失败，可参考{" "}
              <a
                href="http://www.rainbond.com/docs/user-manual/app-creation/language-support/"
                target="_blank"
              >
                Rainbond源码支持规范
              </a>{" "}
              对代码进行调整。
            </div>
          )
        }
        extra={extra}
        actions={ServiceGetData ? "" : actions}
        style={{ marginTop: 48, marginBottom: 16 }}
      />
    );
  };

  renderMoreService = () => {
    const { ServiceGetData, is_deploy, appDetail, is_multi } = this.state;
    const serviceInfo = this.state.serviceInfo;
    const { rainbondInfo } = this.props;
    const extra =
      serviceInfo && serviceInfo.length > 0
        ? serviceInfo.map(item => (
            <div
              style={{
                marginBottom: 16
              }}
            >
              {this.renderSuccessInfo(item)}
            </div>
          ))
        : "";

    let actions = [];
    ServiceGetData && is_multi
      ? (actions = [
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button onClick={this.showDelete} type="default">
              {" "}
              放弃创建{" "}
            </Button>
            <Button type="primary" onClick={this.handleMoreService}>
              进入多组件构建
            </Button>
          </div>
        ])
      : ServiceGetData
      ? (actions = [
          <div style={{ display: "flex" }}>
            <Button
              onClick={this.showDelete}
              type="default"
              style={{ marginRight: "8px" }}
            >
              {" "}
              放弃创建{" "}
            </Button>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Button
                onClick={this.handleBuild}
                type="primary"
                style={{ marginRight: "8px" }}
                loading={this.state.buildAppLoading}
              >
                {" "}
                创建{" "}
              </Button>
              <div>
                <Tooltip
                  placement="topLeft"
                  title={
                    <p>
                      取消本选项你可以先对组件进行
                      <br />
                      高级设置再构建启动。
                    </p>
                  }
                >
                  <Radio
                    size="small"
                    onClick={this.renderSuccessOnChange}
                    checked={is_deploy}
                  >
                    并构建启动
                  </Radio>
                </Tooltip>
              </div>
            </div>
          </div>
        ])
      : appDetail.service_source == "third_party"
      ? (actions = [
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Button
                onClick={this.handleBuild}
                type="primary"
                style={{ marginRight: "8px" }}
                loading={this.state.buildAppLoading}
              >
                {" "}
                放弃创建{" "}
              </Button>
              <Button type="primary" onClick={this.handleMoreService}>
                进入多组件构建
              </Button>
            </div>
          </div>
        ])
      : (actions = [
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button onClick={this.showDelete} type="default">
              {" "}
              放弃创建{" "}
            </Button>
            <Button type="primary" onClick={this.handleMoreService}>
              进入多服务构建
            </Button>
          </div>
        ]);
    if (appDetail.service_source == "third_party") {
      actions = [
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Button
              onClick={this.handleBuild}
              type="primary"
              style={{ marginRight: "8px" }}
              loading={this.state.buildAppLoading}
            >
              {" "}
              创建{" "}
            </Button>
          </div>
        </div>
      ];
    }

    if (is_deploy) {
      ServiceGetData &&
        !this.props.ButtonGroupState &&
        this.props.handleServiceBotton(actions, true);
    } else {
      ServiceGetData &&
        this.props.ButtonGroupState &&
        this.props.handleServiceBotton(actions, false);
    }

    return (
      <Result
        type="success"
        title={
          appDetail.service_source == "third_party"
            ? "第三方组件检测通过"
            : "组件构建源检测出多模块构建"
        }
        description={
          appDetail.service_source == "third_party" ? (
            ""
          ) : (
            <div>
              <div>组件构建源检测通过仅代表平台可以检测到多模块构建。</div>
              90%以上的用户在检测通过后可部署成功，如遇部署失败，可参考{" "}
              <a
                href="http://www.rainbond.com/docs/user-manual/app-creation/language-support/"
                target="_blank"
              >
                Rainbond源码支持规范
              </a>{" "}
              对代码进行调整。
            </div>
          )
        }
        extra={""}
        actions={ServiceGetData ? "" : actions}
        style={{ marginTop: 48, marginBottom: 16 }}
      />
    );
  };

  renderChecking = () => {
    const { ServiceGetData } = this.state;
    const actions = (
      <Button onClick={this.showDelete} type="default">
        放弃创建
      </Button>
    );
    ServiceGetData &&
      this.props.ButtonGroupState &&
      this.props.handleServiceBotton(actions, false);

    const extra = (
      <div>
        {this.state.eventId && (
          <LogProcress
            opened={true}
            socketUrl={this.socketUrl}
            eventId={this.state.eventId}
          />
        )}
      </div>
    );
    return (
      <Result
        type="ing"
        title="组件构建源检测中..."
        extra={extra}
        description="此过程可能比较耗时，请耐心等待"
        actions={ServiceGetData ? "" : actions}
        style={{
          marginTop: 48,
          marginBottom: 16
        }}
      />
    );
  };

  renderEdit = () => {
    // 判断应用创建方式
    const appDetail = this.state.appDetail;
    // 源码创建
    if (appDetail.service_source === "source_code") {
      // 指定源码
      if (appDetail.code_from === "gitlab_manual") {
        return (
          <EditCreateCodeCustom
            data={appDetail}
            onSubmit={this.handleCodeSubmit}
            onCancel={this.handleCancelEdit}
          />
        );
      }
      ServiceGetData &&
        this.props.ButtonGroupState &&
        this.props.handleServiceBotton(actions, false);

      const extra = (
        <div>
          {this.state.eventId && (
            <LogProcress
              socketUrl={this.socketUrl}
              eventId={this.state.eventId}
            />
          )}
        </div>
      );
      return (
        <Result
          type="ing"
          title="组件构建源检测中..."
          extra={extra}
          description="此过程可能比较耗时，请耐心等待"
          actions={ServiceGetData ? "" : actions}
          style={{
            marginTop: 48,
            marginBottom: 16
          }}
        />
      );
    }
  };
  render() {
    const { status, is_multi, appDetail } = this.state;
    const { ServiceGetData } = this.state;
    return (
      <div>
        {ServiceGetData ? (
          <div>
            <Card bordered={false}>
              <div
                style={{
                  minHeight: 400
                }}
              >
                {status === "checking" ? this.renderChecking() : null}
                {status === "success" && is_multi != true
                  ? this.renderSuccess()
                  : null}
                {status === "success" && is_multi == true
                  ? this.renderMoreService()
                  : null}
                {status === "failure" ? this.renderError() : null}
              </div>
            </Card>

            {this.state.modifyUrl ? (
              <ModifyUrl
                data={appDetail}
                onSubmit={this.handleModifyUrl}
                onCancel={this.cancelModifyUrl}
              />
            ) : null}

            {this.state.modifyImageName ? (
              <ModifyImageName
                data={appDetail}
                onSubmit={this.handleModifyImageName}
                onCancel={this.cancelModifyImageName}
              />
            ) : null}
            {this.state.modifyImageCmd ? (
              <ModifyImageCmd
                data={appDetail}
                onSubmit={this.handleModifyImageCmd}
                onCancel={this.cancelModifyImageCmd}
              />
            ) : null}

            {this.state.modifyUserpass ? (
              <ModifyUrl
                showUsernameAndPass
                data={appDetail}
                onSubmit={this.handleModifyUserpass}
                onCancel={this.cancelModifyUserpass}
              />
            ) : null}
            {this.state.showKey ? (
              <ShowRegionKey onCancel={this.handleCancelShowKey} />
            ) : null}
            {this.state.showDelete && (
              <ConfirmModal
                onOk={this.handleDelete}
                title="放弃创建"
                subDesc="此操作不可恢复"
                desc="确定要放弃创建此组件吗？"
                onCancel={() => {
                  this.setState({ showDelete: false });
                }}
              />
            )}
          </div>
        ) : (
          <PageHeaderLayout>
            <Card bordered={false}>
              <div
                style={{
                  minHeight: 400
                }}
              >
                {status === "checking" ? this.renderChecking() : null}
                {status === "success" && is_multi != true
                  ? this.renderSuccess()
                  : null}
                {status === "success" && is_multi == true
                  ? this.renderMoreService()
                  : null}
                {status === "failure" ? this.renderError() : null}
              </div>
            </Card>

            {this.state.modifyUrl ? (
              <ModifyUrl
                data={appDetail}
                onSubmit={this.handleModifyUrl}
                onCancel={this.cancelModifyUrl}
              />
            ) : null}

            {this.state.modifyImageName ? (
              <ModifyImageName
                data={appDetail}
                onSubmit={this.handleModifyImageName}
                onCancel={this.cancelModifyImageName}
              />
            ) : null}
            {this.state.modifyImageCmd ? (
              <ModifyImageCmd
                data={appDetail}
                onSubmit={this.handleModifyImageCmd}
                onCancel={this.cancelModifyImageCmd}
              />
            ) : null}

            {this.state.modifyUserpass ? (
              <ModifyUrl
                showUsernameAndPass
                data={appDetail}
                onSubmit={this.handleModifyUserpass}
                onCancel={this.cancelModifyUserpass}
              />
            ) : null}
            {this.state.showKey ? (
              <ShowRegionKey onCancel={this.handleCancelShowKey} />
            ) : null}
            {this.state.showDelete && (
              <ConfirmModal
                onOk={this.handleDelete}
                title="放弃创建"
                subDesc="此操作不可恢复"
                desc="确定要放弃创建此组件吗？"
                onCancel={() => {
                  this.setState({ showDelete: false });
                }}
              />
            )}
          </PageHeaderLayout>
        )}
      </div>
    );
  }
}
