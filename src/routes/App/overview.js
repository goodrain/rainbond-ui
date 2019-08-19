import React, { PureComponent, Fragment } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { connect } from "dva";
import {
  ChartCard,
  yuan,
  MiniArea,
  MiniBar,
  MiniProgress,
  Field,
  Bar,
  Pie,
  TimelineChart,
} from "../../components/Charts";
import numeral from "numeral";
import { Link, Switch, Route } from "dva/router";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Icon,
  Menu,
  Dropdown,
  Progress,
  Tooltip,
  Affix,
  Table
} from "antd";
import PageHeaderLayout from "../../layouts/PageHeaderLayout";
import { getRoutes } from "../../utils/utils";
import appAcionLogUtil from "../../utils/app-action-log-util";
import dateUtil from "../../utils/date-util";
import { getRouterData } from "../../common/router";
import { getActionLog, getActionLogDetail } from "../../services/app";
import LogSocket from "../../utils/logSocket";

import StatusIcon from "../../components/StatusIcon";

import LogProcress from "../../components/LogProcress";
import styles from "./Index.less";
import globalUtil from "../../utils/global";
import appUtil from "../../utils/app";
import userUtil from "../../utils/user";
import teamUtil from "../../utils/team";
import regionUtil from "../../utils/region";
import monitorDataUtil from "../../utils/monitorDataUtil";
import AppVersionManage from "../../components/AppVersionManage";
import Run from "../../../public/images/run.png";
import Down from "../../../public/images/down.png";
import Abnormal from "../../../public/images/abnormal.png";

const ButtonGroup = Button.Group;

@connect(({ user, appControl }) => ({ currUser: user.currentUser, appDetail: appControl.appDetail }))
class LogItem extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      status: "",
      resultStatus: "",
      opened: false,
      logType: "info",
      logs: [],
      actioning: false,
    };
  }
  static contextTypes = {
    isActionIng: PropTypes.func,
    appRolback: PropTypes.func,
  }
  showLogType = () => {
    if (this.state.status === "ing") {
      return "none";
    }

    if (this.state.opened === false) {
      return "none";
    }
    return "";
  }
  shouldComponentUpdate() {
    return true
  }
  componentDidMount() {
    const { data } = this.props;
    if (data) {
      if (this.ref) {
        this.ref.querySelector(".actioncn").innerHTML = (appAcionLogUtil.getActionCN(data));
        if (appAcionLogUtil.isSuccess(data)) {
          this.onSuccess();
        }
        if (appAcionLogUtil.isFail(data)) {
          this.onFail(data);
        }
        if (appAcionLogUtil.isTimeout(data)) {
          this.onTimeout(data);
        }
        if (appAcionLogUtil.isActioning(data)) {
          this.setState({ status: "ing", actioning: true });
          this.ref.querySelector(".actionresultcn").innerHTML = "进行中";
          this.context.isActionIng(true);
        }
        this.ref.querySelector(".action-user").innerHTML = "@" + appAcionLogUtil.getActionUser(data);
      }
    }
  }


  loadLog() {
    getActionLogDetail({
      app_alias: this.props.appAlias,
      level: this.state.logType,
      team_name: globalUtil.getCurrTeamName(),
      event_id: this.props.data.event_id,
    }).then((data) => {
      if (data) {
        this.setState({
          // logs: (data.list || []).reverse(),
          logs: (data.list || []),
        });
      }
    });
  }
  getSocketUrl = () => {
    let currTeam = userUtil.getTeamByTeamName(this.props.currUser, globalUtil.getCurrTeamName());
    let currRegionName = globalUtil.getCurrRegionName();

    if (currTeam) {
      let region = teamUtil.getRegionByName(currTeam, currRegionName);

      if (region) {
        return regionUtil.getEventWebSocketUrl(region);
      }
    }
    return "";
  }
  createSocket() {
    const { socketUrl, data } = this.props;
    let slef = this;
    this.socket = new LogSocket({
      url: this.getSocketUrl(),
      eventId: data.event_id,
      onMessage: (data) => {
        let logs = this.state.logs;
        logs.unshift(data);
        this.setState({
          logs: [].concat(logs),
        });
      },
    });
  }
  onClose = () => {
    this.isDoing = false;
  }
  onSuccess = (data) => {
    this.setState({ resultStatus: "success" });
    this
      .ref
      .querySelector(".actionresultcn")
      .innerHTML = "完成";
  }
  onTimeout = (data) => {
    this.setState({ resultStatus: "timeout" });
    this
      .ref
      .querySelector(".actionresultcn")
      .innerHTML = "超时";

    this
      .ref
      .querySelector(".action-error-msg")
      .innerHTML = "(" + appAcionLogUtil.getFailMessage(data) + ")";
  }
  onFail = (data) => {
    this.setState({ resultStatus: "fail" });
    this
      .ref
      .querySelector(".actionresultcn")
      .innerHTML = "失败";

    this
      .ref
      .querySelector(".action-error-msg")
      .innerHTML = "(" + appAcionLogUtil.getFailMessage(data) + ")";
  }
  onComplete = (data) => {
    this.setState({ status: "" });
    this
      .context
      .isActionIng(false);
    this.close();
  }
  getLogContHeight() {
    const { status, opened } = this.state;
    if (status === "ing" && !opened) {
      return 15;
    }

    if (opened) {
      return "auto";
    }

    return 0;
  }
  open = () => {
    this.setState({
      opened: true,
      logType: "info",
    }, () => {
      this.loadLog();
    });
  }
  close = () => {
    this.setState({ opened: false });
  }
  changeLogType = (type) => {
    if (type === this.state.logType) { return; }
    this.setState({
      logType: type,
      logs: []
    }, () => {
      this.loadLog();
    });
  }
  saveRef = (ref) => {
    this.ref = ref;
  }
  getResultClass() {
    const { data } = this.props;
    if (this.state.resultStatus === "fail") {
      return styles.fail;
    }

    if (this.state.resultStatus === "success") {
      return styles.success;
    }
    return "";
  }
  handleRollback = () => {
    this
      .context
      .appRolback(appAcionLogUtil.getRollbackVersion(this.props.data));
  }
  render() {
    const { status, opened, logType, logs } = this.state;
    const { data } = this.props;
    const box = document.getElementById("box")
    if (!data) {
      return null;
    }

    return (
      <div
        ref={this.saveRef}
        className={`${styles.logItem} ${this.getResultClass()}`}
      >
        <div className={styles.logItemDate}>
          <span className={styles.time}>{appAcionLogUtil.getActionTime(data)}</span>
          <span className={styles.date}>{dateUtil.dateToCN(appAcionLogUtil.getActionDateTime(data), "yyyy-MM-dd")}</span>
        </div>
        <div className={styles.logItemMain}>
          <div className={styles.hd}>
            <label className={styles.tit}>
              <span className="actioncn" />
              <span className="actionresultcn" />
              <span className="action-error-msg" />
              <span className="action-user" />
            </label>
            <div className={styles.btns}>
              {appAcionLogUtil.canRollback(data) && appUtil.canRollback(this.props.appDetail)
                ? <span onClick={this.handleRollback} className={styles.btn}>回滚到此版本</span>
                : ""
              }
              {!opened
                ? <span onClick={this.open} className={styles.btn}>查看详情</span>
                : <span onClick={this.close} className={styles.btn}>收起</span>}
            </div>
          </div>
          {appAcionLogUtil.isShowCommitInfo(data)
            ? <div className={styles.codeVersion}>
              <div className={styles.versionInfo}>代码信息： {appAcionLogUtil.getCommitLog(data)}</div>
              <div className={styles.versionAuthor}>#{appAcionLogUtil.getCodeVersion(data)}
                by {appAcionLogUtil.getCommitUser(data)}
              </div>
            </div>
            : ""
          }

          <ButtonGroup
            style={{
              display: this.showLogType(),
            }}
            size="small"
            className={styles.logTypeBtn}
          >
            <Button
              onClick={() => {
                this.changeLogType("info");
              }}
              className={logType === "info"
                ? "active"
                : ""}
              type="dashed"
            >Info日志
            </Button>
            <Button
              onClick={() => {
                this.changeLogType("debug");
              }}
              className={logType === "debug"
                ? "active"
                : ""}
              type="dashed"
            >Debug日志
            </Button>
            <Button
              onClick={() => {
                this.changeLogType("error");
              }}
              className={logType === "error"
                ? "active"
                : ""}
              type="dashed"
            >Error日志
            </Button>
          </ButtonGroup>
          <div
            style={{
              height: this.getLogContHeight(),
              maxHeight: 350,
              overflowY: "auto",
            }}
            className={`${styles.logContent} logs-cont`}
          >
            {/* 动态日志 */}
            {status === "ing" ? <LogProcress
              resover
              onClose={this.onClose}
              onComplete={this.onComplete}
              onSuccess={this.onSuccess}
              onTimeout={this.onTimeout}
              onFail={this.onFail}
              socketUrl={this.getSocketUrl()}
              eventId={data.event_id}
              opened={opened}
              list={this.state.logs}
            /> :
              <div>
                {logs && logs.length > 0 && logs.map((item, index) => <p key={index}>
                  <span style={{
                    marginRight: 10
                  }}>{dateUtil.format(item.time, 'hh:mm:ss')}</span>
                  <span>{item.message}</span>
                </p>)
                }
              </div>}

          </div>
        </div>
      </div>
    );
  }
}

