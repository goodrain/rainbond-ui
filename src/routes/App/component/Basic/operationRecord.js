import React, { PureComponent } from "react";
import {
  Button,
  Icon,
  Modal,
  Form,
  Checkbox,
  Select,
  Card,
  Row,
  Col,
  Tooltip
} from "antd";
import { connect } from "dva";
import moment from "moment";
import dateUtil from "../../../../utils/date-util";
import globalUtil from "../../../../utils/global";

import styles from "../../Index.less";

@connect()
@Form.create()
class Index extends PureComponent {
  constructor(arg) {
    super(arg);
    this.state = {
      logVisible: false,
      content: "",
      LogContentList: [
        // "7416dd9e2a58:190822 13:37:28  InnoDB: Shutdown completed; log sequence number 1597945"
      ],
      showHighlighted: ""
    };
  }
  componentDidMount() {}

  handleMore = () => {
    const { handleMore } = this.props;
    handleMore && handleMore(true);
  };

  formatSeconds = value => {
    var secondTime = parseInt(value); // 秒
    var minuteTime = 0; // 分
    var hourTime = 0; // 小时
    if (secondTime > 60) {
      //如果秒数大于60，将秒数转换成整数
      //获取分钟，除以60取整数，得到整数分钟
      minuteTime = parseInt(secondTime / 60);
      //获取秒数，秒数取佘，得到整数秒数
      secondTime = parseInt(secondTime % 60);
      //如果分钟大于60，将分钟转换成小时
      if (minuteTime > 60) {
        //获取小时，获取分钟除以60，得到整数小时
        hourTime = parseInt(minuteTime / 60);
        //获取小时后取佘的分，获取分钟除以60取佘的分
        minuteTime = parseInt(minuteTime % 60);
      }
    }
    var result = "";
    if (secondTime > 0) {
      result = "" + parseInt(secondTime) + "秒";
    }
    if (minuteTime > 0) {
      result = "" + parseInt(minuteTime) + "分" + result;
    }
    if (hourTime > 0) {
      result = "" + parseInt(hourTime) + "小时" + result;
    }
    return result;
  };

