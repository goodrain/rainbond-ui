import React, { PureComponent } from "react";
import { Button, Icon, Card, Modal, Switch, Radio } from "antd";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import Result from "../../components/Result";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import ConfirmModal from "../../components/ConfirmModal";
import {
  getCreateCheckId,
  getCreateCheckResult,
  buildApp,
  getCheckuuid,
} from "../../services/createApp";
import globalUtil from "../../utils/global";
import LogProcress from "../../components/LogProcress";
import userUtil from "../../utils/user";
import regionUtil from "../../utils/region";
import ShowRegionKey from "../../components/ShowRegionKey";
import ModifyImageCmd from "./modify-image-cmd";
import ModifyImageName from "./modify-image-name";
import ModifyUrl from "./modify-url";

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

@connect(({ user }) => ({ currUser: user.currentUser }))
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
      is_deploy:true,
      GihubGetData: props.GihubGetData ? props.GihubGetData : null
    };
    this.mount = false;
    this.socketUrl = "";
    const teamName = globalUtil.getCurrTeamName();
    const regionName = globalUtil.getCurrRegionName();
    const region = userUtil.hasTeamAndRegion(this.props.currUser, teamName, regionName);
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
        app_alias: this.getAppAlias(),
      },
      callback: (appDetail) => {
        this.setState({ appDetail: appDetail.service });
        this.getCheckuuid();
      },
    });
  };
  getCheckuuid = () => {
    const appAlias = this.getAppAlias();
    const team_name = globalUtil.getCurrTeamName();
    getCheckuuid({ team_name, app_alias: appAlias }).then((data) => {
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
    const { GihubGetData } = this.state;
    return GihubGetData ? GihubGetData : this.props.match.params.appAlias;
  }
  loopStatus = () => {
    if (!this.mount) return;
    const appAlias = this.getAppAlias();
    const team_name = globalUtil.getCurrTeamName();
    getCreateCheckResult({
      team_name,
      app_alias: appAlias,
      check_uuid: this.state.check_uuid,
    })
      .then((data) => {
        if (data && this.mount) {
          const status = data.bean.check_status;
          const error_infos = data.bean.error_infos || [];
          const serviceInfo = data.bean.service_info || [];
          this.setState({ status, errorInfo: error_infos, serviceInfo });
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
  startCheck = (loopStatus) => {
    const appAlias = this.getAppAlias();
    const team_name = globalUtil.getCurrTeamName();
    const p = getCreateCheckId(
      {
        team_name,
        app_alias: appAlias,
      },
      (res) => {
        if (res.status === 404) {
          this.props.dispatch(routerRedux.replace(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/exception/404`));
        }
      },
    ).then((data) => {
      if (data) {
        this.state.check_uuid = data.bean.check_uuid;
        this.setState({ eventId: data.bean.check_event_id, appDetail: data.bean });
        if (loopStatus !== false) {
          this.loopStatus();
        }
      }
    });
  };
  handleCreate = () => { };
  handleSetting = () => {
    const appAlias = this.getAppAlias();
    this.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/create/create-setting/${appAlias}`));
  };
  handleBuild = () => {
    const appAlias = this.getAppAlias();
    const team_name = globalUtil.getCurrTeamName();
    const {is_deploy}=this.state;
    buildApp({ team_name, app_alias: appAlias }).then((data) => {
      if (data) {
        const appAlias = this.getAppAlias();
        this.props.dispatch({
          type: "global/fetchGroups",
          payload: {
            team_name,
            is_deploy//默认true
          },
        });
        this.props.dispatch(routerRedux.push(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/app/${appAlias}/overview`));
      }
    });
  };
  recheck = () => {
    this.setState(
      {
        status: "checking",
      },
      () => {
        this.startCheck();
      },
    );
  };
  cancelModifyImageName = () => {
    this.setState({ modifyImageName: false });
  };
  cancelModifyImageCmd = () => {
    this.setState({ modifyImageCmd: false });
  };
  handleClick = (e) => {
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
          this.setState({ modifyImageName: true });
          return;
        }
        // docker_run命令
        if (appDetail.service_source === "docker_run") {
          this.setState({ modifyImageCmd: true });
          return;
        }
      }

      parent = parent.parentNode;
    }
  };
  handleDelete = () => {
    const appAlias = this.getAppAlias();
    const { GihubGetData } = this.state;
    this.props.dispatch({
      type: "appControl/deleteApp",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias,
        is_force: true,
      },
      callback: () => {
        GihubGetData ? this.props.handleGihubState(true, null, null) :
          this.props.dispatch(routerRedux.replace(`/team/${globalUtil.getCurrTeamName()}/region/${globalUtil.getCurrRegionName()}/index`));
      },
    });
  };
  cancelModifyUrl = () => {
    this.setState({ modifyUrl: false });
  };
  handleCancelEdit = () => {
    this.setState({ showEdit: false });
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
  handleModifyUserpass = (values) => {
    const appDetail = this.state.appDetail;
    this.props.dispatch({
      type: "appControl/editAppCreateInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail.service_alias,
        user_name: values.user_name,
        password: values.password,
      },
      callback: (data) => {
        if (data) {
          this.startCheck(false);
          this.cancelModifyUserpass();
        }
      },
    });
  };
  handleModifyUrl = (values) => {
    const appDetail = this.state.appDetail;
    this.props.dispatch({
      type: "appControl/editAppCreateInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail.service_alias,
        git_url: values.git_url,
      },
      callback: (data) => {
        if (data) {
          this.startCheck(false);
          this.handleCancelEdit();
        }
      },
    });
  };
  handleModifyImageName = (values) => {
    const appDetail = this.state.appDetail;
    this.props.dispatch({
      type: "appControl/editAppCreateInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail.service_alias,
        docker_cmd: values.docker_cmd,
      },
      callback: (data) => {
        if (data) {
          this.startCheck(false);
          this.cancelModifyImageName();
        }
      },
    });
  };
  handleModifyImageCmd = (values) => {
    const appDetail = this.state.appDetail;
    this.props.dispatch({
      type: "appControl/editAppCreateInfo",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appDetail.service_alias,
        docker_cmd: values.docker_cmd,
      },
      callback: (data) => {
        if (data) {
          this.cancelModifyImageCmd();
        }
      },
    });
  };
  handleImageSubmit = () => { };
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
              marginBottom: 16,
            }}
          >
            <Icon
              style={{
                color: "#f5222d",
                marginRight: 8,
              }}
              type="close-circle-o"
            />
            <span
              dangerouslySetInnerHTML={{
                __html: `<span>${item.error_info || ""} ${item.solve_advice || ""}</span>`,
              }}
            />
          </div>
        ))}
      </div>
    );
    const actions = [
      <Button onClick={this.showDelete} type="default">
        {" "}
        放弃创建{" "}
      </Button>,
      <Button onClick={this.recheck} type="primary">
        重新检测
      </Button>,
    ];

    return (
      <Result
        type="error"
        title="应用检测未通过"
        description="请核对并修改以下信息后，再重新检测。"
        extra={extra}
        actions={actions}
        style={{
          marginTop: 48,
          marginBottom: 16,
        }}
      />
    );
  };

  renderSuccessInfo = (item) => {
    if (typeof item.value === "string") {
      return (
        <div>
          <span
            style={{
              verticalAlign: "top",
              display: "inline-block",
              fontWeight: "bold",
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
            fontWeight: "bold",
          }}
        >
          {item.key}：
        </span>
        <div
          style={{
            display: "inline-block",
          }}
        >
          {(item.value || []).map(item => (
            <p
              style={{
                marginBottom: 0,
              }}
            >
              {item}
            </p>
          ))}
        </div>
      </div>
    );
  };

  renderSuccessOnChange=(e)=> {
    this.setState({
      is_deploy:e.target.value==1?true:false
    })
  }

  renderSuccess = () => {
    const { GihubGetData } = this.state;

    const serviceInfo = this.state.serviceInfo;
    const extra = (
      <div>
        {serviceInfo.map(item => (
          <div
            style={{
              marginBottom: 16,
            }}
          >
            {this.renderSuccessInfo(item)}
          </div>
        ))}
      </div>
    );
    let actions = []
    GihubGetData ?
      actions = [
        <div style={{ display: 'flex', justifyContent: "space-around" }}>
          <div style={{ display: 'flex'}}>
            <Button onClick={this.handleBuild} type="primary" size="large">
              {" "}创建{" "}
            </Button>
            <RadioGroup onChange={this.renderSuccessOnChange} defaultValue={1} size="small">
              <div><Radio value={1}>构建应用并部署</Radio></div>
              <div><Radio value={2}>构建应用不部署</Radio></div>
            </RadioGroup>
          </div>
          <Button onClick={this.showDelete} type="default" size="large">
            {" "}
            放弃创建{" "}
          </Button>
        </div>,
      ] : actions = [
        <Button onClick={this.handleBuild} type="primary">
          {" "}
          构建应用{" "}
        </Button>,

        <Button type="default" onClick={this.handleSetting}>
          高级设置
      </Button>,
        <Button onClick={this.showDelete} type="default">
          {" "}
          放弃创建{" "}
        </Button>,
      ];
    return (
      <Result
        type="success"
        title="应用检测通过"
        description={
          <div>
            <div>应用检测通过仅代表平台可以检测到代码语言类型和代码源。</div>
            90%以上的用户在检测通过后可部署成功，如遇部署失败，可参考{" "}
            <a
              href="http://www.rainbond.com/docs/stable/user-manual/create-an-app.html"
              target="_blank"
            >
              rainbond文档
            </a>{" "}
            对代码包进行调整。
          </div>
        }
        extra={extra}
        actions={actions}
        style={{ marginTop: 48, marginBottom: 16 }}
      />
    );
  };
  renderChecking = () => {
    const actions = (
      <Button onClick={this.showDelete} type="default">
        放弃创建
      </Button>
    );

    const extra = (
      <div>
        {this.state.eventId && (
          <LogProcress socketUrl={this.socketUrl} eventId={this.state.eventId} />
        )}
      </div>
    );
    return (
      <Result
        type="ing"
        title="应用检测中..."
        extra={extra}
        description="此过程可能比较耗时，请耐心等待"
        actions={actions}
        style={{
          marginTop: 48,
          marginBottom: 16,
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
      // 源码demo
      if (appDetail.code_from === "gitlab_demo") {
      }
      // 好雨git仓库
      if (appDetail.code_from === "gitlab_exit") {
      }
      // github项目
      if (appDetail.code_from === "github") {
      }
    }

    // compose创建
    if (appDetail.service_source === "docker_compose") {
    }
    return null;
  };
  render() {
    const status = this.state.status;
    const appDetail = this.state.appDetail;
    const { GihubGetData } = this.state;
    return (
      <PageHeaderLayout GihubGetData={GihubGetData}>
        <Card bordered={false}>
          <div
            style={{
              minHeight: 400,
            }}
          >
            {status === "checking" ? this.renderChecking() : null}
            {status === "success" ? this.renderSuccess() : null}
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
            data={{
              docker_cmd: appDetail.docker_cmd,
            }}
            onSubmit={this.handleModifyImageName}
            onCancel={this.cancelModifyImageName}
          />
        ) : null}
        {this.state.modifyImageCmd ? (
          <ModifyImageCmd
            data={{
              docker_cmd: appDetail.docker_cmd,
            }}
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
        {this.state.showKey ? <ShowRegionKey onCancel={this.handleCancelShowKey} /> : null}
        {this.state.showDelete && (
          <ConfirmModal
            onOk={this.handleDelete}
            title="放弃创建"
            subDesc="此操作不可恢复"
            desc="确定要放弃创建此应用吗？"
            onCancel={() => {
              this.setState({ showDelete: false });
            }}
          />
        )}
      </PageHeaderLayout>
    );
  }
}