class LogList extends PureComponent {
  render() {
    const list = this.props.list;
    return (
      <div className={styles.logs}>
        {list.map((item) => (<LogItem appDetail={this.props.appDetail} key={item.event_id} appAlias={this.props.appAlias} data={item} />))
        }
      </div>
    );
  }
}

@connect(({ user, appControl }) => ({
  currUser: user.currentUser,
  appRequest: appControl.appRequest,
  appRequestRange: appControl.appRequestRange,
  requestTime: appControl.requestTime,
  requestTimeRange: appControl.requestTimeRange,
  appDisk: appControl.appDisk,
  appMemory: appControl.appMemory,
}), null, null, { withRef: true })
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      actionIng: false,
      logList: [],
      page: 1,
      page_size: 6,
      hasNext: false,
      // 安装的性能分析插件
      anaPlugins: [],
      disk: 0,
      memory: 0,
      showVersionManage: false,
      showUpgrade: false,
      beanData: null,
      dataList: [],
      new_pods: null,
      old_pods: null
    };
    this.inerval = 5000;
  }
  static contextTypes = {
    isActionIng: PropTypes.func,
    appRolback: PropTypes.func,
  }
  componentDidMount() {
    const { dispatch, appAlias } = this.props;
    this.loadLog();
    this.mounted = true;
    this.getAnalyzePlugins();
    this.fetchAppDiskAndMemory();
    this.getVersionList();
    this.fetchPods();
  }
  componentWillUnmount() {
    this.mounted = false;
    this
      .props
      .dispatch({ type: "appControl/clearDisk" });
    this
      .props
      .dispatch({ type: "appControl/clearMemory" });
    this
      .props
      .dispatch({ type: "appControl/clearRequestTime" });
    this
      .props
      .dispatch({ type: "appControl/clearRequestTimeRange" });
    this
      .props
      .dispatch({ type: "appControl/clearRequest" });
    this
      .props
      .dispatch({ type: "appControl/clearRequestRange" });
  }
  getAnalyzePlugins() {
    this
      .props
      .dispatch({
        type: "appControl/getAnalyzePlugins",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
        },
        callback: (data) => {
          const list = data && data.list || [];
          if (list && list.length) {
            this.setState({ anaPlugins: list });
            this.fetchRequestTime();
            this.fetchRequestTimeRange();
            this.fetchRequest();
            this.fetchRequestRange();
          }
        },
      });
  }
  fetchAppDiskAndMemory() {
    this
      .props
      .dispatch({
        type: "appControl/getAppResource",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
        },
        callback: (data) => {
          if (data && data.bean) {
            this.setState({ disk: data.bean.disk || 0, memory: data.bean.memory || 0 });
          }
        },
      });
  }
  fetchRequestTime() {
    if (!this.mounted) { return; }
    this
      .props
      .dispatch({
        type: "appControl/fetchRequestTime",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          serviceId: this.props.appDetail.service.service_id,
        },
        complete: () => {
          if (this.mounted) {
            setTimeout(() => {
              this.fetchRequestTime();
            }, this.inerval);
          }
        },
      });
  }
  fetchRequestTimeRange() {
    if (!this.mounted) { return; }
    this
      .props
      .dispatch({
        type: "appControl/fetchRequestTimeRange",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          start: this.getStartTime(),
          serviceId: this.props.appDetail.service.service_id,
          step: this.getStep(),
        },
        complete: () => {
          if (this.mounted) {
            setTimeout(() => {
              this.fetchRequestTimeRange();
            }, this.inerval);
          }
        },
      });
  }
  fetchRequest() {
    if (!this.mounted) { return; }
    this
      .props
      .dispatch({
        type: "appControl/fetchRequest",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          serviceId: this.props.appDetail.service.service_id,
        },
        complete: () => {
          if (this.mounted) {
            setTimeout(() => {
              this.fetchRequest();
            }, this.inerval);
          }
        },
      });
  }
  fetchRequestRange() {
    if (!this.mounted) { return; }
    this
      .props
      .dispatch({
        type: "appControl/fetchRequestRange",
        payload: {
          team_name: globalUtil.getCurrTeamName(),
          app_alias: this.props.appAlias,
          start: this.getStartTime(),
          serviceId: this.props.appDetail.service.service_id,
          step: this.getStep(),
        },
        complete: () => {
          if (this.mounted) {
            setTimeout(() => {
              this.fetchRequestRange();
            }, this.inerval);
          }
        },
      });
  }

  loadLog = (append) => {
    const { dispatch, appAlias } = this.props;
    getActionLog({
      app_alias: appAlias,
      page: this.state.page,
      page_size: this.state.page_size,
      start_time: "",
      team_name: globalUtil.getCurrTeamName(),
    }).then((data) => {
      if (data) {
        if (!append) {
          this.setState({
            hasNext: data.has_next,
            logList: (data.list || []),
          });
        } else {
          this.setState({
            hasNext: data.has_next,
            logList: (this.state.logList).concat(data.list || []),
          });
        }
      }
    });
  }
  onAction = (actionLog) => {
    this.setState({
      logList: [actionLog].concat(this.state.logList),
      showUpgrade: true
    });
  }
  handleNextPage = () => {
    this.setState({
      page: this.state.page + 1,
    }, () => {
      this.loadLog(true);
    });
  }
  getStartTime() {
    return (new Date().getTime() / 1000) - (60 * 60);
  }
  getStep() {
    return 60;
  }
  showVersionManage = () => {
    this.setState({ showVersionManage: true });
  }
  hideVersionManage = () => {
    this.setState({ showVersionManage: false });
  }
  handleRollback = (data) => {
    this
      .context
      .appRolback(data);
  }

  onPageChange = (page) => {

  };

  getVersionList = update => {
    update && this.props.setShowUpgrade();
    this.props.dispatch({
      type: "appControl/getAppVersionList",
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        service_alias: this.props.appAlias,
        page_num: 1,
        page_size: 10,
      },
      callback: data => {
        if (data && data.bean && data.list) {
          let beanobj = null;
          data.list && data.list.length > 0 && data.list.map((item) => {
            if (item.build_version === data.bean.current_version) {
              beanobj = item;
            }
          })
          this.setState({
            beanData: beanobj,
            dataList: data.list
          });
        }
      }
    });
  };

  fetchPods = () => {
    const { appAlias, dispatch } = this.props;
    dispatch({
      type: 'appControl/fetchPods',
      payload: {
        team_name: globalUtil.getCurrTeamName(),
        app_alias: appAlias
      },
      callback: data => {
        if (data && data.list) {
          this.setState({
            new_pods: data.list.new_pods,
            old_pods: data.list.old_pods
          })
        }
      }
    })
  }



  render() {
    const topColResponsiveProps = {
      xs: 24,
      sm: 12,
      md: 12,
      lg: 12,
      xl: 6,
      style: {
        marginBottom: 24,
      },
    };
    const { logList, hasNext, anaPlugins, opened, showUpgrade, memory, beanData, dataList, new_pods } = this.state;
    const { appDetail, status } = this.props;
    let hasAnaPlugins = !!anaPlugins.length;
    console.log('new_pods', new_pods)
    return (
      <Fragment>
        <Row gutter={24}>
          <Col xs={24} xm={24} md={24} lg={24} xl={24}>
            <div className={styles.buildBox}>
              <div className={styles.buildContent}>
                <div className={styles.buildLeftBox}>
                  <h2 className={styles.buildState}>{status && status.status_cn || "-"}</h2>
                  <div className={styles.buildCommitInfo}>
                    <ul className={styles.buildInfo}>
                      <li>
                        <a target='_blank'>
                          <svg t="1565779224563" className={styles.icon} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1204" width="16" height="16"><path d="M510.138182 143.592727h-3.258182A365.149091 365.149091 0 0 0 139.636364 513.163636a380.509091 380.509091 0 0 0 376.087272 375.156364h3.490909A365.149091 365.149091 0 0 0 884.363636 518.749091 379.810909 379.810909 0 0 0 510.138182 143.592727zM744.727273 748.450909a319.767273 319.767273 0 0 1-229.236364 93.090909A333.730909 333.730909 0 0 1 186.181818 512 318.603636 318.603636 0 0 1 506.88 190.138182h3.025455A333.265455 333.265455 0 0 1 837.818182 518.981818a318.138182 318.138182 0 0 1-93.090909 229.469091z" p-id="1205"></path><path d="M605.090909 535.272727h-93.090909v-186.181818a23.272727 23.272727 0 0 0-46.545455 0v209.454546a23.272727 23.272727 0 0 0 23.272728 23.272727h116.363636a23.272727 23.272727 0 0 0 0-46.545455z" p-id="1206"></path></svg>
                          运行7小时
                          </a>
                      </li>
                      <li>
                        <a target='_blank'>
                          <svg t="1565779336591" className={styles.icon} viewBox="0 0 1099 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1890" width="16" height="16"><path d="M841.66 313.7 676.06 189.2c-3.7-2.8-8.1-4.3-12.7-4.3L277.56 185c-8.5 0-16.7 5.9-16.7 16.8l0 618.8c0 13.9 12 27.2 27.3 27.2l552.2 0c8.8 0 14.8-4.3 14.8-14.2L855.16 330.1C855.06 323.4 847.06 317.7 841.66 313.7zM682.36 257.7l0 124.5c0 4.9-2.4 9.2-7.8 9.2l-262 0c-7.2 0-8.2-3.8-8.2-9.5l0-145.1 248.4 0L682.36 257.7zM804.66 778.6c0 10.7-6.5 18-16.9 18l-461 0c-8.1 0.1-13.5-5.8-13.5-14.5L313.26 248.4c0-7.1 6.6-11.5 15.3-11.5 7.5 0 17 0 27.7 0l0.1 190.4c0 6.9 4.3 10.1 10.8 10.1l346.1-0.1c6.8 0.1 10.7-5 10.5-12.7l0.1-135.2 80.8 60.4L804.66 778.6zM371.56 621.2l188.7 0c6.7 0 11.2-4.3 11.2-10.4 0-5.2 0-20.1 0-25.7 0-6.6-7-10.8-13.2-10.8L370.16 574.3c-7.8 0-11.7 4.9-11.7 10.8 0 6.4 0 21.7 0 25.4C358.46 616.5 363.16 621.2 371.56 621.2zM709.86 574.3l-95 0c-8.2 0-14.1 4.7-14.1 11.3 0 4.7 0 19 0 23.8 0 8.1 6.3 11.9 13.6 11.9l94.3 0c8.4 0 15.2-5.9 15.2-13.2 0-6.2 0-11.8 0-18.9C723.96 581.2 718.46 574.3 709.86 574.3zM480.06 698.5 371.76 698.5c-8.3 0-13.4 4.3-13.4 13.3 0 6 0 12.2 0 17.3 0 8.9 5.4 14.4 13.7 14.4l105.6 0c7.9 0 15.1-5.3 15.1-14 0-6.7 0-11.6 0-16.3C492.76 705 486.06 698.5 480.06 698.5zM709.06 698.5 533.56 698.5c-8.9 0-14.2 6.5-14.2 14.1 0 4.4 0 12.5 0 17.3 0 6.2 5.6 13.6 14.5 13.6l174 0c8.9 0 16-6.3 16-15.4 0-4.1 0-8.7 0-14.9C723.96 704.8 718.66 698.5 709.06 698.5zM627.46 360.4c7.3 0 13.2-6.1 13.2-11.4L640.66 277.4c0-7.4-4.1-11.5-10.3-11.5-5.1 0-24.9 0-29.3 0-6.2 0-9.2 4.5-9.2 11.4l0 71.9c0 6.4 6.3 11.3 11.9 11.3C608.56 360.4 622.06 360.4 627.46 360.4z" p-id="1891"></path></svg>
                          分配   {numeral(this.state.memory).format("0,0")} MB 内存
                          </a>
                      </li>
                      <li>
                        <a target='_blank'>
                          <svg t="1565779448163" className={styles.icon} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2108" width="16" height="16"><path d="M631 117l286 286v504H107V117h524m16.5-40H67v870h890V386.5L647.5 77z m-50 40v248.6H250V117h347.5m40-40H210v328.6h427.5V77zM774 658.4V907H250V658.4h524m40-40H210V947h604V618.4zM360.7 158.1h-40v160h40v-160zM705 718.5H319v40h386v-40z m0 86.2H319v40h386v-40z" fill="" p-id="2109"></path></svg>
                          占用   {numeral(this.state.disk).format("0,0")} MB 磁盘
                          </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className={styles.buildRightBox}>
                  <h2 className={` ${styles.alcen} ${styles.buildState} `}>
                    <svg t="1565853114924" className={styles.icon} viewBox="0 0 1184 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6049" width="16" height="16"><path d="M448.576 576l118.272 0q-8 90.272-56.288 142.016t-122.56 51.712q-92.576 0-145.44-66.272t-52.864-180.576q0-110.848 53.152-178.016t133.152-67.136q84.576 0 132.576 49.728t55.424 141.152l-116 0q-2.848-36.576-20.288-56.576t-46.56-20q-32.576 0-50.56 34.56t-18.016 101.44q0 27.424 2.848 48t10.272 39.712 22.848 29.44 37.728 10.272q54.272 0 62.272-79.424zM855.424 576l117.728 0q-8 90.272-56 142.016t-122.272 51.712q-92.576 0-145.44-66.272t-52.864-180.576q0-110.848 53.152-178.016t133.152-67.136q84.576 0 132.576 49.728t55.424 141.152l-116.576 0q-2.272-36.576-20-56.576t-46.272-20q-32.576 0-50.56 34.56t-18.016 101.44q0 27.424 2.848 48t10.272 39.712 22.56 29.44 37.44 10.272q28 0 43.712-21.728t19.136-57.728zM1060.576 508q0-118.272-8.864-175.424t-34.56-92q-3.424-4.576-7.712-8t-12.288-8.576-9.152-6.272q-49.152-36-398.272-36-357.152 0-405.728 36-2.848 2.272-10.016 6.56t-12 8-8.288 8.288q-25.728 34.272-34.272 91.136t-8.576 176.288q0 118.848 8.576 175.712t34.272 91.712q3.424 4.576 8.576 8.576t11.712 8 10.016 6.848q25.152 18.848 136.864 28t268.864 9.152q348.576 0 398.272-37.152 2.848-2.272 9.728-6.272t11.712-8 7.712-9.152q26.272-34.272 34.848-90.848t8.576-176.576zM1170.272 73.152l0 877.728-1170.272 0 0-877.728 1170.272 0z" p-id="6050"></path></svg>

                    {beanData && beanData.build_version}</h2>
                  <div className={styles.buildCommitInfo}>
                    <ul className={styles.buildInfo}>
                      <li>
                        <a target='_blank'>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17" className={styles.icon}><circle cx="8.51" cy="8.5" r="3.5" fill="none" stroke="#9d9d9d" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></circle><path d="M16.5 8.5h-4.49m-7 0H.5" fill="none" stroke="#9d9d9d" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></path></svg>
                          {beanData ? beanData.code_version : '-'}
                        </a>
                      </li>
                      <li>
                        <a target='_blank'>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17" className={styles.icon}><circle cx="3.8" cy="3.2" r="1.7" fill="none" stroke="#9d9d9d" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></circle><path d="M6.75 15.5s1.95-1.95 1.95-1.98H6.3s-2.48.15-2.48-2.46V4.92m2.93 6.64s1.95 1.95 1.95 1.97" fill="none" stroke="#9d9d9d" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></path><g fill="none" stroke="#9d9d9d" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"><circle cx="13.2" cy="13.8" r="1.7"></circle><path d="M10.25 1.5S8.3 3.45 8.3 3.47h2.4s2.48-.15 2.48 2.46v6.14m-2.93-6.63S8.3 3.49 8.3 3.47"></path></g></svg>
                          {beanData ? beanData.commit_msg : '-'}
                        </a>
                      </li>
                      <li>
                        <a target='_blank'>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17" className={styles.icon}><circle cx="4.94" cy="2.83" r="1.83" fill="none" stroke="#9d9d9d" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></circle><circle cx="11.78" cy="5.15" r="1.83" fill="none" stroke="#9d9d9d" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></circle><circle cx="4.98" cy="14.17" r="1.83" fill="none" stroke="#9d9d9d" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></circle><path d="M11.78 6.99s.09 2.68-1.9 3.38c-1.76.62-2.92-.04-4.93 1.97V4.66" fill="none" stroke="#9d9d9d" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></path></svg>
                          {beanData ? beanData.branch : '-'}
                        </a>
                      </li>
                    </ul>
                    <p className={styles.buildAuthor}>
                      <a target='_blank'>查看更多版本</a>
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col xs={24} xm={24} md={24} lg={24} xl={24}>
            <div style={{ padding: '10px' }}>
              构建版本历史
              </div>
            <div className={styles.buildHistoryBox}>
              <ul className={styles.buildHistoryList}>
                {dataList && dataList.length > 0 && dataList.map((item) => {
                  const { commit_msg, repo_url, build_user, code_version, status, create_time, finish_time } = item
                  return <li className={`${styles.rowLi} ${styles.prRow} ${
                    status === 'success' ? styles.passed : status === 'error' ? styles.failed : styles.canceled
                    } `}>
                    <div className={`${styles.lineone} ${styles.fadeOute}`}>

                      <div className={`${styles.rowRtem} ${styles.buildInfo}`}>
                        <h2 className={`${styles.rowBranch}`}>
                          <span
                            className={`${styles.statusIcon} `}
                          >
                            {
                              status === 'success' ?
                                <svg className={styles.icon} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="31270" width="16" height="16"><path d="M927.97968 108.360629a50.575037 50.575037 0 0 0-69.085501 18.517689l-391.898737 678.933747-316.000056-182.409708A50.575037 50.575037 0 0 0 100.427574 711.005546l359.812488 207.690002a50.553362 50.553362 0 0 0 69.078276-18.517689L946.504593 177.44613a50.575037 50.575037 0 0 0-18.524913-69.085501z" fill="#46AF60" p-id="31271"></path></svg>
                                : status === 'error' ?
                                  <svg className={styles.icon} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="32079" width="16" height="16"><path d="M 909.812 962.028 c -13.094 0 -26.188 -4.996 -36.179 -14.987 L 73.958 147.368 c -19.98 -19.98 -19.98 -52.378 0 -72.359 c 19.983 -19.98 52.38 -19.98 72.36 0 L 945.99 874.683 c 19.981 19.981 19.981 52.378 0 72.36 c -9.99 9.99 -23.084 14.985 -36.179 14.985 Z" fill="#db4545" p-id="32080"></path><path d="M 110.138 962.028 c -13.094 0 -26.188 -4.996 -36.179 -14.987 c -19.98 -19.98 -19.98 -52.378 0 -72.359 L 873.632 75.01 c 19.982 -19.98 52.377 -19.98 72.36 0 c 19.98 19.981 19.98 52.378 0 72.36 L 146.316 947.041 c -9.99 9.99 -23.084 14.986 -36.179 14.986 Z" fill="#db4545" p-id="32081"></path></svg>
                                  : <svg className={styles.icon} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="43063" width="16" height="16"><path d="M511.998049 66.069397c-246.273427 0-445.926662 199.653235-445.926662 445.926462s199.653035 445.931458 445.926662 445.931458c246.296411 0 445.926462-199.658032 445.926462-445.931458S758.29446 66.069397 511.998049 66.069397zM511.998049 920.100164c-225.395582 0-408.104305-182.709523-408.104305-408.104305 0-225.395582 182.708723-408.105305 408.104305-408.105305 225.41357 0 408.125291 182.709723 408.125291 408.105305C920.12334 737.410428 737.411619 920.100164 511.998049 920.100164zM816.163025 803.452451 233.172693 196.400632l-25.336822 23.633976 583.593923 607.556477L816.163025 803.452451z" p-id="43064" fill="#9d9d9d"></path></svg>
                            }

                          </span>
                          <a className={styles.passeda}>
                            <font >v5.1.6释放</font>
                          </a>
                        </h2>
                        <div className={styles.rowMessage}>
                          <font >{commit_msg ? commit_msg : repo_url}</font>
                        </div>
                      </div>

                      <div className={`${styles.rowRtem} ${styles.buildCommitter}`}>
                        <a>
                          <img class="real-avatar" src="https://avatars1.githubusercontent.com/u/18493394?v=4?v=3&amp;s=18" srcset="https://avatars1.githubusercontent.com/u/18493394?v=4?v=3&amp;s=18 1x, https://avatars1.githubusercontent.com/u/18493394?v=4?v=3&amp;s=36 2x" alt="barnettZQG头像" />
                          <font style={{ marginLeft: '10px' }}>{build_user}</font>
                        </a>
                      </div>
                    </div>
                    <div className={`${styles.linetwo}`}>
                      <h3 className={`${styles.rowRtem} ${styles.buildCommitter} ${styles.alcen}`}>
                        <a className={status === 'success' ? styles.passeda : status === 'error' ? styles.faileda : styles.canceleda}>
                          <svg className={styles.icon} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="26201" width="16" height="16"><path d="M951.509333 507.2L465.194667 993.514667c-0.682667 1.024-1.130667 2.176-2.026667 3.072a20.8 20.8 0 0 1-15.253333 5.994666 20.8 20.8 0 0 1-15.253334-5.994666c-0.896-0.896-1.322667-2.048-2.026666-3.072L73.066667 635.946667c-1.024-0.682667-2.154667-1.130667-3.072-2.026667A20.8 20.8 0 0 1 64 618.666667a20.693333 20.693333 0 0 1 5.994667-15.253334c0.917333-0.896 2.048-1.322667 3.072-2.026666L559.381333 115.093333A20.906667 20.906667 0 0 1 575.914667 106.666667h86.528c2.837333-32.042667 15.914667-60.16 35.626666-78.570667l0.341334 0.384c4.181333-4.416 9.877333-7.146667 16.170666-7.146667 12.629333 0 22.869333 10.922667 22.869334 24.384 0 8-3.84 14.741333-9.408 19.178667-10.218667 9.429333-17.493333 24.298667-19.925334 41.770667h102.464c6.826667 0 12.672 3.413333 16.533334 8.426666l124.373333 124.373334a20.992 20.992 0 0 1 8.426667 16.554666V490.666667a20.906667 20.906667 0 0 1-8.405334 16.533333z m-220.757333-151.658667a22.101333 22.101333 0 0 1-16.170667 7.125334c-12.629333 0-22.826667-10.922667-22.826666-24.384 0-8 3.84-14.741333 9.408-19.2 5.290667-4.885333 9.621333-11.456 13.162666-18.837334-18.24 4.864-31.744 21.333333-31.744 41.066667a42.666667 42.666667 0 0 0 85.333334 0c0-10.090667-3.626667-19.221333-9.493334-26.538667-13.12 33.002667-27.669333 40.768-27.669333 40.768z m186.496-91.413333L802.453333 149.333333h-89.877333c3.712 9.472 9.045333 17.536 15.466667 23.466667 0.874667 0.704 1.962667 1.130667 2.709333 1.962667l0.384-0.384c22.208 20.757333 36.8 53.504 36.8 90.752 0 0.896-0.213333 1.685333-0.256 2.56 25.536 14.741333 42.922667 42.026667 42.922667 73.642666a85.333333 85.333333 0 0 1-170.666667 0 85.141333 85.141333 0 0 1 81.493333-84.949333c-1.92-18.944-9.408-35.157333-20.245333-45.184-0.874667-0.704-1.962667-1.130667-2.752-1.962667l-0.341333 0.384C682.218667 194.794667 670.506667 173.674667 664.96 149.333333h-80.917333l-469.333334 469.333334 333.205334 333.205333 469.333333-469.333333V264.128zM304.682667 582.08a20.842667 20.842667 0 0 1 29.461333 0l150.378667 150.378667a20.842667 20.842667 0 0 1-29.461334 29.461333l-150.378666-150.378667a20.842667 20.842667 0 0 1 0-29.461333z m85.333333-85.333333a20.842667 20.842667 0 0 1 29.461333 0l150.357334 150.378666a20.842667 20.842667 0 0 1-29.461334 29.461334l-150.357333-150.378667a20.842667 20.842667 0 0 1 0-29.461333z" fill="" p-id="26202"></path></svg>
                          <font >{status === 'success' ? '成功' : '失败'}</font>
                        </a>
                      </h3>
                      <div className={`${styles.rowRtem} ${styles.buildCommitter}  `}>
                        <a className={`${styles.alcen}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17" className={styles.icon}><circle cx="8.51" cy="8.5" r="3.5" fill="none" stroke="#9d9d9d" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></circle><path d="M16.5 8.5h-4.49m-7 0H.5" fill="none" stroke="#9d9d9d" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></path></svg>
                          <font >{code_version ? code_version : '-'}</font>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17" className={styles.icon}><path d="M11.34 10.96v1.1c0 .55-.45 1-1 1H4.83c-.55 0-1-.45-1-1V6.55c0-.55.41-1 .91-1h.91m1.24 4.34l5.92-5.93m-3.9-.02h3.92v3.92" fill="none" stroke="#9d9d9d" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></path></svg>
                        </a>
                      </div>
                    </div>
                    <div className={`${styles.linestree}`}>
                      <div className={`${styles.rowRtem} ${styles.rowDuration}`}>
                        <div className={styles.alcen}>
                          <svg t="1565779224563" className={styles.icon} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1204" width="16" height="16"><path d="M510.138182 143.592727h-3.258182A365.149091 365.149091 0 0 0 139.636364 513.163636a380.509091 380.509091 0 0 0 376.087272 375.156364h3.490909A365.149091 365.149091 0 0 0 884.363636 518.749091 379.810909 379.810909 0 0 0 510.138182 143.592727zM744.727273 748.450909a319.767273 319.767273 0 0 1-229.236364 93.090909A333.730909 333.730909 0 0 1 186.181818 512 318.603636 318.603636 0 0 1 506.88 190.138182h3.025455A333.265455 333.265455 0 0 1 837.818182 518.981818a318.138182 318.138182 0 0 1-93.090909 229.469091z" p-id="1205"></path><path d="M605.090909 535.272727h-93.090909v-186.181818a23.272727 23.272727 0 0 0-46.545455 0v209.454546a23.272727 23.272727 0 0 0 23.272728 23.272727h116.363636a23.272727 23.272727 0 0 0 0-46.545455z" p-id="1206"></path></svg>
                          <time className={styles.labelAlign} >
                            <font >6分48秒</font>
                          </time>
                        </div>
                      </div>
                      <div className={`${styles.rowRtem} ${styles.rowCalendar} ${styles.alcen}`} >
                        <div className={styles.alcen}>
                          <svg t="1565853415564" className={styles.icon} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="17300" width="16" height="16"><path d="M787.15 847.45H234.71a48.92 48.92 0 0 1-48.85-48.86V228a48.91 48.91 0 0 1 48.85-48.85h552.44A48.91 48.91 0 0 1 836 228v570.59a48.92 48.92 0 0 1-48.85 48.86zM234.71 195.19A32.89 32.89 0 0 0 201.86 228v570.59a32.89 32.89 0 0 0 32.85 32.86h552.44A32.89 32.89 0 0 0 820 798.59V228a32.89 32.89 0 0 0-32.85-32.85z" fill="" p-id="17301"></path><path d="M836 364.29H185.86V228a48.91 48.91 0 0 1 48.85-48.85h552.44A48.91 48.91 0 0 1 836 228z m-634.14-16H820V228a32.89 32.89 0 0 0-32.85-32.85H234.71A32.89 32.89 0 0 0 201.86 228z" fill="" p-id="17302"></path><path d="M348.92 121.08h16V250.6h-16zM672.03 121.08h16V250.6h-16zM483.31 677.22H355.84l16.78-14.12c26.14-22 93.18-88.53 89.48-131.62-1-12.15-7.67-21.64-20.27-29-29-17.39-62.07 9.22-62.4 9.49l-10.13-12.36c1.71-1.4 42.25-33.94 80.68-10.88 17.09 10 26.56 23.91 28.06 41.39 3.95 46-51.36 104.55-79.45 131.1h84.72zM567.94 679.35c-12.72 0-26.9-1.92-42.31-5.77l3.88-15.53c32.93 8.24 59.62 6.76 75.14-4.16 10-7 15.57-17.86 17.1-33.13 1.67-16.67-1.85-28.64-10.76-36.58-20.83-18.56-64.25-9.38-64.69-9.28l-11.17 2.43 1.54-11.33 11.16-81.82h88.69v16h-74.73L554 557.52c16.65-1.92 48.1-2.69 67.63 14.69 12.85 11.42 18.25 28.3 16.07 50.14-2 19.9-10 34.91-23.82 44.63-11.72 8.23-27.26 12.37-45.94 12.37z" fill="" p-id="17303"></path></svg>
                          <time className={styles.labelAlign}>
                            <font>
                              {moment(create_time).format("YYYY年-MM月-DD日")}
                            </font>
                          </time>
                        </div>
                      </div>

                    </div>
                  </li>
                })}
              </ul>
              {/* <p>
                <button id="ember4027" className={styles.button}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" className={styles.icon} ><path class="st0" d="M14.5 7.419s-3.134 3.919-7 3.919-7-3.919-7-3.919S3.634 3.5 7.5 3.5s7 3.919 7 3.919z"></path><ellipse class="st0" cx="7.5" cy="7.419" rx="2.022" ry="2.335"></ellipse></svg>
                  <font >显示更多</font>
                </button>
              </p> */}
            </div>
          </Col>
        </Row>

        <Row gutter={24} style={{ margin: '10px 0' }}>
          <Col xs={10} xm={10} md={10} lg={10} xl={10} style={{ background: '#fff' }}>
            <div >
              <div className={styles.text}>20190812020202</div>
              <Row gutter={24}>
                {new_pods && new_pods.length > 0 && new_pods.map((item, index) => {
                  const { pod_status, pod_name } = item;
                  return <Col xs={6} xm={6} md={6} lg={6} xl={6} className={styles.boxImg} >
                    <Tooltip title={pod_name}>
                      <img className={styles.imgs} src={pod_status === 'Running' ? Run : pod_status === 'Closed' ? Abnormal : Down}></img>
                    </Tooltip>
                    <p>
                      {pod_status === 'Running' ? '正常运行' : pod_status === 'Closed' ? '运行异常' : '关闭中'}
                    </p>
                  </Col>
                })}
              </Row>
            </div>
          </Col>
          <Col xs={4} xm={4} md={4} lg={4} xl={4} >
            <div >
              <p style={{ marginTop: '30px' }}>正在滚动升级</p>
              <Progress percent={50} showInfo={false} strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }} />
            </div>
          </Col>
          <Col xs={10} xm={10} md={10} lg={10} xl={10} style={{ background: '#fff' }}>
            <div>
              <div className={styles.text}>20190812020202</div>
              <Row gutter={24}>
                {new_pods && new_pods.length > 0 && new_pods.map((item, index) => {
                  const { pod_status, pod_name } = item;
                  return <Col xs={6} xm={6} md={6} lg={6} xl={6} className={styles.boxImg} >
                    <Tooltip title={pod_name}>
                      <img style={{cursor:'pointer'}} className={styles.imgs} src={pod_status === 'Running' ? Run : pod_status === 'Closed' ? Abnormal : Down}></img>
                    </Tooltip>
                    <p>
                      {pod_status === 'Running' ? '升级中' : pod_status === 'Closed' ? '运行异常' : '启动中'}
                    </p>
                  </Col>
                })}
              </Row>
            </div>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} xm={24} md={24} lg={24} xl={24}>
            <Card bordered={false} title="操作日志" extra={<a onClick={this.showVersionManage} href="javascript:;">构建版本管理</a>}>
              <LogList appDetail={this.props.appDetail} appAlias={this.props.appAlias} list={logList || []} /> {this.state.hasNext && <p
                style={{
                  textAlign: "center",
                  fontSize: 30,
                }}
              ><Icon
                  style={{
                    cursor: "pointer",
                  }}
                  onClick={this.handleNextPage}
                  type="down"
                />
              </p>
              }

              {this.state.showVersionManage &&
                <AppVersionManage
                  onRollback={this.handleRollback}
                  onCancel={this.hideVersionManage}
                  team_name={globalUtil.getCurrTeamName()}
                  service_alias={this.props.appAlias}
                  showUpgrade={showUpgrade}
                  setShowUpgrade={() => { this.setState({ showUpgrade: false }) }}
                />}
            </Card>
          </Col>

        </Row>
        <Affix offsetBottom={0} style={{
          background: '#fff'
        }}>
          <div style={{
            textAlign: "center",
            background: '#fff'
          }}>
            <Icon
              style={{
                cursor: "pointer",
                textAlign: "center",
                fontSize: 30,
              }}
              onClick={() => {
              }}
              type="up"
            />
          </div>

          {/* <Row gutter={24} >
            <Col xs={24} xm={24} md={24} lg={24} xl={24}>
              <div style={{
                textAlign: "left",
                background: '#fff'
              }}>
                <Button type="primary" onClick={() => { alert(2) }}>事件记录</Button>
              </div>

              <Table
                size="middle"
                style={{
                  background: '#fff'
                }}
                pagination={{
                  // current: this.state.page,
                  // pageSize: this.state.page_size,
                  // total: this.state.total,
                  // onChange: this.onPageChange,
                  current: 1,
                  pageSize: 1,
                  total: 1,
                  onChange: this.onPageChange,
                }}
                dataSource={[]}
                columns={[
                  {
                    title: "事件类型",
                    dataIndex: "service_cname",
                  },
                  {
                    title: "开始时间",
                    dataIndex: "stretime",
                  },
                  {
                    title: "结束时间",
                    dataIndex: "tiem",
                  },
                  {
                    title: "操作人",
                    dataIndex: "name",
                  },
                  {
                    title: "概述",
                    dataIndex: "group_name",
                  },
                  {
                    title: "状态",
                    dataIndex: "state",
                  },
                ]}
              />
            </Col>

          </Row> */}

        </Affix>
      </Fragment >
    );
  }
}
