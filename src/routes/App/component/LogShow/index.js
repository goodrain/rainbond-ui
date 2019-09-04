import React, { PureComponent } from "react";
import { connect } from "dva";
import styles from "./index.less";
import globalUtil from "../../../../utils/global";
import Ansi from "../../../../components/Ansi";

@connect(
  ({ user }) => ({
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
      dockerprogress: null,
      status: null,
      dynamic: false
    };
    this.state.dockerprogress = new Map();
  }
  componentDidMount() {
    this.loadEventLog();
  }
  shouldComponentUpdate() {
    return true;
  }
  showSocket() {
    const { EventID } = this.props;
    this.props.socket &&
      this.props.socket.watchEventLog(
        message => {
          var logs = this.state.logs || [];
          if (message.message.indexOf("id") != -1) {
            try {
              let m = JSON.parse(message.message);
              if (m && m.id != undefined) {
                var dockerprogress = this.state.dockerprogress;
                if (dockerprogress.get(m.id) != undefined) {
                  dockerprogress.set(m.id, m);
                } else {
                  dockerprogress.set(m.id, m);
                  logs.push(message);
                }
                this.setState({
                  dockerprogress: dockerprogress,
                  logs: logs,
                  dynamic: true
                });
                return;
              }
            } catch (err) {
              logs.push(message);
            }
          } else {
            logs.push(message);
          }
          if (this.refs.box) {
            this.refs.box.scrollTop = this.refs.box.scrollHeight;
          }
          this.setState({ logs: logs, dynamic: true });
        },
        () => {
          this.setState({
            status: <p style={{ color: "green" }}>操作已成功</p>
          });
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
        <a>{lineNumber}</a>
        <Ansi>{message}</Ansi>
      </div>
    );
  };
  render() {
    const { logs, status, dockerprogress, dynamic } = this.state;
    let lineNumber = 0;
    return (
      <div>
        <div className={styles.logsss} ref="box">
          {logs &&
            logs.map((log, index) => {
              lineNumber++;
              try {
                if (log.message.indexOf('"stream"') != -1) {
                  let m = JSON.parse(log.message);
                  if (m && m.stream != undefined) {
                    return this.getLineHtml(lineNumber, m.stream);
                  }
                }
                if (
                  log.message.indexOf("status") != -1 ||
                  log.message.indexOf("progress") != -1
                ) {
                  if (!dynamic) {
                    lineNumber--;
                    return;
                  }
                  let m = JSON.parse(log.message);
                  if (m && m.status != undefined && m.id != undefined) {
                    let dp = dockerprogress.get(m.id);
                    if (dp && dp.progress != undefined) {
                      return this.getLineHtml(
                        lineNumber,
                        m.id + ":" + m.status + " " + dp.progress
                      );
                    } else {
                      return this.getLineHtml(
                        lineNumber,
                        m.id + ":" + m.status
                      );
                    }
                  }
                  if (m && m.status != undefined) {
                    return this.getLineHtml(lineNumber, m.status);
                  }
                  if (m && m.progress != undefined && m.id != undefined) {
                    return this.getLineHtml(
                      lineNumber,
                      m.id + ":" + m.progress
                    );
                  }
                }
                return this.getLineHtml(lineNumber, log.message);
              } catch (err) {
                //ignore
                return this.getLineHtml(lineNumber, log.message);
              }
            })}
        </div>
        {status && <div style={{ textAlign: "center" }}>{status}</div>}
      </div>
    );
  }
}

export default Index;