  showModal = EventID => {
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
              // this.watchLog(EventID);
            }
          );
        } else {
          // this.watchLog(EventID);
        }
      }
    });
  };
  watchLog(EventID) {
    this.props.socket.watchEventLog(
      messages => {
        if (messages && messages.length > 0) {
          this.setState({ LogContentList: messages });
        }
      },
      message => {
        if (this.state.started) {
          var LogContentList = this.state.LogContentList || [];
          if (LogContentList.length >= 5000) {
            LogContentList.shift();
          }
          LogContentList.push(message);
          if (this.refs.box) {
            this.refs.box.scrollTop = this.refs.box.scrollHeight;
          }
          this.setState({ LogContentList: logs });
        }
      },
      error => {
        console.log("err", error);
      },
      EventID
    );
  }
  handleOk = e => {
    console.log(e);
    this.setState({
      logVisible: false
    });
  };

  handleCancel = e => {
    console.log(e);
    this.setState({
      logVisible: false
    });
  };

  render() {
    const { logList, has_next, recordLoading } = this.props;
    const { content, LogContentList, showHighlighted } = this.state;
    const statusCNMap = val => {
      switch (val) {
        case "complete":
          return (
            <span style={{ color: "#39AA56", paddingLeft: "5px" }}>完成</span>
          );
        case "success":
          return (
            <span style={{ color: "#39AA56", paddingLeft: "5px" }}>完成</span>
          );
        case "failure":
          return (
            <span style={{ color: "#F5212D", paddingLeft: "5px" }}>失败</span>
          );
        case "timeout":
          return (
            <span style={{ color: "#F5212D", paddingLeft: "5px" }}>超时</span>
          );
        default:
          return (
            <span style={{ color: "#F69C49", paddingLeft: "5px" }}>进行中</span>
          );
      }
    };

    return (
      <Card bordered={false} title="操作记录" loading={recordLoading}>
        <Modal
          title="日志"
          visible={this.state.logVisible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          width="1200px"
          bodyStyle={{ background: "#222222", color: "#fff" }}
          footer={null}
        >
          <div className={styles.logsss} ref="box">
            {LogContentList &&
              LogContentList.length > 0 &&
              LogContentList.map((log, index) => {
                // console.log("logs", log);
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
                      {log.substring(log.indexOf(":") + 1, log.length)}
                    </span>

                    {LogContentList.length == 1 ? (
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
                        {log.substring(0, log.indexOf(":"))}{" "}
                      </span>
                    ) : LogContentList.length > 1 &&
                      index >= 1 &&
                      log.substring(0, log.indexOf(":")) ==
                        LogContentList[
                          index <= 0 ? index + 1 : index - 1
                        ].substring(
                          0,
                          LogContentList[
                            index <= 0 ? index + 1 : index - 1
                          ].indexOf(":")
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
                                LogContentList[
                                  index <= 0 ? index + 1 : index - 1
                                ].substring(
                                  0,
                                  LogContentList[
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
                        {log.substring(0, log.indexOf(":"))}{" "}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </Modal>

        <Row gutter={24}>
          <Col xs={24} xm={24} md={24} lg={24} xl={24}>
            {logList &&
              logList.map(item => {
                const {
                  StartTime,
                  Status,
                  UserName,
                  OptType,
                  Message,
                  EndTime,
                  type,
                  EventID
                } = item;
                return (
                  <div
                    key={EventID}
                    className={`${styles.loginfo} ${
                      Status === "success"
                        ? styles.logpassed
                        : Status === "timeout"
                        ? styles.logcanceled
                        : Status === "failure"
                        ? styles.logfailed
                        : styles.logfored
                    }`}
                  >
                    <div>{StartTime}</div>
                    <div>
                      <Tooltip title={Message}>
                        {globalUtil.fetchStateOptTypeText(OptType)}
                        {statusCNMap(Status)}
                        {Status === "success" ? "" : Message}
                      </Tooltip>
                    </div>
                    <div>
                      <span>@{UserName}</span>
                      <span>
                        {this.formatSeconds(
                          (new Date(EndTime).getTime()
                            ? new Date(EndTime).getTime()
                            : Date.parse(new Date())) -
                            new Date(StartTime).getTime()
                        )}
                      </span>
                    </div>
                    <div>
                      {/* {type === "deploy" && (
                        <Tooltip title={Message}>
                          <svg
                            t="1566376323726"
                            class="icon"
                            viewBox="0 0 1024 1024"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            p-id="1157"
                            data-spm-anchor-id="a313x.7781069.0.i2"
                            width="16"
                            height="16"
                          >
                            <path
                              d="M513.46384 60.225663c-248.291946 0-449.584462 201.299679-449.584462 449.624371 0 248.296039 201.292516 449.594695 449.584462 449.594695 248.28069 0 449.63665-201.299679 449.63665-449.594695C963.099467 261.525342 761.744529 60.225663 513.46384 60.225663zM473.683834 304.175721c2.690272-35.478026 40.597627-32.423457 40.597627-32.423457s34.488489-2.288113 39.011502 32.225959c0 0 8.162914 181.774997-15.904225 294.366308 0 0-3.746324 14.944364-23.107277 16.22145l0 0.275269c-20.751626-0.539282-24.692379-16.296151-24.692379-16.296151C465.521944 485.947647 473.683834 304.175721 473.683834 304.175721zM513.489422 747.984642c-25.719778 0-46.560432-20.840654-46.560432-46.560432 0-25.710568 20.840654-46.556339 46.560432-46.556339s46.561455 20.845771 46.561455 46.556339C560.050878 727.143988 539.2092 747.984642 513.489422 747.984642z"
                              p-id="1158"
                              fill="#BBBBBB"
                              data-spm-anchor-id="a313x.7781069.0.i3"
                              class=""
                            />
                          </svg>
                        </Tooltip>
                      )} */}
                      {type === "deploy" && (
                        <Tooltip title="查看日志">
                          <svg
                            style={{
                              cursor: "pointer"
                            }}
                            onClick={() => {
                              this.showModal(EventID);
                            }}
                            t="1566527207023"
                            class="icon"
                            viewBox="0 0 1024 1024"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            p-id="5957"
                            width="16"
                            height="16"
                          >
                            <path
                              d="M902.8 892l-95.5-96.3c62.4-95.5 35.6-223.5-59.9-285.9s-223.5-35.6-285.9 59.9-35.6 223.5 59.9 285.9c33.7 22 73.1 33.7 113.4 33.6 40.6-0.1 80.3-12.2 114-34.8l95.6 96.2c11.9 11.9 31.3 11.9 43.2 0l15.3-15.4c11.9-12.1 11.9-31.4 0-43.5l-0.1 0.3zM746.4 734.6C732 765 706 788.3 674.2 799.3c-12.7 5-26.2 7.4-39.8 6.9-69.6 1-126.7-54.6-127.7-124.2S561.4 555.3 631 554.3 757.7 609 758.6 678.5c0.3 19.5-4 38.7-12.4 56.2l0.2-0.1zM364.6 720H263.4c-17.5-0.7-31.2-15.5-30.5-33 0.7-16.6 13.9-29.8 30.5-30.5H363c2.5-29.2 9.8-57.8 21.4-84.6H263.5c-17.5-0.7-31.2-15.5-30.5-33 0.7-16.6 13.9-29.8 30.5-30.5h159.3c31.1-38.5 72.1-67.8 118.6-84.6H263.5c-17.5 0-31.8-14.2-31.7-31.8 0-17.5 14.2-31.7 31.7-31.7H749c17.5 0 31.8 14.2 31.7 31.8 0 17.5-14.2 31.7-31.7 31.7h-23.8c85.9 31.3 150.5 103.6 171.9 192.6V160.1c0.1-52.9-42.7-96-95.6-96.3H210.8c-52.9 0.4-95.5 43.3-95.5 96.2v687c0 52.9 42.7 95.9 95.6 96.2h346.4C455 912.9 379.7 825.7 364.6 720zM263.4 212.2H749c17.5 0.7 31.2 15.5 30.5 33-0.7 16.6-13.9 29.8-30.5 30.5H263.4c-17.5-0.7-31.2-15.5-30.5-33 0.7-16.6 14-29.8 30.5-30.5z"
                              fill="#1296db"
                              p-id="5958"
                            />
                          </svg>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                );
              })}

            {!logList ||
              (logList && logList.length === 0 && (
                <div
                  style={{
                    background: "#fff",
                    paddingBottom: "10px",
                    textAlign: "center"
                  }}
                >
                  暂无操作记录
                </div>
              ))}
            {has_next && (
              <p
                style={{
                  textAlign: "center",
                  fontSize: 30
                }}
              >
                <Icon
                  style={{
                    cursor: "pointer"
                  }}
                  onClick={this.props.handleNextPage}
                  type="down"
                />
              </p>
            )}
          </Col>
        </Row>
      </Card>
    );
  }
}

export default Index;
