import React, { PureComponent } from "react";
import {
  Form,
} from "antd";
import { connect } from "dva";
import styles from "./index.less";
import globalUtil from "../../../../utils/global";
var Convert = require("ansi-to-html");
var convert = new Convert();

@connect()
@Form.create()
class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      logs: [],
      status: null,
    };
  }
  componentDidMount() {
    this.loadEventLog()
  }
  shouldComponentUpdate() {
    return true
  }
  showSocket() {
      const {EventID} = this.props
      this.props.socket.watchEventLog((message)=>{
         var logs = this.state.logs || []
         logs.push(message)
         this.setState({ logs: logs })
      },()=>{
        this.setState({ status: "操作已成功" })
      },()=>{
        this.setState({ status: "操作出现异常" })
      },EventID)
  }
  loadEventLog() {
    const {EventID} = this.props
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
              LogContentList: res.list,
              logVisible: true
            },
            () => {
              if (this.props.showSocket) {
                this.showSocket()
              }
            }
          );
        } else {
          if (this.props.showSocket) {
            this.showSocket()
          }
        }
      }
    });
  }

  handleCancel = () => {
    this.props.handleCancel()
  };

  render() {
    const {logs, status} = this.state
    return (
      <div>
          <div className={styles.logsss} ref="box">
            {logs && logs.map((log, index) => {
                return (
                  <div key={index}>
                    {convert.toHtml(log.message)}
                  </div>
                );
              })}
          </div>
          {status && <div style={{textAlign:"center"}}>{status}</div>}
      </div>
    )
  }
}

export default Index;
