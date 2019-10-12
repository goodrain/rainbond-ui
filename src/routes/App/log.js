import React, { PureComponent, Fragment } from "react";
import { connect } from "dva";
import { Card, Button, Icon, Modal } from "antd";
import styles from "./Log.less";
import globalUtil from "../../utils/global";
import { getServiceLog, getHistoryLog } from "../../services/app";
import NoPermTip from "../../components/NoPermTip";
import appUtil from "../../utils/app";
import Ansi from "../../components/Ansi";

class History1000Log extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      loading: true,
      showHighlighted: ""
    };
  }
  componentDidMount() {
    this.loadData();
  }
  loadData() {
    getServiceLog({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias,
      lines: 1000
    }).then(data => {
      if (data) {
        this.setState({ loading: false, list: data.list || [] });
      }
    });
  }
  render() {
    const { loading, list, showHighlighted } = this.state;
    return (
      <Modal
        title="最近1000条日志"
        visible={true}
        width={1000}
        bodyStyle={{ background: "#222222", color: "#fff" }}
        className={styles.logModal}
        onCancel={this.props.onCancel}
        footer={null}
        // footer={[<Button onClick={this.props.onCancel}>关闭</Button>]}
      >
        {loading ? (
          <div style={{ textAlign: "center" }}>
            <Icon
              type="loading"
              style={{ marginTop: 20, marginBottom: 20 }}
            />
          </div>
        ) : (
          ""
        )}
        {!loading ? (
          <div
            style={{
              padding: "20px 0",
              maxHeight: 500,
              overflowY: "auto",
              background: "#212121"
            }}
          >
            {list.length > 0 ? (
              <div className={styles.History1000Log}>
                {list.map((log, index) => {
                  return (
                    <div key={index}>
                      <span
                        style={{
                          color:
                            showHighlighted ==
                            log.substring(0, log.indexOf(":"))
                              ? "#FFFF91"
                              : "#666666"
                        }}
                      >
                        <b>{/* <Icon type="caret-right" /> */}</b>
                        <span>{log == "" ? "" : `${index + 1}`}</span>
                      </span>
                      <span
                        ref="texts"
                        style={{
                          color:
                            showHighlighted ==
                            log.substring(0, log.indexOf(":"))
                              ? "#FFFF91"
                              : "#FFF"
                        }}
                      >
                        <Ansi>
                          {log.substring(log.indexOf(":") + 1, log.length)}
                        </Ansi>
                      </span>

                      {list.length == 1 ? (
                        <span
                          style={{
                            color:
                              showHighlighted ==
                              log.substring(0, log.indexOf(":"))
                                ? "#FFFF91"
                                : "#bbb",
                            cursor: "pointer",
                            backgroundColor: log.substring(0, log.indexOf(":"))
                              ? "#666"
                              : ""
                          }}
                          onClick={() => {
                            this.setState({
                              showHighlighted:
                                showHighlighted ==
                                log.substring(0, log.indexOf(":"))
                                  ? ""
                                  : log.substring(0, log.indexOf(":"))
                            });
                          }}
                        >
                          <Ansi>{log.substring(0, log.indexOf(":"))}</Ansi>{" "}
                        </span>
                      ) : list.length > 1 &&
                        index >= 1 &&
                        log.substring(0, log.indexOf(":")) ==
                          list[index <= 0 ? index + 1 : index - 1].substring(
                            0,
                            list[index <= 0 ? index + 1 : index - 1].indexOf(
                              ":"
                            )
                          ) ? (
                        ""
                      ) : (
                        <span
                          style={{
                            color:
                              showHighlighted ==
                              log.substring(0, log.indexOf(":"))
                                ? "#FFFF91"
                                : "#bbb",
                            cursor: "pointer",
                            backgroundColor:
                              index == 0 && log.substring(0, log.indexOf(":"))
                                ? "#666"
                                : log.substring(0, log.indexOf(":")) ==
                                  list[
                                    index <= 0 ? index + 1 : index - 1
                                  ].substring(
                                    0,
                                    list[
                                      index <= 0 ? index + 1 : index - 1
                                    ].indexOf(":")
                                  )
                                ? ""
                                : "#666"
                          }}
                          onClick={() => {
                            this.setState({
                              showHighlighted:
                                showHighlighted ==
                                log.substring(0, log.indexOf(":"))
                                  ? ""
                                  : log.substring(0, log.indexOf(":"))
                            });
                          }}
                        >
                          <Ansi>{log.substring(0, log.indexOf(":"))}</Ansi>{" "}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p
                style={{ textAlign: "center", marginBottom: 0, color: "#999" }}
              >
                暂无日志
              </p>
            )}
          </div>
        ) : (
          ""
        )}
      </Modal>
    );
  }
}

class HistoryLog extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      loading: true
    };
  }
  componentDidMount() {
    this.loadData();
  }
  loadData() {
    getHistoryLog({
      team_name: globalUtil.getCurrTeamName(),
      app_alias: this.props.appAlias
    }).then(data => {
      if (data) {
        this.setState({ loading: false, list: data.list || [] });
      }
    });
  }
  render() {
    const { loading, list } = this.state;

    return (
      <Modal
        title="历史日志下载"
        visible={true}
        width={700}
        onCancel={this.props.onCancel}
        footer={[<Button onClick={this.props.onCancel}>关闭</Button>]}
      >
        {loading ? (
          <div style={{ textAlign: "center" }}>
            <Icon
              type="loading"
              style={{ marginTop: 100, marginBottom: 100 }}
            />
          </div>
        ) : (
          ""
        )}

        {!loading ? (
          <div style={{ textAlign: "left" }}>
            {list.length > 0 ? (
              <div>
                {list.map(item => {
                  return (
                    <p>
                      <a target="_blank" href={item.file_url}>
                        {item.file_name}
                      </a>
                    </p>
                  );
                })}
              </div>
            ) : (
              <p style={{ textAlign: "center" }}>暂无历史日志</p>
            )}
          </div>
        ) : (
          ""
        )}
      </Modal>
    );
  }
}

@connect(
  ({ user, appControl }) => ({
    currUser: user.currentUser
  }),
  null,
  null,
  { withRef: true }
)
export default class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      logs: [],
      started: true,
      websocketUrl: "",
      showHistoryLog: false,
      showHistory1000Log: false,
      showHighlighted: "",
      showText: "true"
    };
  }
  componentDidMount() {
    if (!this.canView()) return;
    this.loadLog();
  }
  componentWillUnmount() {
    this.props.socket && this.props.socket.closeLogMessage();
  }
  canView() {
    return appUtil.canManageAppLog(this.props.appDetail);
  }
  loadLog() {
    const { logs } = this.state;
    if (logs.length == 0) {
      getServiceLog({
        team_name: globalUtil.getCurrTeamName(),
        app_alias: this.props.appAlias
      }).then(data => {
        if (data) {
          if (this.refs.box) {
            this.refs.box.scrollTop = this.refs.box.scrollHeight;
          }
          this.setState({ logs: data.list || [] });
          this.watchLog();
        }
      });
    } else {
      this.watchLog();
    }
  }
  watchLog() {
    this.props.socket &&
      this.props.socket.setOnLogMessage(
        messages => {
          if (messages && messages.length > 0) {
            var logs = this.state.logs || [];
            const newlogs = logs.concat(messages);
            this.setState({ logs: newlogs });
          }
        },
        messages => {
          if (this.state.started) {
            var logs = this.state.logs || [];
            if (logs.length >= 5000) {
              logs.shift();
            }
            logs = logs.concat(messages);
            if (this.refs.box) {
              this.refs.box.scrollTop = this.refs.box.scrollHeight;
            }
            this.setState({ logs: logs });
          }
        }
      );
  }
  componentWillUnmount() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (
      this.refs.box &&
      prevState.logs.length !== this.state.logs.length &&
      this.state.showHighlighted == ""
    ) {
      this.refs.box.scrollTop = this.refs.box.scrollHeight;
    }
  }
  handleStop = () => {
    this.setState({ started: false });
  };
  handleStart = () => {
    this.setState({ started: true });
  };
  showDownHistoryLog = () => {
    this.setState({ showHistoryLog: true });
  };
  hideDownHistoryLog = () => {
    this.setState({ showHistoryLog: false });
  };
  showDownHistory1000Log = () => {
    this.setState({ showHistory1000Log: true });
  };
  hideDownHistory1000Log = () => {
    this.setState({ showHistory1000Log: false });
  };
  render() {
    if (!this.canView()) return <NoPermTip />;

    const { logs, showHighlighted } = this.state;
    return (
      <Card
        title={
          <Fragment>
            {this.state.started ? (
              <Button onClick={this.handleStop}>暂停推送</Button>
            ) : (
              <Button onClick={this.handleStart}>开始推送</Button>
            )}
          </Fragment>
        }
        extra={
          <Fragment>
            <a
              onClick={this.showDownHistoryLog}
              href="javascript:;"
              style={{ marginRight: 10 }}
            >
              历史日志下载
            </a>
            <a onClick={this.showDownHistory1000Log} href="javascript:;">
              最近1000条日志
            </a>
          </Fragment>
        }
      >
        <div className={styles.logsss} ref="box">
          {logs &&
            logs.length > 0 &&
            logs.map((log, index) => {
              return (
                <div key={index}>
                  <span
                    style={{
                      color:
                        showHighlighted == log.substring(0, log.indexOf(":"))
                          ? "#FFFF91"
                          : "#666666"
                    }}
                  >
                    <b>{/* <Icon type="caret-right" /> */}</b>
                    <span>{log == "" ? "" : `${index + 1}`}</span>
                  </span>
                  <span
                    ref="texts"
                    style={{
                      color:
                        showHighlighted == log.substring(0, log.indexOf(":"))
                          ? "#FFFF91"
                          : "#FFF"
                    }}
                  >
                    <Ansi>
                      {log.substring(log.indexOf(":") + 1, log.length)}
                    </Ansi>
                  </span>

                  {logs.length == 1 ? (
                    <span
                      style={{
                        color:
                          showHighlighted == log.substring(0, log.indexOf(":"))
                            ? "#FFFF91"
                            : "#bbb",
                        cursor: "pointer",
                        backgroundColor: log.substring(0, log.indexOf(":"))
                          ? "#666"
                          : ""
                      }}
                      onClick={() => {
                        this.setState({
                          showHighlighted:
                            showHighlighted ==
                            log.substring(0, log.indexOf(":"))
                              ? ""
                              : log.substring(0, log.indexOf(":"))
                        });
                      }}
                    >
                      <Ansi>{log.substring(0, log.indexOf(":"))}</Ansi>
                    </span>
                  ) : logs.length > 1 &&
                    index >= 1 &&
                    log.substring(0, log.indexOf(":")) ==
                      logs[index <= 0 ? index + 1 : index - 1].substring(
                        0,
                        logs[index <= 0 ? index + 1 : index - 1].indexOf(":")
                      ) ? (
                    ""
                  ) : (
                    <span
                      style={{
                        color:
                          showHighlighted == log.substring(0, log.indexOf(":"))
                            ? "#FFFF91"
                            : "#bbb",
                        cursor: "pointer",
                        backgroundColor:
                          index == 0 && log.substring(0, log.indexOf(":"))
                            ? "#666"
                            : log.substring(0, log.indexOf(":")) ==
                              logs[
                                index <= 0 ? index + 1 : index - 1
                              ].substring(
                                0,
                                logs[
                                  index <= 0 ? index + 1 : index - 1
                                ].indexOf(":")
                              )
                            ? ""
                            : "#666"
                      }}
                      onClick={() => {
                        this.setState({
                          showHighlighted:
                            showHighlighted ==
                            log.substring(0, log.indexOf(":"))
                              ? ""
                              : log.substring(0, log.indexOf(":"))
                        });
                      }}
                    >
                      <Ansi>{log.substring(0, log.indexOf(":"))}</Ansi>
                    </span>
                  )}
                </div>
              );
            })}
        </div>
        {this.state.showHistoryLog && (
          <HistoryLog
            onCancel={this.hideDownHistoryLog}
            appAlias={this.props.appAlias}
          />
        )}
        {this.state.showHistory1000Log && (
          <History1000Log
            onCancel={this.hideDownHistory1000Log}
            appAlias={this.props.appAlias}
          />
        )}
      </Card>
    );
  }
}
