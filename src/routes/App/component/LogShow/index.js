import React, { PureComponent } from "react";
import { Form } from "antd";
import { connect } from "dva";
import styles from "./index.less";
import globalUtil from "../../../../utils/global";
var Convert = require("ansi-to-html");
var convert = new Convert();

@connect(
  ({ user, appControl }) => ({
    currUser: user.currentUser
  }),
  null,
  null,
  { withRef: true }
)
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      logs: [],
      dockerprogress: {},
      status: null
    };
  }
  componentDidMount() {
    this.loadEventLog();
  }
  shouldComponentUpdate() {
    return true;
  }
  showSocket() {
    const { EventID } = this.props;
    this.props.socket.watchEventLog(
      message => {
        var logs = this.state.logs || [];
        if (message.message.indexOf('"status"') != -1) {
          let m = JSON.parse(message.message);
          if (m && m.status != undefined && m.id != undefined) {
            var dockerprogress = this.state.dockerprogress;
            if (dockerprogress[m.id] != undefined) {
              dockerprogress[m.id] = m;
            } else {
              dockerprogress[m.id] = m;
              logs.push(message);
            }
            this.setState({ dockerprogress: dockerprogress, logs: logs });
            return;
          }
        } else {
          logs.push(message);
        }
        if (this.refs.box) {
          this.refs.box.scrollTop = this.refs.box.scrollHeight;
        }
        this.setState({ logs: logs });
      },
      () => {
        this.setState({ status: <p style={{ color: "green" }}>操作已成功</p> });
      },
      () => {
        this.setState({ status: <p style={{ color: "red" }}>操作失败</p> });
      },
      EventID
    );
  }
  loadEventLog() {
    const { EventID } = this.props;
    const team_name = globalUtil.getCurrTeamName();
    this.props.dispatch({
      type: "appControl/fetchLogContent",
      payload: {
        team_name,
        eventID: EventID
      },
      callback: res => {
        if (res) {
          this.setState(
            {
              logs: res.list,
              logVisible: true
            },
            () => {
              if (this.props.showSocket) {
                this.showSocket();
              }
            }
          );
        } else {
          if (this.props.showSocket) {
            this.showSocket();
          }
        }
      }
    });
  }

  handleCancel = () => {
    this.props.handleCancel();
  };
  getLineHtml = (lineNumber, message) => {
    return (
      <div className={styles.logline} key={lineNumber}>
        <a>
          {lineNumber}
        </a>
        {message}
      </div>
    );
  };
  render() {
    const { logs, status, dockerprogress } = this.state;

    return (
      <div>
        <div className={styles.logsss} ref="box">
          {logs &&
            logs.map((log, index) => {
              let lineNumber = index + 1;
              if (log.message.indexOf('"stream"') != -1) {
                let m = JSON.parse(log.message);
                if (m && m.stream != undefined) {
                  return this.getLineHtml(lineNumber, convert.toHtml(m.stream));
                }
              }
              if (log.message.indexOf('"status"') != -1) {
                let m = JSON.parse(log.message);
                if (m && m.status != undefined && m.id != undefined) {
                  let dp = dockerprogress[m.id];
                  if (dp.progress != undefined) {
                    return this.getLineHtml(
                      lineNumber,
                      dp.id + ":" + dp.progress
                    );
                  } else {
                    return this.getLineHtml(lineNumber, dp.id + ":" + m.status);
                  }
                }
                if (m && m.status != undefined) {
                  return this.getLineHtml(lineNumber, m.status);
                }
              }
              return this.getLineHtml(lineNumber, convert.toHtml(log.message));
            })}
        </div>
        {status &&
          <div style={{ textAlign: "center" }}>
            {status}
          </div>}
      </div>
    );
  }
}

export default Index;
